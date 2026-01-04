/**
 * Virtual scrolling entity list for performance with large entity counts
 */

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

export function VirtualEntityList({
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

  const { visibleItems, totalHeight, onScroll, containerRef } = useVirtualScroll({
    itemCount: entities.length,
    itemHeight: ITEM_HEIGHT,
    containerHeight,
    overscan: OVERSCAN,
  });

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
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
              onClick={() => onToggleEntity(entity.logicalName)}
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
              {hasLookups && <Link2 size={14} color={lookupColor} style={{ flexShrink: 0 }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
