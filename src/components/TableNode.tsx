/**
 * Custom Table Node for ERD - matches database table visualization style
 */

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Plus, X } from 'lucide-react';
import type { Entity, EntityAttribute, AlternateKey } from '@/types';
import { getAttributeBadge, isLookupType } from '../utils/badges';

export interface TableNodeData extends Record<string, unknown> {
  entity: Entity;
  color: string;
  isDarkMode?: boolean;
  orderedFields?: string[]; // Fields to display in order (PK first, then FIFO)
  onOpenFieldDrawer?: (entityName: string) => void;
  onRemoveField?: (entityName: string, fieldName: string) => void;
}

interface TableNodeProps {
  data: TableNodeData;
  selected?: boolean;
}

// Get type label (using Dataverse/Power Apps terminology)
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

// Layout constants for handle positioning
const HEADER_HEIGHT = 36; // Header with entity name
const SUBHEADER_HEIGHT = 24; // Logical name row
const FIELD_ROW_HEIGHT = 28; // Each field row height
const FIELD_PADDING_TOP = 4; // Padding at top of fields section

// Calculate the Y position for a field's handle
function getFieldHandleTop(fieldIndex: number): number {
  return (
    HEADER_HEIGHT +
    SUBHEADER_HEIGHT +
    FIELD_PADDING_TOP +
    fieldIndex * FIELD_ROW_HEIGHT +
    FIELD_ROW_HEIGHT / 2
  );
}

