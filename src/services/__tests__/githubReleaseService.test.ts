/**
 * Tests for the GitHub Release Service
 * Covers version comparison, update detection, and release parsing.
 */

import {
  compareVersions,
  isUpdateAvailable,
  getLatestRelease,
  fetchLatestReleaseFromPages,
  getLatestReleaseInfo,
  downloadManagedSolutionBase64,
  fetchManagedSolutionFromPages,
  loadManagedSolutionViaScript,
  getManagedSolutionBase64,
  type ReleaseAsset,
  type LatestRelease,
} from '../githubReleaseService';

/** Compute the sha384-<base64> SRI hash of a string (mirrors the service). */
async function sri(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-384', new TextEncoder().encode(text));
  let bin = '';
  new Uint8Array(digest).forEach((b) => (bin += String.fromCharCode(b)));
  return `sha384-${btoa(bin)}`;
}

const mockFetch = vi.fn();

const asset: ReleaseAsset = {
  apiUrl: 'https://api.github.com/assets/2',
  browserDownloadUrl: 'https://github.com/x/y/releases/download/managed.zip',
  name: 'DataverseERDVisualizer_0.1.13.0_managed.zip',
  size: 3,
};

/** Build a fake ok/failed Response whose body is the given bytes. */
function bytesResponse(ok: boolean, bytes = new Uint8Array([0x50, 0x4b, 0x03])) {
  return {
    ok,
    status: ok ? 200 : 500,
    statusText: ok ? 'OK' : 'Server Error',
    arrayBuffer: async () => bytes.buffer,
  };
}

