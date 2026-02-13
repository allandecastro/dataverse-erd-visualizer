/**
 * Sidebar filters: search, publisher, solution, layout mode, expand/collapse
 */

import { memo } from 'react';
import { Search, Eye, EyeOff } from 'lucide-react';
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
  const smallButtonBg = isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)';
  const inputBg = isDarkMode ? '#1a1a1a' : '#ffffff';

  // SVG chevron arrow for select dropdown - properly encoded for CSS url()
  const arrowColor = isDarkMode ? '%23e2e8f0' : '%231e293b';
  const selectArrowBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${arrowColor}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

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
          backgroundColor: inputBg,
          border: `1px solid ${borderColor}`,
          color: textColor,
          backgroundImage: selectArrowBg,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'calc(100% - 12px) center',
          backgroundSize: '12px 12px',
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
          backgroundColor: inputBg,
          border: `1px solid ${borderColor}`,
          color: textColor,
          backgroundImage: selectArrowBg,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'calc(100% - 12px) center',
          backgroundSize: '12px 12px',
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
      <select
        key={`layout-${isDarkMode}`}
        value={layoutMode}
        onChange={(e) => onLayoutModeChange(e.target.value as LayoutMode)}
        className={styles.select}
        style={{
          backgroundColor: inputBg,
          border: `1px solid ${borderColor}`,
          color: textColor,
          backgroundImage: selectArrowBg,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'calc(100% - 12px) center',
          backgroundSize: '12px 12px',
        }}
      >
        <option value="force">Layout: Force-Directed</option>
        <option value="grid">Layout: Grid</option>
        <option value="auto">Layout: Auto-Arrange</option>
        <option value="nicolas">Layout: NICOLAS</option>
        <option value="manual">Layout: Manual</option>
      </select>

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
