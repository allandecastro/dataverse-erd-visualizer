/**
 * VSDX (Visio) Export Utility
 *
 * Creates a valid VSDX file from ERD entities and relationships.
 * VSDX is an Office Open XML format (ZIP containing XML files).
 */

import JSZip from 'jszip';
import type { Entity, EntityRelationship, EntityPosition } from '@/types';
import type { ColorSettings } from '../types';

export interface VisioExportOptions {
  entities: Entity[];
  relationships: EntityRelationship[];
  entityPositions: Record<string, EntityPosition>;
  selectedFields: Record<string, Set<string>>;
  collapsedEntities: Set<string>;
  colorSettings: ColorSettings;
  onProgress?: (progress: number, message: string) => void;
}

// Visio uses inches, we need to convert from pixels
// Standard screen is 96 DPI
const PIXELS_TO_INCHES = 1 / 96;
const CARD_WIDTH_INCHES = 2.0;
const CARD_HEIGHT_INCHES = 0.8;

/**
 * Convert hex color to Visio RGB format (#RRGGBB)
 */
function hexToVisioRgb(hex: string): string {
  // Remove # if present and ensure uppercase
  return hex.replace('#', '#').toUpperCase();
}

/**
 * Generate [Content_Types].xml
 */
function generateContentTypes(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/visio/document.xml" ContentType="application/vnd.ms-visio.drawing.main+xml"/>
  <Override PartName="/visio/pages/pages.xml" ContentType="application/vnd.ms-visio.pages+xml"/>
  <Override PartName="/visio/pages/page1.xml" ContentType="application/vnd.ms-visio.page+xml"/>
  <Override PartName="/visio/windows.xml" ContentType="application/vnd.ms-visio.windows+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;
}

/**
 * Generate _rels/.rels
 */
function generateRootRels(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.microsoft.com/visio/2010/relationships/document" Target="visio/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
}

/**
 * Generate docProps/core.xml
 */
function generateCoreProps(): string {
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Dataverse ERD</dc:title>
  <dc:creator>Dataverse ERD Visualizer</dc:creator>
  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`;
}

/**
 * Generate docProps/app.xml
 */
function generateAppProps(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>Dataverse ERD Visualizer</Application>
  <AppVersion>1.0</AppVersion>
</Properties>`;
}

/**
 * Generate visio/document.xml
 */
function generateDocument(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<VisioDocument xmlns="http://schemas.microsoft.com/office/visio/2012/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <DocumentSettings TopPage="0" DefaultTextStyle="0" DefaultLineStyle="0" DefaultFillStyle="0">
    <GlueSettings>9</GlueSettings>
    <SnapSettings>65847</SnapSettings>
    <SnapExtensions>34</SnapExtensions>
  </DocumentSettings>
  <StyleSheets>
    <StyleSheet ID="0" Name="Normal">
      <Cell N="LineWeight" V="0.01"/>
      <Cell N="LineColor" V="#000000"/>
      <Cell N="LinePattern" V="1"/>
      <Cell N="FillForegnd" V="#FFFFFF"/>
      <Cell N="FillPattern" V="1"/>
    </StyleSheet>
  </StyleSheets>
</VisioDocument>`;
}

/**
 * Generate visio/_rels/document.xml.rels
 */
function generateDocumentRels(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.microsoft.com/visio/2010/relationships/pages" Target="pages/pages.xml"/>
  <Relationship Id="rId2" Type="http://schemas.microsoft.com/visio/2010/relationships/windows" Target="windows.xml"/>
</Relationships>`;
}

/**
 * Generate visio/windows.xml
 */
