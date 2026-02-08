/**
 * Keyboard shortcuts hook for ERD navigation
 * Note: Canvas navigation (pan, zoom, fit) is handled natively by React Flow
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcutsOptions {
  // Selection
  onSelectAll: () => void;
  onDeselectAll: () => void;
  // Search
  onOpenSearch: () => void;
  // Snapshots
  onSaveSnapshot?: () => void;
  onOpenSnapshots?: () => void;
  // Share URL
  onShareURL?: () => void;
  // Enabled state
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onSelectAll,
  onDeselectAll,
  onOpenSearch,
  onSaveSnapshot,
  onOpenSnapshots,
  onShareURL,
  enabled = true,
}: KeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow Escape to work even in inputs
        if (e.key !== 'Escape') {
          return;
        }
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      switch (e.key) {
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

        // Search with /
        case '/':
          if (!isCtrlOrCmd) {
            e.preventDefault();
            onOpenSearch();
          }
          break;

        // Save snapshot with Ctrl+S
        case 's':
        case 'S':
          if (isCtrlOrCmd) {
            e.preventDefault();
            if (e.shiftKey && onOpenSnapshots) {
              // Ctrl+Shift+S - Open Snapshot Manager
              onOpenSnapshots();
            } else if (onSaveSnapshot) {
              // Ctrl+S - Save snapshot
              onSaveSnapshot();
            }
          }
          break;

        // Share URL with Ctrl+Shift+C
        case 'c':
        case 'C':
          if (isCtrlOrCmd && e.shiftKey && onShareURL) {
            e.preventDefault();
            onShareURL();
          }
          break;
      }
    },
    [onSelectAll, onDeselectAll, onOpenSearch, onSaveSnapshot, onOpenSnapshots, onShareURL]
  );

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
    { key: 'Ctrl+A', description: 'Select all tables' },
    { key: 'Esc', description: 'Deselect all' },
    { key: '/', description: 'Search tables' },
    { key: 'Ctrl+S', description: 'Save snapshot' },
    { key: 'Ctrl+Shift+S', description: 'Open Snapshot Manager' },
    { key: 'Ctrl+Shift+C', description: 'Generate shareable URL' },
  ];
}