describe('githubReleaseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
  });

  describe('compareVersions', () => {
    it('treats equal 4-segment versions as equal', () => {
      expect(compareVersions('0.1.12.4', '0.1.12.4')).toBe(0);
    });

    it('detects a newer patch segment', () => {
      expect(compareVersions('0.1.12.5', '0.1.12.4')).toBeGreaterThan(0);
      expect(compareVersions('0.1.12.4', '0.1.12.5')).toBeLessThan(0);
    });

    it('compares major/minor before later segments', () => {
      expect(compareVersions('1.0.0.0', '0.9.99.99')).toBeGreaterThan(0);
      expect(compareVersions('0.2.0.0', '0.1.99.99')).toBeGreaterThan(0);
    });

    it('pads missing segments with zero', () => {
      expect(compareVersions('0.1.12', '0.1.12.0')).toBe(0);
      expect(compareVersions('0.1.12.1', '0.1.12')).toBeGreaterThan(0);
    });

    it('ignores a leading "v"', () => {
      expect(compareVersions('v0.1.12.4', '0.1.12.4')).toBe(0);
    });

    it('treats non-numeric segments as zero', () => {
      expect(compareVersions('0.1.x.4', '0.1.0.4')).toBe(0);
    });
  });

  describe('isUpdateAvailable', () => {
    it('is true only when the latest version is strictly newer', () => {
      expect(isUpdateAvailable('0.1.12.4', '0.1.12.5')).toBe(true);
      expect(isUpdateAvailable('0.1.12.4', '0.1.12.4')).toBe(false);
      expect(isUpdateAvailable('0.1.12.5', '0.1.12.4')).toBe(false);
    });
  });

  describe('getLatestRelease', () => {
    it('parses the tag and selects the managed solution asset', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v0.1.13.0',
          html_url:
            'https://github.com/allandecastro/dataverse-erd-visualizer/releases/tag/v0.1.13.0',
          assets: [
            {
              name: 'webresources_0.1.13.0.zip',
              url: 'https://api.github.com/assets/1',
              browser_download_url: 'https://github.com/.../webresources_0.1.13.0.zip',
              size: 1000,
            },
            {
              name: 'DataverseERDVisualizer_0.1.13.0_managed.zip',
              url: 'https://api.github.com/assets/2',
              browser_download_url: 'https://github.com/.../managed.zip',
              size: 2000,
            },
          ],
        }),
      });

      const release = await getLatestRelease();

      expect(release.tagName).toBe('v0.1.13.0');
      expect(release.version).toBe('0.1.13.0');
      expect(release.managedAsset).not.toBeNull();
      expect(release.managedAsset?.name).toBe('DataverseERDVisualizer_0.1.13.0_managed.zip');
      expect(release.managedAsset?.apiUrl).toBe('https://api.github.com/assets/2');
    });

    it('returns a null managed asset when none is attached', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v0.1.13.0',
          html_url: 'https://github.com/x/y/releases/tag/v0.1.13.0',
          assets: [
            {
              name: 'webresources_0.1.13.0.zip',
              url: 'https://api.github.com/assets/1',
              browser_download_url: 'https://github.com/.../webresources_0.1.13.0.zip',
              size: 1000,
            },
          ],
        }),
      });

      const release = await getLatestRelease();
      expect(release.managedAsset).toBeNull();
    });

    it('throws when the GitHub API responds with an error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(getLatestRelease()).rejects.toThrow(/404/);
    });
  });

  describe('downloadManagedSolutionBase64', () => {
    it('downloads via the api endpoint and returns base64', async () => {
      mockFetch.mockResolvedValueOnce(bytesResponse(true, new Uint8Array([0x50, 0x4b])));

      const base64 = await downloadManagedSolutionBase64(asset);

      // 0x50,0x4b === "PK" === base64 "UEs"
      expect(base64).toBe('UEs=');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        asset.apiUrl,
        expect.objectContaining({ headers: { Accept: 'application/octet-stream' } })
      );
    });

    it('falls back to the browser download URL when the primary fetch fails (CORS)', async () => {
      mockFetch
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce(bytesResponse(true, new Uint8Array([0x50, 0x4b])));

      const base64 = await downloadManagedSolutionBase64(asset);

      expect(base64).toBe('UEs=');
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenLastCalledWith(asset.browserDownloadUrl, expect.anything());
    });

    it('throws when every download strategy fails', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(downloadManagedSolutionBase64(asset)).rejects.toThrow(/Failed to fetch/);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('loadManagedSolutionViaScript', () => {
    afterEach(() => {
      delete window.__ERD_SOLUTION_UPDATE__;
      document.head.querySelectorAll('script[src*="/update/"]').forEach((s) => s.remove());
    });

    /** Grab the injected update script for a given version. */
    const injectedScript = (version: string) =>
      document.head.querySelector<HTMLScriptElement>(`script[src$="/update/v${version}.js"]`);

    it('resolves with the base64 payload once the script populates the global', async () => {
      const promise = loadManagedSolutionViaScript('1.0.0.0');
      const script = injectedScript('1.0.0.0');
      expect(script).toBeTruthy();

      window.__ERD_SOLUTION_UPDATE__ = { version: '1.0.0.0', data: 'PAYLOAD64' };
      script!.dispatchEvent(new Event('load'));

      await expect(promise).resolves.toBe('PAYLOAD64');
      // Global and script are cleaned up afterwards.
      expect(window.__ERD_SOLUTION_UPDATE__).toBeUndefined();
    });

    it('rejects when the script fails to load', async () => {
      const promise = loadManagedSolutionViaScript('1.0.0.0');
      injectedScript('1.0.0.0')!.dispatchEvent(new Event('error'));
      await expect(promise).rejects.toThrow(/Failed to load/);
    });

    it('rejects when the payload version does not match', async () => {
      const promise = loadManagedSolutionViaScript('1.0.0.0');
      window.__ERD_SOLUTION_UPDATE__ = { version: '9.9.9.9', data: 'X' };
      injectedScript('1.0.0.0')!.dispatchEvent(new Event('load'));
      await expect(promise).rejects.toThrow(/did not match the expected version/);
    });
  });

  describe('fetchLatestReleaseFromPages', () => {
    it('parses the manifest into a LatestRelease with SRI hashes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          version: '0.1.13.1',
          js: 'update/v0.1.13.1.js',
          integrity: 'sha384-jshash',
          dataIntegrity: 'sha384-datahash',
        }),
      });

      const r = await fetchLatestReleaseFromPages();
      expect(r.version).toBe('0.1.13.1');
      expect(r.htmlUrl).toContain('/releases/tag/v0.1.13.1');
      expect(r.managedAsset).toBeNull();
      expect(r.integrity).toBe('sha384-jshash');
      expect(r.dataIntegrity).toBe('sha384-datahash');
    });

    it('throws when the manifest is unavailable', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 404 });
      await expect(fetchLatestReleaseFromPages()).rejects.toThrow(/not available/);
    });
  });

  describe('getLatestReleaseInfo', () => {
    it('prefers the Pages manifest', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ version: '0.1.13.1', js: 'update/v0.1.13.1.js' }),
      });
      const r = await getLatestReleaseInfo();
      expect(r.version).toBe('0.1.13.1');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('falls back to the GitHub API when Pages is unavailable', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('pages down')).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tag_name: 'v0.1.13.0',
          html_url: 'https://github.com/x/y/releases/tag/v0.1.13.0',
          assets: [],
        }),
      });
      const r = await getLatestReleaseInfo();
      expect(r.version).toBe('0.1.13.0');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('fetchManagedSolutionFromPages', () => {
    it('returns the base64 from the Pages JSON payload', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ version: '1.0.0.0', data: 'VIAFETCH' }),
      });

      await expect(fetchManagedSolutionFromPages('1.0.0.0')).resolves.toBe('VIAFETCH');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://allandecastro.github.io/dataverse-erd-visualizer/update/v1.0.0.0.json',
        expect.anything()
      );
    });

    it('accepts a matching dataIntegrity hash', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ version: '1.0.0.0', data: 'VIAFETCH' }),
      });
      const good = await sri('VIAFETCH');
      await expect(fetchManagedSolutionFromPages('1.0.0.0', good)).resolves.toBe('VIAFETCH');
    });

    it('throws when dataIntegrity does not match', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ version: '1.0.0.0', data: 'VIAFETCH' }),
      });
      await expect(fetchManagedSolutionFromPages('1.0.0.0', 'sha384-bogus')).rejects.toThrow(
        /Integrity check failed/
      );
    });

    it('throws when the payload is not available (404)', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 404 });
      await expect(fetchManagedSolutionFromPages('1.0.0.0')).rejects.toThrow(/not available/);
    });

    it('throws when the payload version does not match', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ version: '9.9.9.9', data: 'X' }),
      });
      await expect(fetchManagedSolutionFromPages('1.0.0.0')).rejects.toThrow(
        /did not match the expected version/
      );
    });
  });

  describe('getManagedSolutionBase64', () => {
    const release: LatestRelease = {
      tagName: 'v1.0.0.0',
      version: '1.0.0.0',
      htmlUrl: 'https://github.com/x/y/releases/tag/v1.0.0.0',
      managedAsset: asset,
    };

    afterEach(() => {
      delete window.__ERD_SOLUTION_UPDATE__;
      document.head.querySelectorAll('script[src*="/update/"]').forEach((s) => s.remove());
    });

    /** Wait (microtask poll) for the update script to be injected, then return it. */
    const waitForScript = async (version: string): Promise<HTMLScriptElement> => {
      for (let i = 0; i < 100; i++) {
        const el = document.head.querySelector<HTMLScriptElement>(
          `script[src$="/update/v${version}.js"]`
        );
        if (el) return el;
        await Promise.resolve();
      }
      throw new Error('update script was never injected');
    };

    it('prefers the data-only Pages fetch (no script injected)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ version: '1.0.0.0', data: 'VIAFETCH' }),
      });

      await expect(getManagedSolutionBase64(release)).resolves.toBe('VIAFETCH');
      expect(document.head.querySelector('script[src*="/update/"]')).toBeNull();
    });

    it('falls back to the <script> include when the fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('connect-src blocked'));

      const promise = getManagedSolutionBase64(release);
      const script = await waitForScript('1.0.0.0');
      window.__ERD_SOLUTION_UPDATE__ = { version: '1.0.0.0', data: 'VIASCRIPT' };
      script.dispatchEvent(new Event('load'));

      await expect(promise).resolves.toBe('VIASCRIPT');
    });

    it('falls back to the binary download when both Pages strategies fail', async () => {
      mockFetch
        .mockRejectedValueOnce(new TypeError('connect-src blocked')) // Pages JSON fetch
        .mockResolvedValueOnce(bytesResponse(true, new Uint8Array([0x50, 0x4b]))); // asset download

      const promise = getManagedSolutionBase64(release);
      const script = await waitForScript('1.0.0.0');
      script.dispatchEvent(new Event('error'));

      await expect(promise).resolves.toBe('UEs=');
    });
  });
});
