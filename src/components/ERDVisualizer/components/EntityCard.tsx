/**
 * Entity card component for ERD visualization
 */

import { useRef } from 'react';
import { Settings, ChevronDown, ChevronUp, Link2, Key } from 'lucide-react';
import type { Entity, AttributeType } from '@/types';
import type { ThemeColors, ColorSettings } from '../types';
import { FieldSelector } from './FieldSelector';
import { getFieldTypeColor } from '../types';

export interface EntityCardProps {
  entity: Entity;
  position: { x: number; y: number };
  isHovered: boolean;
  isHighlighted?: boolean;
  isDraggingThis: boolean;
  isCollapsed: boolean;
  tableColor: string;
  selectedFields: Set<string>;
  showFieldSelector: boolean;
  fieldSearchQuery: string;
  isDarkMode: boolean;
  colorSettings: ColorSettings;
  themeColors: ThemeColors;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onToggleCollapse: () => void;
  onToggleFieldSelector: () => void;
  onToggleField: (fieldName: string) => void;
  onSelectAllFields: () => void;
  onClearAllFields: () => void;
  onFieldSearchChange: (value: string) => void;
  onCloseFieldSelector: () => void;
}

export function EntityCard({
  entity,
  position,
  isHovered,
  isHighlighted = false,
  isDraggingThis,
  isCollapsed,
  tableColor,
  selectedFields,
  showFieldSelector,
  fieldSearchQuery,
  isDarkMode,
  colorSettings,
  themeColors,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onToggleCollapse,
  onToggleFieldSelector,
  onToggleField,
  onSelectAllFields,
  onClearAllFields,
  onFieldSearchChange,
  onCloseFieldSelector,
}: EntityCardProps) {
  const fieldSelectorRef = useRef<HTMLDivElement>(null);
  const { cardBg, borderColor, textSecondary } = themeColors;
  const { lookupColor } = colorSettings;

  const hasLookups = entity.attributes.some(a => a.type === 'Lookup' || a.type === 'Owner');

  const getTypeColor = (type: AttributeType) => getFieldTypeColor(type, lookupColor);

  // Highlight animation style
  const highlightStyle = isHighlighted ? {
    boxShadow: '0 0 0 4px rgba(96, 165, 250, 0.6), 0 12px 24px rgba(0, 0, 0, 0.3)',
    animation: 'pulse-highlight 1s ease-in-out 2',
  } : {};

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '300px',
        background: cardBg,
        border: `2px solid ${isHighlighted ? '#60a5fa' : tableColor}`,
        borderRadius: '6px',
        overflow: 'visible',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        boxShadow: isHighlighted
          ? '0 0 0 4px rgba(96, 165, 250, 0.6), 0 12px 24px rgba(0, 0, 0, 0.3)'
          : isHovered
            ? '0 12px 24px rgba(0, 0, 0, 0.2)'
            : '0 2px 8px rgba(0, 0, 0, 0.1)',
        cursor: isDraggingThis ? 'grabbing' : 'grab',
        zIndex: isHighlighted ? 20 : isHovered || isDraggingThis ? 10 : 2,
        ...highlightStyle,
      }}
    >
      {/* Header */}
      <div style={{
        padding: '12px 14px',
        background: tableColor,
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopLeftRadius: '4px',
        borderTopRightRadius: '4px'
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '15px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {entity.displayName}
          </div>
          <div style={{ fontSize: '11px', opacity: 0.8, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
              gap: '4px'
            }}>
              <Link2 size={12} color={lookupColor} />
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFieldSelector();
            }}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '4px',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: '#ffffff'
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
              color: '#ffffff'
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
          onSearchChange={onFieldSearchChange}
          onClose={onCloseFieldSelector}
          getFieldTypeColor={getTypeColor}
        />
      )}

      {/* Attributes */}
      {!isCollapsed && (selectedFields.size > 0 || entity.attributes.some(a => a.isPrimaryKey)) && (
        <div style={{ padding: '12px' }}>
          <div style={{ fontSize: '10px', color: textSecondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
            Attributes ({entity.attributes.filter(attr => selectedFields.has(attr.name) || attr.isPrimaryKey).length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {entity.attributes.filter(attr => selectedFields.has(attr.name) || attr.isPrimaryKey).map(attr => (
              <div key={attr.name} style={{
                padding: '6px 8px',
                background: attr.isPrimaryKey ? (isDarkMode ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.05)') : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'),
                borderRadius: '3px',
                border: `1px solid ${attr.isPrimaryKey ? '#fbbf24' : borderColor}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, overflow: 'hidden' }}>
                    {attr.isPrimaryKey && <Key size={12} color="#fbbf24" style={{ flexShrink: 0 }} />}
                    <span style={{ fontSize: '11px', fontWeight: attr.isPrimaryKey ? '600' : '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                    flexShrink: 0
                  }}>
                    {attr.isPrimaryKey ? 'PK' : attr.type}
                  </span>
                </div>
                <span style={{ fontFamily: 'monospace', fontSize: '9px', color: textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {attr.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
