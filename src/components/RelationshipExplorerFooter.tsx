/**
 * Relationship Explorer footer with bulk actions and primary "Add to Canvas" button
 */

import { memo } from 'react';
import { Check, X, Plus } from 'lucide-react';
import styles from '@/styles/RelationshipExplorerDrawer.module.css';

export interface RelationshipExplorerFooterProps {
  checkedCount: number;
  isDarkMode: boolean;
  borderColor: string;
  textColor: string;
  onSelectAllVisible: () => void;
  onClearAll: () => void;
  onAddToCanvas: () => void;
}

export const RelationshipExplorerFooter = memo(function RelationshipExplorerFooter({
  checkedCount,
  isDarkMode,
  borderColor,
  textColor,
  onSelectAllVisible,
  onClearAll,
  onAddToCanvas,
}: RelationshipExplorerFooterProps) {
  const secondaryButtonStyle = {
    background: isDarkMode ? borderColor : '#f3f4f6',
    border: `1px solid ${borderColor}`,
    color: textColor,
  };

  return (
    <div style={{ borderTop: `1px solid ${borderColor}` }}>
      <div className={styles.footerContainer}>
        <button
          onClick={onSelectAllVisible}
          aria-label="Select all visible tables"
          className={styles.footerButton}
          style={secondaryButtonStyle}
        >
          <Check size={14} aria-hidden="true" />
          Select All
        </button>
        <button
          onClick={onClearAll}
          aria-label="Clear selection"
          className={styles.footerButton}
          style={secondaryButtonStyle}
        >
          <X size={14} aria-hidden="true" />
          Clear
        </button>
      </div>
      <div style={{ padding: '0 16px 12px' }}>
        <button
          onClick={onAddToCanvas}
          disabled={checkedCount === 0}
          className={styles.footerButtonPrimary}
          style={{
            background: checkedCount > 0 ? '#2563eb' : isDarkMode ? borderColor : '#e5e7eb',
            color: checkedCount > 0 ? '#ffffff' : textColor,
          }}
          aria-label={`Add ${checkedCount} table${checkedCount !== 1 ? 's' : ''} to canvas`}
        >
          <Plus size={14} aria-hidden="true" />
          Add {checkedCount} {checkedCount === 1 ? 'Table' : 'Tables'} to Canvas
        </button>
      </div>
    </div>
  );
});
