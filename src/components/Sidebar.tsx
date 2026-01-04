/**
 * Sidebar component with entity list, filters, and settings
 */

import { useState, useRef, useEffect } from 'react';
import type { Entity } from '@/types';
import type { LayoutMode, ThemeColors, ColorSettings } from '@/types/erdTypes';
import { VirtualEntityList } from './VirtualEntityList';
import { SidebarHeader } from './SidebarHeader';
import { SidebarSettings } from './SidebarSettings';
import { SidebarFilters } from './SidebarFilters';
import { SidebarLegend } from './SidebarLegend';

export interface SidebarProps {
  entities: Entity[];
  selectedEntities: Set<string>;
  searchQuery: string;
  publisherFilter: string;
  solutionFilter: string;
  publishers: string[];
  solutions: string[];
  layoutMode: LayoutMode;
  isDarkMode: boolean;
  showSettings: boolean;
  colorSettings: ColorSettings;
  themeColors: ThemeColors;
  onToggleEntity: (entityName: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onSearchChange: (value: string) => void;
  onPublisherFilterChange: (value: string) => void;
  onSolutionFilterChange: (value: string) => void;
  onLayoutModeChange: (mode: LayoutMode) => void;
  onToggleDarkMode: () => void;
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
  isDarkMode,
  showSettings,
  colorSettings,
  themeColors,
  onToggleEntity,
  onSelectAll,
  onDeselectAll,
  onExpandAll,
  onCollapseAll,
  onSearchChange,
  onPublisherFilterChange,
  onSolutionFilterChange,
  onLayoutModeChange,
  onToggleDarkMode,
  onToggleSettings,
  onColorSettingsChange,
}: SidebarProps) {
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
    <div
      style={{
        width: '320px',
        borderRight: `1px solid ${borderColor}`,
        backgroundColor: panelBg,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header Section */}
      <div style={{ padding: '20px', borderBottom: `1px solid ${borderColor}` }}>
        <SidebarHeader
          isDarkMode={isDarkMode}
          showSettings={showSettings}
          borderColor={borderColor}
          textColor={textColor}
          textSecondary={textSecondary}
          onToggleDarkMode={onToggleDarkMode}
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
        ref={entityListContainerRef}
        style={{
          flex: 1,
          overflow: 'hidden',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: '600' }}>
            Tables ({selectedEntities.size}/{entities.length})
            {displayedEntities.length !== entities.length && (
              <span style={{ fontSize: '12px', color: textSecondary, marginLeft: '8px' }}>
                (showing {displayedEntities.length})
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={onSelectAll}
              style={{
                padding: '4px 10px',
                background: 'transparent',
                border: `1px solid ${borderColor}`,
                borderRadius: '4px',
                color: textColor,
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              All
            </button>
            <button
              onClick={onDeselectAll}
              style={{
                padding: '4px 10px',
                background: 'transparent',
                border: `1px solid ${borderColor}`,
                borderRadius: '4px',
                color: textColor,
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              None
            </button>
          </div>
        </div>

        {/* Virtual scrolling entity list */}
        <div style={{ flex: 1, minHeight: 0 }}>
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
    </div>
  );
}
