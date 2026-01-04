/**
 * Export utilities for ERD diagrams
 */

import type { Entity, EntityRelationship, EntityPosition } from '@/types';
import type { ColorSettings } from '@/types/erdTypes';
import { MERMAID_TYPE_MAP, getFieldTypeColor } from '@/types/erdTypes';
import {
  CARD_WIDTH,
  HEADER_HEIGHT,
  ATTRIBUTES_TITLE_HEIGHT,
  FIELD_HEIGHT,
  FIELD_HALF_HEIGHT,
  CARDINALITY_SYMBOLS,
} from '@/constants';

export interface ExportOptions {
  entities: Entity[];
  relationships: EntityRelationship[];
  entityPositions: Record<string, EntityPosition>;
  selectedFields: Record<string, Set<string>>;
  collapsedEntities: Set<string>;
  isDarkMode: boolean;
  colorSettings: ColorSettings;
}

/**
 * Generate a smooth cubic bezier curve path between two points
 */
function generateBezierPath(
  start: { x: number; y: number },
  end: { x: number; y: number }
): string {
  const dx = end.x - start.x;
  const curveStrength = Math.min(Math.abs(dx) * 0.4, 100);
  const cp1x = start.x + curveStrength;
  const cp1y = start.y;
  const cp2x = end.x - curveStrength;
  const cp2y = end.y;
  return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
}

/**
 * Calculate connection point for an entity
 */
function getConnectionPoint(
  entities: Entity[],
  entityPositions: Record<string, EntityPosition>,
  selectedFields: Record<string, Set<string>>,
  collapsedEntities: Set<string>,
  entityName: string,
  fieldName: string | undefined,
  side: 'left' | 'right'
): { x: number; y: number } {
  const entity = entities.find((e) => e.logicalName === entityName);
  const pos = entityPositions[entityName];
  if (!pos) return { x: 0, y: 0 };

  const x = side === 'left' ? pos.x : pos.x + CARD_WIDTH;
  let y = pos.y + HEADER_HEIGHT / 2;

  if (entity && fieldName && !collapsedEntities.has(entityName)) {
    const entitySelectedFields = selectedFields[entityName] || new Set();
    const visibleFields = entity.attributes.filter(
      (attr) => entitySelectedFields.has(attr.name) || attr.isPrimaryKey
    );
    const fieldIndex = visibleFields.findIndex((attr) => attr.name === fieldName);

    if (fieldIndex >= 0) {
      y =
        pos.y +
        HEADER_HEIGHT +
        ATTRIBUTES_TITLE_HEIGHT +
        fieldIndex * FIELD_HEIGHT +
        FIELD_HALF_HEIGHT;
    }
  }

  return { x, y };
}

/**
 * Draw crow's foot cardinality marker on canvas
 */
function drawCardinalityMarkerCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  type: 'one' | 'many',
  direction: 'left' | 'right',
  color: string
): void {
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
    // Crow's foot for "N" or "many"
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + offset * 12, y - markerSize);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + offset * 12, y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + offset * 12, y + markerSize);
    ctx.stroke();
  }
}

/**
 * Draw cardinality label on canvas
 */
function drawCardinalityLabelCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  isDarkMode: boolean
): void {
  // Background rect
  ctx.fillStyle = isDarkMode ? '#1e293b' : '#f1f5f9';
  ctx.strokeStyle = isDarkMode ? '#334155' : '#cbd5e1';
  ctx.lineWidth = 1;

  const rectSize = 20;
  const rx = 4;

  // Rounded rect
  ctx.beginPath();
  ctx.roundRect(x - rectSize / 2, y - rectSize / 2, rectSize, rectSize, rx);
  ctx.fill();
  ctx.stroke();

  // Label text
  ctx.fillStyle = isDarkMode ? '#94a3b8' : '#64748b';
  ctx.font = '700 11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y);
}

/**
 * Copy diagram to clipboard as PNG
 */
