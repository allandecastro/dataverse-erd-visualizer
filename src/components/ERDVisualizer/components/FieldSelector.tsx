/**
 * Field selector dropdown component
 */

import { forwardRef, useState } from 'react';
import { Search, CheckSquare, Square, X, Link2 } from 'lucide-react';
import type { FieldSelectorProps } from '../types';

export const FieldSelector = forwardRef<HTMLDivElement, Omit<FieldSelectorProps, 'onSelectLookups'>>(({
  entity,
  selectedFields,
  searchQuery,
  tableColor,
  isDarkMode,
  themeColors,
  onToggleField,
  onSelectAll,
  onClearAll,
  onSearchChange,
  onClose,
  getFieldTypeColor,
}, ref) => {
  const { borderColor, cardBg, textColor, textSecondary } = themeColors;
  const [showOnlyLookups, setShowOnlyLookups] = useState(false);

  // Filter out PK fields - they are always shown automatically
  const selectableAttributes = entity.attributes.filter(attr => !attr.isPrimaryKey);

  // Apply search filter
  let filteredAttributes = selectableAttributes.filter(attr =>
    attr.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    attr.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Apply lookup filter if enabled
  if (showOnlyLookups) {
    filteredAttributes = filteredAttributes.filter(attr =>
      attr.type === 'Lookup' || attr.type === 'Owner' || attr.type === 'Customer'
    );
  }

  const buttonStyle = {
    padding: '3px 8px',
    fontSize: '10px',
    background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    border: `1px solid ${borderColor}`,
    borderRadius: '3px',
    cursor: 'pointer',
    color: textColor
  };

  const activeButtonStyle = {
    ...buttonStyle,
    background: tableColor,
    color: '#ffffff',
    border: `1px solid ${tableColor}`
  };

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: '4px',
        background: cardBg,
        border: `2px solid ${tableColor}`,
        borderRadius: '6px',
        padding: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        zIndex: 100
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '12px', fontWeight: '600' }}>Select Fields</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectAll();
            }}
            style={buttonStyle}
          >
            All
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClearAll();
            }}
            style={buttonStyle}
          >
            Clear
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowOnlyLookups(!showOnlyLookups);
            }}
            style={{
              ...(showOnlyLookups ? activeButtonStyle : buttonStyle),
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Filter to show only Lookup fields"
          >
            <Link2 size={10} />
            Lookup
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            style={{
              padding: '3px 6px',
              fontSize: '10px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: textColor,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: '8px' }}>
        <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: textSecondary }} />
        <input
          type="text"
          placeholder="Search fields..."
          value={searchQuery}
          onChange={(e) => {
            e.stopPropagation();
            onSearchChange(e.target.value);
          }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            padding: '6px 8px 6px 28px',
            background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
            border: `1px solid ${borderColor}`,
            borderRadius: '4px',
            color: textColor,
            fontSize: '11px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Scrollable field list */}
      <div
        style={{
          maxHeight: '250px',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
        onWheel={(e) => e.stopPropagation()}
      >
        {filteredAttributes.map(attr => (
          <div
            key={attr.name}
            onClick={(e) => {
              e.stopPropagation();
              onToggleField(attr.name);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              background: selectedFields.has(attr.name) ? (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)') : 'transparent',
              marginBottom: '2px'
            }}
          >
            {selectedFields.has(attr.name) ? <CheckSquare size={14} color={tableColor} /> : <Square size={14} color={textSecondary} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {attr.displayName}
              </div>
              <div style={{ fontSize: '9px', fontFamily: 'monospace', color: textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {attr.name}
              </div>
            </div>
            <span style={{
              fontSize: '9px',
              fontWeight: '600',
              padding: '2px 5px',
              borderRadius: '3px',
              background: getFieldTypeColor(attr.type),
              color: '#ffffff',
              flexShrink: 0
            }}>
              {attr.type}
            </span>
          </div>
        ))}

        {filteredAttributes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '16px', fontSize: '11px', color: textSecondary }}>
            No fields match your search
          </div>
        )}
      </div>
    </div>
  );
});

FieldSelector.displayName = 'FieldSelector';
