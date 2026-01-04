/**
 * Toolbar export buttons for PNG, Mermaid, SVG, and Draw.io formats
 */

import { memo } from 'react';
import { Download, ClipboardCopy, FileSpreadsheet, Loader2 } from 'lucide-react';

export interface ToolbarExportButtonsProps {
  isDarkMode: boolean;
  isExportingDrawio?: boolean;
  drawioExportProgress?: { progress: number; message: string };
  onCopyPNG: () => void;
  onExportMermaid: () => void;
  onExportSVG: () => void;
  onExportDrawio: () => void;
}

export const ToolbarExportButtons = memo(function ToolbarExportButtons({
  isDarkMode,
  isExportingDrawio,
  drawioExportProgress,
  onCopyPNG,
  onExportMermaid,
  onExportSVG,
  onExportDrawio,
}: ToolbarExportButtonsProps) {
  const exportButtonStyle = (color: string) => ({
    padding: '8px 10px',
    background: isDarkMode ? `${color}33` : `${color}1a`,
    border: `1px solid ${color}`,
    borderRadius: '6px',
    color: color,
    cursor: 'pointer',
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '5px',
    fontSize: '12px',
    fontWeight: '600' as const,
  });

  return (
    <>
      <button
        onClick={onCopyPNG}
        title="Copy PNG to clipboard"
        style={exportButtonStyle('#ec4899')}
      >
        <ClipboardCopy size={14} />
        PNG
      </button>
      <button
        onClick={onExportMermaid}
        title="Copy Mermaid code to clipboard"
        style={exportButtonStyle('#8b5cf6')}
      >
        <ClipboardCopy size={14} />
        Mermaid
      </button>
      <button onClick={onExportSVG} title="Download SVG file" style={exportButtonStyle('#10b981')}>
        <Download size={14} />
        SVG
      </button>
      <button
        onClick={onExportDrawio}
        title={
          isExportingDrawio
            ? drawioExportProgress?.message || 'Exporting...'
            : 'Download Draw.io file (can import to Visio)'
        }
        disabled={isExportingDrawio}
        style={{
          ...exportButtonStyle('#3b82f6'),
          cursor: isExportingDrawio ? 'wait' : 'pointer',
          opacity: isExportingDrawio ? 0.7 : 1,
          position: 'relative' as const,
          minWidth: '80px',
        }}
      >
        {isExportingDrawio ? (
          <>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            {drawioExportProgress ? `${drawioExportProgress.progress}%` : 'Draw.io'}
          </>
        ) : (
          <>
            <FileSpreadsheet size={14} />
            Draw.io
          </>
        )}
      </button>
    </>
  );
});
