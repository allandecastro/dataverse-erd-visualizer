/**
 * URL State Validation - Validates shared URL state against current entity schema
 * Similar to snapshot validation but simplified for URL state (no fields validation)
 */

import type { Entity } from '@/types';
import type { CompactState } from './urlStateCodec';

/**
 * Validation result for URL state
 */
export interface URLValidationResult {
  isValid: boolean;
  missingEntities: string[];
  // Note: URL state doesn't include fields, so no missingFields
}

/**
 * Validate URL state against current entity schema
 * Similar to validateSnapshot() in useSnapshots.ts but simplified
 * @param state Compact state from URL
 * @param entities Available entities in current environment
 * @returns Validation result with missing entities list
 */
export function validateURLState(
  state: CompactState,
  entities: Entity[]
): URLValidationResult {
  const entityMap = new Map(entities.map((e) => [e.logicalName, e]));
  const missingEntities: string[] = [];

  // Check selected entities
  state.e.forEach((entityName) => {
    if (!entityMap.has(entityName)) {
      missingEntities.push(entityName);
    }
  });

  return {
    isValid: missingEntities.length === 0,
    missingEntities,
  };
}

/**
 * Filter out invalid entities from URL state
 * Similar to filterInvalidEntries() in useSnapshots.ts
 * @param state Compact state from URL
 * @param validation Validation result with missing entities
 * @returns Filtered compact state without missing entities
 */
export function filterInvalidURLEntries(
  state: CompactState,
  validation: URLValidationResult
): CompactState {
  const missingSet = new Set(validation.missingEntities);

  // Filter selected entities
  const validEntities = state.e.filter((name) => !missingSet.has(name));

  // Filter entity positions to match valid entities
  const validPositions = Object.fromEntries(
    Object.entries(state.p).filter(([entityName]) => !missingSet.has(entityName))
  );

  return {
    ...state,
    e: validEntities,
    p: validPositions,
  };
}
