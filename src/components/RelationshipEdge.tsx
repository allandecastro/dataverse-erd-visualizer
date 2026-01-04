/**
 * Custom React Flow edge for relationship visualization
 */

import { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type Position } from '@xyflow/react';
import type { EntityRelationship } from '@/types';
import type { ColorSettings } from '@/types/erdTypes';

export interface RelationshipEdgeData {
  relationship: EntityRelationship;
  colorSettings: ColorSettings;
  isDarkMode: boolean;
}

interface RelationshipEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  data?: RelationshipEdgeData;
  selected?: boolean;
}

export const RelationshipEdge = memo(function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: RelationshipEdgeProps) {
  const relationship = data?.relationship;
  const colorSettings = data?.colorSettings;
  const isDarkMode = data?.isDarkMode ?? false;
  const lookupColor = colorSettings?.lookupColor ?? '#ef4444';

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  // Determine cardinality based on relationship type
  const sourceCardinality = 'N';
  const targetCardinality = '1';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#60a5fa' : lookupColor,
          strokeWidth: selected ? 3 : 2,
          opacity: 0.8,
        }}
      />
      <EdgeLabelRenderer>
        {/* Source cardinality label (N) */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${sourceX + 20}px, ${sourceY}px)`,
            background: isDarkMode ? '#374151' : '#ffffff',
            border: `1px solid ${lookupColor}`,
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '10px',
            fontWeight: '600',
            color: lookupColor,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {sourceCardinality}
        </div>

        {/* Target cardinality label (1) */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${targetX - 20}px, ${targetY}px)`,
            background: isDarkMode ? '#374151' : '#ffffff',
            border: '1px solid #fbbf24',
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '10px',
            fontWeight: '600',
            color: '#fbbf24',
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {targetCardinality}
        </div>

        {/* Relationship name tooltip on hover */}
        {relationship && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 15}px)`,
              background: isDarkMode ? '#1f2937' : '#ffffff',
              border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '10px',
              color: isDarkMode ? '#d1d5db' : '#374151',
              whiteSpace: 'nowrap',
              pointerEvents: 'all',
              opacity: selected ? 1 : 0,
              transition: 'opacity 0.2s',
            }}
            className="nodrag nopan"
          >
            {relationship.schemaName}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
});
