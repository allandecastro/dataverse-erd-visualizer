/**
 * Entity Search component for finding and navigating to entities on canvas
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, MapPin } from 'lucide-react';
import type { Entity } from '@/types';
import type { ThemeColors } from '../types';

export interface EntitySearchProps {
  entities: Entity[];
  isOpen: boolean;
  isDarkMode: boolean;
  themeColors: ThemeColors;
  onClose: () => void;
  onNavigateToEntity: (entityName: string) => void;
}

export function EntitySearch({
  entities,
  isOpen,
  isDarkMode,
  themeColors,
  onClose,
  onNavigateToEntity,
}: EntitySearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { panelBg, borderColor, textColor, textSecondary } = themeColors;

  // Filter entities based on search
  const filteredEntities = entities.filter(entity => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      entity.displayName.toLowerCase().includes(query) ||
      entity.logicalName.toLowerCase().includes(query)
    );
  }).slice(0, 10); // Limit to 10 results

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && filteredEntities.length > 0) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, filteredEntities.length]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredEntities.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredEntities[selectedIndex]) {
          onNavigateToEntity(filteredEntities[selectedIndex].logicalName);
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [filteredEntities, selectedIndex, onNavigateToEntity, onClose]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          zIndex: 1000,
        }}
      />

      {/* Search Dialog */}
      <div
        style={{
          position: 'fixed',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '400px',
          maxWidth: '90vw',
          background: panelBg,
          borderRadius: '12px',
          border: `1px solid ${borderColor}`,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          zIndex: 1001,
          overflow: 'hidden',
        }}
      >
        {/* Search Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: `1px solid ${borderColor}`,
          gap: '12px',
        }}>
          <Search size={20} color={textSecondary} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search entities on canvas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '16px',
              color: textColor,
            }}
          />
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              color: textSecondary,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          style={{
            maxHeight: '300px',
            overflowY: 'auto',
          }}
        >
          {filteredEntities.length === 0 ? (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              color: textSecondary,
              fontSize: '14px',
            }}>
              No entities found
            </div>
          ) : (
            filteredEntities.map((entity, index) => (
              <div
                key={entity.logicalName}
                onClick={() => {
                  onNavigateToEntity(entity.logicalName);
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: index === selectedIndex
                    ? (isDarkMode ? 'rgba(96, 165, 250, 0.2)' : 'rgba(37, 99, 235, 0.1)')
                    : 'transparent',
                  borderLeft: index === selectedIndex
                    ? `3px solid ${isDarkMode ? '#60a5fa' : '#2563eb'}`
                    : '3px solid transparent',
                  transition: 'all 0.1s',
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <MapPin size={16} color={isDarkMode ? '#60a5fa' : '#2563eb'} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: textColor,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {entity.displayName}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: textSecondary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {entity.logicalName}
                  </div>
                </div>
                <div style={{
                  fontSize: '11px',
                  color: textSecondary,
                  padding: '2px 6px',
                  background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  borderRadius: '4px',
                }}>
                  {entity.isCustomEntity ? 'Custom' : 'Standard'}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: '8px 16px',
          borderTop: `1px solid ${borderColor}`,
          display: 'flex',
          gap: '16px',
          fontSize: '11px',
          color: textSecondary,
        }}>
          <span><kbd style={kbdStyle(isDarkMode)}>↑↓</kbd> navigate</span>
          <span><kbd style={kbdStyle(isDarkMode)}>Enter</kbd> go to</span>
          <span><kbd style={kbdStyle(isDarkMode)}>Esc</kbd> close</span>
        </div>
      </div>
    </>
  );
}

function kbdStyle(isDarkMode: boolean): React.CSSProperties {
  return {
    padding: '2px 6px',
    background: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
    borderRadius: '3px',
    fontFamily: 'inherit',
    fontSize: '10px',
  };
}
