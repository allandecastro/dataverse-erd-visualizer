/**
 * Snapshot Manager Header - Title, close button, and auto-save toggle
 */

import { X } from 'lucide-react';
import styles from '@/styles/SnapshotManager.module.css';

export interface SnapshotManagerHeaderProps {
  isDarkMode: boolean;
  autoSaveEnabled: boolean;
  panelBg: string;
  borderColor: string;
  textColor: string;
  onToggleAutoSave: (enabled: boolean) => void;
  onClose: () => void;
}

export function SnapshotManagerHeader({
  isDarkMode,
  autoSaveEnabled,
  panelBg,
  borderColor,
  textColor,
  onToggleAutoSave,
  onClose,
}: SnapshotManagerHeaderProps) {
  return (
    <div className={styles.header} style={{ borderColor, background: panelBg }}>
      <div className={styles.headerTop}>
        <h2 className={styles.title} style={{ color: textColor }}>
          Snapshots
        </h2>
        <button
          onClick={onClose}
          className={styles.closeButton}
          title="Close"
          style={{
            color: textColor,
            background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Auto-save toggle */}
      <div className={styles.autoSaveSection}>
        <label className={styles.autoSaveLabel} style={{ color: textColor }}>
          <input
            type="checkbox"
            checked={autoSaveEnabled}
            onChange={(e) => onToggleAutoSave(e.target.checked)}
            className={styles.autoSaveCheckbox}
          />
          <span
            className={styles.autoSaveToggle}
            style={{
              background: autoSaveEnabled
                ? '#0ea5e9'
                : isDarkMode
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(0,0,0,0.1)',
              borderColor,
            }}
          >
            <span
              className={styles.autoSaveSlider}
              style={{
                transform: autoSaveEnabled ? 'translateX(16px)' : 'translateX(0)',
                background: '#ffffff',
              }}
            />
          </span>
          <span className={styles.autoSaveText}>Auto-save enabled (saves every 2 seconds)</span>
        </label>
      </div>
    </div>
  );
}
