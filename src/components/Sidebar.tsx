/**
 * Sidebar component with entity list, filters, and settings
 */

import { useState, useRef, useEffect } from 'react';
import type { Entity } from '@/types';
import type { LayoutMode, ColorSettings, DerivedGroup } from '@/types/erdTypes';
import { useTheme } from '@/context';
import { getEntityPublisher } from '@/utils/entityUtils';
import { VirtualEntityList } from './VirtualEntityList';
import { GroupedEntityList } from './GroupedEntityList';
import { SidebarHeader } from './SidebarHeader';
import { SidebarSettings } from './SidebarSettings';
import { SidebarFilters } from './SidebarFilters';
import { SidebarLegend } from './SidebarLegend';
import styles from '@/styles/Sidebar.module.css';

export interface SidebarProps {
  entities: Entity[];
  selectedEntities: Set<string>;
  searchQuery: string;
  publisherFilter: string;
  solutionFilter: string;
  publishers: string[];
  solutions: string[];
  layoutMode: LayoutMode;
  showSettings: boolean;
  colorSettings: ColorSettings;
  onToggleEntity: (entityName: string) => void;
  onSelectAll: (entityNames?: string[]) => void;
  onDeselectAll: (entityNames?: string[]) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onSearchChange: (value: string) => void;
  onPublisherFilterChange: (value: string) => void;
  onSolutionFilterChange: (value: string) => void;
  onLayoutModeChange: (mode: LayoutMode) => void;
  onToggleSettings: () => void;
  onColorSettingsChange: (key: keyof ColorSettings, value: string) => void;
  entityColorOverrideCount: number;
  onResetAllEntityColors: () => void;
  entityColorOverrides: Record<string, string>;
  derivedGroups: DerivedGroup[];
  groupFilter: string;
  onGroupFilterChange: (value: string) => void;
  onSetGroupName: (color: string, name: string) => void;
}

