/**
 * Field Drawer header with title, search and filter buttons
 */

import { memo } from 'react';
import { X, Search, CheckCircle, Wrench } from 'lucide-react';
import type { BadgeCount } from '../utils/badges';
import styles from '@/styles/FieldDrawerHeader.module.css';

export interface FieldDrawerHeaderProps {
  entityDisplayName: string;
  /** ID for the title element, used for aria-labelledby */
  titleId?: string;
  searchQuery: string;
  showSelectedOnly: boolean;
  showCustomOnly: boolean;
  availableBadges: BadgeCount[];
  activeBadgeFilter: string | null;
  isDarkMode: boolean;
  headerBg: string;
  borderColor: string;
  textColor: string;
  textSecondary: string;
  inputBg: string;
  inputBorder: string;
  onSearchChange: (value: string) => void;
  onToggleSelectedOnly: () => void;
  onToggleCustomOnly: () => void;
  onBadgeFilterChange: (label: string) => void;
  onClose: () => void;
}

export const FieldDrawerHeader = memo(function FieldDrawerHeader({
  entityDisplayName,
  titleId,
  searchQuery,
  showSelectedOnly,
  showCustomOnly,
  availableBadges,
  activeBadgeFilter,
  isDarkMode,
  headerBg,
  borderColor,
  textColor,
  textSecondary,
  inputBg,
  inputBorder,
  onSearchChange,
  onToggleSelectedOnly,
  onToggleCustomOnly,
  onBadgeFilterChange,
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

  const getCustomButtonStyle = () => ({
    background: showCustomOnly
      ? isDarkMode
        ? '#1e40af'
        : '#dbeafe'
      : isDarkMode
        ? '#374151'
        : '#f3f4f6',
    color: showCustomOnly ? (isDarkMode ? '#93c5fd' : '#1e40af') : textSecondary,
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
          onClick={onToggleCustomOnly}
          aria-pressed={showCustomOnly}
          aria-label="Show custom fields only"
          className={styles.filterButton}
          style={getCustomButtonStyle()}
        >
          <Wrench size={14} aria-hidden="true" />
          Custom
        </button>
      </div>

      {/* Badge Type Filters */}
      <div role="group" aria-label="Filter by field type" className={styles.badgeFilterGroup}>
        {availableBadges.map((badge) => {
          const isActive = activeBadgeFilter === badge.label;
          return (
            <button
              key={badge.label}
              onClick={() => onBadgeFilterChange(badge.label)}
              aria-pressed={isActive}
              aria-label={`Filter by ${badge.label} fields`}
              className={styles.badgeChip}
              style={{
                background: isActive ? badge.color : isDarkMode ? '#374151' : '#f3f4f6',
                color: isActive ? '#ffffff' : textSecondary,
                borderColor: isActive ? badge.color : 'transparent',
              }}
            >
              <span
                className={styles.badgeChipDot}
                style={{
                  background: isActive ? '#ffffff' : badge.color,
                }}
              />
              {badge.label}
              <span className={styles.badgeChipCount}>{badge.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
