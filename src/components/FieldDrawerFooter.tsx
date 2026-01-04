/**
 * Field Drawer footer with Select All/Clear All buttons
 */

import { memo } from 'react';
import { Check, X } from 'lucide-react';
import styles from '@/styles/FieldDrawerFooter.module.css';

export interface FieldDrawerFooterProps {
  isDarkMode: boolean;
  borderColor: string;
  textColor: string;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export const FieldDrawerFooter = memo(function FieldDrawerFooter({
  isDarkMode,
  borderColor,
  textColor,
  onSelectAll,
  onClearAll,
}: FieldDrawerFooterProps) {
  const buttonStyle = {
    background: isDarkMode ? '#374151' : '#f3f4f6',
    border: `1px solid ${borderColor}`,
    color: textColor,
  };

  return (
    <div
      role="group"
      aria-label="Bulk field actions"
      className={styles.container}
      style={{ borderTop: `1px solid ${borderColor}` }}
    >
      <button
        onClick={onSelectAll}
        aria-label="Select all fields"
        className={styles.button}
        style={buttonStyle}
      >
        <Check size={14} aria-hidden="true" />
        Select All
      </button>
      <button
        onClick={onClearAll}
        aria-label="Clear all selected fields"
        className={styles.button}
        style={buttonStyle}
      >
        <X size={14} aria-hidden="true" />
        Clear All
      </button>
    </div>
  );
});
