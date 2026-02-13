/**
 * React Flow ERD component with custom table nodes and edge types.
 *
 * This is the main visualization component that renders the Entity Relationship Diagram
 * using React Flow. It handles:
 * - Entity nodes with the custom TableNode component
 * - Relationship edges with DraggableEdge (normal) and SelfReferenceEdge (self-loops)
 * - Node positioning and layout persistence
 * - Edge offset persistence for manual path adjustments
 *
 * @module ReactFlowERD
 */

import { useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
  getNodesBounds,
  getViewportForBounds,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng, toSvg } from 'html-to-image';
import { Map } from 'lucide-react';

import type { Entity, EntityRelationship, EntityPosition } from '@/types';
import styles from '@/styles/ReactFlowERD.module.css';
import type { ColorSettings, LayoutMode } from '@/types/erdTypes';
import { TableNode, type TableNodeData } from './TableNode';
import { SelfReferenceEdge } from './SelfReferenceEdge';
import { DraggableEdge } from './DraggableEdge';
import { EdgeMarkerDefinitions } from './EdgeMarkerDefinitions';
import { getMarkerIdForNotation, getStrokeDashArray, getEdgeColor } from '@/utils/edgeMarkers';
import {
  EXPORT_PADDING,
  EXPORT_MIN_ZOOM,
  EXPORT_MAX_ZOOM,
  VIEWPORT_MIN_ZOOM,
  VIEWPORT_MAX_ZOOM,
  NODE_CENTER_OFFSET_X,
  NODE_CENTER_OFFSET_Y,
  GRID_SPACING_X,
  GRID_SPACING_Y,
} from '@/constants';

// Register custom node types
const nodeTypes = {
  table: TableNode,
};

// Register custom edge types
const edgeTypes = {
  selfLoop: SelfReferenceEdge,
  draggable: DraggableEdge,
};

export interface ReactFlowERDProps {
  entities: Entity[];
  relationships: EntityRelationship[];
  isDarkMode: boolean;
  colorSettings: ColorSettings;
  showMinimap: boolean;
  layoutMode: LayoutMode;
  entityPositions: Record<string, EntityPosition>;
  onPositionsChange: (positions: Record<string, EntityPosition>) => void;
  onToggleMinimap: () => void;
  // Viewport support for zoom/pan restoration
  zoom?: number;
  pan?: { x: number; y: number };
  // Field drawer support
  orderedFieldsMap?: Record<string, string[]>;
  onOpenFieldDrawer?: (entityName: string) => void;
  onRemoveField?: (entityName: string, fieldName: string) => void;
  // Edge offset support for manual path adjustment (x and y)
  edgeOffsets?: Record<string, { x: number; y: number }>;
  onEdgeOffsetChange?: (edgeId: string, offset: { x: number; y: number }) => void;
  // Collapse support
  collapsedEntities?: Set<string>;
  onToggleCollapse?: (entityName: string) => void;
  // Per-entity color overrides
  entityColorOverrides?: Record<string, string>;
  onOpenColorPicker?: (entityName: string, anchorRect: DOMRect) => void;
}

export interface ReactFlowERDRef {
  focusOnNode: (nodeId: string) => void;
  fitView: () => void;
  exportToPng: () => Promise<Blob>;
  exportToSvg: () => Promise<string>;
}

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

