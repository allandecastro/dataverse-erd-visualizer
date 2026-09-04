/**
 * Update preferences — thin, dependency-free wrapper around the localStorage
 * keys used by the auto-update feature. Kept separate from the hook so pure UI
 * (e.g. the settings checkbox) can read/write the preference without importing
 * the update/import machinery.
 */

import type { LatestRelease } from '@/services/githubReleaseService';
import {
  UPDATE_CHECK_ENABLED_KEY,
  UPDATE_DISMISSED_VERSION_KEY,
  UPDATE_LAST_CHECK_KEY,
  UPDATE_CHECK_TTL_MS,
} from '@/constants';

/** Cached result of a version check, used to throttle GitHub/Pages requests. */
export interface CachedLatest {
  release: LatestRelease;
  checkedAt: number;
}

/** Safely read a localStorage value, returning null on any failure. */
function readItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Safely write a localStorage value, ignoring any failure. */
function writeItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures (private mode, quota, etc.).
  }
}

/** Whether the app should check for updates on load (default: enabled). */
export function getUpdateCheckEnabled(): boolean {
  // Default to enabled unless explicitly turned off.
  return readItem(UPDATE_CHECK_ENABLED_KEY) !== 'false';
}

/** Persist the "check for updates on load" preference. */
export function setUpdateCheckEnabled(enabled: boolean): void {
  writeItem(UPDATE_CHECK_ENABLED_KEY, enabled ? 'true' : 'false');
}

/** The release version the user last dismissed, if any. */
export function getDismissedVersion(): string | null {
  return readItem(UPDATE_DISMISSED_VERSION_KEY);
}

/** Remember a release version so its banner stops prompting. */
export function setDismissedVersion(version: string): void {
  writeItem(UPDATE_DISMISSED_VERSION_KEY, version);
}

/** Read the cached latest-release info, or null when absent/corrupt. */
export function getCachedLatest(): CachedLatest | null {
  const raw = readItem(UPDATE_LAST_CHECK_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CachedLatest;
    if (parsed?.release?.version && typeof parsed.checkedAt === 'number') {
      return parsed;
    }
  } catch {
    // Corrupt cache — ignore.
  }
  return null;
}

/** Cache the latest-release info with the current timestamp. */
export function setCachedLatest(release: LatestRelease): void {
  writeItem(UPDATE_LAST_CHECK_KEY, JSON.stringify({ release, checkedAt: Date.now() }));
}

/** Whether a cached check is still within the throttle window. */
export function isCacheFresh(cached: CachedLatest): boolean {
  return Date.now() - cached.checkedAt < UPDATE_CHECK_TTL_MS;
}
