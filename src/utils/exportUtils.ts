/**
 * Export utilities for ERD diagrams
 * Matches the on-screen TableNode design exactly
 */

import type { Entity, EntityRelationship, EntityPosition, EntityAttribute } from '@/types';
import type { ColorSettings, EdgeStyle } from '@/types/erdTypes';
import { MERMAID_TYPE_MAP } from '@/types/erdTypes';
import { CARD_WIDTH, CARDINALITY_SYMBOLS } from '@/constants';
import { getAttributeBadge } from './badges';

// Layout constants matching TableNode.tsx exactly
const HEADER_HEIGHT = 36; // Header with display name only
const SUBHEADER_HEIGHT = 24; // Logical name row
const FIELD_ROW_HEIGHT = 28; // Each field row height
const FIELD_PADDING_TOP = 4; // Padding at top of fields section

// Get type label (matching TableNode.tsx getTypeLabel)
function getTypeLabel(attr: EntityAttribute): string {
  if (attr.isPrimaryKey) return 'Unique Identifier';
  switch (attr.type) {
    case 'Lookup':
      return 'Lookup';
    case 'Owner':
      return 'Owner';
    case 'Customer':
      return 'Customer';
    case 'String':
      return 'Text';
    case 'Memo':
      return 'Multiline Text';
    case 'Integer':
      return 'Whole Number';
    case 'BigInt':
      return 'Big Integer';
    case 'Decimal':
      return 'Decimal Number';
    case 'Double':
      return 'Floating Point';
    case 'Money':
      return 'Currency';
    case 'DateTime':
      return 'Date and Time';
    case 'Boolean':
      return 'Yes/No';
    case 'Picklist':
      return 'Choice';
    case 'State':
      return 'Status';
    case 'Status':
      return 'Status Reason';
    case 'UniqueIdentifier':
      return 'Unique Identifier';
    default:
      return attr.type;
  }
}

export interface ExportOptions {
  entities: Entity[];
  relationships: EntityRelationship[];
  entityPositions: Record<string, EntityPosition>;
  selectedFields: Record<string, Set<string>>;
  collapsedEntities: Set<string>;
  isDarkMode: boolean;
  colorSettings: ColorSettings;
  /** Ordered field names per entity (PK first, then FIFO order) - matches on-screen display */
  orderedFieldsMap?: Record<string, string[]>;
}

/**
 * Get visible fields for an entity in display order
 * Uses orderedFieldsMap if available, otherwise falls back to filtering entity.attributes
 */
function getVisibleFields(
  entity: Entity,
  orderedFieldsMap?: Record<string, string[]>,
  selectedFields?: Record<string, Set<string>>
): EntityAttribute[] {
  // If orderedFieldsMap is available, use it (matches on-screen display)
  if (orderedFieldsMap && orderedFieldsMap[entity.logicalName]) {
    const orderedFieldNames = orderedFieldsMap[entity.logicalName];
    return orderedFieldNames
      .map((fieldName) => entity.attributes.find((a) => a.name === fieldName))
      .filter((attr): attr is EntityAttribute => attr !== undefined);
  }

  // Fallback: filter by selectedFields + isPrimaryKey
  const entitySelectedFields = selectedFields?.[entity.logicalName] || new Set();
  return entity.attributes.filter(
    (attr) => entitySelectedFields.has(attr.name) || attr.isPrimaryKey
  );
}

/**
 * Generate path based on edge style
 */
