/**
 * Utility functions for determining edge marker types based on relationship data
 */

import type { EntityRelationship, RelationshipType } from '@/types';
import type { LineNotationStyle, LineStrokeStyle, CardinalityEnd } from '@/types/erdTypes';

/**
 * Determines the cardinality end type for crow's foot notation
 *
 * @param relType - The relationship type ('1:N', 'N:1', or 'N:N')
 * @param isSource - Whether this is the source end of the relationship
 * @param isOptional - Whether the relationship is optional (for future use)
 * @returns The cardinality end type
 */
export function getCardinalityEnd(
  relType: RelationshipType,
  isSource: boolean,
  isOptional: boolean = false
): CardinalityEnd {
  if (relType === '1:N') {
    if (isSource) {
      return isOptional ? 'one-optional' : 'one';
    }
    return isOptional ? 'many-optional' : 'many';
  } else if (relType === 'N:1') {
    if (isSource) {
      return isOptional ? 'many-optional' : 'many';
    }
    return isOptional ? 'one-optional' : 'one';
  } else {
    // N:N
    return isOptional ? 'many-optional' : 'many';
  }
}

/**
 * Gets the color suffix for marker IDs based on relationship type
 *
 * @param relationship - The entity relationship
 * @param useTypeColors - Whether to use relationship type-specific colors
 * @returns The color suffix for marker IDs
 */
export function getMarkerColorSuffix(
  relationship: EntityRelationship,
  useTypeColors: boolean
): string {
  if (!useTypeColors) {
    return 'lookup';
  }

  switch (relationship.type) {
    case '1:N':
    case 'N:1':
      // 1:N and N:1 are the same relationship from different perspectives
      // Use the same color suffix to match getEdgeColor() behavior
      return 'onetomany';
    case 'N:N':
      return 'manytomany';
    default:
      return 'lookup';
  }
}

/**
 * Gets the SVG marker ID for a given notation style and relationship
 *
 * @param notation - The line notation style ('simple', 'crowsfoot', or 'uml')
 * @param relationship - The entity relationship
 * @param isSource - Whether this is the source end of the relationship
 * @param useTypeColors - Whether to use relationship type-specific colors
 * @returns The marker ID string
 */
export function getMarkerIdForNotation(
  notation: LineNotationStyle,
  relationship: EntityRelationship,
  isSource: boolean,
  useTypeColors: boolean = false
): string {
  if (notation === 'simple') {
    return 'arrow-closed'; // React Flow built-in
  }

  // Get the color suffix based on relationship type
  const colorSuffix = getMarkerColorSuffix(relationship, useTypeColors);

  if (notation === 'crowsfoot') {
    const cardinalityEnd = getCardinalityEnd(relationship.type, isSource);
    return `crowsfoot-${cardinalityEnd}-${colorSuffix}`;
  }

  if (notation === 'uml') {
    // Determine UML marker based on relationship type
    // For composition vs aggregation, we use different markers
    if (relationship.type === 'N:N') {
      return `uml-aggregation-${colorSuffix}`; // Hollow diamond for many-to-many
    } else if (isSource) {
      return `uml-association-${colorSuffix}`; // Simple arrow for source
    } else {
      return `uml-composition-${colorSuffix}`; // Filled diamond for target
    }
  }

  return 'arrow-closed';
}

/**
 * Gets stroke dasharray based on line stroke style
 *
 * @param lineStroke - The line stroke style ('solid', 'dashed', or 'dotted')
 * @returns The SVG stroke-dasharray value
 */
export function getStrokeDashArray(lineStroke: LineStrokeStyle): string {
  switch (lineStroke) {
    case 'dashed':
      return '8,4';
    case 'dotted':
      return '2,3';
    case 'solid':
    default:
      return '';
  }
}

/**
 * Gets edge color based on relationship type and color settings
 *
 * @param relationship - The entity relationship
 * @param useTypeColors - Whether to use relationship type-specific colors
 * @param defaultColor - The default color to use
 * @param typeColors - Optional colors for each relationship type
 * @returns The edge color hex string
 */
export function getEdgeColor(
  relationship: EntityRelationship,
  useTypeColors: boolean,
  defaultColor: string,
  typeColors: {
    oneToMany?: string;
    manyToOne?: string;
    manyToMany?: string;
  }
): string {
  if (!useTypeColors) {
    return defaultColor;
  }

  switch (relationship.type) {
    case '1:N':
    case 'N:1':
      // 1:N and N:1 are the same relationship from different perspectives
      // Use the same color for both
      return typeColors.oneToMany || defaultColor;
    case 'N:N':
      return typeColors.manyToMany || defaultColor;
    default:
      return defaultColor;
  }
}
