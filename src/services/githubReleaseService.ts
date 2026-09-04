/**
 * GitHub Release Service
 * Checks the latest published release on GitHub and downloads the managed
 * solution asset so it can be imported into Dataverse. This is the only part of
 * the app that talks to an external (non-Dataverse) host.
 */

import {
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_PAGES_BASE_URL,
  MANAGED_ASSET_SUFFIX,
  UPDATE_PROXY_URL,
} from '@/constants';

/** Payload shape assigned by the published update script on GitHub Pages. */
interface SolutionUpdatePayload {
  version: string;
  data: string; // base64 of the managed solution zip
}

declare global {
  interface Window {
    __ERD_SOLUTION_UPDATE__?: SolutionUpdatePayload;
  }
}

/** A downloadable asset attached to a GitHub release */
export interface ReleaseAsset {
  /** api.github.com asset endpoint (best CORS compatibility with octet-stream) */
  apiUrl: string;
  /** Public browser download URL (fallback) */
  browserDownloadUrl: string;
  name: string;
  size: number;
}

/** Parsed information about the latest GitHub release */
export interface LatestRelease {
  /** Raw git tag, e.g. "v0.1.12.4" */
  tagName: string;
  /** Version without the leading "v", e.g. "0.1.12.4" */
  version: string;
  /** Public release page URL */
  htmlUrl: string;
  /** The managed solution asset, if present */
  managedAsset: ReleaseAsset | null;
  /** SRI hash (`sha384-…`) of the Pages `.js` payload, for `<script integrity>` */
  integrity?: string;
  /** SRI hash (`sha384-…`) of the base64 `data`, to verify the fetched payload */
  dataIntegrity?: string;
}

/** Manifest published to GitHub Pages at `update/latest.json` */
interface PagesLatestManifest {
  version: string;
  js: string;
  integrity?: string;
  dataIntegrity?: string;
}

/** Raw asset shape from the GitHub REST API */
interface GitHubApiAsset {
  url: string;
  browser_download_url: string;
  name: string;
  size: number;
}

/** Raw release shape from the GitHub REST API */
interface GitHubApiRelease {
  tag_name: string;
  html_url: string;
  assets: GitHubApiAsset[];
}

const RELEASES_LATEST_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
const PAGES_LATEST_MANIFEST_URL = `${GITHUB_PAGES_BASE_URL}/update/latest.json`;

/** Build the public release page URL for a version. */
function releaseTagUrl(version: string): string {
  return `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/tag/v${version}`;
}

/** Compute the `sha384-<base64>` SRI hash of a string (WebCrypto). */
async function sha384OfString(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-384', bytes);
  let binary = '';
  const view = new Uint8Array(digest);
  for (let i = 0; i < view.length; i++) {
    binary += String.fromCharCode(view[i]);
  }
  return `sha384-${btoa(binary)}`;
}

/**
 * Compare two 4-segment (Dataverse-style) version strings.
 * Missing segments are treated as 0.
 * @returns positive if a > b, negative if a < b, 0 if equal.
 */
