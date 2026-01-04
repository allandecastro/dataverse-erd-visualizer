/**
 * Custom edge component for self-referencing relationships (e.g., parent-child hierarchies).
 *
 * Creates a looping path where both endpoints are on the RIGHT side of the table node:
 * - Source: Lookup field handle (right side, at sourceY)
 * - Target: Primary key row level (right side, at targetY)
 *
 * Path routing:
 * ```
 * ┌─────────────┐
 * │  Table      │──┐
 * │  PK ←───────│──┤ (target)
 * │  ...        │  │
 * │  Lookup ────│──┘ (source)
 * └─────────────┘
 * ```
 *
 * The path extends 50px to the right with 8px rounded corners,
 * going either up or down depending on the relative positions.
 */

import { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from '@xyflow/react';

export const SelfReferenceEdge = memo(function SelfReferenceEdge({
  id,
  sourceX,
  sourceY,
  targetY,
  label,
  labelStyle,
  style,
  markerEnd,
}: EdgeProps) {
  // For self-reference edges, BOTH start and end are on the RIGHT side:
  // - Start: lookup field handle (right side, at sourceY)
  // - End: PK row level (right side, at targetY)
  // This keeps the entire loop on one side of the table

  // How far the path extends to the right
  const horizontalExtent = 50;
  const radius = 8; // Corner radius for rounded corners

  // The rightmost point of the loop
  const rightX = sourceX + horizontalExtent;

  // End point is on the RIGHT side at the PK row level (targetY)
  // We use sourceX (right side of table) instead of targetX (left side)
  const endX = sourceX;
  const endY = targetY;

  // Determine direction: going up or down from source to target
  const goingUp = targetY < sourceY;

  let path: string;

  if (goingUp) {
    // Lookup is BELOW PK - loop goes: right → up → back left
    path =
      `M ${sourceX} ${sourceY} ` +
      // Go right
      `L ${rightX - radius} ${sourceY} ` +
      // Corner: turn up
      `Q ${rightX} ${sourceY}, ${rightX} ${sourceY - radius} ` +
      // Go up to target Y level
      `L ${rightX} ${endY + radius} ` +
      // Corner: turn left
      `Q ${rightX} ${endY}, ${rightX - radius} ${endY} ` +
      // Go back left to end point
      `L ${endX} ${endY}`;
  } else {
    // Lookup is ABOVE PK - loop goes: right → down → back left
    path =
      `M ${sourceX} ${sourceY} ` +
      // Go right
      `L ${rightX - radius} ${sourceY} ` +
      // Corner: turn down
      `Q ${rightX} ${sourceY}, ${rightX} ${sourceY + radius} ` +
      // Go down to target Y level
      `L ${rightX} ${endY - radius} ` +
      // Corner: turn left
      `Q ${rightX} ${endY}, ${rightX - radius} ${endY} ` +
      // Go back left to end point
      `L ${endX} ${endY}`;
  }

  const labelX = rightX + 15;
  const labelY = (sourceY + endY) / 2;

  return (
    <>
      <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(0%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
              fontSize: (labelStyle?.fontSize as number) || 10,
              color: (labelStyle?.fill as string) || '#6b7280',
              background: 'transparent',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});
