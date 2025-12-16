/**
 * Keyboard shortcuts hook for ERD navigation
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcutsOptions {
  // Navigation
  onPanLeft: () => void;
  onPanRight: () => void;
  onPanUp: () => void;
  onPanDown: () => void;
  // Zoom
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onResetView: () => void;
  // Selection
  onSelectAll: () => void;
  onDeselectAll: () => void;
  // Search
  onOpenSearch: () => void;
  // Enabled state
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onPanLeft,
  onPanRight,
  onPanUp,
  onPanDown,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onResetView,
  onSelectAll,
  onDeselectAll,
  onOpenSearch,
  enabled = true,
}: KeyboardShortcutsOptions) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Allow Escape to work even in inputs
      if (e.key !== 'Escape') {
        return;
      }
    }

    // Prevent default for our shortcuts
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;

    switch (e.key) {
      // Arrow keys for panning
      case 'ArrowLeft':
        e.preventDefault();
        onPanLeft();
        break;
      case 'ArrowRight':
        e.preventDefault();
        onPanRight();
        break;
      case 'ArrowUp':
        e.preventDefault();
        onPanUp();
        break;
      case 'ArrowDown':
        e.preventDefault();
        onPanDown();
        break;

      // Zoom with + and -
      case '+':
      case '=': // = key (same as + without shift)
        e.preventDefault();
        onZoomIn();
        break;
      case '-':
      case '_': // _ key (same as - with shift)
        e.preventDefault();
        onZoomOut();
        break;

      // Fit to screen with F
      case 'f':
      case 'F':
        if (!isCtrlOrCmd) {
          e.preventDefault();
          onFitToScreen();
        }
        break;

      // Reset view with 0 or Home
      case '0':
        if (!isCtrlOrCmd) {
          e.preventDefault();
          onResetView();
        }
        break;
      case 'Home':
        e.preventDefault();
        onResetView();
        break;

      // Select all with Ctrl+A
      case 'a':
      case 'A':
        if (isCtrlOrCmd) {
          e.preventDefault();
          onSelectAll();
        }
        break;

      // Deselect with Escape
      case 'Escape':
        e.preventDefault();
        onDeselectAll();
        break;

      // Search with Ctrl+F or /
      case '/':
        if (!isCtrlOrCmd) {
          e.preventDefault();
          onOpenSearch();
        }
        break;
    }
  }, [
    onPanLeft, onPanRight, onPanUp, onPanDown,
    onZoomIn, onZoomOut, onFitToScreen, onResetView,
    onSelectAll, onDeselectAll, onOpenSearch
  ]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
}

/**
 * Get keyboard shortcut help text
 */
export function getKeyboardShortcuts(): { key: string; description: string }[] {
  return [
    { key: '←↑→↓', description: 'Pan canvas' },
    { key: '+ / -', description: 'Zoom in/out' },
    { key: 'F', description: 'Fit to screen' },
    { key: '0 / Home', description: 'Reset view' },
    { key: 'Ctrl+A', description: 'Select all' },
    { key: 'Esc', description: 'Deselect all' },
    { key: '/', description: 'Search entity' },
  ];
}
