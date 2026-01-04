/**
 * Field Drawer scrollable list of fields
 */

import { CheckSquare, Square } from 'lucide-react';
import type { EntityAttribute } from '@/types';
import type { AttributeBadge } from '../utils/badges';

export interface FieldDrawerListProps {
  filteredAttributes: EntityAttribute[];
  selectedFields: Set<string>;
  isDarkMode: boolean;
  textColor: string;
  textSecondary: string;
  hoverBg: string;
  getBadge: (attr: EntityAttribute) => AttributeBadge;
  isLookup: (attr: EntityAttribute) => boolean;
  onFieldToggle: (attr: EntityAttribute) => void;
}

export function FieldDrawerList({
  filteredAttributes,
  selectedFields,
  isDarkMode,
  textColor,
  textSecondary,
  hoverBg,
  getBadge,
  isLookup,
  onFieldToggle,
}: FieldDrawerListProps) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 0',
      }}
    >
      {filteredAttributes.map((attr) => {
        const badge = getBadge(attr);
        const isSelected = selectedFields.has(attr.name) || attr.isPrimaryKey;
        const isDisabled = attr.isPrimaryKey;
        const isLookupField = isLookup(attr);

        return (
          <div
            key={attr.name}
            onClick={() => !isDisabled && onFieldToggle(attr)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 16px',
              gap: '10px',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              background:
                isSelected && !isDisabled ? (isDarkMode ? '#1e3a5f' : '#eff6ff') : 'transparent',
              opacity: isDisabled ? 0.6 : 1,
              borderBottom: `1px solid ${isDarkMode ? '#2d3748' : '#f3f4f6'}`,
            }}
            onMouseEnter={(e) => {
              if (!isDisabled) {
                e.currentTarget.style.background = isSelected
                  ? isDarkMode
                    ? '#1e3a5f'
                    : '#eff6ff'
                  : hoverBg;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                isSelected && !isDisabled ? (isDarkMode ? '#1e3a5f' : '#eff6ff') : 'transparent';
            }}
          >
            {/* Checkbox */}
            <div style={{ color: isSelected ? '#3b82f6' : textSecondary }}>
              {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
            </div>

            {/* Badge */}
            <span
              style={{
                background: badge.color,
                color: '#ffffff',
                padding: '2px 5px',
                borderRadius: '3px',
                fontSize: '9px',
                fontWeight: 600,
                minWidth: '28px',
                textAlign: 'center',
              }}
            >
              {badge.label}
            </span>

            {/* Field info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  color: textColor,
                  fontSize: '12px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {attr.displayName || attr.name}
              </div>
              <div
                style={{
                  color: textSecondary,
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {attr.name}
                {isLookupField && attr.lookupTarget && (
                  <span style={{ color: '#f59e0b' }}> → {attr.lookupTarget}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {filteredAttributes.length === 0 && (
        <div
          style={{
            padding: '24px 16px',
            textAlign: 'center',
            color: textSecondary,
            fontSize: '12px',
          }}
        >
          No fields match the current filters
        </div>
      )}
    </div>
  );
}
