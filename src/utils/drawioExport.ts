/**
 * Draw.io Export Utility
 *
 * Creates a Draw.io (.drawio) file from ERD entities and relationships.
 * Draw.io format is well-documented XML that can be:
 * - Opened directly in draw.io (free, web-based)
 * - Imported into Microsoft Visio
 * - Opened in VS Code with Draw.io extension
 */

import type {
  Entity,
  EntityRelationship,
  EntityPosition,
  EntityAttribute,
  AlternateKey,
} from '@/types';
import type { ColorSettings } from '@/types/erdTypes';
import { getAttributeBadge } from './badges';

export interface DrawioExportOptions {
  entities: Entity[];
  relationships: EntityRelationship[];
  entityPositions: Record<string, EntityPosition>;
  selectedFields: Record<string, Set<string>>;
  collapsedEntities: Set<string>;
  colorSettings: ColorSettings;
  entityColorOverrides?: Record<string, string>;
  groupNames?: Record<string, string>;
  onProgress?: (progress: number, message: string) => void;
}

// Constants for shape sizing (matching TableNode.tsx)
const CARD_WIDTH = 300; // Increased from 200px to accommodate field information
const HEADER_HEIGHT = 40; // Entity display name header
const SUBHEADER_HEIGHT = 24; // Logical name row
const FIELD_ROW_HEIGHT = 28; // Each field row
const AK_HEADER_HEIGHT = 24; // Alternate keys section header
const AK_ROW_HEIGHT = 24; // Each alternate key row
const PADDING = 8; // Top/bottom padding

// Cached style strings (pre-computed for performance)
const SWIMLANE_STYLE_BASE = [
  'swimlane',
  'fontStyle=1',
  'childLayout=stackLayout',
  'horizontal=1',
  'horizontalStack=0',
  'resizeParent=1',
  'resizeParentMax=0',
  'resizeLast=0',
  'collapsible=0',
  'marginBottom=0',
  'swimlaneFillColor=#ffffff',
  'fontColor=#ffffff',
  'strokeColor=#333333',
  'strokeWidth=2',
].join(';');

const LOGICAL_NAME_STYLE = [
  'text',
  'strokeColor=none',
  'fillColor=#f8fafc',
  'align=left',
  'verticalAlign=middle',
  'spacingLeft=10',
  'spacingRight=10',
  'overflow=hidden',
  'rotatable=0',
  'points=[[0,0.5],[1,0.5]]',
  'portConstraint=eastwest',
  'fontFamily=Courier New',
  'fontSize=11',
  'fontColor=#64748b',
].join(';');

const FIELD_STYLE_BASE = [
  'text',
  'strokeColor=none',
  'align=left',
  'verticalAlign=middle',
  'spacingLeft=10',
  'spacingRight=10',
  'overflow=hidden',
  'rotatable=0',
  'points=[[0,0.5],[1,0.5]]',
  'portConstraint=eastwest',
  'fontSize=12',
].join(';');

const AK_HEADER_STYLE = [
  'text',
  'strokeColor=none',
  'fillColor=#e0f2fe',
  'align=left',
  'verticalAlign=middle',
  'spacingLeft=10',
  'spacingRight=10',
  'overflow=hidden',
  'rotatable=0',
  'points=[[0,0.5],[1,0.5]]',
  'portConstraint=eastwest',
  'fontStyle=1',
  'fontSize=10',
  'fontColor=#0ea5e9',
].join(';');

const AK_ROW_STYLE = [
  'text',
  'strokeColor=none',
  'fillColor=#f0f9ff',
  'align=left',
  'verticalAlign=middle',
  'spacingLeft=10',
  'spacingRight=10',
  'overflow=hidden',
  'rotatable=0',
  'points=[[0,0.5],[1,0.5]]',
  'portConstraint=eastwest',
  'fontSize=11',
].join(';');

const CONNECTOR_STYLE = [
  'edgeStyle=orthogonalEdgeStyle',
  'rounded=1',
  'orthogonalLoop=1',
  'jettySize=auto',
  'html=1',
  'strokeColor=#333333',
  'strokeWidth=2',
  'endArrow=classic',
  'endFill=1',
  'fontSize=10',
  'fontColor=#333333',
  'labelBackgroundColor=#ffffff',
  'align=center',
  'verticalAlign=middle',
].join(';');