function generateWindows(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Windows xmlns="http://schemas.microsoft.com/office/visio/2012/main">
  <Window ID="0" WindowType="Drawing" WindowState="1073741824" WindowLeft="0" WindowTop="0" WindowWidth="1920" WindowHeight="1080" ContainerType="Page" Page="0">
    <ShowRulers>1</ShowRulers>
    <ShowGrid>1</ShowGrid>
    <ShowPageBreaks>0</ShowPageBreaks>
    <ShowGuides>1</ShowGuides>
    <ShowConnectionPoints>1</ShowConnectionPoints>
    <GlueSettings>9</GlueSettings>
    <SnapSettings>65847</SnapSettings>
    <SnapExtensions>34</SnapExtensions>
  </Window>
</Windows>`;
}

/**
 * Generate visio/pages/pages.xml
 */
function generatePages(pageWidth: number, pageHeight: number): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Pages xmlns="http://schemas.microsoft.com/office/visio/2012/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <Page ID="0" Name="ERD Diagram" ViewScale="1" ViewCenterX="${pageWidth / 2}" ViewCenterY="${pageHeight / 2}">
    <PageSheet>
      <Cell N="PageWidth" V="${pageWidth}"/>
      <Cell N="PageHeight" V="${pageHeight}"/>
      <Cell N="PageScale" V="1"/>
      <Cell N="DrawingScale" V="1"/>
      <Cell N="DrawingScaleType" V="0"/>
      <Cell N="DrawingSizeType" V="1"/>
    </PageSheet>
    <Rel r:id="rId1"/>
  </Page>
</Pages>`;
}

/**
 * Generate visio/pages/_rels/pages.xml.rels
 */
