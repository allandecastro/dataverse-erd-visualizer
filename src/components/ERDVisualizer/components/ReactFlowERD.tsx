/**
 * React Flow ERD with custom table nodes
 */

import { useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { Entity, EntityRelationship, EntityPosition } from '@/types';
import type { ColorSettings, LayoutMode } from '../types';
import { TableNode, type TableNodeData } from './TableNode';

// Register custom node types
const nodeTypes = {
  table: TableNode,
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
}

export interface ReactFlowERDRef {
  focusOnNode: (nodeId: string) => void;
}

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

// Inner component that uses React Flow hooks
const ReactFlowERDInner = forwardRef<ReactFlowERDRef, ReactFlowERDProps>(function ReactFlowERDInner({
  entities,
  relationships,
  isDarkMode,
  colorSettings,
  showMinimap,
  entityPositions,
  onPositionsChange,
}, ref) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { setCenter, getZoom } = useReactFlow();

  // Expose focusOnNode method via ref
  useImperativeHandle(ref, () => ({
    focusOnNode: (nodeId: string) => {
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        const zoom = Math.max(getZoom(), 0.8);
        setCenter(node.position.x + 140, node.position.y + 100, { zoom, duration: 500 });
      }
    },
  }), [nodes, setCenter, getZoom]);

  // Update nodes when entities or positions change
  useEffect(() => {
    const cols = Math.ceil(Math.sqrt(entities.length)) || 1;

    const newNodes: Node[] = entities.map((entity, index) => {
      // Use entityPositions if available, otherwise fall back to grid
      const pos = entityPositions[entity.logicalName];
      const row = Math.floor(index / cols);
      const col = index % cols;

      // Determine color based on publisher
      const isCustom = entity.publisher &&
        !['Microsoft', 'Microsoft Dynamics 365', 'Microsoft Dynamics CRM'].includes(entity.publisher);
      const color = isCustom ? colorSettings.customTableColor : colorSettings.standardTableColor;

      return {
        id: entity.logicalName,
        type: 'table',
        position: pos ? { x: pos.x, y: pos.y } : { x: col * 320, y: row * 450 },
        data: {
          entity,
          color,
          isDarkMode,
        } as TableNodeData,
      };
    });

    const newEdges: Edge[] = relationships.map((rel) => ({
      id: rel.schemaName,
      source: rel.from,
      target: rel.to,
      type: 'smoothstep',
      animated: false,
      style: {
        stroke: colorSettings.lookupColor || '#f59e0b',
        strokeWidth: 1.5,
        strokeDasharray: '5,5',
      },
      labelStyle: {
        fontSize: 10,
        fill: isDarkMode ? '#9ca3af' : '#6b7280',
      },
      labelBgStyle: {
        fill: isDarkMode ? '#1f2937' : '#ffffff',
        fillOpacity: 0.9,
      },
      label: rel.referencingAttribute || '',
    }));

    setNodes(newNodes);
    setEdges(newEdges);
  }, [entities, relationships, entityPositions, colorSettings, isDarkMode, setNodes, setEdges]);

  // Handle node drag end to update positions
  const onNodeDragStop = useCallback((_event: React.MouseEvent, node: Node) => {
    onPositionsChange({
      ...entityPositions,
      [node.id]: { x: node.position.x, y: node.position.y },
    });
  }, [entityPositions, onPositionsChange]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeDragStop={onNodeDragStop}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.1}
      maxZoom={2}
      colorMode={isDarkMode ? 'dark' : 'light'}
      proOptions={{ hideAttribution: true }}
    >
      <Controls position="top-left" />
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
export const ReactFlowERD = forwardRef<ReactFlowERDRef, ReactFlowERDProps>(function ReactFlowERD(props, ref) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlowProvider>
        <ReactFlowERDInner {...props} ref={ref} />
      </ReactFlowProvider>
    </div>
  );
});
