/**
 * Grouped entity list with collapsible group sections
 * Replaces VirtualEntityList when entities have color-based groups
 */

import { memo, useCallback, useRef, useState, useMemo } from 'react';
import { ChevronRight, Pencil } from 'lucide-react';
import type { Entity } from '@/types';
import type { ThemeColors, ColorSettings, DerivedGroup } from '@/types/erdTypes';
import { EntityItemContent } from './EntityItemContent';
import styles from '@/styles/Sidebar.module.css';

const GROUP_HEADER_HEIGHT = 40;
const ENTITY_ITEM_HEIGHT = 52;
const OVERSCAN = 5;

/** Flattened list item — either a group header or an entity row */
type ListItem =
  | { type: 'group-header'; group: DerivedGroup; entityCount: number; selectedCount: number }
  | { type: 'entity'; entity: Entity; isSelected: boolean };

export interface GroupedEntityListProps {
  entities: Entity[];
  selectedEntities: Set<string>;
  isDarkMode: boolean;
  themeColors: ThemeColors;
  colorSettings: ColorSettings;
  onToggleEntity: (entityName: string) => void;
  containerHeight: number;
  derivedGroups: DerivedGroup[];
  onSetGroupName: (color: string, name: string) => void;
}

export const GroupedEntityList = memo(function GroupedEntityList({
  entities,
  selectedEntities,
  isDarkMode,
  themeColors,
  colorSettings,
  onToggleEntity,
  containerHeight,
  derivedGroups,
  onSetGroupName,
}: GroupedEntityListProps) {
  const { borderColor, textSecondary } = themeColors;
  const { customTableColor, standardTableColor, lookupColor } = colorSettings;

  // Local collapse state (not persisted)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  // Inline rename state
  const [renamingGroup, setRenamingGroup] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Keyboard navigation state
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Build entity lookup by logical name for O(1) access
  const entityMap = useMemo(() => {
    const map = new Map<string, Entity>();
    for (const entity of entities) {
      map.set(entity.logicalName, entity);
    }
    return map;
  }, [entities]);

  // Set of entity names that appear in the current `entities` list (post-filter)
  const visibleEntityNames = useMemo(() => {
    return new Set(entities.map((e) => e.logicalName));
  }, [entities]);

  // Build the flattened list of items
  const flatItems = useMemo(() => {
    const items: ListItem[] = [];
    const groupedEntityNames = new Set<string>();

    for (const group of derivedGroups) {
      // Only include entities that are in the visible (filtered) list
      const groupEntities = group.entityNames.filter((name) => visibleEntityNames.has(name));
      if (groupEntities.length === 0) continue;

      const selectedCount = groupEntities.filter((name) => selectedEntities.has(name)).length;
      items.push({
        type: 'group-header',
        group,
        entityCount: groupEntities.length,
        selectedCount,
      });

      if (!collapsedGroups.has(group.color)) {
        for (const name of groupEntities) {
          const entity = entityMap.get(name);
          if (entity) {
            items.push({
              type: 'entity',
              entity,
              isSelected: selectedEntities.has(name),
            });
          }
        }
      }

      for (const name of groupEntities) {
        groupedEntityNames.add(name);
      }
    }

    // Ungrouped entities (no color override)
    const ungroupedEntities = entities.filter((e) => !groupedEntityNames.has(e.logicalName));
    if (ungroupedEntities.length > 0) {
      const ungroupedSelectedCount = ungroupedEntities.filter((e) =>
        selectedEntities.has(e.logicalName)
      ).length;

      items.push({
        type: 'group-header',
        group: {
          color: '__ungrouped__',
          name: 'Ungrouped',
          entityNames: ungroupedEntities.map((e) => e.logicalName),
        },
        entityCount: ungroupedEntities.length,
        selectedCount: ungroupedSelectedCount,
      });

      if (!collapsedGroups.has('__ungrouped__')) {
        for (const entity of ungroupedEntities) {
          items.push({
            type: 'entity',
            entity,
            isSelected: selectedEntities.has(entity.logicalName),
          });
        }
      }
    }

    return items;
  }, [derivedGroups, entities, selectedEntities, collapsedGroups, entityMap, visibleEntityNames]);

  // Cumulative offset array for variable-height virtual scrolling
  const { offsets, totalHeight } = useMemo(() => {
    const offs = new Array<number>(flatItems.length + 1);
    offs[0] = 0;
    for (let i = 0; i < flatItems.length; i++) {
      offs[i + 1] =
        offs[i] + (flatItems[i].type === 'group-header' ? GROUP_HEADER_HEIGHT : ENTITY_ITEM_HEIGHT);
    }
    return { offsets: offs, totalHeight: offs[flatItems.length] };
  }, [flatItems]);

  // Custom virtual scrolling for variable-height items:
  // we precompute cumulative offsets and use binary search to find the visible range.
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop((e.target as HTMLDivElement).scrollTop);
  }, []);

  // Binary search for first visible item
  const visibleRange = useMemo(() => {
    const viewStart = scrollTop;
    const viewEnd = scrollTop + containerHeight;

    // Binary search for start index
    let lo = 0;
    let hi = flatItems.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (offsets[mid + 1] <= viewStart) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    const startIdx = Math.max(0, lo - OVERSCAN);

    // Find end index
    let endIdx = lo;
    while (endIdx < flatItems.length && offsets[endIdx] < viewEnd) {
      endIdx++;
    }
    endIdx = Math.min(flatItems.length - 1, endIdx + OVERSCAN);

    return { startIdx, endIdx };
  }, [scrollTop, containerHeight, flatItems.length, offsets]);

  const toggleGroup = useCallback((color: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(color)) {
        next.delete(color);
      } else {
        next.add(color);
      }
      return next;
    });
  }, []);

  const startRename = useCallback((color: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingGroup(color);
    setRenameValue(currentName);
    // Focus input after render
    setTimeout(() => renameInputRef.current?.focus(), 0);
  }, []);

  const confirmRename = useCallback(() => {
    if (renamingGroup && renameValue.trim()) {
      onSetGroupName(renamingGroup, renameValue.trim());
    }
    setRenamingGroup(null);
    setRenameValue('');
  }, [renamingGroup, renameValue, onSetGroupName]);

  const cancelRename = useCallback(() => {
    setRenamingGroup(null);
    setRenameValue('');
  }, []);

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        confirmRename();
      } else if (e.key === 'Escape') {
        cancelRename();
      }
    },
    [confirmRename, cancelRename]
  );

  // Keyboard navigation handler for both group headers and entity rows
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, idx: number) => {
      const item = flatItems[idx];
      if (!item) return;

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (item.type === 'group-header') {
            toggleGroup(item.group.color);
          } else {
            onToggleEntity(item.entity.logicalName);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (idx < flatItems.length - 1) {
            const next = idx + 1;
            setFocusedIndex(next);
            const el = itemRefs.current.get(next);
            if (el) {
              el.focus();
              el.scrollIntoView({ block: 'nearest' });
            }
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (idx > 0) {
            const prev = idx - 1;
            setFocusedIndex(prev);
            const el = itemRefs.current.get(prev);
            if (el) {
              el.focus();
              el.scrollIntoView({ block: 'nearest' });
            }
          }
          break;
        case 'Home': {
          e.preventDefault();
          setFocusedIndex(0);
          const el = itemRefs.current.get(0);
          if (el) {
            el.focus();
            el.scrollIntoView({ block: 'nearest' });
          }
          break;
        }
        case 'End': {
          e.preventDefault();
          const last = flatItems.length - 1;
          setFocusedIndex(last);
          const el = itemRefs.current.get(last);
          if (el) {
            el.focus();
            el.scrollIntoView({ block: 'nearest' });
          }
          break;
        }
      }
    },
    [flatItems, toggleGroup, onToggleEntity]
  );

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      role="tree"
      aria-label="Grouped entity list"
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {flatItems.map((item, idx) => {
          if (idx < visibleRange.startIdx || idx > visibleRange.endIdx) return null;

          if (item.type === 'group-header') {
            const isCollapsed = collapsedGroups.has(item.group.color);
            const isUngrouped = item.group.color === '__ungrouped__';
            const isRenaming = renamingGroup === item.group.color;

            return (
              <div
                key={`group-${item.group.color}`}
                ref={(el) => {
                  if (el) itemRefs.current.set(idx, el);
                  else itemRefs.current.delete(idx);
                }}
                className={styles.groupHeader}
                onClick={() => toggleGroup(item.group.color)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                onFocus={() => setFocusedIndex(idx)}
                tabIndex={focusedIndex === idx || (focusedIndex === -1 && idx === 0) ? 0 : -1}
                style={{
                  position: 'absolute',
                  top: offsets[idx],
                  left: 0,
                  right: 0,
                  height: GROUP_HEADER_HEIGHT,
                  borderBottom: `1px solid ${borderColor}`,
                  background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                }}
                role="treeitem"
                aria-expanded={!isCollapsed}
              >
                <ChevronRight
                  size={14}
                  className={`${styles.groupChevron} ${isCollapsed ? '' : styles.groupChevronExpanded}`}
                  style={{ color: textSecondary }}
                />
                {!isUngrouped && (
                  <div
                    className={styles.groupColorSwatch}
                    style={{ background: item.group.color }}
                  />
                )}
                {isRenaming ? (
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={confirmRename}
                    onKeyDown={handleRenameKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    className={styles.groupRenameInput}
                    style={{
                      color: isDarkMode ? '#e2e8f0' : '#1e293b',
                      background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      borderColor: borderColor,
                    }}
                  />
                ) : (
                  <span className={styles.groupName}>{item.group.name}</span>
                )}
                <span className={styles.groupCount} style={{ color: textSecondary }}>
                  {item.selectedCount}/{item.entityCount}
                </span>
                {!isUngrouped && !isRenaming && (
                  <button
                    className={styles.groupRenameBtn}
                    onClick={(e) => startRename(item.group.color, item.group.name, e)}
                    title="Rename group"
                    style={{ color: textSecondary }}
                  >
                    <Pencil size={12} />
                  </button>
                )}
              </div>
            );
          }

          // Entity item
          const { entity, isSelected } = item;

          return (
            <div
              key={entity.logicalName}
              ref={(el) => {
                if (el) itemRefs.current.set(idx, el);
                else itemRefs.current.delete(idx);
              }}
              role="treeitem"
              aria-selected={isSelected}
              tabIndex={focusedIndex === idx || (focusedIndex === -1 && idx === 0) ? 0 : -1}
              onClick={() => onToggleEntity(entity.logicalName)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              onFocus={() => setFocusedIndex(idx)}
              style={{
                position: 'absolute',
                top: offsets[idx],
                left: 0,
                right: 0,
                height: ENTITY_ITEM_HEIGHT,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px 8px 28px',
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
              <EntityItemContent
                entity={entity}
                isSelected={isSelected}
                customTableColor={customTableColor}
                standardTableColor={standardTableColor}
                lookupColor={lookupColor}
                textSecondary={textSecondary}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});
