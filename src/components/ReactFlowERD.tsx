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
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Map } from 'lucide-react';

import type { Entity, EntityRelationship, EntityPosition } from '@/types';
import styles from '@/styles/ReactFlowERD.module.css';
import type { ColorSettings, LayoutMode } from '@/types/erdTypes';
import { TableNode, type TableNodeData } from './TableNode';
import { SelfReferenceEdge } from './SelfReferenceEdge';
import { DraggableEdge } from './DraggableEdge';

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
  // Field drawer support
  orderedFieldsMap?: Record<string, string[]>;
  onOpenFieldDrawer?: (entityName: string) => void;
  onRemoveField?: (entityName: string, fieldName: string) => void;
  // Edge offset support for manual path adjustment (x and y)
  edgeOffsets?: Record<string, { x: number; y: number }>;
  onEdgeOffsetChange?: (edgeId: string, offset: { x: number; y: number }) => void;
}

export interface ReactFlowERDRef {
  focusOnNode: (nodeId: string) => void;
  fitView: () => void;
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
    orderedFieldsMap,
    onOpenFieldDrawer,
    onRemoveField,
    edgeOffsets,
    onEdgeOffsetChange,
  },
  ref
) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { setCenter, getZoom, fitView: rfFitView } = useReactFlow();

  // Expose focusOnNode and fitView methods via ref
  useImperativeHandle(
    ref,
    () => ({
      focusOnNode: (nodeId: string) => {
        const node = nodes.find((n) => n.id === nodeId);
        if (node) {
          const zoom = Math.max(getZoom(), 0.8);
          setCenter(node.position.x + 140, node.position.y + 100, { zoom, duration: 500 });
        }
      },
      fitView: () => {
        rfFitView({ padding: 0.2, duration: 300 });
      },
    }),
    [nodes, setCenter, getZoom, rfFitView]
  );

  // Update nodes when entities or positions change
  useEffect(() => {
    const cols = Math.ceil(Math.sqrt(entities.length)) || 1;

    const newNodes: Node[] = entities.map((entity, index) => {
      // Use entityPositions if available, otherwise fall back to grid
      const pos = entityPositions[entity.logicalName];
      const row = Math.floor(index / cols);
      const col = index % cols;

      // Determine color based on publisher
      const isCustom =
        entity.publisher &&
        !['Microsoft', 'Microsoft Dynamics 365', 'Microsoft Dynamics CRM'].includes(
          entity.publisher
        );
      const color = isCustom ? colorSettings.customTableColor : colorSettings.standardTableColor;

      return {
        id: entity.logicalName,
        type: 'table',
        position: pos ? { x: pos.x, y: pos.y } : { x: col * 320, y: row * 450 },
        data: {
          entity,
          color,
          isDarkMode,
          orderedFields: orderedFieldsMap?.[entity.logicalName],
          onOpenFieldDrawer,
          onRemoveField,
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

      return {
        id: rel.schemaName,
        source: rel.from,
        target: rel.to,
        sourceHandle,
        targetHandle,
        type: edgeType,
        animated: false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: colorSettings.lookupColor || '#f59e0b',
          width: 20,
          height: 20,
        },
        style: {
          stroke: colorSettings.lookupColor || '#f59e0b',
          strokeWidth: 1.5,
          strokeDasharray: '5,5', // Dotted line style
        },
        labelStyle: {
          fontSize: 10,
          fill: isDarkMode ? '#9ca3af' : '#6b7280',
        },
        labelBgStyle: {
          fill: 'transparent',
        },
        label: rel.referencingAttribute || '',
        // Pass offset data for draggable edges
        data: {
          offset: edgeOffsets?.[rel.schemaName] ?? { x: 0, y: 0 },
          onOffsetChange: onEdgeOffsetChange,
          edgeStyle: colorSettings.edgeStyle, // Pass edge style for path calculation
        },
      };
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [
    entities,
    relationships,
    entityPositions,
    colorSettings,
    isDarkMode,
    orderedFieldsMap,
    onOpenFieldDrawer,
    onRemoveField,
    edgeOffsets,
    onEdgeOffsetChange,
    setNodes,
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
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.1}
      maxZoom={2}
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
