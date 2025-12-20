/**
 * Sidebar component with entity list, filters, and settings
 */

import { useState, useRef, useEffect } from 'react';
import { Moon, Sun, Settings, Search, RefreshCw, Eye, EyeOff, Link2 } from 'lucide-react';
import type { Entity } from '@/types';
import type { LayoutMode, ThemeColors, ColorSettings } from '../types';
import { VirtualEntityList } from './VirtualEntityList';

// Inline logo as data URL for Dataverse web resource compatibility
const LOGO_DATA_URL = `data:image/svg+xml,${encodeURIComponent(`<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="dvGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:rgb(236, 72, 153)"/><stop offset="100%" style="stop-color:rgb(139, 92, 246)"/></linearGradient><clipPath id="logoClip"><rect x="0" y="0" width="400" height="400" rx="40"/></clipPath></defs><g clip-path="url(#logoClip)"><rect x="0" y="0" width="400" height="400" rx="40" fill="url(#dvGrad)"/><rect x="60" y="60" width="100" height="80" rx="8" fill="#ffffff"/><rect x="60" y="60" width="100" height="24" rx="8" fill="#1e1b4b"/><line x1="70" y1="98" x2="140" y2="98" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/><line x1="70" y1="114" x2="130" y2="114" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/><line x1="70" y1="130" x2="120" y2="130" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/><rect x="240" y="60" width="100" height="80" rx="8" fill="#ffffff"/><rect x="240" y="60" width="100" height="24" rx="8" fill="#1e1b4b"/><line x1="250" y1="98" x2="320" y2="98" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/><line x1="250" y1="114" x2="310" y2="114" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/><line x1="250" y1="130" x2="300" y2="130" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/><rect x="150" y="200" width="100" height="80" rx="8" fill="#ffffff"/><rect x="150" y="200" width="100" height="24" rx="8" fill="#1e1b4b"/><line x1="160" y1="238" x2="230" y2="238" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/><line x1="160" y1="254" x2="220" y2="254" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/><line x1="160" y1="270" x2="210" y2="270" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/><path d="M 160 100 L 240 100" stroke="#fbbf24" stroke-width="4" fill="none"/><path d="M 110 140 L 110 170 L 175 200" stroke="#fbbf24" stroke-width="4" fill="none"/><path d="M 290 140 L 290 170 L 225 200" stroke="#fbbf24" stroke-width="4" fill="none"/><circle cx="160" cy="100" r="6" fill="#fbbf24"/><circle cx="240" cy="100" r="6" fill="#fbbf24"/><circle cx="110" cy="140" r="6" fill="#fbbf24"/><circle cx="175" cy="200" r="6" fill="#fbbf24"/><circle cx="290" cy="140" r="6" fill="#fbbf24"/><circle cx="225" cy="200" r="6" fill="#fbbf24"/></g></svg>`)}`;

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
        {/* Header row: Logo + Title + Social icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <a
            href="https://github.com/allandecastro/dataverse-erd-visualizer"
            target="_blank"
            rel="noopener noreferrer"
            title="View on GitHub"
            style={{ display: 'flex', flexShrink: 0, transition: 'opacity 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <img
              src={LOGO_DATA_URL}
              alt="Dataverse ERD Visualizer"
              style={{ width: '36px', height: '36px', borderRadius: '6px', cursor: 'pointer' }}
            />
          </a>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              Dataverse ERD Visualizer
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
              <span style={{ fontSize: '10px', color: textSecondary, fontWeight: '500' }}>v{__APP_VERSION__}</span>
              <span style={{
                fontSize: '8px',
                fontWeight: '700',
                padding: '1px 4px',
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                color: '#ffffff',
                borderRadius: '3px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                BETA
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
            <a
              href="https://github.com/allandecastro/dataverse-erd-visualizer"
              target="_blank"
              rel="noopener noreferrer"
              title="View on GitHub"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '26px',
                height: '26px',
                borderRadius: '5px',
                background: isDarkMode ? '#ffffff' : '#24292f',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={isDarkMode ? '#24292f' : '#ffffff'}>
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/allandecastro/"
              target="_blank"
              rel="noopener noreferrer"
              title="Connect on LinkedIn"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '26px',
                height: '26px',
                borderRadius: '5px',
                background: '#0A66C2',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffffff">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
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