function generatePagesRels(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.microsoft.com/visio/2010/relationships/page" Target="page1.xml"/>
</Relationships>`;
}

/**
 * Generate a simple rectangle shape for an entity table
 */
function generateTableShape(
  id: number,
  entity: Entity,
  x: number, // center X in inches
  y: number, // center Y in inches
  color: string
): string {
  const width = CARD_WIDTH_INCHES;
  const height = CARD_HEIGHT_INCHES;
  const visioColor = hexToVisioRgb(color);

  return `
    <Shape ID="${id}" Type="Shape" Name="${entity.logicalName}" NameU="${entity.logicalName}" LineStyle="0" FillStyle="0" TextStyle="0">
      <Cell N="PinX" V="${x}"/>
      <Cell N="PinY" V="${y}"/>
      <Cell N="Width" V="${width}"/>
      <Cell N="Height" V="${height}"/>
      <Cell N="LocPinX" V="${width / 2}"/>
      <Cell N="LocPinY" V="${height / 2}"/>
      <Cell N="Angle" V="0"/>
      <Cell N="FillForegnd" V="${visioColor}"/>
      <Cell N="FillBkgnd" V="#FFFFFF"/>
      <Cell N="FillPattern" V="1"/>
      <Cell N="LineWeight" V="0.02"/>
      <Cell N="LineColor" V="#000000"/>
      <Cell N="LinePattern" V="1"/>
      <Cell N="Rounding" V="0.05"/>
      <Section N="Geometry" IX="0">
        <Cell N="NoFill" V="0"/>
        <Cell N="NoLine" V="0"/>
        <Row T="RelMoveTo" IX="1">
          <Cell N="X" V="0"/>
          <Cell N="Y" V="0"/>
        </Row>
        <Row T="RelLineTo" IX="2">
          <Cell N="X" V="1"/>
          <Cell N="Y" V="0"/>
        </Row>
        <Row T="RelLineTo" IX="3">
          <Cell N="X" V="1"/>
          <Cell N="Y" V="1"/>
        </Row>
        <Row T="RelLineTo" IX="4">
          <Cell N="X" V="0"/>
          <Cell N="Y" V="1"/>
        </Row>
        <Row T="RelLineTo" IX="5">
          <Cell N="X" V="0"/>
          <Cell N="Y" V="0"/>
        </Row>
      </Section>
      <Section N="Character" IX="0">
        <Row IX="0">
          <Cell N="Font" V="Calibri"/>
          <Cell N="Color" V="#FFFFFF"/>
          <Cell N="Size" V="0.125"/>
          <Cell N="Style" V="1"/>
        </Row>
      </Section>
      <Text>${entity.displayName}</Text>
    </Shape>`;
}

/**
 * Generate a connector line between two shapes using simple polyline geometry
 */
function generateConnector(
  id: number,
  rel: EntityRelationship,
  _fromShapeId: number,
  _toShapeId: number,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): string {
  // Determine which side to connect based on relative positions
  const fromIsLeft = fromX < toX;

  // Calculate actual connection points at the edge of each shape
  const startX = fromIsLeft ? fromX + CARD_WIDTH_INCHES / 2 : fromX - CARD_WIDTH_INCHES / 2;
  const startY = fromY;
  const endX = fromIsLeft ? toX - CARD_WIDTH_INCHES / 2 : toX + CARD_WIDTH_INCHES / 2;
  const endY = toY;

  // Cardinality text for display
  const cardinalityText = rel.type;

  // Calculate bounding box
  const minX = Math.min(startX, endX);
  const minY = Math.min(startY, endY);
  const maxX = Math.max(startX, endX);
  const maxY = Math.max(startY, endY);

  const width = maxX - minX || 0.1; // Ensure minimum width
  const height = maxY - minY || 0.1; // Ensure minimum height

  // Pin at center of bounding box
  const pinX = (minX + maxX) / 2;
  const pinY = (minY + maxY) / 2;

  // Local coordinates relative to bottom-left of bounding box
  // Shape origin is at (PinX - LocPinX, PinY - LocPinY) = (minX, minY)
  const localStartX = startX - minX;
  const localStartY = startY - minY;
  const localEndX = endX - minX;
  const localEndY = endY - minY;

  return `
    <Shape ID="${id}" Type="Shape" Name="Connector_${rel.schemaName}" NameU="Connector_${rel.schemaName}">
      <Cell N="PinX" V="${pinX}"/>
      <Cell N="PinY" V="${pinY}"/>
      <Cell N="Width" V="${width}"/>
      <Cell N="Height" V="${height}"/>
      <Cell N="LocPinX" V="${width / 2}"/>
      <Cell N="LocPinY" V="${height / 2}"/>
      <Cell N="Angle" V="0"/>
      <Cell N="LineWeight" V="0.02"/>
      <Cell N="LineColor" V="#000000"/>
      <Cell N="LinePattern" V="1"/>
      <Cell N="LineCap" V="1"/>
      <Cell N="EndArrow" V="4"/>
      <Cell N="EndArrowSize" V="2"/>
      <Section N="Geometry" IX="0">
        <Cell N="NoFill" V="1"/>
        <Cell N="NoLine" V="0"/>
        <Cell N="NoShow" V="0"/>
        <Row T="MoveTo" IX="1">
          <Cell N="X" V="${localStartX}"/>
          <Cell N="Y" V="${localStartY}"/>
        </Row>
        <Row T="LineTo" IX="2">
          <Cell N="X" V="${localEndX}"/>
          <Cell N="Y" V="${localEndY}"/>
        </Row>
      </Section>
      <Text>${cardinalityText}</Text>
    </Shape>`;
}

/**
 * Generate visio/pages/page1.xml with all shapes
 */
function generatePage(options: VisioExportOptions): { xml: string; pageWidth: number; pageHeight: number } {
  const {
    entities,
    relationships,
    entityPositions,
    colorSettings,
  } = options;

  // Calculate bounds from entity positions
  const positions = Object.entries(entityPositions)
    .filter(([name]) => entities.some(e => e.logicalName === name))
    .map(([, pos]) => pos);

  if (positions.length === 0) {
    return {
      xml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<PageContents xmlns="http://schemas.microsoft.com/office/visio/2012/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <Shapes/>
</PageContents>`,
      pageWidth: 11,
      pageHeight: 8.5
    };
  }

  // Find bounds
  const minX = Math.min(...positions.map(p => p.x));
  const maxX = Math.max(...positions.map(p => p.x));
  const minY = Math.min(...positions.map(p => p.y));
  const maxY = Math.max(...positions.map(p => p.y));

  // Convert to inches and add padding
  const padding = 2; // inches
  const contentWidth = (maxX - minX) * PIXELS_TO_INCHES + CARD_WIDTH_INCHES;
  const contentHeight = (maxY - minY) * PIXELS_TO_INCHES + CARD_HEIGHT_INCHES;

  const pageWidth = Math.max(11, contentWidth + padding * 2);
  const pageHeight = Math.max(8.5, contentHeight + padding * 2);

  // Create mapping of entity name to shape ID
  const entityToShapeId: Record<string, number> = {};
  const entityToPosition: Record<string, { x: number; y: number }> = {};

  let shapeId = 1;
  const shapes: string[] = [];

  // Generate table shapes
  entities.forEach(entity => {
    const pos = entityPositions[entity.logicalName];
    if (!pos) return;

    const tableColor = entity.isCustomEntity
      ? colorSettings.customTableColor
      : colorSettings.standardTableColor;

    // Convert pixel position to Visio inches
    // Visio Y-axis goes up, our canvas Y goes down
    const x = (pos.x - minX) * PIXELS_TO_INCHES + padding + CARD_WIDTH_INCHES / 2;
    const y = pageHeight - ((pos.y - minY) * PIXELS_TO_INCHES + padding + CARD_HEIGHT_INCHES / 2);

    entityToShapeId[entity.logicalName] = shapeId;
    entityToPosition[entity.logicalName] = { x, y };

    shapes.push(generateTableShape(shapeId, entity, x, y, tableColor));
    shapeId++;
  });

  // Generate connector shapes for relationships
  relationships.forEach(rel => {
    const fromShapeId = entityToShapeId[rel.from];
    const toShapeId = entityToShapeId[rel.to];
    const fromPos = entityToPosition[rel.from];
    const toPos = entityToPosition[rel.to];

    if (fromShapeId && toShapeId && fromPos && toPos) {
      shapes.push(generateConnector(
        shapeId,
        rel,
        fromShapeId,
        toShapeId,
        fromPos.x,
        fromPos.y,
        toPos.x,
        toPos.y
      ));
      shapeId++;
    }
  });

  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<PageContents xmlns="http://schemas.microsoft.com/office/visio/2012/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <Shapes>