export const TableNode = memo(function TableNode({ data, selected }: TableNodeProps) {
  const {
    entity,
    color,
    isDarkMode = false,
    orderedFields,
    onOpenFieldDrawer,
    onRemoveField,
  } = data;

  // Get attributes to display based on orderedFields or just PK
  const displayAttributes =
    orderedFields && orderedFields.length > 0
      ? orderedFields
          .map((fieldName) => entity.attributes.find((a) => a.name === fieldName))
          .filter((attr): attr is EntityAttribute => attr !== undefined)
      : entity.attributes.filter((attr) => attr.isPrimaryKey);

  // Get alternate keys
  const alternateKeys = entity.alternateKeys || [];

  // Theme-aware colors
  const bgColor = isDarkMode ? '#1f2937' : '#ffffff';
  const subHeaderBg = isDarkMode ? '#374151' : '#f8f9fa';
  const textColor = isDarkMode ? '#f3f4f6' : '#374151';
  const textSecondary = isDarkMode ? '#9ca3af' : '#6b7280';
  const borderColor = isDarkMode ? '#4b5563' : '#e5e7eb';
  const attrBorderColor = isDarkMode ? '#374151' : '#f3f4f6';
  const akBadgeColor = '#0ea5e9'; // Cyan/sky color for AK

  // Find primary key for default handle position
  const pkAttr = displayAttributes.find((a) => a.isPrimaryKey);
  const pkIndex = pkAttr ? displayAttributes.findIndex((a) => a.isPrimaryKey) : 0;
  const defaultHandleTop = getFieldHandleTop(pkIndex);

  return (
    <div
      style={{
        background: bgColor,
        borderRadius: '8px',
        boxShadow: selected
          ? '0 0 0 2px #3b82f6, 0 4px 12px rgba(0,0,0,0.15)'
          : isDarkMode
            ? '0 2px 8px rgba(0,0,0,0.3)'
            : '0 2px 8px rgba(0,0,0,0.1)',
        minWidth: '220px',
        maxWidth: '280px',
        fontSize: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Per-field handles for precise edge connections */}
      {displayAttributes.map((attr, index) => {
        const handleTop = getFieldHandleTop(index);
        const isPK = attr.isPrimaryKey;
        const isLookup = isLookupType(attr);

        return (
          <div key={`handles-${attr.name}`}>
            {/* Target handle on left - for PK fields (incoming edges) */}
            {isPK && (
              <Handle
                type="target"
                position={Position.Left}
                id={attr.name}
                style={{
                  background: color,
                  width: 8,
                  height: 8,
                  top: handleTop,
                }}
              />
            )}
            {/* Source handle on right - for lookup fields (outgoing edges) */}
            {isLookup && (
              <Handle
                type="source"
                position={Position.Right}
                id={attr.name}
                style={{
                  background: '#f97316', // Orange for lookup connections
                  width: 8,
                  height: 8,
                  top: handleTop,
                }}
              />
            )}
          </div>
        );
      })}
      {/* Default handles for fallback (when field-specific handles aren't available) */}
      <Handle
        type="target"
        position={Position.Left}
        id="default-target"
        style={{
          background: color,
          width: 8,
          height: 8,
          top: defaultHandleTop,
          opacity: 0, // Hidden, used as fallback
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="default-source"
        style={{
          background: color,
          width: 8,
          height: 8,
          top: defaultHandleTop,
          opacity: 0, // Hidden, used as fallback
        }}
      />

      {/* Header */}
      <div
        style={{
          background: color,
          color: '#ffffff',
          padding: '8px 12px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          height: HEADER_HEIGHT,
          boxSizing: 'border-box',
        }}
      >
        <span
          style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {entity.displayName}
        </span>
        {onOpenFieldDrawer && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenFieldDrawer(entity.logicalName);
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '4px',
              padding: '2px 4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
            title="Add fields"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {/* Logical name */}
      <div
        style={{
          background: subHeaderBg,
          padding: '4px 12px',
          color: textSecondary,
          fontSize: '11px',
          fontFamily: 'monospace',
          borderBottom: `1px solid ${borderColor}`,
          height: SUBHEADER_HEIGHT,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {entity.logicalName}
      </div>

      {/* Fields */}
      <div style={{ padding: `${FIELD_PADDING_TOP}px 0` }}>
        {displayAttributes.map((attr) => {
          const badge = getAttributeBadge(attr);
          const typeLabel = getTypeLabel(attr);
          const canRemove = !attr.isPrimaryKey && onRemoveField;

          return (
            <div
              key={attr.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                gap: '8px',
                height: FIELD_ROW_HEIGHT,
                boxSizing: 'border-box',
                borderBottom: `1px solid ${attrBorderColor}`,
              }}
            >
              {/* Badge */}
              <span
                style={{
                  background: badge.color,
                  color: '#ffffff',
                  padding: '1px 4px',
                  borderRadius: '3px',
                  fontSize: '9px',
                  fontWeight: 600,
                  minWidth: '24px',
                  textAlign: 'center',
                }}
              >
                {badge.label}
              </span>

              {/* Field name */}
              <span
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: textColor,
                }}
              >
                {attr.displayName || attr.name}
              </span>

              {/* Type */}
              <span
                style={{
                  color: textSecondary,
                  fontSize: '10px',
                  fontStyle: 'italic',
                }}
              >
                {typeLabel}
              </span>

              {/* Remove button (only for non-PK fields) */}
              {canRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveField(entity.logicalName, attr.name);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '2px',
                    cursor: 'pointer',
                    color: textSecondary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '3px',
                  }}
                  title="Remove field"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          );
        })}

        {displayAttributes.length === 0 && (
          <div
            style={{
              padding: '8px 12px',
              color: textSecondary,
              fontSize: '11px',
              textAlign: 'center',
              fontStyle: 'italic',
            }}
          >
            No fields selected
          </div>
        )}
      </div>

      {/* Alternate Keys Section */}
      {alternateKeys.length > 0 && (
        <>
          {/* Separator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '4px 12px',
              gap: '8px',
              background: isDarkMode ? '#1a2332' : '#f0f4f8',
              borderTop: `1px solid ${borderColor}`,
              borderBottom: `1px solid ${borderColor}`,
            }}
          >
            <span
              style={{
                background: akBadgeColor,
                color: '#ffffff',
                padding: '1px 4px',
                borderRadius: '3px',
                fontSize: '9px',
                fontWeight: 600,
              }}
            >
              AK
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Alternate Keys
            </span>
          </div>

          {/* Alternate Key List */}
          <div style={{ padding: '4px 0' }}>
            {alternateKeys.map((ak: AlternateKey) => (
              <div
                key={ak.logicalName}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px 12px',
                  gap: '8px',
                  borderBottom: `1px solid ${attrBorderColor}`,
                }}
              >
                {/* Key icon/badge */}
                <span
                  style={{
                    color: akBadgeColor,
                    fontSize: '11px',
                  }}
                >
                  🔑
                </span>

                {/* Key name */}
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: textColor,
                    fontSize: '11px',
                  }}
                >
                  {ak.displayName}
                </span>

                {/* Key attributes - with tooltip for composite keys */}
                <span
                  style={{
                    color: textSecondary,
                    fontSize: '10px',
                    fontStyle: 'italic',
                    cursor: ak.keyAttributes.length > 1 ? 'help' : 'default',
                  }}
                  title={ak.keyAttributes.length > 1 ? ak.keyAttributes.join(', ') : undefined}
                >
                  {ak.keyAttributes.length === 1
                    ? ak.keyAttributes[0]
                    : `${ak.keyAttributes.length} fields`}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
});
