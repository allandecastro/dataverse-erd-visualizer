/**
 * localStorage abstraction layer for snapshot persistence
 */

import type { SnapshotsStorageData } from '@/types/snapshotTypes';

// localStorage key for snapshot storage
const STORAGE_KEY = 'erd-visualizer-snapshots';

/**
 * Load snapshots from localStorage
 * @returns Snapshots data or null if not found or corrupted
 */
export function loadSnapshots(): SnapshotsStorageData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const data = JSON.parse(stored) as SnapshotsStorageData;

    // Validate structure
    if (!data || typeof data !== 'object') {
      console.warn('[SnapshotStorage] Invalid snapshot data structure');
      return null;
    }

    if (!Array.isArray(data.snapshots)) {
      console.warn('[SnapshotStorage] Invalid snapshots array');
      return null;
    }

    return data;
  } catch (error) {
    console.error('[SnapshotStorage] Error loading snapshots:', error);
    return null;
  }
}

/**
 * Save snapshots to localStorage
 * @param data Snapshots data to save
 * @throws Error if quota exceeded or save fails
 */
export function saveSnapshots(data: SnapshotsStorageData): void {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    // Check for quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw new Error('Storage quota exceeded. Delete old snapshots or export to JSON.');
    }
    throw new Error(
      `Failed to save snapshots: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Clear all snapshots from localStorage
 */
export function clearSnapshots(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[SnapshotStorage] Error clearing snapshots:', error);
  }
}

/**
 * Get estimated storage size in bytes
 * @returns Approximate size in bytes
 */
export function getStorageSize(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return 0;
    }
    // Rough estimate: 2 bytes per character in UTF-16
    return stored.length * 2;
  } catch (error) {
    console.error('[SnapshotStorage] Error calculating storage size:', error);
    return 0;
  }
}

/**
 * Format bytes to human-readable string
 * @param bytes Size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatStorageSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(1)} ${units[i]}`;
}
