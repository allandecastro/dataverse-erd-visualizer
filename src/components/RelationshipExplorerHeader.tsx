/**
 * Relationship Explorer header with title, search, and filter toggles
 */

import { memo } from 'react';
import { X, Search, EyeOff, Wrench } from 'lucide-react';
import styles from '@/styles/RelationshipExplorerDrawer.module.css';

export interface RelationshipExplorerHeaderProps {
  title: string;
  subtitle: string;
  titleId?: string;
  searchQuery: string;
  hideSystemEntities: boolean;
  hideActivityEntities: boolean;
  customOnly: boolean;
  headerBg: string;
  borderColor: string;
  textColor: string;
  textSecondary: string;
  inputBg: string;
  inputBorder: string;
  onSearchChange: (value: string) => void;
  onToggleHideSystem: () => void;
  onToggleHideActivity: () => void;
  onToggleCustomOnly: () => void;
  onClose: () => void;
}

export const RelationshipExplorerHeader = memo(function RelationshipExplorerHeader({
  title,
  subtitle,
  titleId,
  searchQuery,
  hideSystemEntities,
  hideActivityEntities,
  customOnly,
  headerBg,
  borderColor,
  textColor,
  textSecondary,
  inputBg,
  inputBorder,
  onSearchChange,
  onToggleHideSystem,
  onToggleHideActivity,
  onToggleCustomOnly,
  onClose,
}: RelationshipExplorerHeaderProps) {
  const getToggleStyle = (active: boolean) => ({
    background: active ? inputBg : 'transparent',
    color: active ? textColor : textSecondary,
    border: `1px solid ${active ? inputBorder : 'transparent'}`,
  });

  return (
    <div
      className={styles.headerContainer}
      style={{ background: headerBg, borderBottom: `1px solid ${borderColor}` }}
    >
      <div className={styles.titleRow}>
        <div>
          <h2 id={titleId} className={styles.title} style={{ color: textColor }}>
            {title}
          </h2>
          <div className={styles.subtitle} style={{ color: textSecondary }}>
            {subtitle}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close relationship explorer"
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
          placeholder="Search tables..."
          aria-label="Search related tables"
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

      {/* Filter toggles */}
      <div role="group" aria-label="Filter options" className={styles.filterGroup}>
        <button
          onClick={onToggleHideSystem}
          aria-pressed={hideSystemEntities}
          aria-label="Hide system tables"
          className={styles.filterButton}
          style={getToggleStyle(hideSystemEntities)}
          title="Hide system tables (User, Team, Business Unit, etc.)"
        >
          <EyeOff size={12} aria-hidden="true" />
          System
        </button>
        <button
          onClick={onToggleHideActivity}
          aria-pressed={hideActivityEntities}
          aria-label="Hide activity tables"
          className={styles.filterButton}
          style={getToggleStyle(hideActivityEntities)}
          title="Hide activity tables (Email, Phone Call, Appointment, etc.)"
        >
          <EyeOff size={12} aria-hidden="true" />
          Activity
        </button>
        <button
          onClick={onToggleCustomOnly}
          aria-pressed={customOnly}
          aria-label="Show custom tables only"
          className={styles.filterButton}
          style={getToggleStyle(customOnly)}
          title="Show only custom tables"
        >
          <Wrench size={12} aria-hidden="true" />
          Custom
        </button>
      </div>
    </div>
  );
});