/**
 * Memoized XML escape function for better performance with duplicate strings
 */
const escapeXml = (() => {
  const cache = new Map<string, string>();
  return (str: string): string => {
    if (cache.has(str)) {
      return cache.get(str)!;
    }
    const escaped = str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
    cache.set(str, escaped);
    return escaped;
  };
})();

/**
 * Generate a unique ID for Draw.io cells
 */
function generateId(prefix: string, index: number): string {
  return `${prefix}_${index}`;
}

/**
 * Get type label for an attribute (matching TableNode.tsx and exportUtils.ts)
 */
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

/**
 * Create a lookup map of primary keys for O(1) access (performance optimization)
 */
function createPrimaryKeyMap(entities: Entity[]): Map<string, EntityAttribute | undefined> {
  const map = new Map<string, EntityAttribute | undefined>();
  entities.forEach((entity) => {
    const primaryKey = entity.attributes.find((attr) => attr.isPrimaryKey);
    map.set(entity.logicalName, primaryKey);
  });
  return map;
}

/**
 * Get visible fields for an entity respecting selectedFields
 * Always includes primary key even if not in selectedFields
 * Optimized version using cached primary key (avoids O(n) find on every call)
 */
function getVisibleFields(
  entity: Entity,
  selectedFields: Set<string>,
  primaryKey?: EntityAttribute
): EntityAttribute[] {
  const visibleFields: EntityAttribute[] = [];

  // Always include primary key first (use cached if available)
  if (primaryKey) {
    visibleFields.push(primaryKey);
  }

  // Add selected fields (excluding primary key to avoid duplicates)
  entity.attributes.forEach((attr) => {
    if (!attr.isPrimaryKey && selectedFields.has(attr.name)) {
      visibleFields.push(attr);
    }
  });

  // If no fields selected, return only primary key
  return visibleFields;
}

/**
 * Calculate dynamic entity height based on content
 */
function calculateEntityHeight(
  entity: Entity,
  selectedFields: Set<string>,
  isCollapsed: boolean,
  primaryKey?: EntityAttribute
): number {
  if (isCollapsed) {
    // Collapsed: only header + logical name
    return HEADER_HEIGHT + SUBHEADER_HEIGHT + PADDING;
  }

  const visibleFields = getVisibleFields(entity, selectedFields, primaryKey);
  const fieldCount = visibleFields.length;
  const alternateKeyCount = entity.alternateKeys?.length || 0;
  const hasAlternateKeys = alternateKeyCount > 0;

  return (
    HEADER_HEIGHT +
    SUBHEADER_HEIGHT +
    fieldCount * FIELD_ROW_HEIGHT +
    (hasAlternateKeys ? AK_HEADER_HEIGHT : 0) +
    alternateKeyCount * AK_ROW_HEIGHT +
    PADDING
  );
}

/**
 * Format multi-line relationship label for connector
 * Escapes each component to prevent XML injection
 */
function formatRelationshipLabel(relationship: EntityRelationship): string {
  const lines: string[] = [];

  // Line 1: Cardinality (escaped)
  lines.push(escapeXml(relationship.type));

  // Line 2: Schema name (escaped)
  lines.push(escapeXml(relationship.schemaName));

  // Line 3: Field mapping (if available, escape each part)
  if (relationship.referencingAttribute && relationship.referencedAttribute) {
    lines.push(
      `${escapeXml(relationship.referencingAttribute)} → ${escapeXml(relationship.referencedAttribute)}`
    );
  }

  // Join with XML newline character (don't escape the newline entity itself)
  return lines.join('&#xa;');
}

/**
 * Generate swimlane container (parent cell) for entity
 */