export function compareVersions(a: string, b: string): number {
  const parse = (v: string): number[] =>
    v
      .trim()
      .replace(/^v/i, '')
      .split('.')
      .map((seg) => {
        const n = parseInt(seg, 10);
        return Number.isNaN(n) ? 0 : n;
      });

  const pa = parse(a);
  const pb = parse(b);
  const len = Math.max(pa.length, pb.length, 4);

  for (let i = 0; i < len; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * Whether `latestVersion` is strictly newer than `currentVersion`.
 */
export function isUpdateAvailable(currentVersion: string, latestVersion: string): boolean {
  return compareVersions(latestVersion, currentVersion) > 0;
}

/**
 * Fetch the latest release metadata from GitHub.
 * @throws Error when the network request fails or the response is not ok.
 */
export async function getLatestRelease(): Promise<LatestRelease> {
  const response = await fetch(RELEASES_LATEST_URL, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} ${response.statusText}`);
  }

  const data: GitHubApiRelease = await response.json();
  const tagName = data.tag_name ?? '';
  const version = tagName.replace(/^v/i, '');

  const managed = data.assets?.find((asset) => asset.name.endsWith(MANAGED_ASSET_SUFFIX));

  return {
    tagName,
    version,
    htmlUrl: data.html_url,
    managedAsset: managed
      ? {
          apiUrl: managed.url,
          browserDownloadUrl: managed.browser_download_url,
          name: managed.name,
          size: managed.size,
        }
      : null,
  };
}

/**
 * Read the latest-version manifest from GitHub Pages (`update/latest.json`).
 * Preferred over the GitHub API: no rate limit, and it carries SRI hashes.
 *
 * @throws Error when the manifest is unavailable or malformed.
 */
export async function fetchLatestReleaseFromPages(): Promise<LatestRelease> {
  // latest.json is mutable (rewritten each release) — bypass the HTTP cache.
  const response = await fetch(PAGES_LATEST_MANIFEST_URL, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Pages manifest not available: ${response.status}`);
  }
  const manifest = (await response.json()) as Partial<PagesLatestManifest>;
  if (!manifest.version) {
    throw new Error('Pages manifest is missing a version.');
  }
  return {
    tagName: `v${manifest.version}`,
    version: manifest.version,
    htmlUrl: releaseTagUrl(manifest.version),
    managedAsset: null,
    integrity: manifest.integrity,
    dataIntegrity: manifest.dataIntegrity,
  };
}

/**
 * Resolve the latest release, preferring the GitHub Pages manifest (no rate
 * limit, includes SRI hashes) and falling back to the GitHub API.
 */
export async function getLatestReleaseInfo(): Promise<LatestRelease> {
  try {
    return await fetchLatestReleaseFromPages();
  } catch {
    // Pages unavailable — fall back to the rate-limited GitHub API (no SRI).
    return getLatestRelease();
  }
}

/**
 * Convert an ArrayBuffer to a base64 string in chunks to avoid call-stack
 * overflow on large payloads (managed solution zips can be several MB).
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // 32KB per chunk
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

/**
 * Download the managed solution asset and return it base64-encoded, ready to be
 * passed as `CustomizationFile` to ImportSolution.
 *
 * Tries the api.github.com asset endpoint first (best CORS support), then falls
 * back to the public browser download URL. An optional {@link UPDATE_PROXY_URL}
 * can be configured to work around CORS restrictions on the binary download.
 *
 * @throws Error (typically a CORS/network TypeError) when the binary cannot be fetched.
 */
export async function downloadManagedSolutionBase64(asset: ReleaseAsset): Promise<string> {
  const attempts: Array<{ url: string; headers: Record<string, string> }> = [];

  const proxied = (url: string) => (UPDATE_PROXY_URL ? `${UPDATE_PROXY_URL}${url}` : url);

  // Primary: api.github.com asset endpoint returns the binary with octet-stream.
  attempts.push({
    url: proxied(asset.apiUrl),
    headers: { Accept: 'application/octet-stream' },
  });
  // Fallback: the public browser download URL.
  attempts.push({
    url: proxied(asset.browserDownloadUrl),
    headers: {},
  });

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      const response = await fetch(attempt.url, {
        method: 'GET',
        headers: attempt.headers,
      });
      if (!response.ok) {
        lastError = new Error(`Download failed: ${response.status} ${response.statusText}`);
        continue;
      }
      const buffer = await response.arrayBuffer();
      return arrayBufferToBase64(buffer);
    } catch (error) {
      // Typically a CORS TypeError — try the next strategy.
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Failed to download the managed solution asset');
}

