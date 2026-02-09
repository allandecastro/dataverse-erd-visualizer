/**
 * Top toolbar component with stats, export buttons, and navigation controls
 */

import { useState } from 'react';
import { Search, HelpCircle, Bookmark, RefreshCw } from 'lucide-react';
import { useTheme } from '@/context';
import { getKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { ToolbarStats } from './ToolbarStats';
import { ToolbarExportButtons } from './ToolbarExportButtons';
import { KeyboardShortcutsPopup } from './KeyboardShortcutsPopup';
import { ShareButton } from './ShareButton';
import styles from '@/styles/Toolbar.module.css';

export interface ToolbarProps {
  filteredEntitiesCount: number;
  filteredRelationshipsCount: number;
  isExportingDrawio?: boolean;
  drawioExportProgress?: { progress: number; message: string };
  onCopyPNG: () => void;
  onExportMermaid: () => void;
  onExportSVG: () => void;
  onExportDrawio: () => void;
  onOpenSearch: () => void;
  onOpenGuide: () => void;
  onOpenSnapshots: () => void;
  onGenerateShareURL: () => { url: string; warning?: string } | { error: string };
  onRefresh?: () => Promise<void>;
}

export function Toolbar({
  filteredEntitiesCount,
  filteredRelationshipsCount,
  isExportingDrawio,
  drawioExportProgress,
  onCopyPNG,
  onExportMermaid,
  onExportSVG,
  onExportDrawio,
  onOpenSearch,
  onOpenGuide,
  onOpenSnapshots,
  onGenerateShareURL,
  onRefresh,
}: ToolbarProps) {
  const { isDarkMode, themeColors } = useTheme();
  const { panelBg, borderColor, textColor, textSecondary } = themeColors;
  const [showShortcuts, setShowShortcuts] = useState(false);
  const shortcuts = getKeyboardShortcuts();

  const buttonBg = isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)';
  const shortcutBg = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

  return (
    <div
      className={styles.toolbar}
      style={{
        borderBottom: `1px solid ${borderColor}`,
        background: panelBg,
      }}
    >
      {/* Stats */}
      <ToolbarStats
        filteredEntitiesCount={filteredEntitiesCount}
        filteredRelationshipsCount={filteredRelationshipsCount}
        borderColor={borderColor}
        textSecondary={textSecondary}
      />

      {/* Controls */}
      <div className={styles.controls}>
        {/* Export buttons */}
        <ToolbarExportButtons
          isDarkMode={isDarkMode}
          isExportingDrawio={isExportingDrawio}
          drawioExportProgress={drawioExportProgress}
          onCopyPNG={onCopyPNG}
          onExportMermaid={onExportMermaid}
          onExportSVG={onExportSVG}
          onExportDrawio={onExportDrawio}
        />

        <div className={styles.divider} style={{ background: borderColor }} />

        {/* Snapshots */}
        <button
          onClick={onOpenSnapshots}
          title="Manage snapshots (Ctrl+Shift+S)"
          className={styles.searchButton}
          style={{
            background: buttonBg,
            border: `1px solid ${borderColor}`,
            color: textColor,
          }}
        >
          <Bookmark size={16} />
          Snapshots
        </button>

        <div className={styles.divider} style={{ background: borderColor }} />

        {/* Share URL */}
        <ShareButton onGenerateShareURL={onGenerateShareURL} />

        <div className={styles.divider} style={{ background: borderColor }} />

        {/* Search */}
        <button
          onClick={onOpenSearch}
          title="Search entities (press /)"
          className={styles.searchButton}
          style={{
            background: buttonBg,
            border: `1px solid ${borderColor}`,
            color: textColor,
          }}
        >
          <Search size={16} />
          Search
          <span className={styles.shortcutBadge} style={{ background: shortcutBg }}>
            /
          </span>
        </button>

        {/* Keyboard shortcuts */}
        <KeyboardShortcutsPopup
          shortcuts={shortcuts}
          isOpen={showShortcuts}
          isDarkMode={isDarkMode}
          panelBg={panelBg}
          borderColor={borderColor}
          textColor={textColor}
          textSecondary={textSecondary}
          onToggle={() => setShowShortcuts(!showShortcuts)}
          onClose={() => setShowShortcuts(false)}
        />

        {/* Help / Feature Guide */}
        <button
          onClick={onOpenGuide}
          title="Feature Guide - Learn all features"
          className={`${styles.guideButton} ${isDarkMode ? styles.dark : styles.light}`}
        >
          <HelpCircle size={16} />
          Guide
        </button>
      </div>
    </div>
  );
}
