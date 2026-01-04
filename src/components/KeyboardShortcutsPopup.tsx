/**
 * Popup displaying keyboard shortcuts
 */

import { memo } from 'react';
import { X, Keyboard } from 'lucide-react';

export interface KeyboardShortcut {
  key: string;
  description: string;
}

export interface KeyboardShortcutsPopupProps {
  shortcuts: KeyboardShortcut[];
  isOpen: boolean;
  isDarkMode: boolean;
  panelBg: string;
  borderColor: string;
  textColor: string;
  textSecondary: string;
  onToggle: () => void;
  onClose: () => void;
}

export const KeyboardShortcutsPopup = memo(function KeyboardShortcutsPopup({
  shortcuts,
  isOpen,
  isDarkMode,
  panelBg,
  borderColor,
  textColor,
  textSecondary,
  onToggle,
  onClose,
}: KeyboardShortcutsPopupProps) {
  const buttonStyle = {
    padding: '8px 12px',
    background: isOpen
      ? isDarkMode
        ? 'rgba(96, 165, 250, 0.2)'
        : 'rgba(37, 99, 235, 0.2)'
      : isDarkMode
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.02)',
    border: `1px solid ${isOpen ? (isDarkMode ? '#60a5fa' : '#2563eb') : borderColor}`,
    borderRadius: '6px',
    color: isOpen ? (isDarkMode ? '#60a5fa' : '#2563eb') : textColor,
    cursor: 'pointer',
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '6px',
    fontSize: '13px',
    fontWeight: isOpen ? '600' : '400',
  };

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={onToggle} title="Keyboard shortcuts" style={buttonStyle}>
        <Keyboard size={16} />
      </button>

      {isOpen && (
        <div
          style={{
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
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 14px',
              borderBottom: `1px solid ${borderColor}`,
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: '600' }}>Keyboard Shortcuts</span>
            <button
              onClick={onClose}
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
                <kbd
                  style={{
                    padding: '3px 8px',
                    background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontFamily: 'inherit',
                    color: textColor,
                  }}
                >
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
