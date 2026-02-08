/**
 * Snapshot Manager - Modal for managing snapshots
 */

import { useState } from 'react';
import type { ERDSnapshot } from '@/types/snapshotTypes';
import { useTheme } from '@/context';
import { SnapshotManagerHeader } from './SnapshotManagerHeader';
import { SnapshotListItem } from './SnapshotListItem';
import { SnapshotManagerFooter } from './SnapshotManagerFooter';
import styles from '@/styles/SnapshotManager.module.css';

export interface SnapshotManagerProps {
  snapshots: ERDSnapshot[];
  lastAutoSave: ERDSnapshot | null;
  autoSaveEnabled: boolean;
  onClose: () => void;
  onSaveSnapshot: (name: string) => void;
  onLoadSnapshot: (id: string) => void;
  onRenameSnapshot: (id: string, newName: string) => void;
  onDeleteSnapshot: (id: string) => void;
  onExportSnapshot: (id: string) => void;
  onShareSnapshot: (id: string) => void;
  onExportAllSnapshots: () => void;
  onImportSnapshot: (file: File) => void;
  onToggleAutoSave: (enabled: boolean) => void;
}

export function SnapshotManager({
  snapshots,
  lastAutoSave: _lastAutoSave,
  autoSaveEnabled,
  onClose,
  onSaveSnapshot,
  onLoadSnapshot,
  onRenameSnapshot,
  onDeleteSnapshot,
  onExportSnapshot,
  onShareSnapshot,
  onExportAllSnapshots,
  onImportSnapshot,
  onToggleAutoSave,
}: SnapshotManagerProps) {
  const { isDarkMode, themeColors } = useTheme();
  const { panelBg, borderColor, textColor, textSecondary } = themeColors;

  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleSaveClick = () => {
    onSaveSnapshot(newSnapshotName);
    setNewSnapshotName('');
  };

  const handleDeleteClick = (id: string) => {
    if (deleteConfirmId === id) {
      // Second click confirms deletion
      onDeleteSnapshot(id);
      setDeleteConfirmId(null);
    } else {
      // First click shows confirmation
      setDeleteConfirmId(id);
    }
  };

  const handleLoadClick = (id: string) => {
    onLoadSnapshot(id);
    onClose(); // Close modal after loading
  };

  return (
    <div
      className={`${styles.overlay} ${isDarkMode ? styles.overlayDark : styles.overlayLight}`}
      onClick={onClose}
    >
      <div
        className={`${styles.dialog} ${isDarkMode ? styles.dialogDark : styles.dialogLight}`}
        style={{
          background: panelBg,
          borderColor,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <SnapshotManagerHeader
          isDarkMode={isDarkMode}
          autoSaveEnabled={autoSaveEnabled}
          panelBg={panelBg}
          borderColor={borderColor}
          textColor={textColor}
          onToggleAutoSave={onToggleAutoSave}
          onClose={onClose}
        />

        {/* Content */}
        <div className={styles.content}>
          {/* Save new snapshot section */}
          <div className={styles.saveSection} style={{ borderColor }}>
            <h3 className={styles.sectionTitle} style={{ color: textColor }}>
              Save New Snapshot
            </h3>
            <div className={styles.saveForm}>
              <input
                type="text"
                placeholder="Enter snapshot name (optional)"
                value={newSnapshotName}
                onChange={(e) => setNewSnapshotName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveClick();
                  }
                }}
                className={styles.nameInput}
                style={{
                  background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                  borderColor,
                  color: textColor,
                }}
              />
              <button
                onClick={handleSaveClick}
                className={styles.saveButton}
                style={{
                  background: '#0ea5e9',
                  color: '#ffffff',
                }}
              >
                Save Snapshot
              </button>
            </div>
          </div>

          {/* Snapshots list */}
          <div className={styles.listSection}>
            <h3 className={styles.sectionTitle} style={{ color: textColor }}>
              Saved Snapshots ({snapshots.length}/10)
            </h3>
            {snapshots.length === 0 ? (
              <div className={styles.emptyState} style={{ color: textSecondary }}>
                No snapshots saved yet. Save your first snapshot above!
              </div>
            ) : (
              <div className={styles.snapshotList}>
                {snapshots
                  .slice()
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((snapshot) => (
                    <SnapshotListItem
                      key={snapshot.id}
                      snapshot={snapshot}
                      isDarkMode={isDarkMode}
                      borderColor={borderColor}
                      textColor={textColor}
                      textSecondary={textSecondary}
                      deleteConfirm={deleteConfirmId === snapshot.id}
                      onLoad={() => handleLoadClick(snapshot.id)}
                      onRename={(newName) => onRenameSnapshot(snapshot.id, newName)}
                      onExport={() => onExportSnapshot(snapshot.id)}
                      onShare={() => onShareSnapshot(snapshot.id)}
                      onDelete={() => handleDeleteClick(snapshot.id)}
                      onCancelDelete={() => setDeleteConfirmId(null)}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <SnapshotManagerFooter
          isDarkMode={isDarkMode}
          snapshotCount={snapshots.length}
          borderColor={borderColor}
          textColor={textColor}
          textSecondary={textSecondary}
          onImportSnapshot={onImportSnapshot}
          onExportAllSnapshots={onExportAllSnapshots}
        />
      </div>
    </div>
  );
}
