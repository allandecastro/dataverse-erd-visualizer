/**
 * Utility functions for entity grouping via color association.
 *
 * Groups are derived from entityColorOverrides — entities sharing the same
 * color override belong to the same group. Group names map hex colors to
 * user-defined labels.
 */

import type { DerivedGroup } from '@/types/erdTypes';

/** Maps the 10 preset colors (from ColorPickerPopover) to readable names */
export const PRESET_COLOR_LABELS: Record<string, string> = {
  '#ef4444': 'Red',
  '#f97316': 'Orange',
  '#eab308': 'Yellow',
  '#22c55e': 'Green',
  '#14b8a6': 'Teal',
  '#0ea5e9': 'Sky',
  '#3b82f6': 'Blue',
  '#8b5cf6': 'Violet',
  '#ec4899': 'Pink',
  '#64748b': 'Slate',
};

/**
 * Generate a human-readable label for a hex color.
 * Returns the preset name for known colors, or the uppercase hex code for custom colors.
 */
export function generateColorLabel(hexColor: string): string {
  return PRESET_COLOR_LABELS[hexColor.toLowerCase()] || hexColor.toUpperCase();
}

/**
 * Derive groups from entity color overrides and group names.
 * Pure function — can be used directly or inside useMemo.
 *
 * @returns Sorted array of derived groups (by name, alphabetically)
 */
export function deriveGroups(
  entityColorOverrides: Record<string, string>,
  groupNames: Record<string, string>
): DerivedGroup[] {
  const colorToEntities = new Map<string, string[]>();

  for (const [entityName, color] of Object.entries(entityColorOverrides)) {
    const normalized = color.toLowerCase();
    const existing = colorToEntities.get(normalized);
    if (existing) {
      existing.push(entityName);
    } else {
      colorToEntities.set(normalized, [entityName]);
    }
  }

  return Array.from(colorToEntities.entries())
    .map(([color, entityNames]) => ({
      color,
      name: groupNames[color] || generateColorLabel(color),
      entityNames: entityNames.sort(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
