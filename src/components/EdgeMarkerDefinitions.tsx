/**
 * SVG marker definitions for relationship line notation styles
 * Provides reusable markers for crow's foot, UML, and simple arrow notations
 * Creates separate marker sets for each relationship type color
 */

import { memo } from 'react';
import type { LineNotationStyle } from '@/types/erdTypes';

export interface EdgeMarkerDefinitionsProps {
  notation: LineNotationStyle;
  colors: {
    lookup: string;
    oneToMany?: string;
    manyToOne?: string;
    manyToMany?: string;
  };
}

/**
 * Helper to create Crow's Foot markers for a specific color
 */
function createCrowsFootMarkers(color: string, suffix: string) {
  return (
    <>
      {/* Crow's Foot: One (single dash) - mandatory one */}
      <marker
        id={`crowsfoot-one-${suffix}`}
        viewBox="0 0 20 20"
        refX="20"
        refY="10"
        markerWidth="20"
        markerHeight="20"
        orient="auto"
      >
        <line x1="0" y1="10" x2="8" y2="10" stroke={color} strokeWidth="2" />
      </marker>

      {/* Crow's Foot: Many (three-pronged fork) - mandatory many */}
      <marker
        id={`crowsfoot-many-${suffix}`}
        viewBox="0 0 20 20"
        refX="20"
        refY="10"
        markerWidth="20"
        markerHeight="20"
        orient="auto"
      >
        <path d="M 0 4 L 8 10 L 0 16 M 0 10 L 8 10" stroke={color} strokeWidth="2" fill="none" />
      </marker>

      {/* Crow's Foot: One Optional (circle + dash) */}
      <marker
        id={`crowsfoot-one-optional-${suffix}`}
        viewBox="0 0 20 20"
        refX="20"
        refY="10"
        markerWidth="20"
        markerHeight="20"
        orient="auto"
      >
        <circle cx="6" cy="10" r="4" stroke={color} strokeWidth="2" fill="none" />
        <line x1="0" y1="10" x2="8" y2="10" stroke={color} strokeWidth="2" />
      </marker>

      {/* Crow's Foot: Many Optional (circle + fork) */}
      <marker
        id={`crowsfoot-many-optional-${suffix}`}
        viewBox="0 0 20 20"
        refX="20"
        refY="10"
        markerWidth="20"
        markerHeight="20"
        orient="auto"
      >
        <circle cx="12" cy="10" r="4" stroke={color} strokeWidth="2" fill="none" />
        <path d="M 0 4 L 8 10 L 0 16 M 0 10 L 8 10" stroke={color} strokeWidth="2" fill="none" />
      </marker>
    </>
  );
}

/**
 * Helper to create UML markers for a specific color
 */
function createUMLMarkers(color: string, suffix: string) {
  return (
    <>
      {/* UML: Composition (filled diamond) - compact size */}
      <marker
        id={`uml-composition-${suffix}`}
        viewBox="0 0 16 16"
        refX="16"
        refY="8"
        markerWidth="12"
        markerHeight="12"
        orient="auto"
      >
        <path d="M 2 8 L 8 4 L 14 8 L 8 12 Z" fill={color} stroke={color} strokeWidth="1" />
      </marker>

      {/* UML: Aggregation (hollow diamond) - compact size, dark mode compatible */}
      <marker
        id={`uml-aggregation-${suffix}`}
        viewBox="0 0 16 16"
        refX="16"
        refY="8"
        markerWidth="12"
        markerHeight="12"
        orient="auto"
      >
        <path d="M 2 8 L 8 4 L 14 8 L 8 12 Z" fill="none" stroke={color} strokeWidth="1.5" />
      </marker>

      {/* UML: Association (simple arrow) - compact size */}
      <marker
        id={`uml-association-${suffix}`}
        viewBox="0 0 16 16"
        refX="16"
        refY="8"
        markerWidth="12"
        markerHeight="12"
        orient="auto"
      >
        <path d="M 2 4 L 12 8 L 2 12" fill="none" stroke={color} strokeWidth="1.5" />
      </marker>
    </>
  );
}

export const EdgeMarkerDefinitions = memo(function EdgeMarkerDefinitions({
  notation,
  colors,
}: EdgeMarkerDefinitionsProps) {
  // For simple notation, use React Flow's built-in markers
  if (notation === 'simple') {
    return null;
  }

  // Collect all colors that need marker definitions
  // Note: 1:N and N:1 both use 'onetomany' suffix (same color from different perspectives)
  const colorMap = [
    { color: colors.lookup, suffix: 'lookup' },
    { color: colors.oneToMany || colors.lookup, suffix: 'onetomany' },
    { color: colors.manyToMany || colors.lookup, suffix: 'manytomany' },
  ];

  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        {notation === 'crowsfoot' &&
          colorMap.map(({ color, suffix }) => (
            <g key={`crowsfoot-${suffix}`}>{createCrowsFootMarkers(color, suffix)}</g>
          ))}

        {notation === 'uml' &&
          colorMap.map(({ color, suffix }) => (
            <g key={`uml-${suffix}`}>{createUMLMarkers(color, suffix)}</g>
          ))}
      </defs>
    </svg>
  );
});
