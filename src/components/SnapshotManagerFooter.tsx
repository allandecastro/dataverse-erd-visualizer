/**
 * Snapshot Manager Footer - Import button and storage usage indicator
 */

import { useRef } from 'react';
import { Upload, Download } from 'lucide-react';
import styles from '@/styles/SnapshotManager.module.css';

export interface SnapshotManagerFooterProps {
  isDarkMode: boolean;
  snapshotCount: number;
  borderColor: string;
  textColor: string;
  textSecondary: string;
  onImportSnapshot: (file: File) => void;
  onExportAllSnapshots: () => void;
}

export function SnapshotManagerFooter({
  isDarkMode,
  snapshotCount,
  borderColor,
  textColor,
  textSecondary,
  onImportSnapshot,
  onExportAllSnapshots,
}: SnapshotManagerFooterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportSnapshot(file);
      // Reset input so same file can be imported again
      e.target.value = '';
    }
  };

  return (
    <div className={styles.footer} style={{ borderColor }}>
      {/* Export and Import buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onExportAllSnapshots}
          className={styles.importButton}
          style={{
            background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            borderColor,
            color: textColor,
          }}
          title="Export all snapshots to a single JSON file"
        >
          <Download size={16} />
          Export All
        </button>
        <button
          onClick={handleImportClick}
          className={styles.importButton}
          style={{
            background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            borderColor,
            color: textColor,
          }}
          title="Import snapshot from JSON file"
        >
          <Upload size={16} />
          Import
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Storage usage */}
      <div className={styles.storageUsage} style={{ color: textSecondary }}>
        {snapshotCount} / 10 snapshots
      </div>
    </div>
  );
}
