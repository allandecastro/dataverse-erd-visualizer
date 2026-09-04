/**
 * Update preferences — thin, dependency-free wrapper around the localStorage
 * keys used by the auto-update feature. Kept separate from the hook so pure UI
 * (e.g. the settings checkbox) can read/write the preference without importing
 * the update/import machinery.
 */

import { UPDATE_CHECK_ENABLED_KEY, UPDATE_DISMISSED_VERSION_KEY } from '@/constants';

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
