/**
 * Snapshot List Item - Individual snapshot card with actions
 */

import { useState } from 'react';
import { Play, Edit2, Download, Trash2, X, Check, Share2 } from 'lucide-react';
import type { ERDSnapshot } from '@/types/snapshotTypes';
import { formatRelativeTime } from '@/utils/snapshotSerializer';
import styles from '@/styles/SnapshotListItem.module.css';

export interface SnapshotListItemProps {
  snapshot: ERDSnapshot;
  isDarkMode: boolean;
  borderColor: string;
  textColor: string;
  textSecondary: string;
  deleteConfirm: boolean;
  onLoad: () => void;
  onRename: (newName: string) => void;
  onShare: () => void;
  onExport: () => void;
  onDelete: () => void;
  onCancelDelete: () => void;
}

export function SnapshotListItem({
  snapshot,
  isDarkMode,
  borderColor,
  textColor,
  textSecondary,
  deleteConfirm,
  onLoad,
  onRename,
  onShare,
  onExport,
  onDelete,
  onCancelDelete,
}: SnapshotListItemProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameName, setRenameName] = useState(snapshot.name);

  const handleRenameClick = () => {
    setIsRenaming(true);
    setRenameName(snapshot.name);
  };

  const handleRenameSave = () => {
    if (renameName.trim()) {
      onRename(renameName.trim());
    }
    setIsRenaming(false);
  };

  const handleRenameCancel = () => {
    setIsRenaming(false);
    setRenameName(snapshot.name);
  };

  return (
    <div
      className={styles.item}
      style={{
        borderColor,
        background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
      }}
    >
      {/* Name and timestamp */}
      <div className={styles.info}>
        {isRenaming ? (
          <div className={styles.renameForm}>
            <input
              type="text"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSave();
                if (e.key === 'Escape') handleRenameCancel();
              }}
              className={styles.renameInput}
              style={{
                background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                borderColor,
                color: textColor,
              }}
              autoFocus
            />
            <button
              onClick={handleRenameSave}
              className={styles.renameConfirm}
              title="Save"
              style={{
                background: '#10b981',
                color: '#ffffff',
              }}
            >
              <Check size={14} />
            </button>
            <button
              onClick={handleRenameCancel}
              className={styles.renameCancel}
              title="Cancel"
              style={{
                background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                color: textColor,
              }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <div className={styles.name} style={{ color: textColor }}>
              {snapshot.name}
            </div>
            <div className={styles.timestamp} style={{ color: textSecondary }}>
              {formatRelativeTime(snapshot.timestamp)}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      {!isRenaming && (
        <div className={styles.actions}>
          {/* Load button */}
          <button
            onClick={onLoad}
            className={styles.actionButton}
            title="Load snapshot"
            style={{
              background: '#0ea5e9',
              color: '#ffffff',
            }}
          >
            <Play size={14} />
            Load
          </button>

          {/* Rename button */}
          <button
            onClick={handleRenameClick}
            className={styles.actionButton}
            title="Rename snapshot"
            style={{
              background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              color: textColor,
            }}
          >
            <Edit2 size={14} />
          </button>

          {/* Share button */}
          <button
            onClick={onShare}
            className={styles.actionButton}
            title="Share this snapshot as URL"
            style={{
              background: isDarkMode ? 'rgba(6, 182, 212, 0.2)' : 'rgba(6, 182, 212, 0.15)',
              color: '#06b6d4',
            }}
          >
            <Share2 size={14} />
          </button>

          {/* Export button */}
          <button
            onClick={onExport}
            className={styles.actionButton}
            title="Export to JSON"
            style={{
              background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              color: textColor,
            }}
          >
            <Download size={14} />
          </button>

          {/* Delete button */}
          {deleteConfirm ? (
            <>
              <button
                onClick={onDelete}
                className={styles.actionButton}
                title="Confirm delete"
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                }}
              >
                <Trash2 size={14} />
                Confirm?
              </button>
              <button
                onClick={onCancelDelete}
                className={styles.actionButton}
                title="Cancel"
                style={{
                  background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  color: textColor,
                }}
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <button
              onClick={onDelete}
              className={styles.actionButton}
              title="Delete snapshot"
              style={{
                background: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
              }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
