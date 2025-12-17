/**
 * Sidebar component with entity list, filters, and settings
 */

import { useState, useRef, useEffect } from 'react';
import { Database, Moon, Sun, Settings, Search, RefreshCw, Eye, EyeOff, Link2 } from 'lucide-react';
import type { Entity } from '@/types';
import type { LayoutMode, ThemeColors, ColorSettings } from '../types';
import { VirtualEntityList } from './VirtualEntityList';

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
  const { customTableColor, standardTableColor, lookupColor } = colorSettings;

  // Container height measurement for virtual scrolling
  const entityListContainerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(400); // Default height

  // Measure container height on mount and resize
  useEffect(() => {
    const measureHeight = () => {
      if (entityListContainerRef.current) {
        const rect = entityListContainerRef.current.getBoundingClientRect();
        // Subtract header (Tables count + buttons) height (~44px)
        setContainerHeight(Math.max(100, rect.height - 44));
      }
    };

    measureHeight();
    window.addEventListener('resize', measureHeight);

    // Use ResizeObserver for more accurate measurements
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
  const displayedEntities = entities.filter(entity => {
    const matchesSearch = entity.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entity.logicalName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPublisher = publisherFilter === 'all' || entity.publisher === publisherFilter;
    const matchesSolution = solutionFilter === 'all' || (entity.solutions?.includes(solutionFilter) ?? false);
    return matchesSearch && matchesPublisher && matchesSolution;
  });

  const cycleLayoutMode = () => {
    const modes: LayoutMode[] = ['force', 'grid', 'auto'];
    const currentIndex = modes.indexOf(layoutMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    onLayoutModeChange(nextMode);
  };

  const buttonStyle = {
    flex: 1,
    padding: '8px',
    background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    border: `1px solid ${borderColor}`,
    borderRadius: '6px',
    color: textColor,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontSize: '12px',
  };

  const smallButtonStyle = {
    flex: 1,
    padding: '6px',
    background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
    border: `1px solid ${borderColor}`,
    borderRadius: '4px',
    color: textColor,
    fontSize: '11px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
  };

  const selectStyle = {
    width: '100%',
    padding: '10px 32px 10px 12px',
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    border: `1px solid ${borderColor}`,
    borderRadius: '6px',
    color: textColor,
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer',
    marginBottom: '8px',
    WebkitAppearance: 'none' as const,
    MozAppearance: 'none' as const,
    appearance: 'none' as const,
    backgroundImage: `linear-gradient(45deg, transparent 50%, ${textColor} 50%), linear-gradient(135deg, ${textColor} 50%, transparent 50%)`,
    backgroundPosition: 'calc(100% - 16px) calc(1em + 2px), calc(100% - 11px) calc(1em + 2px)',
    backgroundSize: '5px 5px, 5px 5px',
    backgroundRepeat: 'no-repeat',
  };

  return (
    <div style={{
      width: '320px',
      borderRight: `1px solid ${borderColor}`,
      backgroundColor: panelBg,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ padding: '20px', borderBottom: `1px solid ${borderColor}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Database size={28} color="#60a5fa" />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px', fontWeight: '600' }}>Dataverse ERD</span>
              <span style={{
                fontSize: '10px',
                fontWeight: '700',
                padding: '2px 6px',
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                color: '#ffffff',
                borderRadius: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                BETA
              </span>
              <span style={{ fontSize: '11px', color: textSecondary, fontWeight: '500' }}>v0.1.0</span>
            </div>
            <div style={{ fontSize: '12px', color: textSecondary }}>Entity Relationship Diagram</div>
          </div>
        </div>

        {/* Theme and Settings */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={onToggleDarkMode} style={buttonStyle}>
            {isDarkMode ? <Moon size={14} /> : <Sun size={14} />}
            {isDarkMode ? 'Dark' : 'Light'}
          </button>
          <button
            onClick={onToggleSettings}
            style={{
              padding: '8px',
              background: showSettings ? (isDarkMode ? 'rgba(96, 165, 250, 0.2)' : 'rgba(37, 99, 235, 0.2)') : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
              border: `1px solid ${showSettings ? (isDarkMode ? '#60a5fa' : '#2563eb') : borderColor}`,
              borderRadius: '6px',
              color: textColor,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Settings size={16} />
          </button>
        </div>

        {/* Color Settings */}
        {showSettings && (
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
            borderRadius: '6px',
            border: `1px solid ${borderColor}`
          }}>
            <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '10px' }}>Color Settings</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '11px', color: textSecondary, display: 'block', marginBottom: '4px' }}>Custom Table Color</label>
                <input
                  type="color"
                  value={customTableColor}
                  onChange={(e) => onColorSettingsChange('customTableColor', e.target.value)}
                  style={{ width: '100%', height: '32px', borderRadius: '4px', border: `1px solid ${borderColor}`, cursor: 'pointer' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: textSecondary, display: 'block', marginBottom: '4px' }}>Standard Table Color</label>
                <input
                  type="color"
                  value={standardTableColor}
                  onChange={(e) => onColorSettingsChange('standardTableColor', e.target.value)}
                  style={{ width: '100%', height: '32px', borderRadius: '4px', border: `1px solid ${borderColor}`, cursor: 'pointer' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: textSecondary, display: 'block', marginBottom: '4px' }}>Lookup Field Color</label>
                <input
                  type="color"
                  value={lookupColor}
                  onChange={(e) => onColorSettingsChange('lookupColor', e.target.value)}
                  style={{ width: '100%', height: '32px', borderRadius: '4px', border: `1px solid ${borderColor}`, cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: textSecondary }} />
            <input
              type="text"
              placeholder="Search tables..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                border: `1px solid ${borderColor}`,
                borderRadius: '6px',
                color: textColor,
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Filters */}
        <select
          key={`publisher-${isDarkMode}`}
          value={publisherFilter}
          onChange={(e) => onPublisherFilterChange(e.target.value)}
          style={selectStyle}
        >
          <option value="all">All Publishers</option>
          {publishers.filter(p => p !== 'all').map(pub => (
            <option key={pub} value={pub}>{pub}</option>
          ))}
        </select>

        <select
          key={`solution-${isDarkMode}`}
          value={solutionFilter}
          onChange={(e) => onSolutionFilterChange(e.target.value)}
          style={{ ...selectStyle, marginBottom: '12px' }}
        >
          <option value="all">All Solutions</option>
          {solutions.filter(s => s !== 'all').map(sol => (
            <option key={sol} value={sol}>{sol}</option>
          ))}
        </select>

        {/* Layout Mode */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button onClick={cycleLayoutMode} style={buttonStyle}>
            <RefreshCw size={14} />
            {layoutMode === 'force' ? 'Force' : layoutMode === 'grid' ? 'Grid' : 'Auto'}
          </button>
        </div>

        {/* Expand/Collapse */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <button onClick={onExpandAll} style={smallButtonStyle}>
            <Eye size={12} />
            Expand All
          </button>
          <button onClick={onCollapseAll} style={smallButtonStyle}>
            <EyeOff size={12} />
            Collapse All
          </button>
        </div>
      </div>

      {/* Entity List */}
      <div ref={entityListContainerRef} style={{ flex: 1, overflow: 'hidden', padding: '16px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>
            Tables ({selectedEntities.size}/{entities.length})
            {displayedEntities.length !== entities.length && (
              <span style={{ fontSize: '12px', color: textSecondary, marginLeft: '8px' }}>
                (showing {displayedEntities.length})
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={onSelectAll} style={{
              padding: '4px 10px',
              background: 'transparent',
              border: `1px solid ${borderColor}`,
              borderRadius: '4px',
              color: textColor,
              fontSize: '11px',
              cursor: 'pointer'
            }}>All</button>
            <button onClick={onDeselectAll} style={{
              padding: '4px 10px',
              background: 'transparent',
              border: `1px solid ${borderColor}`,
              borderRadius: '4px',
              color: textColor,
              fontSize: '11px',
              cursor: 'pointer'
            }}>None</button>
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
      <div style={{ padding: '16px', borderTop: `1px solid ${borderColor}` }}>
        <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Legend</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '12px', background: customTableColor, borderRadius: '2px' }} />
            <span>Custom Table</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '12px', background: standardTableColor, borderRadius: '2px' }} />
            <span>Standard Table</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link2 size={14} color={lookupColor} />
            <span>Has Lookup Fields</span>
          </div>
        </div>
      </div>

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
