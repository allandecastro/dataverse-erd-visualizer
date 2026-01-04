/**
 * Sidebar filters: search, publisher, solution, layout mode, expand/collapse
 */

import { Search, RefreshCw, Eye, EyeOff } from 'lucide-react';
import type { LayoutMode } from '@/types/erdTypes';

export interface SidebarFiltersProps {
  searchQuery: string;
  publisherFilter: string;
  solutionFilter: string;
  publishers: string[];
  solutions: string[];
  layoutMode: LayoutMode;
  isDarkMode: boolean;
  borderColor: string;
  textColor: string;
  textSecondary: string;
  onSearchChange: (value: string) => void;
  onPublisherFilterChange: (value: string) => void;
  onSolutionFilterChange: (value: string) => void;
  onLayoutModeChange: (mode: LayoutMode) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

export function SidebarFilters({
  searchQuery,
  publisherFilter,
  solutionFilter,
  publishers,
  solutions,
  layoutMode,
  isDarkMode,
  borderColor,
  textColor,
  textSecondary,
  onSearchChange,
  onPublisherFilterChange,
  onSolutionFilterChange,
  onLayoutModeChange,
  onExpandAll,
  onCollapseAll,
}: SidebarFiltersProps) {
  const buttonStyle = {
    flex: 1,
    padding: '8px',
    background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    border: `1px solid ${borderColor}`,
    borderRadius: '6px',
    color: textColor,
    cursor: 'pointer',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
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
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
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

  const cycleLayoutMode = () => {
    const modes: LayoutMode[] = ['force', 'grid', 'auto'];
    const currentIndex = modes.indexOf(layoutMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    onLayoutModeChange(nextMode);
  };

  return (
    <>
      {/* Search */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: textSecondary,
            }}
          />
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
              boxSizing: 'border-box',
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
        {publishers
          .filter((p) => p !== 'all')
          .map((pub) => (
            <option key={pub} value={pub}>
              {pub}
            </option>
          ))}
      </select>

      <select
        key={`solution-${isDarkMode}`}
        value={solutionFilter}
        onChange={(e) => onSolutionFilterChange(e.target.value)}
        style={{ ...selectStyle, marginBottom: '12px' }}
      >
        <option value="all">All Solutions</option>
        {solutions
          .filter((s) => s !== 'all')
          .map((sol) => (
            <option key={sol} value={sol}>
              {sol}
            </option>
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
    </>
  );
}
