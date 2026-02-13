/**
 * Snapshot Context Provider
 * Eliminates snapshot-related prop drilling through ERDVisualizerContent.
 * Wraps useSnapshots hook output and open/close state into a single context.
 */

import { createContext, useContext, type ReactNode } from 'react';
import type { ERDSnapshot } from '@/types/snapshotTypes';

export interface SnapshotContextValue {
  // State
  showSnapshotManager: boolean;
  snapshots: ERDSnapshot[];
  lastAutoSave: ERDSnapshot | null;
  autoSaveEnabled: boolean;
  // Actions
  openSnapshots: () => void;
  closeSnapshots: () => void;
  saveSnapshot: (name: string) => void;
  loadSnapshot: (id: string) => void;
  renameSnapshot: (id: string, newName: string) => void;
  deleteSnapshot: (id: string) => void;
  exportSnapshot: (id: string) => void;
  shareSnapshot: (id: string) => void;
  exportAllSnapshots: () => void;
  importSnapshot: (file: File) => void;
  toggleAutoSave: (enabled: boolean) => void;
}

const SnapshotContext = createContext<SnapshotContextValue | null>(null);

export interface SnapshotProviderProps {
  children: ReactNode;
  showSnapshotManager: boolean;
  openSnapshots: () => void;
  closeSnapshots: () => void;
  snapshots: ERDSnapshot[];
  lastAutoSave: ERDSnapshot | null;
  autoSaveEnabled: boolean;
  saveSnapshot: (name: string) => void;
  loadSnapshot: (id: string) => void;
  renameSnapshot: (id: string, newName: string) => void;
  deleteSnapshot: (id: string) => void;
  exportSnapshot: (id: string) => void;
  shareSnapshot: (id: string) => void;
  exportAllSnapshots: () => void;
  importSnapshot: (file: File) => void;
  toggleAutoSave: (enabled: boolean) => void;
}

export function SnapshotProvider({
  children,
  showSnapshotManager,
  openSnapshots,
  closeSnapshots,
  snapshots,
  lastAutoSave,
  autoSaveEnabled,
  saveSnapshot,
  loadSnapshot,
  renameSnapshot,
  deleteSnapshot,
  exportSnapshot,
  shareSnapshot,
  exportAllSnapshots,
  importSnapshot,
  toggleAutoSave,
}: SnapshotProviderProps) {
  const value: SnapshotContextValue = {
    showSnapshotManager,
    snapshots,
    lastAutoSave,
    autoSaveEnabled,
    openSnapshots,
    closeSnapshots,
    saveSnapshot,
    loadSnapshot,
    renameSnapshot,
    deleteSnapshot,
    exportSnapshot,
    shareSnapshot,
    exportAllSnapshots,
    importSnapshot,
    toggleAutoSave,
  };

  return <SnapshotContext.Provider value={value}>{children}</SnapshotContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSnapshot(): SnapshotContextValue {
  const context = useContext(SnapshotContext);
  if (!context) {
    throw new Error('useSnapshot must be used within SnapshotProvider');
  }
  return context;
}
