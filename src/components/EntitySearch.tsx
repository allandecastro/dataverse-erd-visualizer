/**
 * Entity Search component for finding and navigating to entities on canvas
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, MapPin } from 'lucide-react';
import type { Entity } from '@/types';
import { useTheme } from '@/context';
import styles from '@/styles/EntitySearch.module.css';

export interface EntitySearchProps {
  entities: Entity[];
  isOpen: boolean;
  onClose: () => void;
  onNavigateToEntity: (entityName: string) => void;
}

export function EntitySearch({ entities, isOpen, onClose, onNavigateToEntity }: EntitySearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { isDarkMode, themeColors } = useTheme();
  const { panelBg, borderColor, textColor, textSecondary } = themeColors;

  // Filter entities based on search
  const filteredEntities = entities
    .filter((entity) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        entity.displayName.toLowerCase().includes(query) ||
        entity.logicalName.toLowerCase().includes(query)
      );
    })
    .slice(0, 10); // Limit to 10 results

  // Focus input when opened and reset state
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, filteredEntities.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
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
    },
    [filteredEntities, selectedIndex, onNavigateToEntity, onClose]
  );

  // Reset selected index when search changes
  const prevSearchQuery = useRef(searchQuery);
  useEffect(() => {
    if (prevSearchQuery.current !== searchQuery) {
      prevSearchQuery.current = searchQuery;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedIndex(0);
    }
  }, [searchQuery]);

  if (!isOpen) return null;

  const searchLabelId = 'entity-search-label';
  const resultsId = 'entity-search-results';

  const getResultItemStyle = (isSelected: boolean) => ({
    background: isSelected
      ? isDarkMode
        ? 'rgba(96, 165, 250, 0.2)'
        : 'rgba(37, 99, 235, 0.1)'
      : 'transparent',
    borderLeft: isSelected
      ? `3px solid ${isDarkMode ? '#60a5fa' : '#2563eb'}`
      : '3px solid transparent',
  });

  const kbdBg = isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';
  const badgeBg = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const accentColor = isDarkMode ? '#60a5fa' : '#2563eb';

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} aria-hidden="true" className={styles.backdrop} />

      {/* Search Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={searchLabelId}
        className={styles.dialog}
        style={{ background: panelBg, border: `1px solid ${borderColor}` }}
      >
        {/* Search Input */}
        <div className={styles.searchRow} style={{ borderBottom: `1px solid ${borderColor}` }}>
          <Search size={20} color={textSecondary} aria-hidden="true" />
          <label id={searchLabelId} className="sr-only">
            Search entities on canvas
          </label>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search entities on canvas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-labelledby={searchLabelId}
            aria-controls={resultsId}
            aria-activedescendant={
              filteredEntities[selectedIndex]
                ? `entity-option-${filteredEntities[selectedIndex].logicalName}`
                : undefined
            }
            aria-autocomplete="list"
            role="combobox"
            aria-expanded={filteredEntities.length > 0}
            className={styles.searchInput}
            style={{ color: textColor }}
          />
          <button
            onClick={onClose}
            aria-label="Close search dialog"
            className={styles.closeButton}
            style={{ color: textSecondary }}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          id={resultsId}
          role="listbox"
          aria-label="Search results"
          className={styles.resultsList}
        >
          {filteredEntities.length === 0 ? (
            <div
              role="status"
              aria-live="polite"
              className={styles.noResults}
              style={{ color: textSecondary }}
            >
              No entities found
            </div>
          ) : (
            filteredEntities.map((entity, index) => (
              <div
                key={entity.logicalName}
                id={`entity-option-${entity.logicalName}`}
                role="option"
                aria-selected={index === selectedIndex}
                tabIndex={-1}
                onClick={() => {
                  onNavigateToEntity(entity.logicalName);
                  onClose();
                }}
                className={styles.resultItem}
                style={getResultItemStyle(index === selectedIndex)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <MapPin size={16} color={accentColor} aria-hidden="true" />
                <div className={styles.resultContent}>
                  <div className={styles.resultName} style={{ color: textColor }}>
                    {entity.displayName}
                  </div>
                  <div className={styles.resultLogicalName} style={{ color: textSecondary }}>
                    {entity.logicalName}
                  </div>
                </div>
                <div
                  className={styles.resultBadge}
                  style={{ color: textSecondary, background: badgeBg }}
                >
                  {entity.isCustomEntity ? 'Custom' : 'Standard'}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div
          className={styles.footer}
          style={{ borderTop: `1px solid ${borderColor}`, color: textSecondary }}
        >
          <span>
            <kbd className={styles.kbd} style={{ background: kbdBg }}>
              ↑↓
            </kbd>{' '}
            navigate
          </span>
          <span>
            <kbd className={styles.kbd} style={{ background: kbdBg }}>
              Enter
            </kbd>{' '}
            go to
          </span>
          <span>
            <kbd className={styles.kbd} style={{ background: kbdBg }}>
              Esc
            </kbd>{' '}
            close
          </span>
        </div>
      </div>
    </>
  );
}
