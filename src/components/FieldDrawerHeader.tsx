/**
 * Field Drawer header with title, search and filter buttons
 */

import { memo } from 'react';
import { X, Search, CheckCircle, Link } from 'lucide-react';
import styles from '@/styles/FieldDrawerHeader.module.css';

export interface FieldDrawerHeaderProps {
  entityDisplayName: string;
  /** ID for the title element, used for aria-labelledby */
  titleId?: string;
  searchQuery: string;
  showSelectedOnly: boolean;
  showLookupsOnly: boolean;
  isDarkMode: boolean;
  headerBg: string;
  borderColor: string;
  textColor: string;
  textSecondary: string;
  inputBg: string;
  inputBorder: string;
  onSearchChange: (value: string) => void;
  onToggleSelectedOnly: () => void;
  onToggleLookupsOnly: () => void;
  onClose: () => void;
}

export const FieldDrawerHeader = memo(function FieldDrawerHeader({
  entityDisplayName,
  titleId,
  searchQuery,
  showSelectedOnly,
  showLookupsOnly,
  isDarkMode,
  headerBg,
  borderColor,
  textColor,
  textSecondary,
  inputBg,
  inputBorder,
  onSearchChange,
  onToggleSelectedOnly,
  onToggleLookupsOnly,
  onClose,
}: FieldDrawerHeaderProps) {
  const getSelectedButtonStyle = () => ({
    background: showSelectedOnly
      ? isDarkMode
        ? '#166534'
        : '#dcfce7'
      : isDarkMode
        ? '#374151'
        : '#f3f4f6',
    color: showSelectedOnly ? (isDarkMode ? '#86efac' : '#166534') : textSecondary,
  });

  const getLookupsButtonStyle = () => ({
    background: showLookupsOnly
      ? isDarkMode
        ? '#9a3412'
        : '#ffedd5'
      : isDarkMode
        ? '#374151'
        : '#f3f4f6',
    color: showLookupsOnly ? (isDarkMode ? '#fdba74' : '#9a3412') : textSecondary,
  });

  return (
    <div
      className={styles.container}
      style={{ background: headerBg, borderBottom: `1px solid ${borderColor}` }}
    >
      <div className={styles.titleRow}>
        <div>
          <h2 id={titleId} className={styles.title} style={{ color: textColor }}>
            Add Fields
          </h2>
          <div className={styles.subtitle} style={{ color: textSecondary }}>
            {entityDisplayName}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close field drawer"
          className={styles.closeButton}
          style={{ color: textSecondary }}
          title="Close"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      {/* Search */}
      <div className={styles.searchContainer}>
        <Search
          size={14}
          aria-hidden="true"
          className={styles.searchIcon}
          style={{ color: textSecondary }}
        />
        <input
          type="text"
          placeholder="Search fields..."
          aria-label="Search fields"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={styles.searchInput}
          style={{
            background: inputBg,
            border: `1px solid ${inputBorder}`,
            color: textColor,
          }}
        />
      </div>

      {/* Filter Toggle Buttons */}
      <div role="group" aria-label="Filter options" className={styles.filterGroup}>
        <button
          onClick={onToggleSelectedOnly}
          aria-pressed={showSelectedOnly}
          aria-label="Show selected fields only"
          className={styles.filterButton}
          style={getSelectedButtonStyle()}
        >
          <CheckCircle size={14} aria-hidden="true" />
          Selected
        </button>
        <button
          onClick={onToggleLookupsOnly}
          aria-pressed={showLookupsOnly}
          aria-label="Show lookup fields only"
          className={styles.filterButton}
          style={getLookupsButtonStyle()}
        >
          <Link size={14} aria-hidden="true" />
          Lookups
        </button>
      </div>
    </div>
  );
});
