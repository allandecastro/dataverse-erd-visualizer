/**
 * Top toolbar component with zoom, export, and view controls
 */

import { Download, ZoomIn, ZoomOut, Maximize2, RefreshCw, Minimize2 } from 'lucide-react';
import type { ThemeColors } from '../types';

export interface ToolbarProps {
  filteredEntitiesCount: number;
  filteredRelationshipsCount: number;
  zoom: number;
  isSmartZoom: boolean;
  showMinimap: boolean;
  isDarkMode: boolean;
  themeColors: ThemeColors;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onResetView: () => void;
  onToggleSmartZoom: () => void;
  onToggleMinimap: () => void;
  onCopyPNG: () => void;
  onExportMermaid: () => void;
  onExportSVG: () => void;
}

export function Toolbar({
  filteredEntitiesCount,
  filteredRelationshipsCount,
  zoom,
  isSmartZoom,
  showMinimap,
  isDarkMode,
  themeColors,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onResetView,
  onToggleSmartZoom,
  onToggleMinimap,
  onCopyPNG,
  onExportMermaid,
  onExportSVG,
}: ToolbarProps) {
  const { panelBg, borderColor, textColor, textSecondary } = themeColors;

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
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {/* Export buttons */}
        <button
          onClick={onCopyPNG}
          style={{
            padding: '8px 12px',
            background: isDarkMode ? 'rgba(236, 72, 153, 0.2)' : 'rgba(236, 72, 153, 0.1)',
            border: '1px solid #ec4899',
            borderRadius: '6px',
            color: '#ec4899',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: '600'
          }}
        >
          <Download size={16} />
          Copy PNG
        </button>
        <button
          onClick={onExportMermaid}
          style={{
            padding: '8px 12px',
            background: isDarkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)',
            border: '1px solid #8b5cf6',
            borderRadius: '6px',
            color: '#8b5cf6',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: '600'
          }}
        >
          <Download size={16} />
          Mermaid
        </button>
        <button
          onClick={onExportSVG}
          style={{
            padding: '8px 12px',
            background: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
            border: '1px solid #10b981',
            borderRadius: '6px',
            color: '#10b981',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: '600'
          }}
        >
          <Download size={16} />
          SVG
        </button>

        <div style={{ width: '1px', height: '24px', background: borderColor }} />

        {/* Smart Zoom */}
        <button
          onClick={onToggleSmartZoom}
          title={isSmartZoom
            ? "Smart Zoom ON: Adaptive zoom speed based on entity density"
            : "Smart Zoom OFF: Standard zoom speed"
          }
          style={buttonStyle(isSmartZoom)}
        >
          <ZoomIn size={16} />
          Smart Zoom {isSmartZoom ? 'ON' : 'OFF'}
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
      </div>
    </div>
  );
}