function generateEdgePath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  edgeStyle: EdgeStyle
): string {
  const dx = end.x - start.x;
  const midX = (start.x + end.x) / 2;

  if (edgeStyle === 'bezier') {
    // Bezier curve
    const curveStrength = Math.min(Math.abs(dx) * 0.4, 100);
    const cp1x = start.x + curveStrength;
    const cp1y = start.y;
    const cp2x = end.x - curveStrength;
    const cp2y = end.y;
    return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
  } else if (edgeStyle === 'straight') {
    // Orthogonal path with right angles
    return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
  } else {
    // Smoothstep (default) - orthogonal with rounded corners
    const radius = 8;
    const dir = dx > 0 ? 1 : -1;

    // Simple smoothstep path
    const pathParts = [`M ${start.x} ${start.y}`];
    pathParts.push(`L ${midX - dir * radius} ${start.y}`);

    // First corner
    if (end.y > start.y) {
      pathParts.push(`Q ${midX} ${start.y} ${midX} ${start.y + radius}`);
    } else {
      pathParts.push(`Q ${midX} ${start.y} ${midX} ${start.y - radius}`);
    }

    // Vertical segment
    if (end.y > start.y) {
      pathParts.push(`L ${midX} ${end.y - radius}`);
      pathParts.push(`Q ${midX} ${end.y} ${midX + dir * radius} ${end.y}`);
    } else {
      pathParts.push(`L ${midX} ${end.y + radius}`);
      pathParts.push(`Q ${midX} ${end.y} ${midX + dir * radius} ${end.y}`);
    }

    pathParts.push(`L ${end.x} ${end.y}`);
    return pathParts.join(' ');
  }
}

/**
 * Calculate connection point for an entity (matching TableNode.tsx handle positions)
 */
