/**
 * Custom Table Node for ERD - matches database table visualization style
 */

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Entity, EntityAttribute } from '@/types';

export interface TableNodeData {
  entity: Entity;
  color: string;
  isDarkMode?: boolean;
  [key: string]: unknown; // Index signature for React Flow compatibility
}

interface TableNodeProps {
  data: TableNodeData;
  selected?: boolean;
}

// Get badge for attribute type
function getAttributeBadge(attr: EntityAttribute): { label: string; color: string } {
  if (attr.isPrimaryKey) {
    return { label: 'PK', color: '#f59e0b' };
  }
  if (attr.type === 'Lookup' || attr.type === 'Owner' || attr.type === 'Customer') {
    return { label: 'FK', color: '#ef4444' };
  }
  if (attr.type === 'String' || attr.type === 'Memo') {
    return { label: 'STR', color: '#8b5cf6' };
  }
  if (attr.type === 'Integer' || attr.type === 'BigInt' || attr.type === 'Decimal' || attr.type === 'Double' || attr.type === 'Money') {
    return { label: 'NUM', color: '#3b82f6' };
  }
  if (attr.type === 'DateTime') {
    return { label: 'DT', color: '#10b981' };
  }
  if (attr.type === 'Boolean') {
    return { label: 'BOOL', color: '#6366f1' };
  }
  if (attr.type === 'Picklist' || attr.type === 'State' || attr.type === 'Status') {
    return { label: 'OPT', color: '#ec4899' };
  }
  if (attr.type === 'UniqueIdentifier') {
    return { label: 'ID', color: '#f59e0b' };
  }
  return { label: 'EXT', color: '#6b7280' };
}

// Get type label
function getTypeLabel(attr: EntityAttribute): string {
  if (attr.isPrimaryKey) return 'id';
  if (attr.type === 'Lookup' || attr.type === 'Owner' || attr.type === 'Customer') return 'reference';
  if (attr.type === 'String' || attr.type === 'Memo') return 'string';
  if (attr.type === 'Integer' || attr.type === 'BigInt') return 'integer';
  if (attr.type === 'Decimal' || attr.type === 'Double' || attr.type === 'Money') return 'decimal';
  if (attr.type === 'DateTime') return 'datetime';
  if (attr.type === 'Boolean') return 'boolean';
  if (attr.type === 'Picklist' || attr.type === 'State' || attr.type === 'Status') return 'optionset';
  if (attr.type === 'UniqueIdentifier') return 'guid';
  return (attr.type as string).toLowerCase();
}

export const TableNode = memo(function TableNode({ data, selected }: TableNodeProps) {
  const { entity, color, isDarkMode = false } = data;

  // Only show primary key attributes
  const pkAttributes = entity.attributes.filter((attr) => attr.isPrimaryKey);

  // Theme-aware colors
  const bgColor = isDarkMode ? '#1f2937' : '#ffffff';
  const subHeaderBg = isDarkMode ? '#374151' : '#f8f9fa';
  const textColor = isDarkMode ? '#f3f4f6' : '#374151';
  const textSecondary = isDarkMode ? '#9ca3af' : '#6b7280';
  const borderColor = isDarkMode ? '#4b5563' : '#e5e7eb';
  const attrBorderColor = isDarkMode ? '#374151' : '#f3f4f6';

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
      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: color, width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: color, width: 8, height: 8 }}
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
        }}
      >
        <span style={{ fontSize: '14px' }}>📋</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entity.displayName}
        </span>
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
        }}
      >
        {entity.logicalName}
      </div>

      {/* Primary Key Attributes Only */}
      <div style={{ padding: '4px 0' }}>
        {pkAttributes.map((attr) => {
          const badge = getAttributeBadge(attr);
          const typeLabel = getTypeLabel(attr);

          return (
            <div
              key={attr.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '4px 12px',
                gap: '8px',
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
            </div>
          );
        })}

        {pkAttributes.length === 0 && (
          <div
            style={{
              padding: '8px 12px',
              color: textSecondary,
              fontSize: '11px',
              textAlign: 'center',
              fontStyle: 'italic',
            }}
          >
            No primary key
          </div>
        )}
      </div>
    </div>
  );
});
