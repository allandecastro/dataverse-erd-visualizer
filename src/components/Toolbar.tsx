/**
 * Top toolbar component with stats, export buttons, and navigation controls
 */

import { useState } from 'react';
import { Search, HelpCircle } from 'lucide-react';
import type { ThemeColors } from '@/types/erdTypes';
import { getKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { ToolbarStats } from './ToolbarStats';
import { ToolbarExportButtons } from './ToolbarExportButtons';
import { KeyboardShortcutsPopup } from './KeyboardShortcutsPopup';

export interface ToolbarProps {
  filteredEntitiesCount: number;
  filteredRelationshipsCount: number;
  isDarkMode: boolean;
  themeColors: ThemeColors;
  isExportingDrawio?: boolean;
  drawioExportProgress?: { progress: number; message: string };
  onCopyPNG: () => void;
  onExportMermaid: () => void;
  onExportSVG: () => void;
  onExportDrawio: () => void;
  onOpenSearch: () => void;
  onOpenGuide: () => void;
}

export function Toolbar({
  filteredEntitiesCount,
  filteredRelationshipsCount,
  isDarkMode,
  themeColors,
  isExportingDrawio,
  drawioExportProgress,
  onCopyPNG,
  onExportMermaid,
  onExportSVG,
  onExportDrawio,
  onOpenSearch,
  onOpenGuide,
}: ToolbarProps) {
  const { panelBg, borderColor, textColor, textSecondary } = themeColors;
  const [showShortcuts, setShowShortcuts] = useState(false);
  const shortcuts = getKeyboardShortcuts();

  const iconButtonStyle = {
    padding: '8px',
    background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
    border: `1px solid ${borderColor}`,
    borderRadius: '6px',
    color: textColor,
    cursor: 'pointer',
    display: 'flex' as const,
    alignItems: 'center' as const,
  };

  return (
    <div
      style={{
        padding: '12px 20px',
        borderBottom: `1px solid ${borderColor}`,
        background: panelBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Spinner animation for Draw.io export */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Stats */}
      <ToolbarStats
        filteredEntitiesCount={filteredEntitiesCount}
        filteredRelationshipsCount={filteredRelationshipsCount}
        borderColor={borderColor}
        textSecondary={textSecondary}
      />

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
        }}
      >
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

        <div style={{ width: '1px', height: '24px', background: borderColor }} />

        {/* Search */}
        <button
          onClick={onOpenSearch}
          title="Search entities (press /)"
          style={{
            ...iconButtonStyle,
            padding: '8px 12px',
            gap: '6px',
            fontSize: '13px',
          }}
        >
          <Search size={16} />
          Search
          <span
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              borderRadius: '3px',
              marginLeft: '4px',
            }}
          >
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
          style={{
            padding: '8px 12px',
            background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.2), rgba(139, 92, 246, 0.2))',
            border: '1px solid',
            borderImage: 'linear-gradient(135deg, #60a5fa, #8b5cf6) 1',
            borderRadius: '6px',
            color: isDarkMode ? '#a78bfa' : '#7c3aed',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: '600',
          }}
        >
          <HelpCircle size={16} />
          Guide
        </button>
      </div>
    </div>
  );
}