function getConnectionPoint(
  entities: Entity[],
  entityPositions: Record<string, EntityPosition>,
  collapsedEntities: Set<string>,
  entityName: string,
  fieldName: string | undefined,
  side: 'left' | 'right',
  orderedFieldsMap?: Record<string, string[]>,
  selectedFields?: Record<string, Set<string>>
): { x: number; y: number } {
  const entity = entities.find((e) => e.logicalName === entityName);
  const pos = entityPositions[entityName];
  if (!pos) return { x: 0, y: 0 };

  const x = side === 'left' ? pos.x : pos.x + CARD_WIDTH;
  // Default to header center
  let y = pos.y + HEADER_HEIGHT / 2;

  if (entity && fieldName && !collapsedEntities.has(entityName)) {
    const visibleFields = getVisibleFields(entity, orderedFieldsMap, selectedFields);
    const fieldIndex = visibleFields.findIndex((attr) => attr.name === fieldName);

    if (fieldIndex >= 0) {
      // Match TableNode.tsx getFieldHandleTop calculation
      y =
        pos.y +
        HEADER_HEIGHT +
        SUBHEADER_HEIGHT +
        FIELD_PADDING_TOP +
        fieldIndex * FIELD_ROW_HEIGHT +
        FIELD_ROW_HEIGHT / 2;
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
    orderedFieldsMap,
  } = options;

  const { customTableColor, standardTableColor, lookupColor } = colorSettings;

  // Create a temporary canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }

  const { edgeStyle } = colorSettings;

  // Calculate card height for an entity (matching TableNode design)
  const getCardHeight = (entity: Entity, isCollapsed: boolean): number => {
    if (isCollapsed) return HEADER_HEIGHT + SUBHEADER_HEIGHT;
    const visibleFields = getVisibleFields(entity, orderedFieldsMap, selectedFields);
    if (visibleFields.length === 0) return HEADER_HEIGHT + SUBHEADER_HEIGHT;
    return HEADER_HEIGHT + SUBHEADER_HEIGHT + FIELD_PADDING_TOP + visibleFields.length * FIELD_ROW_HEIGHT + 8;
  };

  // Calculate bounds with proper card heights
  const positions = Object.values(entityPositions);
  if (positions.length === 0) {
    throw new Error('No entities to export');
  }

  // Calculate max card height considering expanded entities
  let maxCardHeight = HEADER_HEIGHT + SUBHEADER_HEIGHT;
  entities.forEach((entity) => {
    const isCollapsed = collapsedEntities.has(entity.logicalName);
    const cardHeight = getCardHeight(entity, isCollapsed);
    maxCardHeight = Math.max(maxCardHeight, cardHeight);
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
      collapsedEntities,
      rel.from,
      lookupField?.name,
      startSide,
      orderedFieldsMap,
      selectedFields
    );
    const end = getConnectionPoint(
      entities,
      entityPositions,
      collapsedEntities,
      rel.to,
      toEntity.primaryIdAttribute,
      endSide,
      orderedFieldsMap,
      selectedFields
    );

    // Adjust for canvas offset
    const adjStart = { x: start.x - minX, y: start.y - minY };
    const adjEnd = { x: end.x - minX, y: end.y - minY };

    // Generate path based on edge style
    const pathData = generateEdgePath(adjStart, adjEnd, edgeStyle);

    // Draw the path
    ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 2;
    const path2D = new Path2D(pathData);
    ctx.stroke(path2D);

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

  // Draw entities (matching TableNode.tsx design exactly)
  entities.forEach((entity) => {
    const pos = entityPositions[entity.logicalName];
    if (!pos) return;

    const x = pos.x - minX;
    const y = pos.y - minY;
    const tableColor = entity.isCustomEntity ? customTableColor : standardTableColor;
    const isCollapsed = collapsedEntities.has(entity.logicalName);
    const visibleFields = getVisibleFields(entity, orderedFieldsMap, selectedFields);
    const cardHeight = getCardHeight(entity, isCollapsed);

    // Card background with rounded corners
    ctx.fillStyle = isDarkMode ? '#1e1e1e' : '#ffffff';
    ctx.beginPath();
    ctx.roundRect(x, y, CARD_WIDTH, cardHeight, 8);
    ctx.fill();

    // Card border
    ctx.strokeStyle = isDarkMode ? '#404040' : '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Header background (36px)
    ctx.fillStyle = tableColor;
    ctx.beginPath();
    ctx.roundRect(x, y, CARD_WIDTH, HEADER_HEIGHT, [8, 8, 0, 0]);
    ctx.fill();

    // Display name in header
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 14px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(entity.displayName.substring(0, 30), x + 12, y + HEADER_HEIGHT / 2);

    // Subheader background (24px) with logical name
    const subheaderY = y + HEADER_HEIGHT;
    ctx.fillStyle = isDarkMode ? '#2a2a2a' : '#f8fafc';
    ctx.beginPath();
    ctx.rect(x, subheaderY, CARD_WIDTH, SUBHEADER_HEIGHT);
    ctx.fill();

    // Logical name in subheader
    ctx.fillStyle = isDarkMode ? '#94a3b8' : '#64748b';
    ctx.font = '11px monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(entity.logicalName, x + 12, subheaderY + SUBHEADER_HEIGHT / 2);

    // Draw fields if not collapsed (matching TableNode field row design)
    if (!isCollapsed && visibleFields.length > 0) {
      let fieldY = y + HEADER_HEIGHT + SUBHEADER_HEIGHT + FIELD_PADDING_TOP;

      visibleFields.forEach((attr) => {
        const badge = getAttributeBadge(attr);
        const typeLabel = getTypeLabel(attr);

        // Field row background on hover area
        ctx.fillStyle = isDarkMode ? '#252525' : '#fafafa';
        ctx.beginPath();
        ctx.rect(x + 4, fieldY, CARD_WIDTH - 8, FIELD_ROW_HEIGHT - 2);
        ctx.fill();

        // Badge (left side)
        ctx.fillStyle = badge.color;
        ctx.beginPath();
        ctx.roundRect(x + 8, fieldY + 6, 28, 16, 3);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '600 9px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badge.label, x + 22, fieldY + 14);

        // Field display name (middle)
        ctx.fillStyle = isDarkMode ? '#e2e8f0' : '#1e293b';
        ctx.font = '500 12px system-ui';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const displayName = attr.displayName || attr.name;
        ctx.fillText(displayName.substring(0, 20), x + 44, fieldY + FIELD_ROW_HEIGHT / 2);

        // Type label (right side)
        ctx.fillStyle = isDarkMode ? '#64748b' : '#94a3b8';
        ctx.font = '11px system-ui';
        ctx.textAlign = 'right';
        ctx.fillText(typeLabel.substring(0, 15), x + CARD_WIDTH - 12, fieldY + FIELD_ROW_HEIGHT / 2);

        fieldY += FIELD_ROW_HEIGHT;
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
    orderedFieldsMap,
  } = options;

  const { customTableColor, standardTableColor, lookupColor, edgeStyle } = colorSettings;
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');

  // Calculate card height for an entity (matching TableNode design)
  const getCardHeight = (entity: Entity, isCollapsed: boolean): number => {
    if (isCollapsed) return HEADER_HEIGHT + SUBHEADER_HEIGHT;
    const visibleFields = getVisibleFields(entity, orderedFieldsMap, selectedFields);
    if (visibleFields.length === 0) return HEADER_HEIGHT + SUBHEADER_HEIGHT;
    return HEADER_HEIGHT + SUBHEADER_HEIGHT + FIELD_PADDING_TOP + visibleFields.length * FIELD_ROW_HEIGHT + 8;
  };

  // Calculate bounds with proper card heights
  const positions = Object.values(entityPositions);
  if (positions.length === 0) return '';

  // Calculate max card height considering expanded entities
  let maxCardHeight = HEADER_HEIGHT + SUBHEADER_HEIGHT;
  entities.forEach((entity) => {
    const isCollapsed = collapsedEntities.has(entity.logicalName);
    const cardHeight = getCardHeight(entity, isCollapsed);
    maxCardHeight = Math.max(maxCardHeight, cardHeight);
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
      collapsedEntities,
      rel.from,
      lookupField?.name,
      startSide,
      orderedFieldsMap,
      selectedFields
    );
    const end = getConnectionPoint(
      entities,
      entityPositions,
      collapsedEntities,
      rel.to,
      toEntity.primaryIdAttribute,
      endSide,
      orderedFieldsMap,
      selectedFields
    );

    // Generate path based on edge style
    const pathD = generateEdgePath(start, end, edgeStyle);

    // Draw the path
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

  // Draw entities (matching TableNode.tsx design exactly)
  entities.forEach((entity) => {
    const pos = entityPositions[entity.logicalName];
    if (!pos) return;

    const tableColor = entity.isCustomEntity ? customTableColor : standardTableColor;
    const isCollapsed = collapsedEntities.has(entity.logicalName);
    const visibleFields = getVisibleFields(entity, orderedFieldsMap, selectedFields);
    const cardHeight = getCardHeight(entity, isCollapsed);

    // Card background with rounded corners
    const rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('x', pos.x.toString());
    rect.setAttribute('y', pos.y.toString());
    rect.setAttribute('width', CARD_WIDTH.toString());
    rect.setAttribute('height', cardHeight.toString());
    rect.setAttribute('fill', isDarkMode ? '#1e1e1e' : '#ffffff');
    rect.setAttribute('stroke', isDarkMode ? '#404040' : '#e2e8f0');
    rect.setAttribute('stroke-width', '1');
    rect.setAttribute('rx', '8');
    svg.appendChild(rect);

    // Header background (36px)
    const header = document.createElementNS(svgNS, 'rect');
    header.setAttribute('x', pos.x.toString());
    header.setAttribute('y', pos.y.toString());
    header.setAttribute('width', CARD_WIDTH.toString());
    header.setAttribute('height', HEADER_HEIGHT.toString());
    header.setAttribute('fill', tableColor);
    header.setAttribute('rx', '8');
    svg.appendChild(header);

    // Cover bottom corners of header to make them square
    const headerBottom = document.createElementNS(svgNS, 'rect');
    headerBottom.setAttribute('x', pos.x.toString());
    headerBottom.setAttribute('y', (pos.y + HEADER_HEIGHT - 8).toString());
    headerBottom.setAttribute('width', CARD_WIDTH.toString());
    headerBottom.setAttribute('height', '8');
    headerBottom.setAttribute('fill', tableColor);
    svg.appendChild(headerBottom);

    // Display name in header
    const displayNameText = document.createElementNS(svgNS, 'text');
    displayNameText.setAttribute('x', (pos.x + 12).toString());
    displayNameText.setAttribute('y', (pos.y + HEADER_HEIGHT / 2 + 5).toString());
    displayNameText.setAttribute('fill', '#ffffff');
    displayNameText.setAttribute('font-size', '14');
    displayNameText.setAttribute('font-weight', '600');
    displayNameText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    displayNameText.textContent = entity.displayName.substring(0, 30);
    svg.appendChild(displayNameText);

    // Subheader background (24px) with logical name
    const subheaderY = pos.y + HEADER_HEIGHT;
    const subheader = document.createElementNS(svgNS, 'rect');
    subheader.setAttribute('x', pos.x.toString());
    subheader.setAttribute('y', subheaderY.toString());
    subheader.setAttribute('width', CARD_WIDTH.toString());
    subheader.setAttribute('height', SUBHEADER_HEIGHT.toString());
    subheader.setAttribute('fill', isDarkMode ? '#2a2a2a' : '#f8fafc');
    svg.appendChild(subheader);

    // Logical name in subheader
    const logicalNameText = document.createElementNS(svgNS, 'text');
    logicalNameText.setAttribute('x', (pos.x + 12).toString());
    logicalNameText.setAttribute('y', (subheaderY + SUBHEADER_HEIGHT / 2 + 4).toString());
    logicalNameText.setAttribute('fill', isDarkMode ? '#94a3b8' : '#64748b');
    logicalNameText.setAttribute('font-size', '11');
    logicalNameText.setAttribute('font-family', 'monospace');
    logicalNameText.textContent = entity.logicalName;
    svg.appendChild(logicalNameText);

    // Draw fields if not collapsed (matching TableNode field row design)
    if (!isCollapsed && visibleFields.length > 0) {
      let fieldY = pos.y + HEADER_HEIGHT + SUBHEADER_HEIGHT + FIELD_PADDING_TOP;

      visibleFields.forEach((attr) => {
        const badge = getAttributeBadge(attr);
        const typeLabelText = getTypeLabel(attr);

        // Field row background
        const fieldBg = document.createElementNS(svgNS, 'rect');
        fieldBg.setAttribute('x', (pos.x + 4).toString());
        fieldBg.setAttribute('y', fieldY.toString());
        fieldBg.setAttribute('width', (CARD_WIDTH - 8).toString());
        fieldBg.setAttribute('height', (FIELD_ROW_HEIGHT - 2).toString());
        fieldBg.setAttribute('fill', isDarkMode ? '#252525' : '#fafafa');
        svg.appendChild(fieldBg);

        // Badge (left side)
        const badgeRect = document.createElementNS(svgNS, 'rect');
        badgeRect.setAttribute('x', (pos.x + 8).toString());
        badgeRect.setAttribute('y', (fieldY + 6).toString());
        badgeRect.setAttribute('width', '28');
        badgeRect.setAttribute('height', '16');
        badgeRect.setAttribute('fill', badge.color);
        badgeRect.setAttribute('rx', '3');
        svg.appendChild(badgeRect);

        const badgeText = document.createElementNS(svgNS, 'text');
        badgeText.setAttribute('x', (pos.x + 22).toString());
        badgeText.setAttribute('y', (fieldY + 18).toString());
        badgeText.setAttribute('fill', '#ffffff');
        badgeText.setAttribute('font-size', '9');
        badgeText.setAttribute('font-weight', '600');
        badgeText.setAttribute('text-anchor', 'middle');
        badgeText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
        badgeText.textContent = badge.label;
        svg.appendChild(badgeText);

        // Field display name (middle)
        const fieldName = document.createElementNS(svgNS, 'text');
        fieldName.setAttribute('x', (pos.x + 44).toString());
        fieldName.setAttribute('y', (fieldY + FIELD_ROW_HEIGHT / 2 + 4).toString());
        fieldName.setAttribute('fill', isDarkMode ? '#e2e8f0' : '#1e293b');
        fieldName.setAttribute('font-size', '12');
        fieldName.setAttribute('font-weight', '500');
        fieldName.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
        const displayName = attr.displayName || attr.name;
        fieldName.textContent = displayName.substring(0, 20);
        svg.appendChild(fieldName);

        // Type label (right side)
        const typeLabel = document.createElementNS(svgNS, 'text');
        typeLabel.setAttribute('x', (pos.x + CARD_WIDTH - 12).toString());
        typeLabel.setAttribute('y', (fieldY + FIELD_ROW_HEIGHT / 2 + 4).toString());
        typeLabel.setAttribute('fill', isDarkMode ? '#64748b' : '#94a3b8');
        typeLabel.setAttribute('font-size', '11');
        typeLabel.setAttribute('text-anchor', 'end');
        typeLabel.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
        typeLabel.textContent = typeLabelText.substring(0, 15);
        svg.appendChild(typeLabel);

        fieldY += FIELD_ROW_HEIGHT;
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