function generateSwimlaneContainer(
  id: string,
  entity: Entity,
  x: number,
  y: number,
  height: number,
  color: string
): string {
  // Use cached base style with dynamic values
  const style = `${SWIMLANE_STYLE_BASE};startSize=${HEADER_HEIGHT};fillColor=${color}`;

  return `      <mxCell id="${id}" value="${escapeXml(entity.displayName)}" style="${style}" vertex="1" parent="1">
        <mxGeometry x="${x}" y="${y}" width="${CARD_WIDTH}" height="${height}" as="geometry" />
      </mxCell>`;
}

/**
 * Generate logical name subheader cell
 */
function generateLogicalNameCell(id: string, parentId: string, logicalName: string): string {
  return `      <mxCell id="${id}" value="${escapeXml(logicalName)}" style="${LOGICAL_NAME_STYLE}" vertex="1" parent="${parentId}">
        <mxGeometry y="${HEADER_HEIGHT}" width="${CARD_WIDTH}" height="${SUBHEADER_HEIGHT}" as="geometry" />
      </mxCell>`;
}

/**
 * Generate individual field row cell
 */
function generateFieldCell(
  id: string,
  parentId: string,
  field: EntityAttribute,
  yOffset: number
): string {
  const badge = getAttributeBadge(field);
  const typeLabel = getTypeLabel(field);
  const customSuffix = field.isCustomAttribute ? ' (Custom)' : '';
  const fieldLabel = `[${badge.label}] ${field.displayName}${customSuffix} | ${typeLabel}`;

  // Truncate if too long
  const truncatedLabel = fieldLabel.length > 60 ? fieldLabel.substring(0, 57) + '...' : fieldLabel;

  // Determine background color based on field type
  let fillColor = '#ffffff'; // Standard fields
  if (field.isPrimaryKey) {
    fillColor = '#fef3c7'; // Gold tint for primary keys
  } else if (field.isPrimaryName) {
    fillColor = '#ccfbf1'; // Teal tint for primary name
  } else if (
    field.isLookup ||
    field.type === 'Lookup' ||
    field.type === 'Owner' ||
    field.type === 'Customer'
  ) {
    fillColor = '#fee2e2'; // Pink tint for lookups
  } else if (field.isCustomAttribute) {
    fillColor = '#f0f9ff'; // Blue tint for custom fields
  }

  // Use cached base style with dynamic fillColor
  const style = `${FIELD_STYLE_BASE};fillColor=${fillColor}`;

  return `      <mxCell id="${id}" value="${escapeXml(truncatedLabel)}" style="${style}" vertex="1" parent="${parentId}">
        <mxGeometry y="${yOffset}" width="${CARD_WIDTH}" height="${FIELD_ROW_HEIGHT}" as="geometry" />
      </mxCell>`;
}

/**
 * Generate alternate keys section (returns array of cells)
 */
function generateAlternateKeysSection(
  baseId: string,
  parentId: string,
  alternateKeys: AlternateKey[],
  startYOffset: number
): string[] {
  const cells: string[] = [];
  let currentY = startYOffset;

  // Header cell with cached style
  cells.push(
    `      <mxCell id="${baseId}_ak_header" value="[AK] ALTERNATE KEYS" style="${AK_HEADER_STYLE}" vertex="1" parent="${parentId}">
        <mxGeometry y="${currentY}" width="${CARD_WIDTH}" height="${AK_HEADER_HEIGHT}" as="geometry" />
      </mxCell>`
  );
  currentY += AK_HEADER_HEIGHT;

  // Alternate key rows with cached style
  alternateKeys.forEach((ak, index) => {
    // Format: 🔑 Key Name: attr1, attr2
    const attributesList = ak.keyAttributes.join(', ');
    const akLabel = `🔑 ${ak.displayName}: ${attributesList}`;

    cells.push(
      `      <mxCell id="${baseId}_ak_${index}" value="${escapeXml(akLabel)}" style="${AK_ROW_STYLE}" vertex="1" parent="${parentId}">
        <mxGeometry y="${currentY}" width="${CARD_WIDTH}" height="${AK_ROW_HEIGHT}" as="geometry" />
      </mxCell>`
    );
    currentY += AK_ROW_HEIGHT;
  });

  return cells;
}

