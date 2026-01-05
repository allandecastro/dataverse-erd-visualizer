/**
 * Sidebar filters: search, publisher, solution, layout mode, expand/collapse
 */

import { memo } from 'react';
import { Search, RefreshCw, Eye, EyeOff } from 'lucide-react';
import type { LayoutMode } from '@/types/erdTypes';
import styles from '@/styles/Sidebar.module.css';

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

export const SidebarFilters = memo(function SidebarFilters({
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
  const buttonBg = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
  const smallButtonBg = isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)';
  const inputBg = isDarkMode ? '#1a1a1a' : '#ffffff';

  const selectArrowBg = `linear-gradient(45deg, transparent 50%, ${textColor} 50%), linear-gradient(135deg, ${textColor} 50%, transparent 50%)`;

  const cycleLayoutMode = () => {
    const modes: LayoutMode[] = ['force', 'grid', 'auto'];
    const currentIndex = modes.indexOf(layoutMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    onLayoutModeChange(nextMode);
  };

  return (
    <>
      {/* Search */}
      <div className={styles.searchContainer}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} style={{ color: textSecondary }} />
          <input
            type="text"
            placeholder="Search tables..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={styles.searchInput}
            style={{
              background: smallButtonBg,
              border: `1px solid ${borderColor}`,
              color: textColor,
            }}
          />
        </div>
      </div>

      {/* Filters */}
      <select
        key={`publisher-${isDarkMode}`}
        value={publisherFilter}
        onChange={(e) => onPublisherFilterChange(e.target.value)}
        className={styles.select}
        style={{
          background: inputBg,
          border: `1px solid ${borderColor}`,
          color: textColor,
          backgroundImage: selectArrowBg,
        }}
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
        className={styles.select}
        style={{
          background: inputBg,
          border: `1px solid ${borderColor}`,
          color: textColor,
          backgroundImage: selectArrowBg,
          marginBottom: '12px',
        }}
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
      <div className={styles.layoutButtonGroup}>
        <button
          onClick={cycleLayoutMode}
          className={styles.layoutButton}
          style={{
            background: buttonBg,
            border: `1px solid ${borderColor}`,
            color: textColor,
          }}
        >
          <RefreshCw size={14} />
          {layoutMode === 'force' ? 'Force' : layoutMode === 'grid' ? 'Grid' : 'Auto'}
        </button>
      </div>

      {/* Expand/Collapse */}
      <div className={styles.expandCollapseGroup}>
        <button
          onClick={onExpandAll}
          className={styles.expandCollapseButton}
          style={{
            background: smallButtonBg,
            border: `1px solid ${borderColor}`,
            color: textColor,
          }}
        >
          <Eye size={12} />
          Expand All
        </button>
        <button
          onClick={onCollapseAll}
          className={styles.expandCollapseButton}
          style={{
            background: smallButtonBg,
            border: `1px solid ${borderColor}`,
            color: textColor,
          }}
        >
          <EyeOff size={12} />
          Collapse All
        </button>
      </div>
    </>
  );
});