export async function copyToClipboardAsPNG(options: ExportOptions): Promise<void> {
  const {
    entities,
    relationships,
    entityPositions,
    selectedFields,
    collapsedEntities,
    isDarkMode,
    colorSettings,
  } = options;

  const { customTableColor, standardTableColor, lookupColor } = colorSettings;

  // Create a temporary canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }

  // Calculate bounds with proper card heights
  const positions = Object.values(entityPositions);
  if (positions.length === 0) {
    throw new Error('No entities to export');
  }

  // Calculate max card height considering expanded entities
  let maxCardHeight = 80;
  entities.forEach((entity) => {
    const isCollapsed = collapsedEntities.has(entity.logicalName);
    const entitySelectedFields = selectedFields[entity.logicalName] || new Set();
    const visibleFieldCount = entity.attributes.filter(
      (attr) => entitySelectedFields.has(attr.name) || attr.isPrimaryKey
    ).length;

    if (!isCollapsed && visibleFieldCount > 0) {
      const cardHeight =
        HEADER_HEIGHT + ATTRIBUTES_TITLE_HEIGHT + visibleFieldCount * FIELD_HEIGHT + 20;
      maxCardHeight = Math.max(maxCardHeight, cardHeight);
    }
  });

  const minX = Math.min(...positions.map((p) => p.x)) - 80;
  const maxX = Math.max(...positions.map((p) => p.x)) + CARD_WIDTH + 80;
  const minY = Math.min(...positions.map((p) => p.y)) - 50;
  const maxY = Math.max(...positions.map((p) => p.y)) + maxCardHeight + 50;

  const width = maxX - minX;
  const height = maxY - minY;

  canvas.width = width;
  canvas.height = height;

  // Background
  ctx.fillStyle = isDarkMode ? '#1a1a1a' : '#f0f0f0';
  ctx.fillRect(0, 0, width, height);

  // Draw relationships with bezier curves
  relationships.forEach((rel) => {
    const fromEntity = entities.find((e) => e.logicalName === rel.from);
    const toEntity = entities.find((e) => e.logicalName === rel.to);
    const fromPos = entityPositions[rel.from];
    const toPos = entityPositions[rel.to];

    if (!fromEntity || !toEntity || !fromPos || !toPos) return;

    // Find the lookup field that creates this relationship
    const lookupField = fromEntity.attributes.find(
      (attr) =>
        (attr.type === 'Lookup' || attr.type === 'Owner') &&
        (rel.referencingAttribute?.toLowerCase() === attr.name.toLowerCase() ||
          rel.schemaName.toLowerCase().includes(attr.name.toLowerCase()))
    );

    // Determine connection sides based on relative positions
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

    // Get connection points (field-aware)
    const start = getConnectionPoint(
      entities,
      entityPositions,
      selectedFields,
      collapsedEntities,
      rel.from,
      lookupField?.name,
      startSide
    );
    const end = getConnectionPoint(
      entities,
      entityPositions,
      selectedFields,
      collapsedEntities,
      rel.to,
      toEntity.primaryIdAttribute,
      endSide
    );

    // Adjust for canvas offset
    const adjStart = { x: start.x - minX, y: start.y - minY };
    const adjEnd = { x: end.x - minX, y: end.y - minY };

    // Generate bezier curve
    const dx = adjEnd.x - adjStart.x;
    const curveStrength = Math.min(Math.abs(dx) * 0.4, 100);

    // Draw the bezier curve
    ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(adjStart.x, adjStart.y);
    ctx.bezierCurveTo(
      adjStart.x + curveStrength,
      adjStart.y,
      adjEnd.x - curveStrength,
      adjEnd.y,
      adjEnd.x,
      adjEnd.y
    );
    ctx.stroke();

    // Draw connector circles
    ctx.fillStyle = lookupColor;
    ctx.beginPath();
    ctx.arc(adjStart.x, adjStart.y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(adjEnd.x, adjEnd.y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Get cardinality
    const cardinality = CARDINALITY_SYMBOLS[rel.type] || { from: '?', to: '?' };

    // Draw cardinality markers
    drawCardinalityMarkerCanvas(
      ctx,
      adjStart.x,
      adjStart.y,
      cardinality.from === '1' ? 'one' : 'many',
      startSide === 'right' ? 'right' : 'left',
      lookupColor
    );
    drawCardinalityMarkerCanvas(
      ctx,
      adjEnd.x,
      adjEnd.y,
      cardinality.to === '1' ? 'one' : 'many',
      endSide === 'right' ? 'right' : 'left',
      '#fbbf24'
    );

    // Draw cardinality labels
    const labelOffset = 25;
    const startLabelX = adjStart.x + (startSide === 'right' ? labelOffset : -labelOffset);
    const endLabelX = adjEnd.x + (endSide === 'right' ? labelOffset : -labelOffset);

    drawCardinalityLabelCanvas(ctx, startLabelX, adjStart.y, cardinality.from, isDarkMode);
    drawCardinalityLabelCanvas(ctx, endLabelX, adjEnd.y, cardinality.to, isDarkMode);
  });

  // Draw entities
  entities.forEach((entity) => {
    const pos = entityPositions[entity.logicalName];
    if (!pos) return;

    const x = pos.x - minX;
    const y = pos.y - minY;
    const tableColor = entity.isCustomEntity ? customTableColor : standardTableColor;
    const isCollapsed = collapsedEntities.has(entity.logicalName);
    const entitySelectedFields = selectedFields[entity.logicalName] || new Set();
    const visibleFields = entity.attributes.filter(
      (attr) => entitySelectedFields.has(attr.name) || attr.isPrimaryKey
    );

    // Calculate card height
    const cardHeight =
      isCollapsed || visibleFields.length === 0
        ? 80
        : HEADER_HEIGHT + ATTRIBUTES_TITLE_HEIGHT + visibleFields.length * FIELD_HEIGHT + 20;

    // Card background with rounded corners
    ctx.fillStyle = isDarkMode ? '#2d2d2d' : '#ffffff';
    ctx.beginPath();
    ctx.roundRect(x, y, CARD_WIDTH, cardHeight, 6);
    ctx.fill();

    // Card border
    ctx.strokeStyle = tableColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Header background
    ctx.fillStyle = tableColor;
    ctx.beginPath();
    ctx.roundRect(x, y, CARD_WIDTH, HEADER_HEIGHT, [6, 6, 0, 0]);
    ctx.fill();

    // Display name
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 15px system-ui';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(entity.displayName, x + 12, y + 25);

    // Logical name
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(entity.logicalName, x + 12, y + 45);

    // Draw fields if not collapsed
    if (!isCollapsed && visibleFields.length > 0) {
      // Attributes title
      ctx.fillStyle = isDarkMode ? '#94a3b8' : '#64748b';
      ctx.font = '600 10px system-ui';
      ctx.fillText(`ATTRIBUTES (${visibleFields.length})`, x + 12, y + HEADER_HEIGHT + 18);

      let fieldY = y + HEADER_HEIGHT + ATTRIBUTES_TITLE_HEIGHT;
      visibleFields.forEach((attr) => {
        // Field background
        const fieldBg = attr.isPrimaryKey
          ? isDarkMode
            ? 'rgba(251, 191, 36, 0.1)'
            : 'rgba(251, 191, 36, 0.05)'
          : isDarkMode
            ? 'rgba(255,255,255,0.05)'
            : 'rgba(0,0,0,0.02)';

        ctx.fillStyle = fieldBg;
        ctx.beginPath();
        ctx.roundRect(x + 12, fieldY, CARD_WIDTH - 24, FIELD_HEIGHT - 4, 3);
        ctx.fill();

        // Field border
        ctx.strokeStyle = attr.isPrimaryKey
          ? '#fbbf24'
          : isDarkMode
            ? 'rgba(255,255,255,0.1)'
            : 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Primary key icon (simplified)
        if (attr.isPrimaryKey) {
          ctx.fillStyle = '#fbbf24';
          ctx.font = '12px system-ui';
          ctx.fillText('🔑', x + 18, fieldY + 18);
        }

        // Display name
        ctx.fillStyle = isDarkMode ? '#e2e8f0' : '#1e293b';
        ctx.font = attr.isPrimaryKey ? '600 11px system-ui' : '500 11px system-ui';
        ctx.fillText(
          attr.displayName.substring(0, 25),
          x + (attr.isPrimaryKey ? 36 : 20),
          fieldY + 16
        );

        // Technical name
        ctx.fillStyle = isDarkMode ? '#94a3b8' : '#64748b';
        ctx.font = '9px monospace';
        ctx.fillText(attr.name.substring(0, 30), x + 20, fieldY + 30);

        // Type badge
        const typeColor = getFieldTypeColor(attr.type, lookupColor);
        ctx.fillStyle = typeColor;
        ctx.beginPath();
        ctx.roundRect(x + CARD_WIDTH - 70, fieldY + 8, 50, 16, 3);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '600 9px system-ui';
        ctx.textAlign = 'center';
        const typeLabel = attr.isPrimaryKey ? 'PK' : attr.type.toUpperCase().substring(0, 8);
        ctx.fillText(typeLabel, x + CARD_WIDTH - 45, fieldY + 19);
        ctx.textAlign = 'left';

        fieldY += FIELD_HEIGHT;
      });
    }
  });

  // Convert to blob and copy to clipboard
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Failed to create image'));
        return;
      }
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
}

/**
 * Export diagram as Mermaid code
 */
export function exportToMermaid(options: ExportOptions): string {
  const { entities, relationships, selectedFields } = options;

  let mermaid = 'erDiagram\n';

  // Add entities with their fields
  entities.forEach((entity) => {
    const entitySelectedFields = selectedFields[entity.logicalName] || new Set();
    const visibleFields = entity.attributes.filter(
      (attr) => entitySelectedFields.has(attr.name) || attr.isPrimaryKey
    );

    if (visibleFields.length > 0) {
      mermaid += `    ${entity.logicalName} {\n`;
      visibleFields.forEach((attr) => {
        const mermaidType = MERMAID_TYPE_MAP[attr.type] || 'string';
        const pkMarker = attr.isPrimaryKey ? ' PK' : '';
        mermaid += `        ${mermaidType} ${attr.name}${pkMarker}\n`;
      });
      mermaid += `    }\n`;
    } else {
      // Entity with no selected fields
      mermaid += `    ${entity.logicalName}\n`;
    }
  });

  mermaid += '\n';

  // Add relationships
  const relTypeMapping: Record<string, string> = {
    'N:1': '||--o{',
    '1:N': '}o--||',
    'N:N': '}o--o{',
  };

  relationships.forEach((rel) => {
    const mermaidRel = relTypeMapping[rel.type] || '||--||';
    mermaid += `    ${rel.from} ${mermaidRel} ${rel.to} : "${rel.schemaName}"\n`;
  });

  return mermaid;
}

/**
 * Create SVG cardinality marker (crow's foot)
 */
function createCardinalityMarkerSVG(
  svgNS: string,
  x: number,
  y: number,
  type: 'one' | 'many',
  direction: 'left' | 'right',
  color: string
): Element {
  const g = document.createElementNS(svgNS, 'g');
  const offset = direction === 'left' ? -1 : 1;
  const markerSize = 8;

  if (type === 'one') {
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', (x + offset * 10).toString());
    line.setAttribute('y1', (y - markerSize).toString());
    line.setAttribute('x2', (x + offset * 10).toString());
    line.setAttribute('y2', (y + markerSize).toString());
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '2');
    g.appendChild(line);
  } else {
    // Crow's foot for "N" or "many"
    for (const dy of [-markerSize, 0, markerSize]) {
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', x.toString());
      line.setAttribute('y1', y.toString());
      line.setAttribute('x2', (x + offset * 12).toString());
      line.setAttribute('y2', (y + dy).toString());
      line.setAttribute('stroke', color);
      line.setAttribute('stroke-width', '2');
      g.appendChild(line);
    }
  }

  return g;
}

