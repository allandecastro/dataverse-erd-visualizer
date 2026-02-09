/**
 * Tests for Snapshot Serialization
 * Validates Set/Array conversions, UUID generation, timestamp formatting
 */

import {
  setToArray,
  arrayToSet,
  recordOfSetsToArrays,
  recordOfArraysToSets,
  generateSnapshotId,
  generateDefaultSnapshotName,
  formatRelativeTime,
  isRecentTimestamp,
  ensureUniqueName,
} from '../snapshotSerializer';

describe('snapshotSerializer', () => {
  describe('setToArray / arrayToSet', () => {
    it('should convert Set to Array', () => {
      const set = new Set(['a', 'b', 'c']);
      const arr = setToArray(set);

      expect(arr).toEqual(['a', 'b', 'c']);
      expect(Array.isArray(arr)).toBe(true);
    });

    it('should convert Array back to Set', () => {
      const arr = ['a', 'b', 'c'];
      const set = arrayToSet(arr);

      expect(set).toEqual(new Set(['a', 'b', 'c']));
      expect(set).toBeInstanceOf(Set);
    });

    it('should handle empty Set', () => {
      const set = new Set<string>();
      const arr = setToArray(set);

      expect(arr).toEqual([]);
    });

    it('should handle empty Array', () => {
      const arr: string[] = [];
      const set = arrayToSet(arr);

      expect(set.size).toBe(0);
    });

    it('should remove duplicates when converting Array to Set', () => {
      const arr = ['a', 'a', 'b', 'b', 'c'];
      const set = arrayToSet(arr);

      expect(set.size).toBe(3);
      expect(set.has('a')).toBe(true);
      expect(set.has('b')).toBe(true);
      expect(set.has('c')).toBe(true);
    });

    it('should preserve order when converting Set to Array', () => {
      const set = new Set(['first', 'second', 'third']);
      const arr = setToArray(set);

      expect(arr[0]).toBe('first');
      expect(arr[1]).toBe('second');
      expect(arr[2]).toBe('third');
    });

    it('should handle numbers in Set', () => {
      const set = new Set([1, 2, 3]);
      const arr = setToArray(set);

      expect(arr).toEqual([1, 2, 3]);
    });

    it('should round-trip Set → Array → Set', () => {
      const originalSet = new Set(['account', 'contact', 'lead']);
      const arr = setToArray(originalSet);
      const restoredSet = arrayToSet(arr);

      expect(restoredSet).toEqual(originalSet);
    });
  });

  describe('recordOfSetsToArrays / recordOfArraysToSets', () => {
    it('should convert Record<string, Set> to Record<string, Array>', () => {
      const record = {
        entity1: new Set(['field1', 'field2']),
        entity2: new Set(['field3', 'field4']),
      };

      const result = recordOfSetsToArrays(record);

      expect(result).toEqual({
        entity1: ['field1', 'field2'],
        entity2: ['field3', 'field4'],
      });
    });

    it('should convert Record<string, Array> back to Record<string, Set>', () => {
      const record = {
        entity1: ['field1', 'field2'],
        entity2: ['field3', 'field4'],
      };

      const result = recordOfArraysToSets(record);

      expect(result.entity1).toEqual(new Set(['field1', 'field2']));
      expect(result.entity2).toEqual(new Set(['field3', 'field4']));
    });

    it('should handle empty record', () => {
      const record: Record<string, Set<string>> = {};

      const result = recordOfSetsToArrays(record);

      expect(result).toEqual({});
    });

    it('should handle record with empty Sets', () => {
      const record = {
        entity1: new Set<string>(),
        entity2: new Set<string>(),
      };

      const result = recordOfSetsToArrays(record);

      expect(result).toEqual({
        entity1: [],
        entity2: [],
      });
    });

    it('should round-trip Record<Set> → Record<Array> → Record<Set>', () => {
      const original = {
        account: new Set(['accountid', 'name']),
        contact: new Set(['contactid', 'fullname']),
      };

      const arrays = recordOfSetsToArrays(original);
      const restored = recordOfArraysToSets(arrays);

      expect(restored.account).toEqual(original.account);
      expect(restored.contact).toEqual(original.contact);
    });

    it('should handle single-element Sets', () => {
      const record = {
        entity: new Set(['singleField']),
      };

      const result = recordOfSetsToArrays(record);

      expect(result).toEqual({
        entity: ['singleField'],
      });
    });
  });

  describe('generateSnapshotId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateSnapshotId();
      const id2 = generateSnapshotId();

      expect(id1).not.toBe(id2);
    });

    it('should generate UUID v4 format', () => {
      const id = generateSnapshotId();

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      // where y is one of [8, 9, a, b]
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('should generate valid ID length', () => {
      const id = generateSnapshotId();

      // UUID is always 36 characters (32 hex + 4 hyphens)
      expect(id.length).toBe(36);
    });

    it('should include version 4 marker', () => {
      const id = generateSnapshotId();
      const parts = id.split('-');

      // Third section should start with '4'
      expect(parts[2][0]).toBe('4');
    });

    it('should generate 100 unique IDs', () => {
      const ids = new Set<string>();

      for (let i = 0; i < 100; i++) {
        ids.add(generateSnapshotId());
      }

      // All 100 should be unique
      expect(ids.size).toBe(100);
    });
  });

  describe('generateDefaultSnapshotName', () => {
    it('should format timestamp to snapshot name', () => {
      const timestamp = new Date('2025-02-07T19:30:00').getTime();
      const name = generateDefaultSnapshotName(timestamp);

      expect(name).toBe('Snapshot 2025-02-07 19:30');
    });

    it('should pad single-digit months and days', () => {
      const timestamp = new Date('2025-01-05T09:05:00').getTime();
      const name = generateDefaultSnapshotName(timestamp);

      expect(name).toBe('Snapshot 2025-01-05 09:05');
    });

    it('should handle midnight time', () => {
      const timestamp = new Date('2025-12-25T00:00:00').getTime();
      const name = generateDefaultSnapshotName(timestamp);

      expect(name).toBe('Snapshot 2025-12-25 00:00');
    });

    it('should handle end of day time', () => {
      const timestamp = new Date('2025-12-31T23:59:00').getTime();
      const name = generateDefaultSnapshotName(timestamp);

      expect(name).toBe('Snapshot 2025-12-31 23:59');
    });

    it('should use current timestamp when called with Date.now()', () => {
      const now = Date.now();
      const name = generateDefaultSnapshotName(now);

      expect(name).toContain('Snapshot');
      expect(name).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
    });
  });

  describe('formatRelativeTime', () => {
    const now = Date.now();

    it('should show "just now" for recent timestamps (< 60 seconds)', () => {
      const timestamp = now - 30 * 1000; // 30 seconds ago

      const result = formatRelativeTime(timestamp);

      expect(result).toBe('just now');
    });

    it('should show minutes for timestamps < 60 minutes', () => {
      const timestamp = now - 5 * 60 * 1000; // 5 minutes ago

      const result = formatRelativeTime(timestamp);

      expect(result).toBe('5 minutes ago');
    });

    it('should use singular "minute" for 1 minute', () => {
      const timestamp = now - 1 * 60 * 1000; // 1 minute ago

      const result = formatRelativeTime(timestamp);

      expect(result).toBe('1 minute ago');
    });

    it('should show hours for timestamps < 24 hours', () => {
      const timestamp = now - 3 * 60 * 60 * 1000; // 3 hours ago

      const result = formatRelativeTime(timestamp);

      expect(result).toBe('3 hours ago');
    });

    it('should use singular "hour" for 1 hour', () => {
      const timestamp = now - 1 * 60 * 60 * 1000; // 1 hour ago

      const result = formatRelativeTime(timestamp);

      expect(result).toBe('1 hour ago');
    });

    it('should show days for timestamps < 7 days', () => {
      const timestamp = now - 2 * 24 * 60 * 60 * 1000; // 2 days ago

      const result = formatRelativeTime(timestamp);

      expect(result).toBe('2 days ago');
    });

    it('should use singular "day" for 1 day', () => {
      const timestamp = now - 1 * 24 * 60 * 60 * 1000; // 1 day ago

      const result = formatRelativeTime(timestamp);

      expect(result).toBe('1 day ago');
    });

    it('should show date for timestamps >= 7 days', () => {
      const timestamp = new Date('2025-01-01T00:00:00').getTime();

      const result = formatRelativeTime(timestamp);

      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/); // MM/DD/YYYY format
    });

    it('should format old date correctly', () => {
      const timestamp = new Date('2024-12-15T10:30:00').getTime();

      const result = formatRelativeTime(timestamp);

      expect(result).toBe('12/15/2024');
    });
  });

  describe('isRecentTimestamp', () => {
    const now = Date.now();

    it('should return true for timestamps < 24 hours old', () => {
      const timestamp = now - 12 * 60 * 60 * 1000; // 12 hours ago

      expect(isRecentTimestamp(timestamp)).toBe(true);
    });

    it('should return true for very recent timestamps', () => {
      const timestamp = now - 5 * 60 * 1000; // 5 minutes ago

      expect(isRecentTimestamp(timestamp)).toBe(true);
    });

    it('should return true for timestamps exactly at boundary (23h 59m)', () => {
      const timestamp = now - 23 * 60 * 60 * 1000 - 59 * 60 * 1000;

      expect(isRecentTimestamp(timestamp)).toBe(true);
    });

    it('should return false for timestamps > 24 hours old', () => {
      const timestamp = now - 25 * 60 * 60 * 1000; // 25 hours ago

      expect(isRecentTimestamp(timestamp)).toBe(false);
    });

    it('should return false for very old timestamps', () => {
      const timestamp = new Date('2024-01-01').getTime();

      expect(isRecentTimestamp(timestamp)).toBe(false);
    });

    it('should return true for current timestamp', () => {
      expect(isRecentTimestamp(now)).toBe(true);
    });
  });

  describe('ensureUniqueName', () => {
    it('should return original name if unique', () => {
      const result = ensureUniqueName('Snapshot 1', ['Snapshot 2', 'Snapshot 3']);

      expect(result).toBe('Snapshot 1');
    });

    it('should append (2) if name exists', () => {
      const result = ensureUniqueName('Snapshot', ['Snapshot']);

      expect(result).toBe('Snapshot (2)');
    });

    it('should increment number until unique', () => {
      const result = ensureUniqueName('Snapshot', ['Snapshot', 'Snapshot (2)', 'Snapshot (3)']);

      expect(result).toBe('Snapshot (4)');
    });

    it('should handle empty existing names', () => {
      const result = ensureUniqueName('Snapshot', []);

      expect(result).toBe('Snapshot');
    });

    it('should handle names with special characters', () => {
      const result = ensureUniqueName('Snapshot: Test', ['Snapshot: Test']);

      expect(result).toBe('Snapshot: Test (2)');
    });

    it('should find gap in numbering', () => {
      // If (2) exists but (3) doesn't, it should use (3)
      const result = ensureUniqueName('Snapshot', ['Snapshot', 'Snapshot (2)']);

      expect(result).toBe('Snapshot (3)');
    });

    it('should handle very long name chains', () => {
      const existing = [
        'Snapshot',
        'Snapshot (2)',
        'Snapshot (3)',
        'Snapshot (4)',
        'Snapshot (5)',
        'Snapshot (6)',
        'Snapshot (7)',
        'Snapshot (8)',
        'Snapshot (9)',
        'Snapshot (10)',
      ];

      const result = ensureUniqueName('Snapshot', existing);

      expect(result).toBe('Snapshot (11)');
    });

    it('should be case-sensitive', () => {
      const result = ensureUniqueName('Snapshot', ['snapshot']);

      // Should return original because 'Snapshot' != 'snapshot'
      expect(result).toBe('Snapshot');
    });
  });
});