/**
 * Generate the Draw.io XML for an entity table with swimlane structure
 * Returns an array of cells (parent + children)
 */
function generateEntityCell(
  id: string,
  entity: Entity,
  x: number,
  y: number,
  color: string,
  selectedFields: Set<string>,
  isCollapsed: boolean,
  primaryKey?: EntityAttribute
): string[] {
  // Calculate dynamic height
  const height = calculateEntityHeight(entity, selectedFields, isCollapsed, primaryKey);

  // Pre-allocate array with estimated size
  const visibleFieldCount = isCollapsed
    ? 0
    : getVisibleFields(entity, selectedFields, primaryKey).length;
  const alternateKeyCount = entity.alternateKeys?.length || 0;
  const estimatedCells =
    2 + visibleFieldCount + (alternateKeyCount > 0 ? alternateKeyCount + 1 : 0);
  const cells: string[] = new Array(estimatedCells);
  let cellIndex = 0;

  // Generate swimlane container (parent)
  cells[cellIndex++] = generateSwimlaneContainer(id, entity, x, y, height, color);

  // Generate logical name subheader
  cells[cellIndex++] = generateLogicalNameCell(`${id}_logical`, id, entity.logicalName);

  // If collapsed, return early (only header + logical name)
  if (isCollapsed) {
    return cells.slice(0, cellIndex); // Trim to actual size
  }

  // Generate field rows
  const visibleFields = getVisibleFields(entity, selectedFields, primaryKey);
  let currentY = HEADER_HEIGHT + SUBHEADER_HEIGHT;

  visibleFields.forEach((field, index) => {
    cells[cellIndex++] = generateFieldCell(`${id}_field_${index}`, id, field, currentY);
    currentY += FIELD_ROW_HEIGHT;
  });

  // Generate alternate keys section if present
  if (entity.alternateKeys && entity.alternateKeys.length > 0) {
    const akCells = generateAlternateKeysSection(id, id, entity.alternateKeys, currentY);
    akCells.forEach((akCell) => {
      cells[cellIndex++] = akCell;
    });
  }

  return cells.slice(0, cellIndex); // Trim to actual size
}

/**
 * Generate the Draw.io XML for a relationship connector with enhanced details
 */
function generateConnectorCell(
  id: string,
  sourceId: string,
  targetId: string,
  relationship: EntityRelationship
): string {
  const label = formatRelationshipLabel(relationship);

  return `      <mxCell id="${id}" value="${label}" style="${CONNECTOR_STYLE}" edge="1" parent="1" source="${sourceId}" target="${targetId}">
        <mxGeometry relative="1" as="geometry" />
      </mxCell>`;
}

/**
 * Generate the complete Draw.io XML document
 */