// Inner component that uses React Flow hooks
const ReactFlowERDInner = forwardRef<ReactFlowERDRef, ReactFlowERDProps>(function ReactFlowERDInner(
  {
    entities,
    relationships,
    isDarkMode,
    colorSettings,
    showMinimap,
    entityPositions,
    onPositionsChange,
    onToggleMinimap,
    zoom,
    pan,
    orderedFieldsMap,
    onOpenFieldDrawer,
    onRemoveField,
    edgeOffsets,
    onEdgeOffsetChange,
    collapsedEntities,
    onToggleCollapse,
    entityColorOverrides,
    onOpenColorPicker,
  },
  ref
) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { setCenter, getZoom, fitView: rfFitView, getNodes } = useReactFlow();

  // Expose focusOnNode, fitView, and export methods via ref
  useImperativeHandle(
    ref,
    () => ({
      focusOnNode: (nodeId: string) => {
        const node = nodes.find((n) => n.id === nodeId);
        if (node) {
          const zoom = Math.max(getZoom(), 0.8);
          setCenter(
            node.position.x + NODE_CENTER_OFFSET_X,
            node.position.y + NODE_CENTER_OFFSET_Y,
            { zoom, duration: 500 }
          );
        }
      },
      fitView: () => {
        rfFitView({ padding: 0.2, duration: 300 });
      },
      exportToPng: async (): Promise<Blob> => {
        const nodesBounds = getNodesBounds(getNodes());
        // Add very generous padding to include edges and labels that extend beyond nodes
        const padding = EXPORT_PADDING;
        const imageWidth = Math.ceil(nodesBounds.width + padding * 2);
        const imageHeight = Math.ceil(nodesBounds.height + padding * 2);

        // Expand bounds to include padding for edges
        const expandedBounds = {
          x: nodesBounds.x - padding,
          y: nodesBounds.y - padding,
          width: nodesBounds.width + padding * 2,
          height: nodesBounds.height + padding * 2,
        };

        const viewport = getViewportForBounds(
          expandedBounds,
          imageWidth,
          imageHeight,
          EXPORT_MIN_ZOOM,
          EXPORT_MAX_ZOOM,
          0
        );

        const viewportEl = document.querySelector('.react-flow__viewport') as HTMLElement;
        if (!viewportEl) throw new Error('React Flow viewport not found');

        const dataUrl = await toPng(viewportEl, {
          backgroundColor: 'transparent',
          width: imageWidth,
          height: imageHeight,
          style: {
            width: `${imageWidth}px`,
            height: `${imageHeight}px`,
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          },
          filter: (node) => {
            // Exclude minimap and controls from export
            const classList = node.classList;
            if (!classList) return true;
            return (
              !classList.contains('react-flow__minimap') &&
              !classList.contains('react-flow__controls') &&
              !classList.contains('react-flow__panel')
            );
          },
        });

        // Convert data URL to Blob
        const res = await fetch(dataUrl);
        return res.blob();
      },
      exportToSvg: async (): Promise<string> => {
        const nodesBounds = getNodesBounds(getNodes());
        // Add very generous padding to include edges and labels that extend beyond nodes
        const padding = EXPORT_PADDING;
        const imageWidth = Math.ceil(nodesBounds.width + padding * 2);
        const imageHeight = Math.ceil(nodesBounds.height + padding * 2);

        // Expand bounds to include padding for edges
        const expandedBounds = {
          x: nodesBounds.x - padding,
          y: nodesBounds.y - padding,
          width: nodesBounds.width + padding * 2,
          height: nodesBounds.height + padding * 2,
        };

        const viewport = getViewportForBounds(
          expandedBounds,
          imageWidth,
          imageHeight,
          EXPORT_MIN_ZOOM,
          EXPORT_MAX_ZOOM,
          0
        );

        const viewportEl = document.querySelector('.react-flow__viewport') as HTMLElement;
        if (!viewportEl) throw new Error('React Flow viewport not found');

        const dataUrl = await toSvg(viewportEl, {
          backgroundColor: 'transparent',
          width: imageWidth,
          height: imageHeight,
          style: {
            width: `${imageWidth}px`,
            height: `${imageHeight}px`,
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          },
          filter: (node) => {
            // Exclude minimap and controls from export
            const classList = node.classList;
            if (!classList) return true;
            return (
              !classList.contains('react-flow__minimap') &&
              !classList.contains('react-flow__controls') &&
              !classList.contains('react-flow__panel')
            );
          },
        });

        // toSvg returns a data URL - decode it based on format
        // Can be: data:image/svg+xml;charset=utf-8,<url-encoded> or data:image/svg+xml;base64,<base64>
        const [header, content] = dataUrl.split(',');
        if (header.includes('base64')) {
          return atob(content);
        }
        return decodeURIComponent(content);
      },
    }),
    [nodes, setCenter, getZoom, rfFitView, getNodes]
  );

  // Update nodes when entities or positions change
  useEffect(() => {
    const cols = Math.ceil(Math.sqrt(entities.length)) || 1;

    const newNodes: Node[] = entities.map((entity, index) => {
      // Use entityPositions if available, otherwise fall back to grid
      const pos = entityPositions[entity.logicalName];
      const row = Math.floor(index / cols);
      const col = index % cols;

      // Determine color based on publisher, with per-entity override support
      const isCustom =
        entity.publisher &&
        !['Microsoft', 'Microsoft Dynamics 365', 'Microsoft Dynamics CRM'].includes(
          entity.publisher
        );
      const defaultColor = isCustom
        ? colorSettings.customTableColor
        : colorSettings.standardTableColor;
      const color = entityColorOverrides?.[entity.logicalName] || defaultColor;

      return {
        id: entity.logicalName,
        type: 'table',
        position: pos
          ? { x: pos.x, y: pos.y }
          : { x: col * GRID_SPACING_X, y: row * GRID_SPACING_Y },
        data: {
          entity,
          color,
          isDarkMode,
          orderedFields: orderedFieldsMap?.[entity.logicalName],
          onOpenFieldDrawer,
          onRemoveField,
          isCollapsed: collapsedEntities?.has(entity.logicalName) ?? false,
          onToggleCollapse,
          hasColorOverride: !!entityColorOverrides?.[entity.logicalName],
          onOpenColorPicker,
        } as TableNodeData,
      };
    });

    /**
     * Map entity relationships to React Flow edges.
     *
     * **Edge Type Selection:**
     * - `selfLoop`: Used for self-referencing relationships (e.g., Account → Account
     *   for parent-child hierarchies). Renders as a loop on the right side of the node.
     * - `draggable`: Used for all other relationships. Supports user-adjustable path
     *   offsets via drag handle to prevent edge overlaps.
     *
     * **Handle Selection (for precise field-to-field connections):**
     * - `sourceHandle`: Uses the lookup field name if that field is visible in the
     *   source node, otherwise falls back to 'default-source' centered on the node.
     * - `targetHandle`: Uses the primary key field name if visible in the target
     *   node, otherwise falls back to 'default-target'.
     *
     * This enables visual connections from Lookup fields → Primary Keys when both
     * fields are displayed, providing an accurate representation of the relationship.
     */
    const newEdges: Edge[] = relationships.map((rel) => {
      const isSelfReference = rel.from === rel.to;

      // Get target entity data for PK lookup
      const targetEntity = entities.find((e) => e.logicalName === rel.to);

      // Get visible fields for source and target
      const sourceVisibleFields = orderedFieldsMap?.[rel.from] || [];
      const targetVisibleFields = orderedFieldsMap?.[rel.to] || [];

      // Determine the source handle (lookup field)
      // Use the referencingAttribute if it's visible, otherwise use default
      const lookupFieldName = rel.referencingAttribute;
      const sourceHandle =
        lookupFieldName && sourceVisibleFields.includes(lookupFieldName)
          ? lookupFieldName
          : 'default-source';

      // Determine the target handle (PK of target entity)
      // Find the PK field name from the target entity
      const targetPKName =
        targetEntity?.primaryIdAttribute ||
        targetEntity?.attributes.find((a) => a.isPrimaryKey)?.name;
      const targetHandle =
        targetPKName && targetVisibleFields.includes(targetPKName)
          ? targetPKName
          : 'default-target';

      // Use draggable edge type for non-self-reference edges
      const edgeType = isSelfReference ? 'selfLoop' : 'draggable';

      // Determine edge color based on settings
      const edgeColor = getEdgeColor(
        rel,
        colorSettings.useRelationshipTypeColors || false,
        colorSettings.lookupColor || '#f97316',
        {
          oneToMany: colorSettings.oneToManyColor,
          manyToOne: colorSettings.manyToOneColor,
          manyToMany: colorSettings.manyToManyColor,
        }
      );

      // Determine stroke style
      const strokeDashArray = getStrokeDashArray(colorSettings.lineStroke || 'solid');

      // Determine marker type based on notation
      // Keep marker size consistent regardless of line thickness
      let markerEnd;
      let edgeStyle: React.CSSProperties;

      if (colorSettings.lineNotation === 'simple') {
        markerEnd = {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
          width: 15,
          height: 15,
        };
        edgeStyle = {
          stroke: edgeColor,
          strokeWidth: colorSettings.lineThickness || 1.5,
          strokeDasharray: strokeDashArray,
        };
      } else {
        const markerId = getMarkerIdForNotation(
          colorSettings.lineNotation || 'simple',
          rel,
          false,
          colorSettings.useRelationshipTypeColors || false
        );
        // For custom SVG markers, use CSS markerEnd property in style
        markerEnd = undefined;
        edgeStyle = {
          stroke: edgeColor,
          strokeWidth: colorSettings.lineThickness || 1.5,
          strokeDasharray: strokeDashArray,
          markerEnd: `url(#${markerId})`,
        } as React.CSSProperties;
      }

      return {
        id: rel.schemaName,
        source: rel.from,
        target: rel.to,
        sourceHandle,
        targetHandle,
        type: edgeType,
        animated: false,
        markerEnd,
        style: edgeStyle,
        labelStyle: {
          fontSize: 10,
          fill: isDarkMode ? '#9ca3af' : '#6b7280',
        },
        labelBgStyle: {
          fill: 'transparent',
        },
        // Show different labels based on relationship type
        // N:N: Show intersection table name and cardinality badge
        // 1:N/N:1: Show referencing attribute name
        label:
          rel.type === 'N:N'
            ? `[N:N] ${rel.intersectEntityName || rel.schemaName}`
            : rel.referencingAttribute || '',
        // Pass offset data for draggable edges
        data: {
          offset: edgeOffsets?.[rel.schemaName] ?? { x: 0, y: 0 },
          onOffsetChange: onEdgeOffsetChange,
          edgeStyle: colorSettings.edgeStyle, // Pass edge style for path calculation
          relationship: rel, // Pass relationship for marker determination
        },
      };
    });

    setNodes(newNodes);
    setEdges(newEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- colorSettings handled by separate effects below
  }, [
    entities,
    relationships,
    entityPositions,
    isDarkMode,
    orderedFieldsMap,
    onOpenFieldDrawer,
    onRemoveField,
    edgeOffsets,
    onEdgeOffsetChange,
    collapsedEntities,
    onToggleCollapse,
    onOpenColorPicker,
    setNodes,
    setEdges,
  ]);

  // Separate effect for color updates - updates node data in-place without recreating nodes
  // This prevents tables from disappearing when color picker is dragged (rapid onChange events)
  useEffect(() => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const entity = entities.find((e) => e.logicalName === node.id);
        if (!entity) return node;

        const isCustom =
          entity.publisher &&
          !['Microsoft', 'Microsoft Dynamics 365', 'Microsoft Dynamics CRM'].includes(
            entity.publisher
          );
        const defaultColor = isCustom
          ? colorSettings.customTableColor
          : colorSettings.standardTableColor;
        const color = entityColorOverrides?.[node.id] || defaultColor;
        const hasColorOverride = !!entityColorOverrides?.[node.id];

        // Only update if color actually changed
        const nodeData = node.data as TableNodeData;
        if (nodeData.color === color && nodeData.hasColorOverride === hasColorOverride) return node;

        return {
          ...node,
          data: { ...node.data, color, hasColorOverride },
        };
      })
    );
  }, [
    colorSettings.customTableColor,
    colorSettings.standardTableColor,
    entities,
    entityColorOverrides,
    setNodes,
  ]);

  // Separate effect for edge color and style updates
  useEffect(() => {
    setEdges((currentEdges) =>
      currentEdges.map((edge) => {
        const rel = relationships.find((r) => r.schemaName === edge.id);
        if (!rel) return edge;

        // Determine edge color
        const edgeColor = getEdgeColor(
          rel,
          colorSettings.useRelationshipTypeColors || false,
          colorSettings.lookupColor || '#f97316',
          {
            oneToMany: colorSettings.oneToManyColor,
            manyToOne: colorSettings.manyToOneColor,
            manyToMany: colorSettings.manyToManyColor,
          }
        );

        // Determine stroke style
        const strokeDashArray = getStrokeDashArray(colorSettings.lineStroke || 'solid');

        // Determine marker type
        // Keep marker size consistent regardless of line thickness
        let markerEnd;
        let edgeStyle: React.CSSProperties;

        if (colorSettings.lineNotation === 'simple') {
          markerEnd = {
            type: MarkerType.ArrowClosed,
            color: edgeColor,
            width: 15,
            height: 15,
          };
          edgeStyle = {
            ...edge.style,
            stroke: edgeColor,
            strokeWidth: colorSettings.lineThickness || 1.5,
            strokeDasharray: strokeDashArray,
          };
        } else {
          const markerId = getMarkerIdForNotation(
            colorSettings.lineNotation || 'simple',
            rel,
            false,
            colorSettings.useRelationshipTypeColors || false
          );
          // For custom SVG markers, use CSS markerEnd property in style
          markerEnd = undefined;
          edgeStyle = {
            ...edge.style,
            stroke: edgeColor,
            strokeWidth: colorSettings.lineThickness || 1.5,
            strokeDasharray: strokeDashArray,
            markerEnd: `url(#${markerId})`,
          } as React.CSSProperties;
        }

        return {
          ...edge,
          style: edgeStyle,
          markerEnd,
          data: {
            ...edge.data,
            edgeStyle: colorSettings.edgeStyle,
          },
        };
      })
    );
  }, [
    colorSettings.lookupColor,
    colorSettings.edgeStyle,
    colorSettings.lineNotation,
    colorSettings.lineStroke,
    colorSettings.lineThickness,
    colorSettings.useRelationshipTypeColors,
    colorSettings.oneToManyColor,
    colorSettings.manyToOneColor,
    colorSettings.manyToManyColor,
    relationships,
    setEdges,
  ]);

  // Handle node drag end to update positions
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onPositionsChange({
        ...entityPositions,
        [node.id]: { x: node.position.x, y: node.position.y },
      });
    },
    [entityPositions, onPositionsChange]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeDragStop={onNodeDragStop}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultViewport={
        zoom !== undefined && pan !== undefined ? { x: pan.x, y: pan.y, zoom } : undefined
      }
      minZoom={VIEWPORT_MIN_ZOOM}
      maxZoom={VIEWPORT_MAX_ZOOM}
      colorMode={isDarkMode ? 'dark' : 'light'}
      proOptions={{ hideAttribution: true }}
      // Disable connection drawing - edges are defined by relationships only
      nodesConnectable={false}
      connectOnClick={false}
    >
      <Controls position="top-left" />

      {/* Minimap toggle button - positioned below controls */}
      <Panel position="top-left" style={{ marginTop: '140px' }}>
        <button
          onClick={onToggleMinimap}
          title={showMinimap ? 'Hide minimap' : 'Show minimap'}
          className={[
            styles.minimapToggle,
            isDarkMode ? styles.dark : styles.light,
            showMinimap ? styles.active : '',
          ].join(' ')}
        >
          <Map size={14} />
        </button>
      </Panel>

      {showMinimap && (
        <MiniMap
          nodeColor={(node) => (node.data as TableNodeData).color}
          maskColor={isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)'}
        />
      )}
      <Background />

      {/* Custom SVG marker definitions for crow's foot and UML notations */}
      <EdgeMarkerDefinitions
        notation={colorSettings.lineNotation || 'simple'}
        colors={{
          lookup: colorSettings.lookupColor || '#f97316',
          oneToMany: colorSettings.oneToManyColor,
          manyToOne: colorSettings.manyToOneColor,
          manyToMany: colorSettings.manyToManyColor,
        }}
      />
    </ReactFlow>
  );
});

// Wrapper component with ReactFlowProvider
export const ReactFlowERD = forwardRef<ReactFlowERDRef, ReactFlowERDProps>(
  function ReactFlowERD(props, ref) {
    return (
      <div className={styles.container}>
        <ReactFlowProvider>
          <ReactFlowERDInner {...props} ref={ref} />
        </ReactFlowProvider>
      </div>
    );
  }
);
