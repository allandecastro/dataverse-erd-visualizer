/**
 * Virtual scrolling entity list for performance with large entity counts
 * Includes keyboard navigation and ARIA attributes for accessibility
 */

import { memo, useCallback, useRef, useState } from 'react';
import { Link2 } from 'lucide-react';
import type { Entity } from '@/types';
import type { ThemeColors, ColorSettings } from '@/types/erdTypes';
import { useVirtualScroll } from '../hooks/useVirtualScroll';

const ITEM_HEIGHT = 52; // Height of each entity item in pixels
const OVERSCAN = 5; // Number of items to render above/below visible area

export interface VirtualEntityListProps {
  entities: Entity[];
  selectedEntities: Set<string>;
  isDarkMode: boolean;
  themeColors: ThemeColors;
  colorSettings: ColorSettings;
  onToggleEntity: (entityName: string) => void;
  containerHeight: number;
}

export const VirtualEntityList = memo(function VirtualEntityList({
  entities,
  selectedEntities,
  isDarkMode,
  themeColors,
  colorSettings,
  onToggleEntity,
  containerHeight,
}: VirtualEntityListProps) {
  const { borderColor, textSecondary } = themeColors;
  const { customTableColor, standardTableColor, lookupColor } = colorSettings;

  // Track focused item index for keyboard navigation
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const { visibleItems, totalHeight, onScroll, containerRef } = useVirtualScroll({
    itemCount: entities.length,
    itemHeight: ITEM_HEIGHT,
    containerHeight,
    overscan: OVERSCAN,
  });

  // Handle keyboard navigation within the list
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      const entity = entities[index];
      if (!entity) return;

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          onToggleEntity(entity.logicalName);
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (index < entities.length - 1) {
            const nextIndex = index + 1;
            setFocusedIndex(nextIndex);
            // Scroll into view and focus
            const nextItem = itemRefs.current.get(nextIndex);
            if (nextItem) {
              nextItem.focus();
              nextItem.scrollIntoView({ block: 'nearest' });
            }
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (index > 0) {
            const prevIndex = index - 1;
            setFocusedIndex(prevIndex);
            const prevItem = itemRefs.current.get(prevIndex);
            if (prevItem) {
              prevItem.focus();
              prevItem.scrollIntoView({ block: 'nearest' });
            }
          }
          break;
        case 'Home': {
          e.preventDefault();
          setFocusedIndex(0);
          const firstItem = itemRefs.current.get(0);
          if (firstItem) {
            firstItem.focus();
            firstItem.scrollIntoView({ block: 'nearest' });
          }
          break;
        }
        case 'End': {
          e.preventDefault();
          const lastIndex = entities.length - 1;
          setFocusedIndex(lastIndex);
          const lastItem = itemRefs.current.get(lastIndex);
          if (lastItem) {
            lastItem.focus();
            lastItem.scrollIntoView({ block: 'nearest' });
          }
          break;
        }
      }
    },
    [entities, onToggleEntity]
  );

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      role="listbox"
      aria-label="Entity list"
      aria-multiselectable="true"
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
      }}
    >
      {/* Spacer to maintain correct scroll height */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ index, offsetTop }) => {
          const entity = entities[index];
          if (!entity) return null;

          const isSelected = selectedEntities.has(entity.logicalName);
          const hasLookups = entity.attributes.some(
            (a) => a.type === 'Lookup' || a.type === 'Owner'
          );

          return (
            <div
              key={entity.logicalName}
              ref={(el) => {
                if (el) {
                  itemRefs.current.set(index, el);
                } else {
                  itemRefs.current.delete(index);
                }
              }}
              role="option"
              aria-selected={isSelected}
              tabIndex={focusedIndex === index || (focusedIndex === -1 && index === 0) ? 0 : -1}
              onClick={() => onToggleEntity(entity.logicalName)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onFocus={() => setFocusedIndex(index)}
              style={{
                position: 'absolute',
                top: offsetTop,
                left: 0,
                right: 0,
                height: ITEM_HEIGHT,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                boxSizing: 'border-box',
                borderRadius: '4px',
                cursor: 'pointer',
                background: isSelected
                  ? isDarkMode
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.04)'
                  : 'transparent',
                border: `1px solid ${isSelected ? borderColor : 'transparent'}`,
                transition: 'all 0.15s',
              }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => {}}
                tabIndex={-1}
                aria-hidden="true"
                style={{ cursor: 'pointer', accentColor: customTableColor }}
              />
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '2px',
                  background: entity.isCustomEntity ? customTableColor : standardTableColor,
                  flexShrink: 0,
                }}
                aria-hidden="true"
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entity.displayName}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: textSecondary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entity.logicalName}
                </div>
              </div>
              {hasLookups && (
                <Link2
                  size={14}
                  color={lookupColor}
                  style={{ flexShrink: 0 }}
                  aria-label="Has lookup relationships"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
