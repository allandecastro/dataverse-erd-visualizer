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
 * Check if an attribute is a lookup type (Lookup, Owner, or Customer)
 */
export function isLookupType(attr: EntityAttribute): boolean {
  return attr.type === 'Lookup' || attr.type === 'Owner' || attr.type === 'Customer';
}
