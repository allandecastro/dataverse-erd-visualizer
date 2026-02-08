/**
 * Serialization helpers for converting between Sets/Arrays for JSON compatibility
 */

/**
 * Convert Set to Array
 * @param set Set to convert
 * @returns Array with same elements
 */
export function setToArray<T>(set: Set<T>): T[] {
  return Array.from(set);
}

/**
 * Convert Array to Set
 * @param array Array to convert
 * @returns Set with same elements
 */
export function arrayToSet<T>(array: T[]): Set<T> {
  return new Set(array);
}

/**
 * Convert Record<string, Set<string>> to Record<string, string[]>
 * @param record Record with Set values
 * @returns Record with Array values
 */
export function recordOfSetsToArrays(record: Record<string, Set<string>>): Record<string, string[]> {
  return Object.fromEntries(Object.entries(record).map(([key, set]) => [key, Array.from(set)]));
}

/**
 * Convert Record<string, string[]> to Record<string, Set<string>>
 * @param record Record with Array values
 * @returns Record with Set values
 */
export function recordOfArraysToSets(record: Record<string, string[]>): Record<string, Set<string>> {
  return Object.fromEntries(Object.entries(record).map(([key, arr]) => [key, new Set(arr)]));
}

/**
 * Generate a UUID (v4) for snapshot IDs
 * @returns UUID string
 */
export function generateSnapshotId(): string {
  // Try native crypto.randomUUID() first (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback: Simple UUID v4 generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a default snapshot name based on timestamp
 * @param timestamp Unix timestamp
 * @returns Default name like "Snapshot 2025-02-07 19:30"
 */
export function generateDefaultSnapshotName(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `Snapshot ${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * Format relative time from timestamp (e.g., "2 hours ago", "just now")
 * @param timestamp Unix timestamp
 * @returns Relative time string
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;

  // For older snapshots, show the date
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Check if a timestamp is recent (< 24 hours old)
 * @param timestamp Unix timestamp
 * @returns True if within last 24 hours
 */
export function isRecentTimestamp(timestamp: number): boolean {
  const now = Date.now();
  const diff = now - timestamp;
  const hours = diff / (1000 * 60 * 60);
  return hours < 24;
}

/**
 * Ensure snapshot name is unique by appending (2), (3), etc.
 * @param name Desired snapshot name
 * @param existingNames Array of existing snapshot names
 * @returns Unique name
 */
export function ensureUniqueName(name: string, existingNames: string[]): string {
  if (!existingNames.includes(name)) {
    return name;
  }

  let counter = 2;
  let uniqueName = `${name} (${counter})`;
  while (existingNames.includes(uniqueName)) {
    counter++;
    uniqueName = `${name} (${counter})`;
  }
  return uniqueName;
}
