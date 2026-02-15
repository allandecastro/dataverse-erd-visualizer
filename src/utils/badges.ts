/**
 * Shared utilities for attribute type badges (using Dataverse terminology)
 */

import type { EntityAttribute } from '@/types';

export interface AttributeBadge {
  label: string;
  color: string;
}

/**
 * Get badge label and color for an attribute type
 * Uses Dataverse-specific terminology for field types
 */
export function getAttributeBadge(attr: EntityAttribute): AttributeBadge {
  if (attr.isPrimaryKey) {
    return { label: 'PK', color: '#f59e0b' };
  }
  if (attr.isPrimaryName) {
    return { label: 'PN', color: '#06b6d4' };
  }
  if (attr.type === 'Lookup' || attr.type === 'Owner' || attr.type === 'Customer') {
    return { label: 'LKP', color: '#ef4444' };
  }
  if (attr.type === 'String') {
    return { label: 'TXT', color: '#8b5cf6' };
  }
  if (attr.type === 'Memo') {
    return { label: 'MLT', color: '#8b5cf6' }; // Multiline Text
  }
  if (attr.type === 'Integer' || attr.type === 'BigInt') {
    return { label: 'INT', color: '#3b82f6' };
  }
  if (attr.type === 'Decimal') {
    return { label: 'DEC', color: '#3b82f6' };
  }
  if (attr.type === 'Double') {
    return { label: 'FLT', color: '#3b82f6' }; // Floating Point
  }
  if (attr.type === 'Money') {
    return { label: 'CUR', color: '#22c55e' }; // Currency
  }
  if (attr.type === 'DateTime') {
    return { label: 'DT', color: '#10b981' };
  }
  if (attr.type === 'Boolean') {
    return { label: 'Y/N', color: '#6366f1' };
  }
  if (attr.type === 'Picklist') {
    return { label: 'CHC', color: '#ec4899' }; // Choice
  }
  if (attr.type === 'State') {
    return { label: 'STS', color: '#f97316' }; // Status
  }
  if (attr.type === 'Status') {
    return { label: 'RSN', color: '#f97316' }; // Status Reason
  }
  if (attr.type === 'UniqueIdentifier') {
    return { label: 'UID', color: '#f59e0b' };
  }
  return { label: 'EXT', color: '#6b7280' };
}

/**
 * Get a human-readable type label for an attribute (using Dataverse/Power Apps terminology)
 */
export function getTypeLabel(attr: EntityAttribute): string {
  if (attr.isPrimaryKey) return 'Unique Identifier';
  switch (attr.type) {
    case 'Lookup':
      return 'Lookup';
    case 'Owner':
      return 'Owner';
    case 'Customer':
      return 'Customer';
    case 'String':
      return 'Text';
    case 'Memo':
      return 'Multiline Text';
    case 'Integer':
      return 'Whole Number';
    case 'BigInt':
      return 'Big Integer';
    case 'Decimal':
      return 'Decimal Number';
    case 'Double':
      return 'Floating Point';
    case 'Money':
      return 'Currency';
    case 'DateTime':
      return 'Date and Time';
    case 'Boolean':
      return 'Yes/No';
    case 'Picklist':
      return 'Choice';
    case 'State':
      return 'Status';
    case 'Status':
      return 'Status Reason';
    case 'UniqueIdentifier':
      return 'Unique Identifier';
    default:
      return attr.type;
  }
}

/**
 * Check if an attribute is a lookup type (Lookup, Owner, or Customer)
 */
export function isLookupType(attr: EntityAttribute): boolean {
  return attr.type === 'Lookup' || attr.type === 'Owner' || attr.type === 'Customer';
}

/**
 * Check if an attribute is a custom attribute (vs. standard OOB attribute)
 */
export function isCustomAttribute(attr: EntityAttribute): boolean {
  return attr.isCustomAttribute === true;
}

export interface BadgeCount {
  label: string;
  color: string;
  count: number;
}

/**
 * Compute available badge types from a list of attributes with counts
 */
export function getAvailableBadges(attributes: EntityAttribute[]): BadgeCount[] {
  const badgeMap = new Map<string, { color: string; count: number }>();
  attributes.forEach((attr) => {
    const badge = getAttributeBadge(attr);
    const existing = badgeMap.get(badge.label);
    if (existing) {
      existing.count++;
    } else {
      badgeMap.set(badge.label, { color: badge.color, count: 1 });
    }
  });
  return Array.from(badgeMap.entries()).map(([label, { color, count }]) => ({
    label,
    color,
    count,
  }));
}

/**
 * Filter attributes by badge label
 */
export function filterByBadge(
  attributes: EntityAttribute[],
  badgeLabel: string
): EntityAttribute[] {
  return attributes.filter((attr) => getAttributeBadge(attr).label === badgeLabel);
}
