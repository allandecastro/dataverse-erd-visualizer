/**
 * Custom React Flow node for entity visualization
 * Adapts the EntityCard design for React Flow
 */

import { memo, useState, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Settings, ChevronDown, ChevronUp, Link2, Key, KeyRound } from 'lucide-react';
import type { Entity, EntityAttribute, AttributeType } from '@/types';
import type { ColorSettings, ThemeColors } from '../types';
import { getFieldTypeColor } from '../types';
import { FieldSelector } from './FieldSelector';

export interface EntityNodeData {
  entity: Entity;
  selectedFields: Set<string>;
  isCollapsed: boolean;
  isDarkMode: boolean;
  colorSettings: ColorSettings;
  themeColors: ThemeColors;
  onToggleField: (fieldName: string) => void;
  onToggleCollapse: () => void;
  onSelectAllFields: () => void;
  onClearAllFields: () => void;
}

interface EntityNodeProps {
  data: EntityNodeData;
  selected?: boolean;
}

export const EntityNode = memo(function EntityNode({ data, selected }: EntityNodeProps) {
  const {
    entity,
    selectedFields,
    isCollapsed,
    isDarkMode,
    colorSettings,
    themeColors,
    onToggleField,
    onToggleCollapse,
    onSelectAllFields,
    onClearAllFields,
  } = data;

  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const [fieldSearchQuery, setFieldSearchQuery] = useState('');
  const fieldSelectorRef = useRef<HTMLDivElement>(null);

  const { cardBg, borderColor, textSecondary } = themeColors;
  const { lookupColor, customTableColor, standardTableColor } = colorSettings;

  // Determine table color based on publisher
  const isCustom = entity.publisher &&
    !['Microsoft', 'Microsoft Dynamics 365', 'Microsoft Dynamics CRM'].includes(entity.publisher);
  const tableColor = isCustom ? customTableColor : standardTableColor;

  const hasLookups = entity.attributes.some((a: EntityAttribute) => a.type === 'Lookup' || a.type === 'Owner');

  const getTypeColor = (type: AttributeType) => getFieldTypeColor(type, lookupColor);

  // Get visible attributes (selected + primary key, sorted with PK first)
  const visibleAttributes = entity.attributes
    .filter((attr: EntityAttribute) => selectedFields.has(attr.name) || attr.isPrimaryKey)
    .sort((a: EntityAttribute, b: EntityAttribute) => {
      if (a.isPrimaryKey && !b.isPrimaryKey) return -1;
      if (!a.isPrimaryKey && b.isPrimaryKey) return 1;
      return 0;
    });

  return (
    <div
      style={{
        width: '300px',
        background: cardBg,
        border: `2px solid ${selected ? '#60a5fa' : tableColor}`,
        borderRadius: '6px',
        overflow: 'visible',
        boxShadow: selected
          ? '0 0 0 4px rgba(96, 165, 250, 0.6), 0 12px 24px rgba(0, 0, 0, 0.3)'
          : '0 2px 8px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Source handle (left side) */}
      <Handle
        type="source"
        position={Position.Left}
        style={{
          background: lookupColor,
          width: 8,
          height: 8,
          border: '2px solid white',
        }}
      />

      {/* Target handle (right side) */}
      <Handle
        type="target"
        position={Position.Right}
        style={{
          background: '#fbbf24',
          width: 8,
          height: 8,
          border: '2px solid white',
        }}
      />

      {/* Header */}
      <div style={{
        padding: '12px 14px',
        background: tableColor,
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopLeftRadius: '4px',
        borderTopRightRadius: '4px',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '15px',
            fontWeight: '600',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {entity.displayName}
          </div>
          <div style={{
            fontSize: '11px',
            opacity: 0.8,
            fontFamily: 'monospace',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {entity.logicalName}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginLeft: '8px' }}>
          {hasLookups && (
            <div style={{
              background: `${lookupColor}33`,
              padding: '4px 8px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <Link2 size={12} color={lookupColor} />
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowFieldSelector(!showFieldSelector);
            }}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '4px',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: '#ffffff',
            }}
          >
            <Settings size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse();
            }}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '4px',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: '#ffffff',
            }}
          >
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {/* Field Selector Dropdown */}
      {showFieldSelector && (
        <FieldSelector
          ref={fieldSelectorRef}
          entity={entity}
          selectedFields={selectedFields}
          searchQuery={fieldSearchQuery}
          tableColor={tableColor}
          isDarkMode={isDarkMode}
          themeColors={themeColors}
          onToggleField={onToggleField}
          onSelectAll={onSelectAllFields}
          onClearAll={onClearAllFields}
          onSearchChange={setFieldSearchQuery}
          onClose={() => setShowFieldSelector(false)}
          getFieldTypeColor={getTypeColor}
        />
      )}

      {/* Attributes */}
      {!isCollapsed && visibleAttributes.length > 0 && (
        <div style={{ padding: '12px' }}>
          <div style={{
            fontSize: '10px',
            color: textSecondary,
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: '600',
          }}>
            Attributes ({visibleAttributes.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {visibleAttributes.map((attr: EntityAttribute) => (
              <div key={attr.name} style={{
                padding: '6px 8px',
                background: attr.isPrimaryKey
                  ? (isDarkMode ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.05)')
                  : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'),
                borderRadius: '3px',
                border: `1px solid ${attr.isPrimaryKey ? '#fbbf24' : borderColor}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flex: 1,
                    overflow: 'hidden',
                  }}>
                    {attr.isPrimaryKey && <Key size={12} color="#fbbf24" style={{ flexShrink: 0 }} />}
                    <span style={{
                      fontSize: '11px',
                      fontWeight: attr.isPrimaryKey ? '600' : '500',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {attr.displayName}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '9px',
                    fontWeight: '600',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    background: getTypeColor(attr.type),
                    color: '#ffffff',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    flexShrink: 0,
                  }}>
                    {attr.isPrimaryKey ? 'PK' : attr.type}
                  </span>
                </div>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '9px',
                  color: textSecondary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {attr.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alternate Keys */}
      {!isCollapsed && entity.alternateKeys && entity.alternateKeys.length > 0 && (
        <div style={{
          padding: '12px',
          paddingTop: visibleAttributes.length > 0 ? '0' : '12px',
        }}>
          <div style={{
            fontSize: '10px',
            color: textSecondary,
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: '600',
          }}>
            Alternate Keys ({entity.alternateKeys.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {entity.alternateKeys.map((key) => (
              <div key={key.logicalName} style={{
                padding: '6px 8px',
                background: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)',
                borderRadius: '3px',
                border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <KeyRound size={12} color="#8b5cf6" style={{ flexShrink: 0 }} />
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '500',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {key.displayName}
                  </span>
                </div>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '9px',
                  color: textSecondary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  paddingLeft: '18px',
                }}>
                  {key.keyAttributes.join(', ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