export function Sidebar({
  entities,
  selectedEntities,
  searchQuery,
  publisherFilter,
  solutionFilter,
  publishers,
  solutions,
  layoutMode,
  showSettings,
  colorSettings,
  onToggleEntity,
  onSelectAll,
  onDeselectAll,
  onExpandAll,
  onCollapseAll,
  onSearchChange,
  onPublisherFilterChange,
  onSolutionFilterChange,
  onLayoutModeChange,
  onToggleSettings,
  onColorSettingsChange,
  entityColorOverrideCount,
  onResetAllEntityColors,
  entityColorOverrides,
  derivedGroups,
  groupFilter,
  onGroupFilterChange,
  onSetGroupName,
}: SidebarProps) {
  const { isDarkMode, toggleDarkMode, themeColors } = useTheme();
  const { panelBg, borderColor, textColor, textSecondary } = themeColors;

  // Container height measurement for virtual scrolling
  const entityListContainerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(400);

  // Measure container height on mount and resize
  useEffect(() => {
    const measureHeight = () => {
      if (entityListContainerRef.current) {
        const rect = entityListContainerRef.current.getBoundingClientRect();
        setContainerHeight(Math.max(100, rect.height - 44));
      }
    };

    measureHeight();
    window.addEventListener('resize', measureHeight);

    const resizeObserver = new ResizeObserver(measureHeight);
    if (entityListContainerRef.current) {
      resizeObserver.observe(entityListContainerRef.current);
    }

    return () => {
      window.removeEventListener('resize', measureHeight);
      resizeObserver.disconnect();
    };
  }, []);

  const hasGroups = Object.keys(entityColorOverrides).length > 0;

  // Filter entities for display
  const displayedEntities = entities.filter((entity) => {
    const matchesSearch =
      entity.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entity.logicalName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPublisher =
      publisherFilter === 'all' || getEntityPublisher(entity) === publisherFilter;
    const matchesSolution =
      solutionFilter === 'all' || (entity.solutions?.includes(solutionFilter) ?? false);
    const matchesGroup =
      groupFilter === 'all' ||
      (groupFilter === '__ungrouped__'
        ? !entityColorOverrides[entity.logicalName]
        : entityColorOverrides[entity.logicalName]?.toLowerCase() === groupFilter);
    return matchesSearch && matchesPublisher && matchesSolution && matchesGroup;
  });

  // When filters are active, All/None should only affect the displayed (filtered) entities
  const isFiltered = displayedEntities.length !== entities.length;
  const handleSelectAll = () => {
    if (isFiltered) {
      onSelectAll(displayedEntities.map((e) => e.logicalName));
    } else {
      onSelectAll();
    }
  };
  const handleDeselectAll = () => {
    if (isFiltered) {
      onDeselectAll(displayedEntities.map((e) => e.logicalName));
    } else {
      onDeselectAll();
    }
  };

  return (
    <aside
      className={styles.sidebar}
      role="navigation"
      aria-label="Entity selection and filters"
      style={{
        borderRight: `1px solid ${borderColor}`,
        backgroundColor: panelBg,
      }}
    >
      {/* Header Section */}
      <div className={styles.headerSection} style={{ borderBottom: `1px solid ${borderColor}` }}>
        <SidebarHeader
          isDarkMode={isDarkMode}
          showSettings={showSettings}
          borderColor={borderColor}
          textColor={textColor}
          textSecondary={textSecondary}
          onToggleDarkMode={toggleDarkMode}
          onToggleSettings={onToggleSettings}
        />

        {showSettings && (
          <SidebarSettings
            isDarkMode={isDarkMode}
            colorSettings={colorSettings}
            borderColor={borderColor}
            textColor={textColor}
            textSecondary={textSecondary}
            onColorSettingsChange={onColorSettingsChange}
            entityColorOverrideCount={entityColorOverrideCount}
            onResetAllEntityColors={onResetAllEntityColors}
          />
        )}

        <SidebarFilters
          searchQuery={searchQuery}
          publisherFilter={publisherFilter}
          solutionFilter={solutionFilter}
          publishers={publishers}
          solutions={solutions}
          layoutMode={layoutMode}
          isDarkMode={isDarkMode}
          borderColor={borderColor}
          textColor={textColor}
          textSecondary={textSecondary}
          onSearchChange={onSearchChange}
          onPublisherFilterChange={onPublisherFilterChange}
          onSolutionFilterChange={onSolutionFilterChange}
          onLayoutModeChange={onLayoutModeChange}
          onExpandAll={onExpandAll}
          onCollapseAll={onCollapseAll}
          groupFilter={groupFilter}
          groups={derivedGroups}
          onGroupFilterChange={onGroupFilterChange}
        />
      </div>

      {/* Entity List */}
      <div
        id="entity-list"
        ref={entityListContainerRef}
        className={styles.entityListContainer}
        role="region"
        aria-label="Entity selection list"
      >
        <div className={styles.entityListHeader}>
          <div className={styles.entityCount}>
            Tables ({selectedEntities.size}/{entities.length})
            {displayedEntities.length !== entities.length && (
              <span className={styles.filterCount} style={{ color: textSecondary }}>
                (showing {displayedEntities.length})
              </span>
            )}
          </div>
          <div className={styles.buttonGroup}>
            <button
              onClick={handleSelectAll}
              className={styles.smallButton}
              style={{ border: `1px solid ${borderColor}`, color: textColor }}
            >
              All
            </button>
            <button
              onClick={handleDeselectAll}
              className={styles.smallButton}
              style={{ border: `1px solid ${borderColor}`, color: textColor }}
            >
              None
            </button>
          </div>
        </div>

        {/* Virtual scrolling entity list */}
        <div className={styles.entityListWrapper}>
          {hasGroups ? (
            <GroupedEntityList
              entities={displayedEntities}
              selectedEntities={selectedEntities}
              isDarkMode={isDarkMode}
              themeColors={themeColors}
              colorSettings={colorSettings}
              onToggleEntity={onToggleEntity}
              containerHeight={containerHeight}
              derivedGroups={derivedGroups}
              onSetGroupName={onSetGroupName}
            />
          ) : (
            <VirtualEntityList
              entities={displayedEntities}
              selectedEntities={selectedEntities}
              isDarkMode={isDarkMode}
              themeColors={themeColors}
              colorSettings={colorSettings}
              onToggleEntity={onToggleEntity}
              containerHeight={containerHeight}
            />
          )}
        </div>
      </div>

      {/* Legend */}
      <SidebarLegend
        colorSettings={colorSettings}
        borderColor={borderColor}
        derivedGroups={derivedGroups}
      />

      {/* Style for select options */}
      <style>{`
        select option {
          background-color: ${isDarkMode ? '#1a1a1a' : '#ffffff'} !important;
          color: ${textColor} !important;
        }
      `}</style>
    </aside>
  );
}
