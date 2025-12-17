/**
 * Top toolbar component with zoom, export, and view controls
 */

import { useState } from 'react';
import { Download, ZoomIn, ZoomOut, Maximize2, RefreshCw, Minimize2, Search, Keyboard, X, HelpCircle, ClipboardCopy, FileSpreadsheet, Loader2 } from 'lucide-react';
import type { ThemeColors } from '../types';
import { getKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export interface ToolbarProps {
  filteredEntitiesCount: number;
  filteredRelationshipsCount: number;
  zoom: number;
  isSmartZoom: boolean;
  showMinimap: boolean;
  isDarkMode: boolean;
  themeColors: ThemeColors;
  isExportingVisio?: boolean;
  visioExportProgress?: { progress: number; message: string };
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onResetView: () => void;
  onToggleSmartZoom: () => void;
  onToggleMinimap: () => void;
  onCopyPNG: () => void;
  onExportMermaid: () => void;
  onExportSVG: () => void;
  onExportVisio: () => void;
  onOpenSearch: () => void;
  onOpenGuide: () => void;
}

export function Toolbar({
  filteredEntitiesCount,
  filteredRelationshipsCount,
  zoom,
  isSmartZoom,
  showMinimap,
  isDarkMode,
  themeColors,
  isExportingVisio,
  visioExportProgress,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onResetView,
  onToggleSmartZoom,
  onToggleMinimap,
  onCopyPNG,
  onExportMermaid,
  onExportSVG,
  onExportVisio,
  onOpenSearch,
  onOpenGuide,
}: ToolbarProps) {
  const { panelBg, borderColor, textColor, textSecondary } = themeColors;
  const [showShortcuts, setShowShortcuts] = useState(false);
  const shortcuts = getKeyboardShortcuts();

  const buttonStyle = (active = false) => ({
    padding: '8px 12px',
    background: active
      ? (isDarkMode ? 'rgba(96, 165, 250, 0.2)' : 'rgba(37, 99, 235, 0.2)')
      : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'),
    border: `1px solid ${active ? (isDarkMode ? '#60a5fa' : '#2563eb') : borderColor}`,
    borderRadius: '6px',
    color: active ? (isDarkMode ? '#60a5fa' : '#2563eb') : textColor,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: active ? '600' : '400',
  });

  const iconButtonStyle = {
    padding: '8px',
    background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
    border: `1px solid ${borderColor}`,
    borderRadius: '6px',
    color: textColor,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  };

  return (
    <div style={{
      padding: '12px 20px',
      borderBottom: `1px solid ${borderColor}`,
      background: panelBg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      {/* Spinner animation for Visio export */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      {/* Stats */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '11px', color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tables</div>
          <div style={{ fontSize: '20px', fontWeight: '700' }}>{filteredEntitiesCount}</div>
        </div>
        <div style={{ width: '1px', height: '32px', background: borderColor }} />
        <div>
          <div style={{ fontSize: '11px', color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Relationships</div>
          <div style={{ fontSize: '20px', fontWeight: '700' }}>{filteredRelationshipsCount}</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {/* Export buttons - clipboard icon for copy, download for SVG */}
        <button
          onClick={onCopyPNG}
          title="Copy PNG to clipboard"
          style={{
            padding: '8px 10px',
            background: isDarkMode ? 'rgba(236, 72, 153, 0.2)' : 'rgba(236, 72, 153, 0.1)',
            border: '1px solid #ec4899',
            borderRadius: '6px',
            color: '#ec4899',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '12px',
            fontWeight: '600'
          }}
        >
          <ClipboardCopy size={14} />
          PNG
        </button>
        <button
          onClick={onExportMermaid}
          title="Copy Mermaid code to clipboard"
          style={{
            padding: '8px 10px',
            background: isDarkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)',
            border: '1px solid #8b5cf6',
            borderRadius: '6px',
            color: '#8b5cf6',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '12px',
            fontWeight: '600'
          }}
        >
          <ClipboardCopy size={14} />
          Mermaid
        </button>
        <button
          onClick={onExportSVG}
          title="Download SVG file"
          style={{
            padding: '8px 10px',
            background: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
            border: '1px solid #10b981',
            borderRadius: '6px',
            color: '#10b981',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '12px',
            fontWeight: '600'
          }}
        >
          <Download size={14} />
          SVG
        </button>
        <button
          onClick={onExportVisio}
          title={isExportingVisio ? visioExportProgress?.message || 'Exporting...' : 'Download Draw.io file (can import to Visio)'}
          disabled={isExportingVisio}
          style={{
            padding: '8px 10px',
            background: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
            border: '1px solid #3b82f6',
            borderRadius: '6px',
            color: '#3b82f6',
            cursor: isExportingVisio ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '12px',
            fontWeight: '600',
            opacity: isExportingVisio ? 0.7 : 1,
            position: 'relative',
            minWidth: '80px',
          }}
        >
          {isExportingVisio ? (
            <>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              {visioExportProgress ? `${visioExportProgress.progress}%` : 'Draw.io'}
            </>
          ) : (
            <>
              <FileSpreadsheet size={14} />
              Draw.io
            </>
          )}
        </button>

        <div style={{ width: '1px', height: '24px', background: borderColor }} />

        {/* Smart Zoom - no ON/OFF text, just color indicates state */}
        <button
          onClick={onToggleSmartZoom}
          title={isSmartZoom
            ? "Smart Zoom: Adaptive zoom (click to disable)"
            : "Enable Smart Zoom for adaptive zoom speed"
          }
          style={buttonStyle(isSmartZoom)}
        >
          <ZoomIn size={14} />
          Smart Zoom
        </button>

        {/* Minimap */}
        <button
          onClick={onToggleMinimap}
          style={buttonStyle(showMinimap)}
        >
          <Minimize2 size={16} />
          Minimap
        </button>

        <div style={{ width: '1px', height: '24px', background: borderColor }} />

        {/* Zoom controls */}
        <button onClick={onZoomOut} style={iconButtonStyle}>
          <ZoomOut size={18} />
        </button>
        <div style={{ minWidth: '60px', textAlign: 'center', fontSize: '13px', color: textSecondary }}>
          {Math.round(zoom * 100)}%
        </div>
        <button onClick={onZoomIn} style={iconButtonStyle}>
          <ZoomIn size={18} />
        </button>

        <div style={{ width: '1px', height: '24px', background: borderColor, margin: '0 4px' }} />

        {/* View controls */}
        <button
          onClick={onFitToScreen}
          style={{
            ...iconButtonStyle,
            padding: '8px 12px',
            gap: '6px',
            fontSize: '13px'
          }}
        >
          <Maximize2 size={16} />
          Fit to Screen
        </button>
        <button
          onClick={onResetView}
          style={{
            ...iconButtonStyle,
            padding: '8px 12px',
            gap: '6px',
            fontSize: '13px'
          }}
        >
          <RefreshCw size={16} />
          Recenter
        </button>

        <div style={{ width: '1px', height: '24px', background: borderColor, margin: '0 4px' }} />

        {/* Search */}
        <button
          onClick={onOpenSearch}
          title="Search entities (press /)"
          style={{
            ...iconButtonStyle,
            padding: '8px 12px',
            gap: '6px',
            fontSize: '13px'
          }}
        >
          <Search size={16} />
          Search
          <span style={{
            fontSize: '10px',
            padding: '2px 6px',
            background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            borderRadius: '3px',
            marginLeft: '4px'
          }}>/</span>
        </button>

        {/* Keyboard shortcuts */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            title="Keyboard shortcuts"
            style={buttonStyle(showShortcuts)}
          >
            <Keyboard size={16} />
          </button>

          {/* Shortcuts popup */}
          {showShortcuts && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              width: '220px',
              background: panelBg,
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
              zIndex: 100,
              overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                borderBottom: `1px solid ${borderColor}`,
              }}>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Keyboard Shortcuts</span>
                <button
                  onClick={() => setShowShortcuts(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    color: textSecondary,
                  }}
                >
                  <X size={14} />
                </button>
              </div>
              <div style={{ padding: '8px 0' }}>
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 14px',
                      fontSize: '12px',
                    }}
                  >
                    <span style={{ color: textSecondary }}>{shortcut.description}</span>
                    <kbd style={{
                      padding: '3px 8px',
                      background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontFamily: 'inherit',
                      color: textColor,
                    }}>
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

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