${shapes.join('\n')}
  </Shapes>
</PageContents>`;

  return { xml, pageWidth, pageHeight };
}

/**
 * Export ERD to VSDX format
 */
export async function exportToVSDX(options: VisioExportOptions): Promise<Blob> {
  const { onProgress } = options;

  onProgress?.(0, 'Initializing VSDX export...');

  const zip = new JSZip();

  // Generate page content first to get dimensions
  onProgress?.(20, 'Generating shapes...');
  const { xml: pageXml, pageWidth, pageHeight } = generatePage(options);

  // Add required files
  onProgress?.(40, 'Building document structure...');

  // Root files
  zip.file('[Content_Types].xml', generateContentTypes());
  zip.folder('_rels')?.file('.rels', generateRootRels());

  // Document properties
  onProgress?.(50, 'Adding document properties...');
  const docProps = zip.folder('docProps');
  docProps?.file('core.xml', generateCoreProps());
  docProps?.file('app.xml', generateAppProps());

  // Visio document
  onProgress?.(60, 'Creating Visio document...');
  const visio = zip.folder('visio');
  visio?.file('document.xml', generateDocument());
  visio?.file('windows.xml', generateWindows());
  visio?.folder('_rels')?.file('document.xml.rels', generateDocumentRels());

  // Pages
  onProgress?.(70, 'Adding pages...');
  const pages = visio?.folder('pages');
  pages?.file('pages.xml', generatePages(pageWidth, pageHeight));
  pages?.folder('_rels')?.file('pages.xml.rels', generatePagesRels());
  pages?.file('page1.xml', pageXml);

  // Generate the ZIP file
  onProgress?.(90, 'Compressing VSDX file...');
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
    mimeType: 'application/vnd.ms-visio.drawing'
  });

  onProgress?.(100, 'Export complete!');

  return blob;
}

/**
 * Download VSDX file
 */
export function downloadVSDX(blob: Blob, filename = 'dataverse-erd.vsdx'): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
