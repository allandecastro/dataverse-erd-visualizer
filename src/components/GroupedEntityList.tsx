/**
 * Grouped entity list with collapsible group sections
 * Replaces VirtualEntityList when entities have color-based groups
 */

import { memo, useCallback, useRef, useState, useMemo } from 'react';
import { ChevronRight, Link2, Pencil } from 'lucide-react';
import type { Entity } from '@/types';
import type { ThemeColors, ColorSettings, DerivedGroup } from '@/types/erdTypes';
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

  // Use the fixed-height virtual scroll hook with an average item height
  // We'll compute our own visible range using binary search instead
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
                className={styles.groupHeader}
                onClick={() => toggleGroup(item.group.color)}
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
          const hasLookups = entity.attributes.some(
            (a) => a.type === 'Lookup' || a.type === 'Owner'
          );

          return (
            <div
              key={entity.logicalName}
              role="treeitem"
              aria-selected={isSelected}
              onClick={() => onToggleEntity(entity.logicalName)}
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
