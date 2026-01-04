/**
 * Draw.io Export Utility
 *
 * Creates a Draw.io (.drawio) file from ERD entities and relationships.
 * Draw.io format is well-documented XML that can be:
 * - Opened directly in draw.io (free, web-based)
 * - Imported into Microsoft Visio
 * - Opened in VS Code with Draw.io extension
 */

import type { Entity, EntityRelationship, EntityPosition } from '@/types';
import type { ColorSettings } from '@/types/erdTypes';

export interface DrawioExportOptions {
  entities: Entity[];
  relationships: EntityRelationship[];
  entityPositions: Record<string, EntityPosition>;
  selectedFields: Record<string, Set<string>>;
  collapsedEntities: Set<string>;
  colorSettings: ColorSettings;
  onProgress?: (progress: number, message: string) => void;
}

// Constants for shape sizing
const CARD_WIDTH = 200;
const CARD_HEIGHT = 80;

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate a unique ID for Draw.io cells
 */
function generateId(prefix: string, index: number): string {
  return `${prefix}_${index}`;
}

/**
 * Generate the Draw.io XML for an entity table
 */
function generateEntityCell(
  id: string,
  entity: Entity,
  x: number,
  y: number,
  color: string
): string {
  const style = [
    'rounded=1',
    'whiteSpace=wrap',
    'html=1',
    `fillColor=${color}`,
    'fontColor=#ffffff',
    'strokeColor=#333333',
    'strokeWidth=2',
    'fontStyle=1',
    'fontSize=14',
  ].join(';');

  return `      <mxCell id="${id}" value="${escapeXml(entity.displayName)}" style="${style}" vertex="1" parent="1">
        <mxGeometry x="${x}" y="${y}" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" as="geometry" />
      </mxCell>`;
}

/**
 * Generate the Draw.io XML for a relationship connector
 */
function generateConnectorCell(
  id: string,
  sourceId: string,
  targetId: string,
  label: string
): string {
  const style = [
    'edgeStyle=orthogonalEdgeStyle',
    'rounded=1',
    'orthogonalLoop=1',
    'jettySize=auto',
    'html=1',
    'strokeColor=#333333',
    'strokeWidth=2',
    'endArrow=classic',
    'endFill=1',
    'fontSize=11',
    'fontColor=#333333',
    'labelBackgroundColor=#ffffff',
  ].join(';');

  return `      <mxCell id="${id}" value="${escapeXml(label)}" style="${style}" edge="1" parent="1" source="${sourceId}" target="${targetId}">
        <mxGeometry relative="1" as="geometry" />
      </mxCell>`;
}

/**
 * Generate the complete Draw.io XML document
 */
function generateDrawioXml(options: DrawioExportOptions): string {
  const { entities, relationships, entityPositions, colorSettings } = options;

  const cells: string[] = [];
  const entityIdMap: Record<string, string> = {};

  // Generate entity cells
  entities.forEach((entity, index) => {
    const pos = entityPositions[entity.logicalName];
    if (!pos) return;

    const id = generateId('entity', index);
    entityIdMap[entity.logicalName] = id;

    const color = entity.isCustomEntity
      ? colorSettings.customTableColor
      : colorSettings.standardTableColor;

    cells.push(generateEntityCell(id, entity, pos.x, pos.y, color));
  });

  // Generate connector cells
  relationships.forEach((rel, index) => {
    const sourceId = entityIdMap[rel.from];
    const targetId = entityIdMap[rel.to];

    if (sourceId && targetId) {
      const id = generateId('connector', index);
      cells.push(generateConnectorCell(id, sourceId, targetId, rel.type));
    }
  });

  // Build the complete XML document
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="Dataverse ERD Visualizer" modified="${new Date().toISOString()}" agent="Dataverse ERD Visualizer" version="1.0">
  <diagram id="erd-diagram" name="ERD Diagram">
    <mxGraphModel dx="0" dy="0" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
${cells.join('\n')}
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

  onProgress?.(30, 'Generating entity shapes...');

  onProgress?.(60, 'Creating connectors...');

  const xml = generateDrawioXml(options);

  onProgress?.(90, 'Finalizing...');

  const blob = new Blob([xml], { type: 'application/xml' });

  onProgress?.(100, 'Export complete!');

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
