/**
 * Tests for groupUtils — entity grouping via color association
 */

import { describe, it, expect } from 'vitest';
import { generateColorLabel, deriveGroups, PRESET_COLOR_LABELS } from '../groupUtils';

describe('groupUtils', () => {
  describe('PRESET_COLOR_LABELS', () => {
    it('should have 10 preset colors', () => {
      expect(Object.keys(PRESET_COLOR_LABELS)).toHaveLength(10);
    });

    it('should map lowercase hex to readable color names', () => {
      expect(PRESET_COLOR_LABELS['#ef4444']).toBe('Red');
      expect(PRESET_COLOR_LABELS['#3b82f6']).toBe('Blue');
      expect(PRESET_COLOR_LABELS['#22c55e']).toBe('Green');
      expect(PRESET_COLOR_LABELS['#64748b']).toBe('Slate');
    });
  });

  describe('generateColorLabel', () => {
    it('should return preset name for known colors', () => {
      expect(generateColorLabel('#ef4444')).toBe('Red');
      expect(generateColorLabel('#f97316')).toBe('Orange');
      expect(generateColorLabel('#eab308')).toBe('Yellow');
      expect(generateColorLabel('#22c55e')).toBe('Green');
      expect(generateColorLabel('#14b8a6')).toBe('Teal');
      expect(generateColorLabel('#0ea5e9')).toBe('Sky');
      expect(generateColorLabel('#3b82f6')).toBe('Blue');
      expect(generateColorLabel('#8b5cf6')).toBe('Violet');
      expect(generateColorLabel('#ec4899')).toBe('Pink');
      expect(generateColorLabel('#64748b')).toBe('Slate');
    });

    it('should be case-insensitive for preset colors', () => {
      expect(generateColorLabel('#EF4444')).toBe('Red');
      expect(generateColorLabel('#3B82F6')).toBe('Blue');
    });

    it('should return uppercase hex for custom colors', () => {
      expect(generateColorLabel('#ff00ff')).toBe('#FF00FF');
      expect(generateColorLabel('#123abc')).toBe('#123ABC');
    });
  });

  describe('deriveGroups', () => {
    it('should return empty array when no color overrides exist', () => {
      const groups = deriveGroups({}, {});
      expect(groups).toEqual([]);
    });

    it('should group entities by shared color', () => {
      const colorOverrides = {
        account: '#ef4444',
        contact: '#ef4444',
        opportunity: '#3b82f6',
      };
      const groups = deriveGroups(colorOverrides, {});

      expect(groups).toHaveLength(2);
      // Sorted by name: Blue < Red
      expect(groups[0].name).toBe('Blue');
      expect(groups[0].entityNames).toEqual(['opportunity']);
      expect(groups[1].name).toBe('Red');
      expect(groups[1].entityNames).toEqual(['account', 'contact']);
    });

    it('should use user-assigned group names when available', () => {
      const colorOverrides = {
        account: '#ef4444',
        contact: '#ef4444',
      };
      const groupNames = { '#ef4444': 'Sales' };
      const groups = deriveGroups(colorOverrides, groupNames);

      expect(groups).toHaveLength(1);
      expect(groups[0].name).toBe('Sales');
      expect(groups[0].entityNames).toEqual(['account', 'contact']);
    });

    it('should normalize colors to lowercase', () => {
      const colorOverrides = {
        account: '#EF4444',
        contact: '#ef4444',
      };
      const groups = deriveGroups(colorOverrides, {});

      expect(groups).toHaveLength(1);
      expect(groups[0].color).toBe('#ef4444');
      expect(groups[0].entityNames).toEqual(['account', 'contact']);
    });

    it('should sort entity names within each group', () => {
      const colorOverrides = {
        zebra_entity: '#ef4444',
        alpha_entity: '#ef4444',
        middle_entity: '#ef4444',
      };
      const groups = deriveGroups(colorOverrides, {});

      expect(groups[0].entityNames).toEqual(['alpha_entity', 'middle_entity', 'zebra_entity']);
    });

    it('should sort groups alphabetically by name', () => {
      const colorOverrides = {
        entity_a: '#ec4899', // Pink
        entity_b: '#22c55e', // Green
        entity_c: '#ef4444', // Red
      };
      const groups = deriveGroups(colorOverrides, {});

      expect(groups.map((g) => g.name)).toEqual(['Green', 'Pink', 'Red']);
    });

    it('should handle custom colors with hex label', () => {
      const colorOverrides = {
        entity_a: '#ff00ff',
      };
      const groups = deriveGroups(colorOverrides, {});

      expect(groups[0].name).toBe('#FF00FF');
      expect(groups[0].color).toBe('#ff00ff');
    });

    it('should handle single entity per group', () => {
      const colorOverrides = {
        entity_a: '#ef4444',
      };
      const groups = deriveGroups(colorOverrides, {});

      expect(groups).toHaveLength(1);
      expect(groups[0].entityNames).toEqual(['entity_a']);
    });

    it('should use user name over auto-label', () => {
      const colorOverrides = {
        entity_a: '#ef4444',
      };
      const groupNames = { '#ef4444': 'My Custom Group' };
      const groups = deriveGroups(colorOverrides, groupNames);

      expect(groups[0].name).toBe('My Custom Group');
    });

    it('should handle multiple groups with mixed named/unnamed', () => {
      const colorOverrides = {
        entity_a: '#ef4444',
        entity_b: '#3b82f6',
        entity_c: '#22c55e',
      };
      const groupNames = { '#ef4444': 'CRM Entities' };
      const groups = deriveGroups(colorOverrides, groupNames);

      expect(groups).toHaveLength(3);
      // Sorted: Blue < CRM Entities < Green
      expect(groups[0].name).toBe('Blue');
      expect(groups[1].name).toBe('CRM Entities');
      expect(groups[2].name).toBe('Green');
    });

    it('should handle orphaned group names gracefully', () => {
      // groupNames has entries for colors not in entityColorOverrides
      const colorOverrides = {
        entity_a: '#ef4444',
      };
      const groupNames = {
        '#ef4444': 'Active',
        '#3b82f6': 'Orphaned Name', // No entities have this color
      };
      const groups = deriveGroups(colorOverrides, groupNames);

      // Should only have 1 group (the one with entities)
      expect(groups).toHaveLength(1);
      expect(groups[0].name).toBe('Active');
    });
  });
});