function generateDrawioXml(options: DrawioExportOptions): string {
  const {
    entities,
    relationships,
    entityPositions,
    selectedFields,
    collapsedEntities,
    colorSettings,
    entityColorOverrides,
    groupNames,
    onProgress,
  } = options;

  // Create primary key lookup map once for O(1) access (performance optimization)
  const primaryKeyMap = createPrimaryKeyMap(entities);

  // Pre-allocate cells array with estimated size
  // Estimate: entities * ~12 cells/entity + relationships * 1 cell
  const estimatedCellCount = entities.length * 12 + relationships.length;
  const cells: string[] = new Array(estimatedCellCount);
  let cellIndex = 0;

  const entityIdMap: Record<string, string> = {};

  // Generate entity cells (now returns arrays of cells)
  entities.forEach((entity, index) => {
    const pos = entityPositions[entity.logicalName];
    if (!pos) return;

    const id = generateId('entity', index);
    entityIdMap[entity.logicalName] = id;

    const defaultColor = entity.isCustomEntity
      ? colorSettings.customTableColor
      : colorSettings.standardTableColor;
    const color = entityColorOverrides?.[entity.logicalName] || defaultColor;

    const entitySelectedFields = selectedFields[entity.logicalName] || new Set<string>();
    const isCollapsed = collapsedEntities.has(entity.logicalName);
    const primaryKey = primaryKeyMap.get(entity.logicalName);

    // Generate entity cells with cached primary key
    const entityCells = generateEntityCell(
      id,
      entity,
      pos.x,
      pos.y,
      color,
      entitySelectedFields,
      isCollapsed,
      primaryKey
    );

    // Add to main cells array
    entityCells.forEach((cell) => {
      cells[cellIndex++] = cell;
    });

    // Report progress per entity (0-80% range for entities)
    if (onProgress && index % 5 === 0) {
      // Report every 5 entities to avoid overhead
      const entityCount = entities.length || 1;
      const progress = Math.floor(((index + 1) / entityCount) * 80);
      onProgress(progress, `Processing entity ${index + 1} of ${entities.length}...`);
    }
  });

  // Generate group label cells above entity clusters
  if (groupNames && entityColorOverrides) {
    const colorToPositions = new Map<string, { x: number; y: number }[]>();
    for (const entity of entities) {
      const color = entityColorOverrides[entity.logicalName];
      if (!color) continue;
      const normalized = color.toLowerCase();
      const name = groupNames[normalized];
      if (!name) continue; // Only add labels for named groups
      const pos = entityPositions[entity.logicalName];
      if (!pos) continue;
      const positions = colorToPositions.get(normalized) || [];
      positions.push({ x: pos.x, y: pos.y });
      colorToPositions.set(normalized, positions);
    }

    let groupIdx = 0;
    for (const [color, positions] of colorToPositions) {
      const name = groupNames[color]!;
      // Calculate bounding box
      const minX = Math.min(...positions.map((p) => p.x));
      const minY = Math.min(...positions.map((p) => p.y));
      const maxX = Math.max(...positions.map((p) => p.x)) + CARD_WIDTH;
      const labelWidth = maxX - minX;
      const labelY = minY - 40;
      const id = generateId('group-label', groupIdx++);

      cells[cellIndex++] =
        `        <mxCell id="${id}" value="${escapeXml(name)}" ` +
        `style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;` +
        `fontStyle=1;fontSize=14;fontColor=${color};spacingLeft=4" ` +
        `vertex="1" parent="1">` +
        `<mxGeometry x="${minX}" y="${labelY}" width="${Math.max(labelWidth, 200)}" height="30" as="geometry" />` +
        `</mxCell>`;
    }
  }

  // Generate connector cells with enhanced relationship details
  relationships.forEach((rel, index) => {
    const sourceId = entityIdMap[rel.from];
    const targetId = entityIdMap[rel.to];

    if (sourceId && targetId) {
      const id = generateId('connector', index);
      cells[cellIndex++] = generateConnectorCell(id, sourceId, targetId, rel);
    }

    // Report progress for relationships (80-95% range)
    if (onProgress && index % 10 === 0) {
      // Report every 10 relationships
      const relationshipCount = relationships.length || 1;
      const progress = 80 + Math.floor(((index + 1) / relationshipCount) * 15);
      onProgress(progress, `Processing relationship ${index + 1} of ${relationships.length}...`);
    }
  });

  // Trim array to actual size and join
  const trimmedCells = cells.slice(0, cellIndex);

  // Report final assembly progress
  if (onProgress) {
    onProgress(95, 'Assembling XML document...');
  }

  // Build the complete XML document
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="Dataverse ERD Visualizer" modified="${new Date().toISOString()}" agent="Dataverse ERD Visualizer" version="1.0">
  <diagram id="erd-diagram" name="ERD Diagram">
    <mxGraphModel dx="0" dy="0" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
${trimmedCells.join('\n')}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

  return xml;
}

/**
 * Export ERD to Draw.io format
 */
export async function exportToDrawio(options: DrawioExportOptions): Promise<Blob> {
  const { onProgress } = options;

  onProgress?.(0, 'Initializing Draw.io export...');

  // generateDrawioXml handles progress reporting from 0-95%
  const xml = generateDrawioXml(options);

  onProgress?.(100, 'Export complete!');

  const blob = new Blob([xml], { type: 'application/xml' });

  return blob;
}

/**
 * Download Draw.io file
 */
export function downloadDrawio(blob: Blob, filename = 'dataverse-erd.drawio'): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
