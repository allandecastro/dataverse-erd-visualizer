/**
 * SVG Relationship lines component
 */

import type { Entity, EntityRelationship, EntityPosition } from '@/types';

export interface RelationshipLinesProps {
  relationships: EntityRelationship[];
  entities: Entity[];
  entityPositions: Record<string, EntityPosition>;
  selectedFields: Record<string, Set<string>>;
  collapsedEntities: Set<string>;
  isDarkMode: boolean;
  lookupColor: string;
}

export function RelationshipLines({
  relationships,
  entities,
  entityPositions,
  selectedFields,
  collapsedEntities,
  isDarkMode,
  lookupColor,
}: RelationshipLinesProps) {
  const drawRelationship = (rel: EntityRelationship) => {
    const fromEntity = entities.find(e => e.logicalName === rel.from);
    const toEntity = entities.find(e => e.logicalName === rel.to);
    const fromPos = entityPositions[rel.from] || { x: 0, y: 0 };
    const toPos = entityPositions[rel.to] || { x: 0, y: 0 };

    if (!fromEntity || !toEntity) return null;

    // Find the lookup field that creates this relationship
    const lookupField = fromEntity.attributes.find(attr =>
      (attr.type === 'Lookup' || attr.type === 'Owner') &&
      rel.schemaName.toLowerCase().includes(attr.name.toLowerCase())
    );

    // Calculate vertical position based on field position in the list
    let startY = fromPos.y + 50; // Default to header middle

    if (lookupField) {
      const fromSelectedFields = selectedFields[rel.from] || new Set();
      const visibleFields = fromEntity.attributes.filter(attr =>
        fromSelectedFields.has(attr.name) || attr.isPrimaryKey
      );
      const fieldIndex = visibleFields.findIndex(attr => attr.name === lookupField.name);

      if (fieldIndex >= 0 && !collapsedEntities.has(rel.from)) {
        // Header (60px) + Attributes title (30px) + field offset
        startY = fromPos.y + 60 + 30 + (fieldIndex * 44) + 22; // 22 = half of field height
      }
    }

    // Target is always the primary key (first field in the list)
    let endY = toPos.y + 50; // Default to header middle

    if (!collapsedEntities.has(rel.to)) {
      // Header (60px) + Attributes title (30px) + first field (22px = half height)
      endY = toPos.y + 60 + 30 + 22;
    }

    // Start from right edge of source entity
    const startX = fromPos.x + 300;

    // End at left edge of target entity
    const endX = toPos.x;

    const midX = (startX + endX) / 2;

    return (
      <g key={`${rel.from}-${rel.to}-${rel.schemaName}`}>
        <path
          d={`M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`}
          fill="none"
          stroke={isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}
          strokeWidth="2"
        />
        <circle cx={startX} cy={startY} r="4" fill={lookupColor} />
        <circle cx={endX} cy={endY} r="4" fill="#fbbf24" />
        <text
          x={midX}
          y={Math.min(startY, endY) + Math.abs(endY - startY) / 2 - 8}
          fill={isDarkMode ? '#94a3b8' : '#64748b'}
          fontSize="11"
          textAnchor="middle"
          fontWeight="600"
        >
          {rel.type}
        </text>
      </g>
    );
  };

  return (
    <svg style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '5000px',
      height: '5000px',
      pointerEvents: 'none',
      zIndex: 1
    }}>
      {relationships.map(drawRelationship)}
    </svg>
  );
}
