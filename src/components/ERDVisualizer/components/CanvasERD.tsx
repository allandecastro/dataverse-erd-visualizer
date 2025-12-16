/**
 * High-performance Canvas-based ERD renderer
 * Renders entities and relationships on a single canvas for better performance
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import type { Entity, EntityRelationship, EntityPosition } from '@/types';
import type { ColorSettings, ThemeColors } from '../types';
import { getFieldTypeColor } from '../types';

export interface CanvasERDProps {
  entities: Entity[];
  relationships: EntityRelationship[];
  entityPositions: Record<string, EntityPosition>;
  selectedFields: Record<string, Set<string>>;
  collapsedEntities: Set<string>;
  pan: { x: number; y: number };
  zoom: number;
  isDarkMode: boolean;
  colorSettings: ColorSettings;
  themeColors: ThemeColors;
  highlightedEntity: string | null;
  hoveredEntity: string | null;
  containerWidth: number;
  containerHeight: number;
  onEntityHover: (entityName: string | null) => void;
  onEntityClick: (entityName: string, event: React.MouseEvent) => void;
  onEntityDragStart: (entityName: string, event: React.MouseEvent) => void;
}

// Constants
const CARD_WIDTH = 300;
const HEADER_HEIGHT = 60;
const ATTRIBUTES_TITLE_HEIGHT = 30;
const FIELD_HEIGHT = 44;
const FIELD_HALF_HEIGHT = 22;

const CARDINALITY_SYMBOLS: Record<string, { from: string; to: string }> = {
  'N:1': { from: 'N', to: '1' },
  '1:N': { from: '1', to: 'N' },
  'N:N': { from: 'N', to: 'N' },
};

export function CanvasERD({
  entities,
  relationships,
  entityPositions,
  selectedFields,
  collapsedEntities,
  pan,
  zoom,
  isDarkMode,
  colorSettings,
  themeColors,
  highlightedEntity,
  hoveredEntity,
  containerWidth,
  containerHeight,
  onEntityHover,
  onEntityClick,
  onEntityDragStart,
}: CanvasERDProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [devicePixelRatio] = useState(() => window.devicePixelRatio || 1);

  const { customTableColor, standardTableColor, lookupColor } = colorSettings;
  const { bgColor } = themeColors;

  // Calculate card height for an entity
  const getCardHeight = useCallback((entity: Entity): number => {
    const isCollapsed = collapsedEntities.has(entity.logicalName);
    if (isCollapsed) return 80;

    const entitySelectedFields = selectedFields[entity.logicalName] || new Set();
    const visibleFieldCount = entity.attributes.filter(attr =>
      entitySelectedFields.has(attr.name) || attr.isPrimaryKey
    ).length;

    if (visibleFieldCount === 0) return 80;
    return HEADER_HEIGHT + ATTRIBUTES_TITLE_HEIGHT + (visibleFieldCount * FIELD_HEIGHT) + 20;
  }, [collapsedEntities, selectedFields]);

  // Get visible fields for an entity
  const getVisibleFields = useCallback((entity: Entity) => {
    const entitySelectedFields = selectedFields[entity.logicalName] || new Set();
    return entity.attributes.filter(attr =>
      entitySelectedFields.has(attr.name) || attr.isPrimaryKey
    );
  }, [selectedFields]);

  // Calculate connection point for relationships
  const getConnectionPoint = useCallback((
    entityName: string,
    fieldName: string | undefined,
    side: 'left' | 'right'
  ): { x: number; y: number } => {
    const entity = entities.find(e => e.logicalName === entityName);
    const pos = entityPositions[entityName];
    if (!pos) return { x: 0, y: 0 };

    const x = side === 'left' ? pos.x : pos.x + CARD_WIDTH;
    let y = pos.y + HEADER_HEIGHT / 2;

    if (entity && fieldName && !collapsedEntities.has(entityName)) {
      const visibleFields = getVisibleFields(entity);
      const fieldIndex = visibleFields.findIndex(attr => attr.name === fieldName);

      if (fieldIndex >= 0) {
        y = pos.y + HEADER_HEIGHT + ATTRIBUTES_TITLE_HEIGHT + (fieldIndex * FIELD_HEIGHT) + FIELD_HALF_HEIGHT;
      }
    }

    return { x, y };
  }, [entities, entityPositions, collapsedEntities, getVisibleFields]);

  // Draw rounded rectangle
  const drawRoundedRect = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number | number[]
  ) => {
    ctx.beginPath();
    if (typeof radius === 'number') {
      ctx.roundRect(x, y, width, height, radius);
    } else {
      ctx.roundRect(x, y, width, height, radius);
    }
  }, []);

  // Draw cardinality marker (crow's foot)
  const drawCardinalityMarker = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    type: 'one' | 'many',
    direction: 'left' | 'right',
    color: string
  ) => {
    const offset = direction === 'left' ? -1 : 1;
    const markerSize = 8;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    if (type === 'one') {
      ctx.beginPath();
      ctx.moveTo(x + offset * 10, y - markerSize);
      ctx.lineTo(x + offset * 10, y + markerSize);
      ctx.stroke();
    } else {
      for (const dy of [-markerSize, 0, markerSize]) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + offset * 12, y + dy);
        ctx.stroke();
      }
    }
  }, []);

  // Draw cardinality label
  const drawCardinalityLabel = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    label: string
  ) => {
    const rectSize = 20;

    ctx.fillStyle = isDarkMode ? '#1e293b' : '#f1f5f9';
    ctx.strokeStyle = isDarkMode ? '#334155' : '#cbd5e1';
    ctx.lineWidth = 1;

    drawRoundedRect(ctx, x - rectSize/2, y - rectSize/2, rectSize, rectSize, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isDarkMode ? '#94a3b8' : '#64748b';
    ctx.font = '700 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y);
  }, [isDarkMode, drawRoundedRect]);

  // Draw a single relationship line
  const drawRelationship = useCallback((
    ctx: CanvasRenderingContext2D,
    rel: EntityRelationship
  ) => {
    const fromEntity = entities.find(e => e.logicalName === rel.from);
    const toEntity = entities.find(e => e.logicalName === rel.to);
    const fromPos = entityPositions[rel.from];
    const toPos = entityPositions[rel.to];

    if (!fromEntity || !toEntity || !fromPos || !toPos) return;

    // Find the lookup field
    const lookupField = fromEntity.attributes.find(attr =>
      (attr.type === 'Lookup' || attr.type === 'Owner') &&
      (rel.referencingAttribute?.toLowerCase() === attr.name.toLowerCase() ||
       rel.schemaName.toLowerCase().includes(attr.name.toLowerCase()))
    );

    // Determine connection sides
    const fromRight = fromPos.x + CARD_WIDTH;
    const toLeft = toPos.x;
    const toRight = toPos.x + CARD_WIDTH;
    const fromLeft = fromPos.x;

    let startSide: 'left' | 'right';
    let endSide: 'left' | 'right';

    if (Math.abs(fromRight - toLeft) < Math.abs(fromLeft - toRight)) {
      startSide = 'right';
      endSide = 'left';
    } else {
      startSide = 'left';
      endSide = 'right';
    }

    const start = getConnectionPoint(rel.from, lookupField?.name, startSide);
    const end = getConnectionPoint(rel.to, toEntity.primaryIdAttribute, endSide);

    // Draw bezier curve
    const dx = end.x - start.x;
    const curveStrength = Math.min(Math.abs(dx) * 0.4, 100);

    ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.bezierCurveTo(
      start.x + curveStrength, start.y,
      end.x - curveStrength, end.y,
      end.x, end.y
    );
    ctx.stroke();

    // Draw connector circles
    ctx.fillStyle = lookupColor;
    ctx.beginPath();
    ctx.arc(start.x, start.y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(end.x, end.y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Get cardinality
    const cardinality = CARDINALITY_SYMBOLS[rel.type] || { from: '?', to: '?' };

    // Draw cardinality markers
    drawCardinalityMarker(
      ctx, start.x, start.y,
      cardinality.from === '1' ? 'one' : 'many',
      startSide === 'right' ? 'right' : 'left',
      lookupColor
    );
    drawCardinalityMarker(
      ctx, end.x, end.y,
      cardinality.to === '1' ? 'one' : 'many',
      endSide === 'right' ? 'right' : 'left',
      '#fbbf24'
    );

    // Draw cardinality labels
    const labelOffset = 25;
    const startLabelX = start.x + (startSide === 'right' ? labelOffset : -labelOffset);
    const endLabelX = end.x + (endSide === 'right' ? labelOffset : -labelOffset);

    drawCardinalityLabel(ctx, startLabelX, start.y, cardinality.from);
    drawCardinalityLabel(ctx, endLabelX, end.y, cardinality.to);
  }, [entities, entityPositions, getConnectionPoint, isDarkMode, lookupColor, drawCardinalityMarker, drawCardinalityLabel]);

  // Draw a single entity card
  const drawEntity = useCallback((
    ctx: CanvasRenderingContext2D,
    entity: Entity
  ) => {
    const pos = entityPositions[entity.logicalName];
    if (!pos) return;

    const x = pos.x;
    const y = pos.y;
    const tableColor = entity.isCustomEntity ? customTableColor : standardTableColor;
    const isHighlighted = highlightedEntity === entity.logicalName;
    const isHovered = hoveredEntity === entity.logicalName;
    const isCollapsed = collapsedEntities.has(entity.logicalName);
    const visibleFields = getVisibleFields(entity);
    const cardHeight = getCardHeight(entity);

    // Shadow
    if (isHighlighted || isHovered) {
      ctx.shadowColor = isHighlighted ? 'rgba(96, 165, 250, 0.6)' : 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = isHighlighted ? 16 : 12;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = isHighlighted ? 0 : 4;
    }

    // Card background
    ctx.fillStyle = isDarkMode ? '#2d2d2d' : '#ffffff';
    drawRoundedRect(ctx, x, y, CARD_WIDTH, cardHeight, 6);
    ctx.fill();

    // Card border
    ctx.strokeStyle = isHighlighted ? '#60a5fa' : tableColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Header background
    ctx.fillStyle = tableColor;
    drawRoundedRect(ctx, x, y, CARD_WIDTH, HEADER_HEIGHT, [6, 6, 0, 0]);
    ctx.fill();

    // Display name
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 15px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(truncateText(ctx, entity.displayName, CARD_WIDTH - 80), x + 12, y + 25);

    // Logical name
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(truncateText(ctx, entity.logicalName, CARD_WIDTH - 24), x + 12, y + 45);

    // Draw fields if not collapsed
    if (!isCollapsed && visibleFields.length > 0) {
      // Attributes title
      ctx.fillStyle = isDarkMode ? '#94a3b8' : '#64748b';
      ctx.font = '600 10px system-ui';
      ctx.fillText(`ATTRIBUTES (${visibleFields.length})`, x + 12, y + HEADER_HEIGHT + 18);

      let fieldY = y + HEADER_HEIGHT + ATTRIBUTES_TITLE_HEIGHT;
      visibleFields.forEach(attr => {
        // Field background
        const fieldBg = attr.isPrimaryKey
          ? (isDarkMode ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.05)')
          : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)');

        ctx.fillStyle = fieldBg;
        drawRoundedRect(ctx, x + 12, fieldY, CARD_WIDTH - 24, FIELD_HEIGHT - 4, 3);
        ctx.fill();

        // Field border
        ctx.strokeStyle = attr.isPrimaryKey ? '#fbbf24' : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)');
        ctx.lineWidth = 1;
        ctx.stroke();

        // Primary key icon
        if (attr.isPrimaryKey) {
          ctx.fillStyle = '#fbbf24';
          ctx.font = '12px system-ui';
          ctx.fillText('🔑', x + 18, fieldY + 18);
        }

        // Display name
        ctx.fillStyle = isDarkMode ? '#e2e8f0' : '#1e293b';
        ctx.font = attr.isPrimaryKey ? '600 11px system-ui' : '500 11px system-ui';
        ctx.textAlign = 'left';
        ctx.fillText(
          truncateText(ctx, attr.displayName, CARD_WIDTH - 100),
          x + (attr.isPrimaryKey ? 36 : 20),
          fieldY + 16
        );

        // Technical name
        ctx.fillStyle = isDarkMode ? '#94a3b8' : '#64748b';
        ctx.font = '9px monospace';
        ctx.fillText(truncateText(ctx, attr.name, CARD_WIDTH - 50), x + 20, fieldY + 30);

        // Type badge
        const typeColor = getFieldTypeColor(attr.type, lookupColor);
        ctx.fillStyle = typeColor;
        drawRoundedRect(ctx, x + CARD_WIDTH - 70, fieldY + 8, 50, 16, 3);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '600 9px system-ui';
        ctx.textAlign = 'center';
        const typeLabel = attr.isPrimaryKey ? 'PK' : attr.type.toUpperCase().substring(0, 8);
        ctx.fillText(typeLabel, x + CARD_WIDTH - 45, fieldY + 19);

        fieldY += FIELD_HEIGHT;
      });
    }
  }, [
    entityPositions, customTableColor, standardTableColor, highlightedEntity,
    hoveredEntity, collapsedEntities, getVisibleFields, getCardHeight, isDarkMode,
    lookupColor, drawRoundedRect
  ]);

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply high DPI scaling
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

    // Fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, containerWidth, containerHeight);

    // Apply pan and zoom transform
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw relationships first (behind entities)
    relationships.forEach(rel => {
      drawRelationship(ctx, rel);
    });

    // Draw entities
    entities.forEach(entity => {
      drawEntity(ctx, entity);
    });

    ctx.restore();
  }, [
    devicePixelRatio, containerWidth, containerHeight, bgColor,
    pan.x, pan.y, zoom, relationships, entities, drawRelationship, drawEntity
  ]);

  // Set up canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = containerWidth * devicePixelRatio;
    canvas.height = containerHeight * devicePixelRatio;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;

    render();
  }, [containerWidth, containerHeight, devicePixelRatio, render]);

  // Re-render when data changes
  useEffect(() => {
    render();
  }, [render]);

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number): { x: number; y: number } => {
    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom,
    };
  }, [pan.x, pan.y, zoom]);

  // Find entity at world coordinates
  const findEntityAt = useCallback((worldX: number, worldY: number): Entity | null => {
    // Search in reverse order (top entities first)
    for (let i = entities.length - 1; i >= 0; i--) {
      const entity = entities[i];
      const pos = entityPositions[entity.logicalName];
      if (!pos) continue;

      const cardHeight = getCardHeight(entity);
      if (
        worldX >= pos.x &&
        worldX <= pos.x + CARD_WIDTH &&
        worldY >= pos.y &&
        worldY <= pos.y + cardHeight
      ) {
        return entity;
      }
    }
    return null;
  }, [entities, entityPositions, getCardHeight]);

  // Handle mouse move for hover
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const world = screenToWorld(screenX, screenY);
    const entity = findEntityAt(world.x, world.y);

    onEntityHover(entity?.logicalName ?? null);
  }, [screenToWorld, findEntityAt, onEntityHover]);

  // Handle mouse down for drag or click
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const world = screenToWorld(screenX, screenY);
    const entity = findEntityAt(world.x, world.y);

    if (entity) {
      onEntityDragStart(entity.logicalName, e);
    }
  }, [screenToWorld, findEntityAt, onEntityDragStart]);

  // Handle click
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const world = screenToWorld(screenX, screenY);
    const entity = findEntityAt(world.x, world.y);

    if (entity) {
      onEntityClick(entity.logicalName, e);
    }
  }, [screenToWorld, findEntityAt, onEntityClick]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    onEntityHover(null);
  }, [onEntityHover]);

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        cursor: hoveredEntity ? 'grab' : 'default',
      }}
    />
  );
}

// Helper to truncate text to fit width
function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;

  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + '...').width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}