/**
 * Fetch the managed solution as base64 from the GitHub Pages JSON payload.
 *
 * GitHub Pages returns `Access-Control-Allow-Origin: *`, so a plain cross-origin
 * `fetch` works from the Dataverse iframe — and unlike the <script> include this
 * only retrieves data (no remote code execution). This is the preferred strategy.
 *
 * @param dataIntegrity - optional `sha384-…` hash; when provided, the fetched
 *   base64 is verified against it and a mismatch throws (tamper detection).
 * @throws Error when the payload is unavailable, mismatched, or fails integrity.
 */
export async function fetchManagedSolutionFromPages(
  version: string,
  dataIntegrity?: string
): Promise<string> {
  const url = `${GITHUB_PAGES_BASE_URL}/update/v${version}.json`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Update payload not available on GitHub Pages: ${response.status}`);
  }
  const payload = (await response.json()) as Partial<SolutionUpdatePayload>;
  if (!payload || payload.version !== version || !payload.data) {
    throw new Error('The Pages payload was missing or did not match the expected version.');
  }
  if (dataIntegrity) {
    const actual = await sha384OfString(payload.data);
    if (actual !== dataIntegrity) {
      throw new Error('Integrity check failed for the update payload.');
    }
  }
  return payload.data;
}

/** Timeout for loading the GitHub Pages update script (ms) */
const SCRIPT_LOAD_TIMEOUT_MS = 30000;

/**
 * Load the managed solution as base64 by injecting a <script> from GitHub Pages.
 *
 * A cross-origin `<script>` tag is exempt from CORS, so this works from the
 * Dataverse iframe where a direct binary `fetch` of the release asset is blocked.
 * The script assigns `window.__ERD_SOLUTION_UPDATE__ = { version, data }`, which
 * we read back, validate against the expected version, and then clean up.
 *
 * @param integrity - optional Subresource Integrity hash. Note: setting it turns
 *   the request into CORS mode, so it only works if Pages returns an ACAO header.
 * @throws Error on load failure, timeout, or a version/payload mismatch.
 */
export function loadManagedSolutionViaScript(version: string, integrity?: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const url = `${GITHUB_PAGES_BASE_URL}/update/v${version}.js`;
    const script = document.createElement('script');
    script.src = url;
    if (integrity) {
      script.integrity = integrity;
      script.crossOrigin = 'anonymous';
    }

    let settled = false;
    const cleanup = () => {
      script.remove();
      delete window.__ERD_SOLUTION_UPDATE__;
    };

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Timed out loading the update payload from GitHub Pages.'));
    }, SCRIPT_LOAD_TIMEOUT_MS);

    script.onload = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const payload = window.__ERD_SOLUTION_UPDATE__;
      cleanup();
      if (!payload || payload.version !== version || !payload.data) {
        reject(new Error('The update payload was missing or did not match the expected version.'));
        return;
      }
      resolve(payload.data);
    };

    script.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanup();
      reject(new Error('Failed to load the update payload from GitHub Pages.'));
    };

    document.head.appendChild(script);
  });
}

/**
 * Obtain the managed solution as base64 via a resilient cascade:
 *   1. `fetch` the Pages JSON payload — safe (data-only) and CORS-OK.
 *   2. `<script>` include of the Pages JS payload — CORS-exempt escape hatch if a
 *      CSP allows `script-src` but blocks `connect-src`.
 *   3. Direct binary download of the release asset — last resort (may hit CORS).
 *
 * @throws the last strategy's error when none succeed.
 */
export async function getManagedSolutionBase64(release: LatestRelease): Promise<string> {
  const strategies: Array<() => Promise<string>> = [
    () => fetchManagedSolutionFromPages(release.version, release.dataIntegrity),
    () => loadManagedSolutionViaScript(release.version, release.integrity),
  ];
  const asset = release.managedAsset;
  if (asset) {
    strategies.push(() => downloadManagedSolutionBase64(asset));
  }

  let lastError: unknown;
  for (const strategy of strategies) {
    try {
      return await strategy();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Unable to retrieve the managed solution.');
}
