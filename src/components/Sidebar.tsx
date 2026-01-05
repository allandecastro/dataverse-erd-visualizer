/**
 * Sidebar component with entity list, filters, and settings
 */

import { useState, useRef, useEffect } from 'react';
import type { Entity } from '@/types';
import type { LayoutMode, ColorSettings } from '@/types/erdTypes';
import { useTheme } from '@/context';
import { VirtualEntityList } from './VirtualEntityList';
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
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onSearchChange: (value: string) => void;
  onPublisherFilterChange: (value: string) => void;
  onSolutionFilterChange: (value: string) => void;
  onLayoutModeChange: (mode: LayoutMode) => void;
  onToggleSettings: () => void;
  onColorSettingsChange: (key: keyof ColorSettings, value: string) => void;
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

  // Filter entities for display
  const displayedEntities = entities.filter((entity) => {
    const matchesSearch =
      entity.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entity.logicalName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPublisher = publisherFilter === 'all' || entity.publisher === publisherFilter;
    const matchesSolution =
      solutionFilter === 'all' || (entity.solutions?.includes(solutionFilter) ?? false);
    return matchesSearch && matchesPublisher && matchesSolution;
  });

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
              onClick={onSelectAll}
              className={styles.smallButton}
              style={{ border: `1px solid ${borderColor}`, color: textColor }}
            >
              All
            </button>
            <button
              onClick={onDeselectAll}
              className={styles.smallButton}
              style={{ border: `1px solid ${borderColor}`, color: textColor }}
            >
              None
            </button>
          </div>
        </div>

        {/* Virtual scrolling entity list */}
        <div className={styles.entityListWrapper}>
          <VirtualEntityList
            entities={displayedEntities}
            selectedEntities={selectedEntities}
            isDarkMode={isDarkMode}
            themeColors={themeColors}
            colorSettings={colorSettings}
            onToggleEntity={onToggleEntity}
            containerHeight={containerHeight}
          />
        </div>
      </div>

      {/* Legend */}
      <SidebarLegend colorSettings={colorSettings} borderColor={borderColor} />

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