/**
 * Create SVG cardinality label
 */
function createCardinalityLabelSVG(
  svgNS: string,
  x: number,
  y: number,
  label: string,
  isDarkMode: boolean
): Element {
  const g = document.createElementNS(svgNS, 'g');

  const rect = document.createElementNS(svgNS, 'rect');
  rect.setAttribute('x', (x - 10).toString());
  rect.setAttribute('y', (y - 10).toString());
  rect.setAttribute('width', '20');
  rect.setAttribute('height', '20');
  rect.setAttribute('rx', '4');
  rect.setAttribute('fill', isDarkMode ? '#1e293b' : '#f1f5f9');
  rect.setAttribute('stroke', isDarkMode ? '#334155' : '#cbd5e1');
  rect.setAttribute('stroke-width', '1');
  g.appendChild(rect);

  const text = document.createElementNS(svgNS, 'text');
  text.setAttribute('x', x.toString());
  text.setAttribute('y', (y + 4).toString());
  text.setAttribute('fill', isDarkMode ? '#94a3b8' : '#64748b');
  text.setAttribute('font-size', '11');
  text.setAttribute('font-weight', '700');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
  text.textContent = label;
  g.appendChild(text);

  return g;
}

/**
 * Export diagram as SVG
 */
export function exportToSVG(options: ExportOptions): string {
  const {
    entities,
    relationships,
    entityPositions,
    selectedFields,
    collapsedEntities,
    isDarkMode,
    colorSettings,
  } = options;

  const { customTableColor, standardTableColor, lookupColor } = colorSettings;
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');

  // Calculate bounds with proper card heights
  const positions = Object.values(entityPositions);
  if (positions.length === 0) return '';

  // Calculate max card height considering expanded entities
  let maxCardHeight = 80;
  entities.forEach((entity) => {
    const isCollapsed = collapsedEntities.has(entity.logicalName);
    const entitySelectedFields = selectedFields[entity.logicalName] || new Set();
    const visibleFieldCount = entity.attributes.filter(
      (attr) => entitySelectedFields.has(attr.name) || attr.isPrimaryKey
    ).length;

    if (!isCollapsed && visibleFieldCount > 0) {
      const cardHeight =
        HEADER_HEIGHT + ATTRIBUTES_TITLE_HEIGHT + visibleFieldCount * FIELD_HEIGHT + 20;
      maxCardHeight = Math.max(maxCardHeight, cardHeight);
    }
  });

  const minX = Math.min(...positions.map((p) => p.x)) - 80;
  const maxX = Math.max(...positions.map((p) => p.x)) + CARD_WIDTH + 80;
  const minY = Math.min(...positions.map((p) => p.y)) - 50;
  const maxY = Math.max(...positions.map((p) => p.y)) + maxCardHeight + 50;

  const width = maxX - minX;
  const height = maxY - minY;

  svg.setAttribute('width', width.toString());
  svg.setAttribute('height', height.toString());
  svg.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
  svg.setAttribute('xmlns', svgNS);

  // Add background
  const bg = document.createElementNS(svgNS, 'rect');
  bg.setAttribute('x', minX.toString());
  bg.setAttribute('y', minY.toString());
  bg.setAttribute('width', width.toString());
  bg.setAttribute('height', height.toString());
  bg.setAttribute('fill', isDarkMode ? '#1a1a1a' : '#f0f0f0');
  svg.appendChild(bg);

  // Draw relationships with bezier curves
  relationships.forEach((rel) => {
    const fromEntity = entities.find((e) => e.logicalName === rel.from);
    const toEntity = entities.find((e) => e.logicalName === rel.to);
    const fromPos = entityPositions[rel.from];
    const toPos = entityPositions[rel.to];

    if (!fromEntity || !toEntity || !fromPos || !toPos) return;

    // Find the lookup field that creates this relationship
    const lookupField = fromEntity.attributes.find(
      (attr) =>
        (attr.type === 'Lookup' || attr.type === 'Owner') &&
        (rel.referencingAttribute?.toLowerCase() === attr.name.toLowerCase() ||
          rel.schemaName.toLowerCase().includes(attr.name.toLowerCase()))
    );

    // Determine connection sides based on relative positions
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

    // Get connection points (field-aware)
    const start = getConnectionPoint(
      entities,
      entityPositions,
      selectedFields,
      collapsedEntities,
      rel.from,
      lookupField?.name,
      startSide
    );
    const end = getConnectionPoint(
      entities,
      entityPositions,
      selectedFields,
      collapsedEntities,
      rel.to,
      toEntity.primaryIdAttribute,
      endSide
    );

    // Generate bezier path
    const pathD = generateBezierPath(start, end);

    // Draw the bezier curve
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', pathD);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', isDarkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    svg.appendChild(path);

    // Draw connector circles
    const circle1 = document.createElementNS(svgNS, 'circle');
    circle1.setAttribute('cx', start.x.toString());
    circle1.setAttribute('cy', start.y.toString());
    circle1.setAttribute('r', '5');
    circle1.setAttribute('fill', lookupColor);
    svg.appendChild(circle1);

    const circle2 = document.createElementNS(svgNS, 'circle');
    circle2.setAttribute('cx', end.x.toString());
    circle2.setAttribute('cy', end.y.toString());
    circle2.setAttribute('r', '5');
    circle2.setAttribute('fill', '#fbbf24');
    svg.appendChild(circle2);

    // Get cardinality
    const cardinality = CARDINALITY_SYMBOLS[rel.type] || { from: '?', to: '?' };

    // Draw cardinality markers
    svg.appendChild(
      createCardinalityMarkerSVG(
        svgNS,
        start.x,
        start.y,
        cardinality.from === '1' ? 'one' : 'many',
        startSide === 'right' ? 'right' : 'left',
        lookupColor
      )
    );
    svg.appendChild(
      createCardinalityMarkerSVG(
        svgNS,
        end.x,
        end.y,
        cardinality.to === '1' ? 'one' : 'many',
        endSide === 'right' ? 'right' : 'left',
        '#fbbf24'
      )
    );

    // Draw cardinality labels
    const labelOffset = 25;
    const startLabelX = start.x + (startSide === 'right' ? labelOffset : -labelOffset);
    const endLabelX = end.x + (endSide === 'right' ? labelOffset : -labelOffset);

    svg.appendChild(
      createCardinalityLabelSVG(svgNS, startLabelX, start.y, cardinality.from, isDarkMode)
    );
    svg.appendChild(createCardinalityLabelSVG(svgNS, endLabelX, end.y, cardinality.to, isDarkMode));
  });

  // Draw entities
  entities.forEach((entity) => {
    const pos = entityPositions[entity.logicalName];
    if (!pos) return;

    const isCustom = entity.isCustomEntity;
    const tableColor = isCustom ? customTableColor : standardTableColor;
    const entitySelectedFields = selectedFields[entity.logicalName] || new Set();
    const isCollapsed = collapsedEntities.has(entity.logicalName);

    // Get visible fields (selected + primary key)
    const visibleFields = entity.attributes.filter(
      (attr) => entitySelectedFields.has(attr.name) || attr.isPrimaryKey
    );

    // Entity card background - use proper dimensions
    const cardHeight =
      isCollapsed || visibleFields.length === 0
        ? 80
        : HEADER_HEIGHT + ATTRIBUTES_TITLE_HEIGHT + visibleFields.length * FIELD_HEIGHT + 20;

    const rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('x', pos.x.toString());
    rect.setAttribute('y', pos.y.toString());
    rect.setAttribute('width', CARD_WIDTH.toString());
    rect.setAttribute('height', cardHeight.toString());
    rect.setAttribute('fill', isDarkMode ? '#2d2d2d' : '#ffffff');
    rect.setAttribute('stroke', tableColor);
    rect.setAttribute('stroke-width', '2');
    rect.setAttribute('rx', '6');
    svg.appendChild(rect);

    // Header background
    const header = document.createElementNS(svgNS, 'rect');
    header.setAttribute('x', pos.x.toString());
    header.setAttribute('y', pos.y.toString());
    header.setAttribute('width', CARD_WIDTH.toString());
    header.setAttribute('height', HEADER_HEIGHT.toString());
    header.setAttribute('fill', tableColor);
    header.setAttribute('rx', '6');
    svg.appendChild(header);

    // Display name
    const displayNameText = document.createElementNS(svgNS, 'text');
    displayNameText.setAttribute('x', (pos.x + 12).toString());
    displayNameText.setAttribute('y', (pos.y + 25).toString());
    displayNameText.setAttribute('fill', '#ffffff');
    displayNameText.setAttribute('font-size', '15');
    displayNameText.setAttribute('font-weight', '600');
    displayNameText.textContent = entity.displayName;
    svg.appendChild(displayNameText);

    // Logical name
    const logicalNameText = document.createElementNS(svgNS, 'text');
    logicalNameText.setAttribute('x', (pos.x + 12).toString());
    logicalNameText.setAttribute('y', (pos.y + 45).toString());
    logicalNameText.setAttribute('fill', 'rgba(255, 255, 255, 0.8)');
    logicalNameText.setAttribute('font-size', '11');
    logicalNameText.setAttribute('font-family', 'monospace');
    logicalNameText.textContent = entity.logicalName;
    svg.appendChild(logicalNameText);

    // Fields
    if (!isCollapsed && visibleFields.length > 0) {
      const fieldsTitle = document.createElementNS(svgNS, 'text');
      fieldsTitle.setAttribute('x', (pos.x + 12).toString());
      fieldsTitle.setAttribute('y', (pos.y + HEADER_HEIGHT + 18).toString());
      fieldsTitle.setAttribute('fill', isDarkMode ? '#94a3b8' : '#64748b');
      fieldsTitle.setAttribute('font-size', '10');
      fieldsTitle.setAttribute('font-weight', '600');
      fieldsTitle.textContent = `ATTRIBUTES (${visibleFields.length})`;
      svg.appendChild(fieldsTitle);

      let yOffset = pos.y + HEADER_HEIGHT + ATTRIBUTES_TITLE_HEIGHT;
      visibleFields.forEach((attr) => {
        // Field background
        const fieldBgColor = attr.isPrimaryKey
          ? isDarkMode
            ? 'rgba(251, 191, 36, 0.1)'
            : 'rgba(251, 191, 36, 0.05)'
          : isDarkMode
            ? 'rgba(255,255,255,0.05)'
            : 'rgba(0,0,0,0.02)';

        const fieldBg = document.createElementNS(svgNS, 'rect');
        fieldBg.setAttribute('x', (pos.x + 12).toString());
        fieldBg.setAttribute('y', yOffset.toString());
        fieldBg.setAttribute('width', (CARD_WIDTH - 24).toString());
        fieldBg.setAttribute('height', (FIELD_HEIGHT - 4).toString());
        fieldBg.setAttribute('fill', fieldBgColor);
        fieldBg.setAttribute(
          'stroke',
          attr.isPrimaryKey ? '#fbbf24' : isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
        );
        fieldBg.setAttribute('rx', '3');
        svg.appendChild(fieldBg);

        // Primary key indicator
        const textXOffset = attr.isPrimaryKey ? 36 : 20;
        if (attr.isPrimaryKey) {
          const keyText = document.createElementNS(svgNS, 'text');
          keyText.setAttribute('x', (pos.x + 20).toString());
          keyText.setAttribute('y', (yOffset + 18).toString());
          keyText.setAttribute('font-size', '12');
          keyText.textContent = '🔑';
          svg.appendChild(keyText);
        }

        const displayName = document.createElementNS(svgNS, 'text');
        displayName.setAttribute('x', (pos.x + textXOffset).toString());
        displayName.setAttribute('y', (yOffset + 16).toString());
        displayName.setAttribute('fill', isDarkMode ? '#e2e8f0' : '#1e293b');
        displayName.setAttribute('font-size', '11');
        displayName.setAttribute('font-weight', attr.isPrimaryKey ? '600' : '500');
        displayName.textContent = attr.displayName.substring(0, 25);
        svg.appendChild(displayName);

        const technicalName = document.createElementNS(svgNS, 'text');
        technicalName.setAttribute('x', (pos.x + 20).toString());
        technicalName.setAttribute('y', (yOffset + 30).toString());
        technicalName.setAttribute('fill', isDarkMode ? '#94a3b8' : '#64748b');
        technicalName.setAttribute('font-size', '9');
        technicalName.setAttribute('font-family', 'monospace');
        technicalName.textContent = attr.name.substring(0, 30);
        svg.appendChild(technicalName);

        // Type badge
        const typeBadge = document.createElementNS(svgNS, 'rect');
        typeBadge.setAttribute('x', (pos.x + CARD_WIDTH - 70).toString());
        typeBadge.setAttribute('y', (yOffset + 8).toString());
        typeBadge.setAttribute('width', '50');
        typeBadge.setAttribute('height', '16');
        typeBadge.setAttribute('fill', getFieldTypeColor(attr.type, lookupColor));
        typeBadge.setAttribute('rx', '3');
        svg.appendChild(typeBadge);

        const typeLabel = attr.isPrimaryKey ? 'PK' : attr.type.toUpperCase().substring(0, 8);
        const typeText = document.createElementNS(svgNS, 'text');
        typeText.setAttribute('x', (pos.x + CARD_WIDTH - 45).toString());
        typeText.setAttribute('y', (yOffset + 19).toString());
        typeText.setAttribute('fill', '#ffffff');
        typeText.setAttribute('font-size', '9');
        typeText.setAttribute('font-weight', '600');
        typeText.setAttribute('text-anchor', 'middle');
        typeText.textContent = typeLabel;
        svg.appendChild(typeText);

        yOffset += FIELD_HEIGHT;
      });
    }
  });

  // Serialize
  const serializer = new XMLSerializer();
  return serializer.serializeToString(svg);
}

/**
 * Download SVG as file
 */
export function downloadSVG(svgString: string, filename = 'dataverse-erd.svg'): void {
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
