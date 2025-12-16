/**
 * Export utilities for ERD diagrams
 */

import type { Entity, EntityRelationship, EntityPosition } from '@/types';
import type { ColorSettings } from '../types';
import { MERMAID_TYPE_MAP, getFieldTypeColor } from '../types';

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
 * Copy diagram to clipboard as PNG
 */
export async function copyToClipboardAsPNG(options: ExportOptions): Promise<void> {
  const {
    entities,
    relationships,
    entityPositions,
    isDarkMode,
    colorSettings,
  } = options;

  const { customTableColor, standardTableColor } = colorSettings;

  // Create a temporary canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }

  // Calculate bounds
  const positions = Object.values(entityPositions);
  if (positions.length === 0) {
    throw new Error('No entities to export');
  }

  const minX = Math.min(...positions.map(p => p.x)) - 50;
  const maxX = Math.max(...positions.map(p => p.x)) + 350;
  const minY = Math.min(...positions.map(p => p.y)) - 50;
  const maxY = Math.max(...positions.map(p => p.y)) + 400;

  const width = maxX - minX;
  const height = maxY - minY;

  canvas.width = width;
  canvas.height = height;

  // Background
  ctx.fillStyle = isDarkMode ? '#1a1a1a' : '#f0f0f0';
  ctx.fillRect(0, 0, width, height);

  // Draw relationships
  ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
  ctx.lineWidth = 2;
  relationships.forEach(rel => {
    const fromPos = entityPositions[rel.from];
    const toPos = entityPositions[rel.to];
    if (!fromPos || !toPos) return;

    const startX = fromPos.x + 300 - minX;
    const startY = fromPos.y + 50 - minY;
    const endX = toPos.x - minX;
    const endY = toPos.y + 50 - minY;
    const midX = (startX + endX) / 2;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(midX, startY);
    ctx.lineTo(midX, endY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  });

  // Draw entities
  ctx.font = '600 15px system-ui';
  entities.forEach(entity => {
    const pos = entityPositions[entity.logicalName];
    if (!pos) return;

    const x = pos.x - minX;
    const y = pos.y - minY;
    const tableColor = entity.isCustomEntity ? customTableColor : standardTableColor;

    // Card background
    ctx.fillStyle = isDarkMode ? '#2d2d2d' : '#ffffff';
    ctx.fillRect(x, y, 300, 80);

    // Card border
    ctx.strokeStyle = tableColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 300, 80);

    // Header background
    ctx.fillStyle = tableColor;
    ctx.fillRect(x, y, 300, 60);

    // Display name
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 15px system-ui';
    ctx.fillText(entity.displayName, x + 12, y + 25);

    // Logical name
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(entity.logicalName, x + 12, y + 45);
  });

  // Convert to blob and copy to clipboard
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Failed to create image'));
        return;
      }
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
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
  entities.forEach(entity => {
    const entitySelectedFields = selectedFields[entity.logicalName] || new Set();
    const visibleFields = entity.attributes.filter(attr =>
      entitySelectedFields.has(attr.name) || attr.isPrimaryKey
    );

    if (visibleFields.length > 0) {
      mermaid += `    ${entity.logicalName} {\n`;
      visibleFields.forEach(attr => {
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
    'N:N': '}o--o{'
  };

  relationships.forEach(rel => {
    const mermaidRel = relTypeMapping[rel.type] || '||--||';
    mermaid += `    ${rel.from} ${mermaidRel} ${rel.to} : "${rel.schemaName}"\n`;
  });

  return mermaid;
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
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");

  // Calculate bounds
  const positions = Object.values(entityPositions);
  if (positions.length === 0) return '';

  const minX = Math.min(...positions.map(p => p.x)) - 50;
  const maxX = Math.max(...positions.map(p => p.x)) + 350;
  const minY = Math.min(...positions.map(p => p.y)) - 50;
  const maxY = Math.max(...positions.map(p => p.y)) + 400;

  const width = maxX - minX;
  const height = maxY - minY;

  svg.setAttribute("width", width.toString());
  svg.setAttribute("height", height.toString());
  svg.setAttribute("viewBox", `${minX} ${minY} ${width} ${height}`);
  svg.setAttribute("xmlns", svgNS);

  // Add background
  const bg = document.createElementNS(svgNS, "rect");
  bg.setAttribute("x", minX.toString());
  bg.setAttribute("y", minY.toString());
  bg.setAttribute("width", width.toString());
  bg.setAttribute("height", height.toString());
  bg.setAttribute("fill", isDarkMode ? "#1a1a1a" : "#f0f0f0");
  svg.appendChild(bg);

  // Draw relationships
  relationships.forEach(rel => {
    const fromPos = entityPositions[rel.from];
    const toPos = entityPositions[rel.to];
    if (!fromPos || !toPos) return;

    const startX = fromPos.x + 300;
    const startY = fromPos.y + 50;
    const endX = toPos.x;
    const endY = toPos.y + 50;
    const midX = (startX + endX) / 2;

    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)");
    path.setAttribute("stroke-width", "2");
    svg.appendChild(path);

    const circle1 = document.createElementNS(svgNS, "circle");
    circle1.setAttribute("cx", startX.toString());
    circle1.setAttribute("cy", startY.toString());
    circle1.setAttribute("r", "4");
    circle1.setAttribute("fill", isDarkMode ? "#60a5fa" : "#2563eb");
    svg.appendChild(circle1);

    const circle2 = document.createElementNS(svgNS, "circle");
    circle2.setAttribute("cx", endX.toString());
    circle2.setAttribute("cy", endY.toString());
    circle2.setAttribute("r", "4");
    circle2.setAttribute("fill", isDarkMode ? "#60a5fa" : "#2563eb");
    svg.appendChild(circle2);

    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", midX.toString());
    text.setAttribute("y", (Math.min(startY, endY) + Math.abs(endY - startY) / 2 - 8).toString());
    text.setAttribute("fill", isDarkMode ? "#94a3b8" : "#64748b");
    text.setAttribute("font-size", "11");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-weight", "600");
    text.textContent = rel.type;
    svg.appendChild(text);
  });

  // Draw entities
  entities.forEach(entity => {
    const pos = entityPositions[entity.logicalName];
    if (!pos) return;

    const isCustom = entity.isCustomEntity;
    const tableColor = isCustom ? customTableColor : standardTableColor;
    const entitySelectedFields = selectedFields[entity.logicalName] || new Set();
    const isCollapsed = collapsedEntities.has(entity.logicalName);

    // Entity card background
    const cardHeight = isCollapsed || entitySelectedFields.size === 0 ? 80 : 80 + 40 + (entitySelectedFields.size * 40);
    const rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("x", pos.x.toString());
    rect.setAttribute("y", pos.y.toString());
    rect.setAttribute("width", "300");
    rect.setAttribute("height", cardHeight.toString());
    rect.setAttribute("fill", isDarkMode ? "#2d2d2d" : "#ffffff");
    rect.setAttribute("stroke", tableColor);
    rect.setAttribute("stroke-width", "2");
    rect.setAttribute("rx", "6");
    svg.appendChild(rect);

    // Header background
    const header = document.createElementNS(svgNS, "rect");
    header.setAttribute("x", pos.x.toString());
    header.setAttribute("y", pos.y.toString());
    header.setAttribute("width", "300");
    header.setAttribute("height", "60");
    header.setAttribute("fill", tableColor);
    header.setAttribute("rx", "6");
    svg.appendChild(header);

    // Display name
    const displayNameText = document.createElementNS(svgNS, "text");
    displayNameText.setAttribute("x", (pos.x + 12).toString());
    displayNameText.setAttribute("y", (pos.y + 25).toString());
    displayNameText.setAttribute("fill", "#ffffff");
    displayNameText.setAttribute("font-size", "15");
    displayNameText.setAttribute("font-weight", "600");
    displayNameText.textContent = entity.displayName;
    svg.appendChild(displayNameText);

    // Logical name
    const logicalNameText = document.createElementNS(svgNS, "text");
    logicalNameText.setAttribute("x", (pos.x + 12).toString());
    logicalNameText.setAttribute("y", (pos.y + 45).toString());
    logicalNameText.setAttribute("fill", "rgba(255, 255, 255, 0.8)");
    logicalNameText.setAttribute("font-size", "11");
    logicalNameText.setAttribute("font-family", "monospace");
    logicalNameText.textContent = entity.logicalName;
    svg.appendChild(logicalNameText);

    // Fields
    if (!isCollapsed && entitySelectedFields.size > 0) {
      const fieldsTitle = document.createElementNS(svgNS, "text");
      fieldsTitle.setAttribute("x", (pos.x + 12).toString());
      fieldsTitle.setAttribute("y", (pos.y + 85).toString());
      fieldsTitle.setAttribute("fill", isDarkMode ? "#94a3b8" : "#64748b");
      fieldsTitle.setAttribute("font-size", "10");
      fieldsTitle.setAttribute("font-weight", "600");
      fieldsTitle.textContent = `ATTRIBUTES (${entitySelectedFields.size})`;
      svg.appendChild(fieldsTitle);

      let yOffset = pos.y + 105;
      entity.attributes.filter(attr => entitySelectedFields.has(attr.name)).forEach(attr => {
        const fieldBg = document.createElementNS(svgNS, "rect");
        fieldBg.setAttribute("x", (pos.x + 12).toString());
        fieldBg.setAttribute("y", yOffset.toString());
        fieldBg.setAttribute("width", "276");
        fieldBg.setAttribute("height", "35");
        fieldBg.setAttribute("fill", isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)");
        fieldBg.setAttribute("stroke", isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)");
        fieldBg.setAttribute("rx", "3");
        svg.appendChild(fieldBg);

        const displayName = document.createElementNS(svgNS, "text");
        displayName.setAttribute("x", (pos.x + 20).toString());
        displayName.setAttribute("y", (yOffset + 15).toString());
        displayName.setAttribute("fill", isDarkMode ? "#e2e8f0" : "#1e293b");
        displayName.setAttribute("font-size", "11");
        displayName.setAttribute("font-weight", "500");
        displayName.textContent = attr.displayName;
        svg.appendChild(displayName);

        const technicalName = document.createElementNS(svgNS, "text");
        technicalName.setAttribute("x", (pos.x + 20).toString());
        technicalName.setAttribute("y", (yOffset + 28).toString());
        technicalName.setAttribute("fill", isDarkMode ? "#94a3b8" : "#64748b");
        technicalName.setAttribute("font-size", "9");
        technicalName.setAttribute("font-family", "monospace");
        technicalName.textContent = attr.name;
        svg.appendChild(technicalName);

        const typeBadge = document.createElementNS(svgNS, "rect");
        typeBadge.setAttribute("x", (pos.x + 230).toString());
        typeBadge.setAttribute("y", (yOffset + 12).toString());
        typeBadge.setAttribute("width", "50");
        typeBadge.setAttribute("height", "14");
        typeBadge.setAttribute("fill", getFieldTypeColor(attr.type, lookupColor));
        typeBadge.setAttribute("rx", "3");
        svg.appendChild(typeBadge);

        const typeText = document.createElementNS(svgNS, "text");
        typeText.setAttribute("x", (pos.x + 255).toString());
        typeText.setAttribute("y", (yOffset + 22).toString());
        typeText.setAttribute("fill", "#ffffff");
        typeText.setAttribute("font-size", "9");
        typeText.setAttribute("font-weight", "600");
        typeText.setAttribute("text-anchor", "middle");
        typeText.textContent = attr.type.toUpperCase();
        svg.appendChild(typeText);

        yOffset += 40;
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
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
