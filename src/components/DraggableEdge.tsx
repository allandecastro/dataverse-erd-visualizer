/**
 * Custom edge with draggable control point for manual path adjustment
 * Allows users to shift the entire edge path to avoid overlaps
 */

import { memo, useState, useCallback, useRef } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  getBezierPath,
  getStraightPath,
  useStore,
  type EdgeProps,
} from '@xyflow/react';

// Selector to get zoom level from React Flow store
const zoomSelector = (state: { transform: [number, number, number] }) => state.transform[2];

export interface DraggableEdgeData {
  offset?: { x: number; y: number };
  onOffsetChange?: (edgeId: string, offset: { x: number; y: number }) => void;
  edgeStyle?: 'smoothstep' | 'bezier' | 'straight' | 'step';
}

export const DraggableEdge = memo(function DraggableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  labelStyle,
  style,
  data,
  markerEnd,
}: EdgeProps) {
  const edgeData = data as DraggableEdgeData | undefined;
  const savedOffset = edgeData?.offset ?? { x: 0, y: 0 };
  const onOffsetChange = edgeData?.onOffsetChange;
  const edgeStyle = edgeData?.edgeStyle ?? 'smoothstep';

  // Get current zoom level to scale mouse movements correctly
  const zoom = useStore(zoomSelector);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom; // Keep ref in sync for event handlers

  // Local offset state for smooth dragging (prevents re-render flicker)
  const [localOffset, setLocalOffset] = useState(savedOffset);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    initialOffset: { x: number; y: number };
  } | null>(null);
  const localOffsetRef = useRef(localOffset);
  localOffsetRef.current = localOffset; // Keep ref in sync

  // Use local offset during drag, saved offset otherwise
  const currentOffset = isDragging ? localOffset : savedOffset;

  /**
   * Calculates the SVG path for the edge with user-applied offset.
   *
   * Supports three edge styles:
   * - **bezier**: Smooth S-curve through offset point using cubic bezier curves
   * - **straight**: Orthogonal path with right angles (no curves)
   * - **smoothstep**: Orthogonal path with rounded corners (default)
   *
   * When offset is (0,0), uses React Flow's built-in path generators.
   * When offset is non-zero, creates a custom path where the vertical
   * routing segment is shifted horizontally by the offset amount.
   *
   * @returns Object containing:
   *   - path: SVG path string for the edge
   *   - labelX/labelY: Position for the edge label
   *   - handleX/handleY: Position for the draggable control point
   */
  const getPathWithOffset = () => {
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;
    const radius = 8;

    let path: string;
    let labelX: number;
    let labelY: number;
    let handleX: number;
    let handleY: number;

    // When offset is 0, use standard paths
    if (currentOffset.x === 0 && currentOffset.y === 0) {
      if (edgeStyle === 'bezier') {
        [path, labelX, labelY] = getBezierPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
          curvature: 0.25,
        });
        handleX = midX;
        handleY = midY;
      } else if (edgeStyle === 'straight') {
        [path, labelX, labelY] = getStraightPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
        });
        handleX = midX;
        handleY = midY;
      } else {
        // Default to smoothstep
        [path, labelX, labelY] = getSmoothStepPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
          borderRadius: radius,
        });
        // Handle on the vertical segment (at midX, midY)
        handleX = midX;
        handleY = midY;
      }
    } else {
      // When offset is non-zero, create shifted path
      // The routing channel (vertical segment) shifts by X offset
      const routingX = midX + currentOffset.x;

      if (edgeStyle === 'bezier') {
        // Bezier: create smooth S-curve through offset point
        const cp1x = sourceX + (routingX - sourceX) * 0.5;
        const cp1y = sourceY;
        const cp2x = routingX;
        const cp2y = midY - (midY - sourceY) * 0.3;
        const cp3x = routingX;
        const cp3y = midY + (targetY - midY) * 0.3;
        const cp4x = targetX - (targetX - routingX) * 0.5;
        const cp4y = targetY;

        path =
          `M ${sourceX} ${sourceY} ` +
          `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${routingX} ${midY} ` +
          `C ${cp3x} ${cp3y}, ${cp4x} ${cp4y}, ${targetX} ${targetY}`;

        labelX = routingX;
        labelY = midY - 15;
        handleX = routingX;
        handleY = midY;
      } else if (edgeStyle === 'straight') {
        // Straight: create orthogonal path
        path =
          `M ${sourceX} ${sourceY} ` +
          `L ${routingX} ${sourceY} ` +
          `L ${routingX} ${targetY} ` +
          `L ${targetX} ${targetY}`;

        labelX = routingX;
        labelY = midY - 15;
        handleX = routingX;
        handleY = midY;
      } else {
        // Smoothstep: create proper orthogonal path with rounded corners
        // Handle all directional cases properly

        const goingDown = targetY > sourceY;
        const vertDir = goingDown ? 1 : -1;

        // Check if routing position requires going backwards
        const routingLeftOfSource = routingX < sourceX;
        const routingRightOfTarget = routingX > targetX;

        if (routingLeftOfSource) {
          // Routing is to the LEFT of source - need to go left first
          // Path: source → left → down/up → right → target
          const turnX1 = sourceX - radius;
          const turnX2 = routingX + radius;

          path =
            `M ${sourceX} ${sourceY} ` +
            // Go left from source
            `L ${turnX1} ${sourceY} ` +
            // Turn down/up
            `Q ${routingX} ${sourceY}, ${routingX} ${sourceY + vertDir * radius} ` +
            // Vertical segment
            `L ${routingX} ${targetY - vertDir * radius} ` +
            // Turn to target
            `Q ${routingX} ${targetY}, ${turnX2} ${targetY} ` +
            // Go to target
            `L ${targetX} ${targetY}`;
        } else if (routingRightOfTarget) {
          // Routing is to the RIGHT of target - need to go past target
          // Path: source → right past target → down/up → left to target
          const turnX1 = routingX - radius;
          const turnX2 = targetX + radius;

          path =
            `M ${sourceX} ${sourceY} ` +
            // Go right from source
            `L ${turnX1} ${sourceY} ` +
            // Turn down/up
            `Q ${routingX} ${sourceY}, ${routingX} ${sourceY + vertDir * radius} ` +
            // Vertical segment
            `L ${routingX} ${targetY - vertDir * radius} ` +
            // Turn to target
            `Q ${routingX} ${targetY}, ${turnX2} ${targetY} ` +
            // Go left to target
            `L ${targetX} ${targetY}`;
        } else {
          // Normal case: routing is between source and target
          // Path: source → routing → target

          // Ensure we have enough space for corners
          const minSpaceX = radius * 2;
          const actualRoutingX = Math.max(
            sourceX + minSpaceX,
            Math.min(targetX - minSpaceX, routingX)
          );

          path =
            `M ${sourceX} ${sourceY} ` +
            // Horizontal from source toward routing
            `L ${actualRoutingX - radius} ${sourceY} ` +
            // First corner
            `Q ${actualRoutingX} ${sourceY}, ${actualRoutingX} ${sourceY + vertDir * radius} ` +
            // Vertical segment
            `L ${actualRoutingX} ${targetY - vertDir * radius} ` +
            // Second corner
            `Q ${actualRoutingX} ${targetY}, ${actualRoutingX + radius} ${targetY} ` +
            // Horizontal to target
            `L ${targetX} ${targetY}`;
        }

        labelX = routingX;
        labelY = midY - 15;
        // Handle position on the vertical segment
        handleX = routingX;
        handleY = midY;
      }
    }

    return {
      path,
      labelX,
      labelY,
      handleX,
      handleY,
    };
  };

  const { path: edgePath, labelX, labelY, handleX, handleY } = getPathWithOffset();

  // Handle mouse down on control point
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setIsDragging(true);
      setLocalOffset(savedOffset); // Initialize local offset from saved value
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        initialOffset: savedOffset,
      };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (dragStartRef.current) {
          // Scale mouse movement by zoom level to match flow coordinates
          const currentZoom = zoomRef.current || 1;
          const deltaX = (moveEvent.clientX - dragStartRef.current.x) / currentZoom;
          const deltaY = (moveEvent.clientY - dragStartRef.current.y) / currentZoom;
          const newOffsetX = dragStartRef.current.initialOffset.x + deltaX;
          const newOffsetY = dragStartRef.current.initialOffset.y + deltaY;
          // Clamp offsets to reasonable range
          const clampedOffsetX = Math.max(-400, Math.min(400, newOffsetX));
          const clampedOffsetY = Math.max(-400, Math.min(400, newOffsetY));
          // Update local state only during drag (no global state update = no flicker)
          setLocalOffset({ x: clampedOffsetX, y: clampedOffsetY });
        }
      };

      const handleMouseUp = () => {
        // Save the final offset to global state only when drag ends
        onOffsetChange?.(id, localOffsetRef.current);
        setIsDragging(false);
        dragStartRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [id, savedOffset, onOffsetChange]
  );

  // Double-click to reset offset
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onOffsetChange?.(id, { x: 0, y: 0 });
    },
    [id, onOffsetChange]
  );

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      {/* Draggable control point - positioned on the line */}
      <EdgeLabelRenderer>
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${handleX}px, ${handleY}px)`,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: isDragging ? '#3b82f6' : 'rgba(107, 114, 128, 0.7)',
            border: `2px solid ${isDragging ? '#60a5fa' : 'rgba(255, 255, 255, 0.9)'}`,
            cursor: isDragging ? 'grabbing' : 'grab',
            pointerEvents: 'all',
            transition: isDragging ? 'none' : 'background 0.15s, border-color 0.15s',
            zIndex: 1000,
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
          title="Drag to move line. Double-click to reset."
        />
        {/* Label */}
        {label && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
              fontSize: typeof labelStyle?.fontSize === 'number' ? labelStyle.fontSize : 10,
              color: typeof labelStyle?.fill === 'string' ? labelStyle.fill : '#6b7280',
              background: 'transparent',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
});
