/**
 * SVG Relationship lines component with curved bezier paths and cardinality labels
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

// Constants for entity card dimensions
const CARD_WIDTH = 300;
const HEADER_HEIGHT = 60;
const ATTRIBUTES_TITLE_HEIGHT = 30;
const FIELD_HEIGHT = 44;
const FIELD_HALF_HEIGHT = 22;

// Cardinality symbol mappings
const CARDINALITY_SYMBOLS: Record<string, { from: string; to: string }> = {
  'N:1': { from: 'N', to: '1' },
  '1:N': { from: '1', to: 'N' },
  'N:N': { from: 'N', to: 'N' },
};

export function RelationshipLines({
  relationships,
  entities,
  entityPositions,
  selectedFields,
  collapsedEntities,
  isDarkMode,
  lookupColor,
}: RelationshipLinesProps) {

  /**
   * Calculate connection point for an entity
   */
  const getConnectionPoint = (
    entityName: string,
    pos: EntityPosition,
    fieldName: string | undefined,
    side: 'left' | 'right'
  ): { x: number; y: number } => {
    const entity = entities.find(e => e.logicalName === entityName);
    const x = side === 'left' ? pos.x : pos.x + CARD_WIDTH;

    // Default to header middle
    let y = pos.y + HEADER_HEIGHT / 2;

    if (entity && fieldName && !collapsedEntities.has(entityName)) {
      const entitySelectedFields = selectedFields[entityName] || new Set();
      const visibleFields = entity.attributes.filter(attr =>
        entitySelectedFields.has(attr.name) || attr.isPrimaryKey
      );
      const fieldIndex = visibleFields.findIndex(attr => attr.name === fieldName);

      if (fieldIndex >= 0) {
        // Header + Attributes title + field offset
        y = pos.y + HEADER_HEIGHT + ATTRIBUTES_TITLE_HEIGHT + (fieldIndex * FIELD_HEIGHT) + FIELD_HALF_HEIGHT;
      }
    }

    return { x, y };
  };

  /**
   * Generate a smooth cubic bezier curve path between two points
   */
  const generateBezierPath = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ): string => {
    const dx = end.x - start.x;

    // Calculate control point offsets based on distance
    const curveStrength = Math.min(Math.abs(dx) * 0.4, 100);

    // Control points for smooth S-curve
    const cp1x = start.x + curveStrength;
    const cp1y = start.y;
    const cp2x = end.x - curveStrength;
    const cp2y = end.y;

    return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
  };

  /**
   * Draw cardinality marker (crow's foot style)
   */
  const drawCardinalityMarker = (
    x: number,
    y: number,
    type: 'one' | 'many',
    direction: 'left' | 'right',
    color: string
  ) => {
    const offset = direction === 'left' ? -1 : 1;
    const markerSize = 8;

    if (type === 'one') {
      // Single line for "1"
      return (
        <line
          x1={x + offset * 10}
          y1={y - markerSize}
          x2={x + offset * 10}
          y2={y + markerSize}
          stroke={color}
          strokeWidth="2"
        />
      );
    } else {
      // Crow's foot for "N" or "many"
      return (
        <g>
          <line
            x1={x}
            y1={y}
            x2={x + offset * 12}
            y2={y - markerSize}
            stroke={color}
            strokeWidth="2"
          />
          <line
            x1={x}
            y1={y}
            x2={x + offset * 12}
            y2={y}
            stroke={color}
            strokeWidth="2"
          />
          <line
            x1={x}
            y1={y}
            x2={x + offset * 12}
            y2={y + markerSize}
            stroke={color}
            strokeWidth="2"
          />
        </g>
      );
    }
  };

  /**
   * Draw a single relationship line
   */
  const drawRelationship = (rel: EntityRelationship, index: number) => {
    const fromEntity = entities.find(e => e.logicalName === rel.from);
    const toEntity = entities.find(e => e.logicalName === rel.to);
    const fromPos = entityPositions[rel.from];
    const toPos = entityPositions[rel.to];

    if (!fromEntity || !toEntity || !fromPos || !toPos) return null;

    // Find the lookup field that creates this relationship
    const lookupField = fromEntity.attributes.find(attr =>
      (attr.type === 'Lookup' || attr.type === 'Owner') &&
      (rel.referencingAttribute?.toLowerCase() === attr.name.toLowerCase() ||
       rel.schemaName.toLowerCase().includes(attr.name.toLowerCase()))
    );

    // Determine connection sides based on relative positions
    const fromRight = fromPos.x + CARD_WIDTH;
    const toLeft = toPos.x;
    const toRight = toPos.x + CARD_WIDTH;
    const fromLeft = fromPos.x;

    // Calculate optimal connection points
    let startSide: 'left' | 'right';
    let endSide: 'left' | 'right';

    // Connect from the closest edges
    if (Math.abs(fromRight - toLeft) < Math.abs(fromLeft - toRight)) {
      startSide = 'right';
      endSide = 'left';
    } else {
      startSide = 'left';
      endSide = 'right';
    }

    // Get connection points
    const start = getConnectionPoint(rel.from, fromPos, lookupField?.name, startSide);
    const end = getConnectionPoint(rel.to, toPos, toEntity.primaryIdAttribute, endSide);

    // Generate bezier path
    const pathD = generateBezierPath(start, end);

    // Get cardinality symbols
    const cardinality = CARDINALITY_SYMBOLS[rel.type] || { from: '?', to: '?' };

    // Line colors
    const lineColor = isDarkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)';
    const lineHoverColor = isDarkMode ? 'rgba(96, 165, 250, 0.6)' : 'rgba(37, 99, 235, 0.5)';
    const textColor = isDarkMode ? '#94a3b8' : '#64748b';

    // Calculate label positions along the curve
    const labelOffset = 25;
    const startLabelX = start.x + (startSide === 'right' ? labelOffset : -labelOffset);
    const endLabelX = end.x + (endSide === 'right' ? labelOffset : -labelOffset);

    return (
      <g key={`${rel.from}-${rel.to}-${rel.schemaName}-${index}`} className="relationship-line">
        {/* Main curve path */}
        <path
          d={pathD}
          fill="none"
          stroke={lineColor}
          strokeWidth="2"
          strokeLinecap="round"
          style={{ transition: 'stroke 0.2s ease' }}
        />

        {/* Hover highlight path (thicker, invisible until hover) */}
        <path
          d={pathD}
          fill="none"
          stroke="transparent"
          strokeWidth="12"
          style={{ cursor: 'pointer' }}
          onMouseEnter={(e) => {
            const parent = e.currentTarget.parentElement;
            if (parent) {
              const mainPath = parent.querySelector('path');
              if (mainPath) mainPath.setAttribute('stroke', lineHoverColor);
            }
          }}
          onMouseLeave={(e) => {
            const parent = e.currentTarget.parentElement;
            if (parent) {
              const mainPath = parent.querySelector('path');
              if (mainPath) mainPath.setAttribute('stroke', lineColor);
            }
          }}
        />

        {/* Start connector (source entity - lookup field) */}
        <circle cx={start.x} cy={start.y} r="5" fill={lookupColor} />

        {/* End connector (target entity - primary key) */}
        <circle cx={end.x} cy={end.y} r="5" fill="#fbbf24" />

        {/* Cardinality markers */}
        {drawCardinalityMarker(
          start.x,
          start.y,
          cardinality.from === '1' ? 'one' : 'many',
          startSide === 'right' ? 'right' : 'left',
          lookupColor
        )}
        {drawCardinalityMarker(
          end.x,
          end.y,
          cardinality.to === '1' ? 'one' : 'many',
          endSide === 'right' ? 'right' : 'left',
          '#fbbf24'
        )}

        {/* Cardinality labels */}
        <g>
          {/* From cardinality */}
          <rect
            x={startLabelX - 10}
            y={start.y - 10}
            width="20"
            height="20"
            rx="4"
            fill={isDarkMode ? '#1e293b' : '#f1f5f9'}
            stroke={isDarkMode ? '#334155' : '#cbd5e1'}
            strokeWidth="1"
          />
          <text
            x={startLabelX}
            y={start.y + 4}
            fill={textColor}
            fontSize="11"
            fontWeight="700"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {cardinality.from}
          </text>

          {/* To cardinality */}
          <rect
            x={endLabelX - 10}
            y={end.y - 10}
            width="20"
            height="20"
            rx="4"
            fill={isDarkMode ? '#1e293b' : '#f1f5f9'}
            stroke={isDarkMode ? '#334155' : '#cbd5e1'}
            strokeWidth="1"
          />
          <text
            x={endLabelX}
            y={end.y + 4}
            fill={textColor}
            fontSize="11"
            fontWeight="700"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {cardinality.to}
          </text>
        </g>

        {/* Relationship type tooltip (shown on hover via CSS) */}
        <title>{`${rel.from} → ${rel.to} (${rel.type})\n${rel.schemaName}`}</title>
      </g>
    );
  };

  return (
    <svg style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '10000px',
      height: '10000px',
      pointerEvents: 'none',
      zIndex: 1,
      overflow: 'visible',
    }}>
      <defs>
        {/* Gradient for relationship lines */}
        <linearGradient id="relationshipGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={lookupColor} stopOpacity="0.8" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.8" />
        </linearGradient>

        {/* Arrow marker for optional use */}
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={isDarkMode ? '#94a3b8' : '#64748b'} />
        </marker>
      </defs>

      {/* Render all relationship lines */}
      <g style={{ pointerEvents: 'auto' }}>
        {relationships.map((rel, index) => drawRelationship(rel, index))}
      </g>
    </svg>
  );
}
