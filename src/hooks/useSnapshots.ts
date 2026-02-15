/**
 * Custom hook for managing snapshots (save/load/rename/delete)
 * Handles CRUD operations, auto-save, and JSON import/export
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Entity } from '@/types';
import type { ToastType } from '@/types/erdTypes';
import type {
  ERDSnapshot,
  SerializableState,
  SnapshotValidationResult,
  SnapshotExportData,
} from '@/types/snapshotTypes';
import { loadSnapshots, saveSnapshots } from '@/utils/snapshotStorage';
import {
  generateSnapshotId,
  generateDefaultSnapshotName,
  ensureUniqueName,
  isRecentTimestamp,
} from '@/utils/snapshotSerializer';
import { encodeStateToURL, buildMinimalShareState } from '@/utils/urlStateCodec';
import { downloadFile } from '@/utils/fileDownload';
import {
  AUTO_SAVE_DEBOUNCE,
  MAX_SNAPSHOTS,
  SHARE_URL_MAX_LENGTH,
  SHARE_URL_WARN_LENGTH,
} from '@/constants';

const CURRENT_VERSION = '1.0.0';

/**
 * Extract snapshots from imported JSON data.
 * Supports both single-snapshot and "Export All" formats.
 * Returns null if the data format is invalid.
 */
export function extractSnapshotsFromImport(data: Record<string, unknown>): ERDSnapshot[] | null {
  if (data.erdVisualizerSnapshot === true) {
    if (!data.snapshot) return null;
    return [data.snapshot as ERDSnapshot];
  }
  if (data.erdVisualizerSnapshotsExport === true) {
    if (!data.snapshots || !Array.isArray(data.snapshots)) return null;
    return data.snapshots as ERDSnapshot[];
  }
  return null;
}

/**
 * Assign unique IDs and names to imported snapshots to avoid conflicts.
 */
export function deduplicateImportedSnapshots(
  importedSnapshots: ERDSnapshot[],
  existingNames: string[]
): ERDSnapshot[] {
  const processed: ERDSnapshot[] = [];
  for (const snapshot of importedSnapshots) {
    const uniqueName = ensureUniqueName(snapshot.name, [
      ...existingNames,
      ...processed.map((s) => s.name),
    ]);
    processed.push({
      ...snapshot,
      id: generateSnapshotId(),
      name: uniqueName,
    });
  }
  return processed;
}

/**
 * Build lookup maps for entity and field validation.
 * Shared by validateSnapshot and filterInvalidEntries to avoid duplicate map creation.
 */
export function buildEntityLookupMaps(entities: Entity[]) {
  const entityMap = new Map(entities.map((e) => [e.logicalName, e]));
  const fieldMaps = new Map(
    entities.map((e) => [e.logicalName, new Set(e.attributes.map((a) => a.name))])
  );
  return { entityMap, fieldMaps };
}

export interface UseSnapshotsProps {
  getSerializableState: () => SerializableState;
  restoreState: (state: SerializableState) => void;
  showToast: (message: string, type: ToastType) => void;
  entities: Entity[]; // For schema validation
}

export function useSnapshots({
  getSerializableState,
  restoreState,
  showToast,
  entities,
}: UseSnapshotsProps) {
  // Load snapshots from localStorage once on mount
  const initialData = loadSnapshots();

  const [snapshots, setSnapshots] = useState<ERDSnapshot[]>(initialData?.snapshots || []);
  const [lastAutoSave, setLastAutoSave] = useState<ERDSnapshot | null>(
    initialData?.lastAutoSave || null
  );
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(
    initialData?.autoSaveEnabled !== undefined ? initialData.autoSaveEnabled : true
  );

  // Refs for auto-save debouncing and snapshot tracking
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedStateRef = useRef<string>('');
  const snapshotsRef = useRef<ERDSnapshot[]>(snapshots);

  // Keep snapshotsRef in sync with snapshots state
  useEffect(() => {
    snapshotsRef.current = snapshots;
  }, [snapshots]);

  // Persist snapshots to localStorage whenever they change
  const persistToStorage = useCallback(
    (snaps: ERDSnapshot[], autoSave: ERDSnapshot | null, autoSaveEnabledValue: boolean) => {
      try {
        saveSnapshots({
          snapshots: snaps,
          lastAutoSave: autoSave || undefined,
          autoSaveEnabled: autoSaveEnabledValue,
        });
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Failed to save snapshots', 'error');
      }
    },
    [showToast]
  );

  // Auto-save: Trigger on state change (debounced)
  useEffect(() => {
    if (!autoSaveEnabled) return;

    // Get current state and serialize for comparison
    const currentState = getSerializableState();
    const currentStateJson = JSON.stringify(currentState);

    // Skip if state hasn't changed
    if (currentStateJson === lastSavedStateRef.current) {
      return;
    }

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer
    autoSaveTimerRef.current = setTimeout(() => {
      const autoSaveSnapshot: ERDSnapshot = {
        id: 'auto-save',
        name: 'Auto-saved Session',
        timestamp: Date.now(),
        version: CURRENT_VERSION,
        state: currentState,
      };

      setLastAutoSave(autoSaveSnapshot);
      persistToStorage(snapshotsRef.current, autoSaveSnapshot, autoSaveEnabled);
      lastSavedStateRef.current = currentStateJson;
    }, AUTO_SAVE_DEBOUNCE);

    // Cleanup timer on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [getSerializableState, autoSaveEnabled, persistToStorage]);

  // Auto-save on window beforeunload (browser close/refresh)
  useEffect(() => {
    if (!autoSaveEnabled) return;

    const handleBeforeUnload = () => {
      const currentState = getSerializableState();
      const autoSaveSnapshot: ERDSnapshot = {
        id: 'auto-save',
        name: 'Auto-saved Session',
        timestamp: Date.now(),
        version: CURRENT_VERSION,
        state: currentState,
      };

      // Synchronous save (beforeunload is time-sensitive)
      try {
        saveSnapshots({
          snapshots,
          lastAutoSave: autoSaveSnapshot,
          autoSaveEnabled,
        });
      } catch (error) {
        console.error('[useSnapshots] Failed to auto-save on beforeunload:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [getSerializableState, snapshots, autoSaveEnabled]);

  // Validate snapshot schema (check for missing entities/fields)
  const validateSnapshot = useCallback(
    (snapshot: ERDSnapshot): SnapshotValidationResult => {
      const { entityMap, fieldMaps } = buildEntityLookupMaps(entities);
      const missingEntities: string[] = [];
      const missingFields: Array<{ entity: string; field: string }> = [];

      snapshot.state.selectedEntities.forEach((entityName) => {
        if (!entityMap.has(entityName)) {
          missingEntities.push(entityName);
        }
      });

      Object.entries(snapshot.state.selectedFields).forEach(([entityName, fieldNames]) => {
        const fields = fieldMaps.get(entityName);
        if (fields) {
          fieldNames.forEach((fieldName) => {
            if (!fields.has(fieldName)) {
              missingFields.push({ entity: entityName, field: fieldName });
            }
          });
        }
      });

      return {
        isValid: missingEntities.length === 0 && missingFields.length === 0,
        missingEntities,
        missingFields,
      };
    },
    [entities]
  );

  // Filter out missing entities/fields from snapshot state
  const filterInvalidEntries = useCallback(
    (state: SerializableState, _validation: SnapshotValidationResult): SerializableState => {
      const { entityMap, fieldMaps } = buildEntityLookupMaps(entities);
      const validEntities = state.selectedEntities.filter((name) => entityMap.has(name));

      // Filter fields using shared field maps
      const filterFieldRecord = (record: Record<string, string[]>) => {
        const result: Record<string, string[]> = {};
        Object.entries(record).forEach(([entityName, fieldNames]) => {
          const fields = fieldMaps.get(entityName);
          if (fields) {
            const valid = fieldNames.filter((f) => fields.has(f));
            if (valid.length > 0) result[entityName] = valid;
          }
        });
        return result;
      };

      // Filter entity positions
      const validEntityPositions: Record<
        string,
        { x: number; y: number; vx?: number; vy?: number }
      > = {};
      Object.entries(state.entityPositions).forEach(([entityName, position]) => {
        if (entityMap.has(entityName)) {
          validEntityPositions[entityName] = position;
        }
      });

      return {
        ...state,
        selectedEntities: validEntities,
        collapsedEntities: state.collapsedEntities.filter((name) => entityMap.has(name)),
        selectedFields: filterFieldRecord(state.selectedFields),
        fieldOrder: filterFieldRecord(state.fieldOrder),
        entityPositions: validEntityPositions,
      };
    },
    [entities]
  );

  // Save new snapshot
  const saveSnapshot = useCallback(
    (name: string): void => {
      const trimmedName = name.trim();
      const snapshotName = trimmedName || generateDefaultSnapshotName(Date.now());

      // Ensure unique name
      const existingNames = snapshots.map((s) => s.name);
      const uniqueName = ensureUniqueName(snapshotName, existingNames);

      const newSnapshot: ERDSnapshot = {
        id: generateSnapshotId(),
        name: uniqueName,
        timestamp: Date.now(),
        version: CURRENT_VERSION,
        state: getSerializableState(),
      };

      // Add to snapshots (enforce max limit)
      let updatedSnapshots = [...snapshots, newSnapshot];
      if (updatedSnapshots.length > MAX_SNAPSHOTS) {
        // Remove oldest snapshot (by timestamp)
        updatedSnapshots.sort((a, b) => a.timestamp - b.timestamp);
        updatedSnapshots = updatedSnapshots.slice(1);
      }

      setSnapshots(updatedSnapshots);
      persistToStorage(updatedSnapshots, lastAutoSave, autoSaveEnabled);
      showToast(`Snapshot "${uniqueName}" saved!`, 'success');
    },
    [snapshots, getSerializableState, lastAutoSave, autoSaveEnabled, persistToStorage, showToast]
  );

  // Load snapshot (with schema validation)
  const loadSnapshot = useCallback(
    (id: string, skipValidation = false): void => {
      const snapshot =
        snapshots.find((s) => s.id === id) || (id === 'auto-save' ? lastAutoSave : null);
      if (!snapshot) {
        showToast('Snapshot not found', 'error');
        return;
      }

      // Validate schema (unless skipped after user confirmation)
      if (!skipValidation) {
        const validation = validateSnapshot(snapshot);
        if (!validation.isValid) {
          // Show warning and require user confirmation
          const missingCount = validation.missingEntities.length + validation.missingFields.length;
          showToast(
            `Schema mismatch detected. ${missingCount} element(s) will be skipped. Check console for details.`,
            'warning'
          );
          console.warn('[Snapshots] Missing entities:', validation.missingEntities);
          console.warn('[Snapshots] Missing fields:', validation.missingFields);

          // Filter out invalid entries
          const filteredState = filterInvalidEntries(snapshot.state, validation);
          restoreState(filteredState);
          showToast(
            `Snapshot loaded (${validation.missingEntities.length} entities and ${validation.missingFields.length} fields skipped)`,
            'success'
          );
          return;
        }
      }

      // Load snapshot normally
      restoreState(snapshot.state);
      showToast(`Snapshot "${snapshot.name}" loaded!`, 'success');
    },
    [snapshots, lastAutoSave, validateSnapshot, filterInvalidEntries, restoreState, showToast]
  );

  // Rename snapshot
  const renameSnapshot = useCallback(
    (id: string, newName: string): void => {
      const trimmedName = newName.trim();
      if (!trimmedName) {
        showToast('Snapshot name cannot be empty', 'error');
        return;
      }

      // Ensure unique name
      const existingNames = snapshots.filter((s) => s.id !== id).map((s) => s.name);
      const uniqueName = ensureUniqueName(trimmedName, existingNames);

      const updated = snapshots.map((s) => (s.id === id ? { ...s, name: uniqueName } : s));
      setSnapshots(updated);
      persistToStorage(updated, lastAutoSave, autoSaveEnabled);
      showToast('Snapshot renamed!', 'success');
    },
    [snapshots, lastAutoSave, autoSaveEnabled, persistToStorage, showToast]
  );

  // Delete snapshot
  const deleteSnapshot = useCallback(
    (id: string): void => {
      const updated = snapshots.filter((s) => s.id !== id);
      setSnapshots(updated);
      persistToStorage(updated, lastAutoSave, autoSaveEnabled);
      showToast('Snapshot deleted!', 'success');
    },
    [snapshots, lastAutoSave, autoSaveEnabled, persistToStorage, showToast]
  );

  // Export snapshot to JSON file
  const exportSnapshotToJSON = useCallback(
    (id: string): void => {
      const snapshot = snapshots.find((s) => s.id === id);
      if (!snapshot) {
        showToast('Snapshot not found', 'error');
        return;
      }

      const exportData: SnapshotExportData = {
        erdVisualizerSnapshot: true,
        version: CURRENT_VERSION,
        exported: Date.now(),
        snapshot,
      };

      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const filename = `snapshot-${snapshot.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.json`;
      downloadFile(blob, filename);

      showToast('Snapshot exported to JSON!', 'success');
    },
    [snapshots, showToast]
  );

  // Share snapshot as URL
  const shareSnapshot = useCallback(
    async (id: string): Promise<void> => {
      const snapshot = snapshots.find((s) => s.id === id);
      if (!snapshot) {
        showToast('Snapshot not found', 'error');
        return;
      }

      try {
        const minimalState = buildMinimalShareState(snapshot.state);

        // Encode state to URL
        const encoded = encodeStateToURL(minimalState);
        const baseUrl = window.location.origin + window.location.pathname + window.location.search;
        const shareUrl = `${baseUrl}#${encoded}`;

        // Check URL length
        const urlLength = shareUrl.length;
        if (urlLength > SHARE_URL_MAX_LENGTH) {
          showToast(
            'Snapshot too large to share via URL (32KB limit). Use Export instead.',
            'error'
          );
          return;
        }

        // Copy to clipboard
        await navigator.clipboard.writeText(shareUrl);

        // Show success toast with optional warning
        if (urlLength > SHARE_URL_WARN_LENGTH) {
          showToast(
            `Share URL copied! (${urlLength} chars - may not work in older browsers)`,
            'warning'
          );
        } else {
          showToast(`Share URL for "${snapshot.name}" copied to clipboard!`, 'success');
        }
      } catch (error) {
        console.error('[useSnapshots] Failed to share snapshot:', error);
        showToast(
          `Failed to share snapshot: ${error instanceof Error ? error.message : String(error)}`,
          'error'
        );
      }
    },
    [snapshots, showToast]
  );

  // Export all snapshots to a single JSON file
  const exportAllSnapshotsToJSON = useCallback((): void => {
    if (snapshots.length === 0 && !lastAutoSave) {
      showToast('No snapshots to export', 'info');
      return;
    }

    const exportData = {
      erdVisualizerSnapshotsExport: true,
      version: CURRENT_VERSION,
      exported: Date.now(),
      count: snapshots.length + (lastAutoSave ? 1 : 0),
      snapshots,
      lastAutoSave,
      autoSaveEnabled,
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    downloadFile(blob, `snapshots-all-${Date.now()}.json`);

    showToast(`${exportData.count} snapshot(s) exported!`, 'success');
  }, [snapshots, lastAutoSave, autoSaveEnabled, showToast]);

  // Import snapshot from JSON file
  const importSnapshotFromJSON = useCallback(
    (file: File): void => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = e.target?.result as string;
          const data = JSON.parse(json);

          const importedSnapshots = extractSnapshotsFromImport(data);
          if (!importedSnapshots) {
            showToast('Invalid snapshot file format', 'error');
            return;
          }

          const processedSnapshots = deduplicateImportedSnapshots(
            importedSnapshots,
            snapshots.map((s) => s.name)
          );

          // Add to snapshots (enforce max limit)
          let updatedSnapshots = [...snapshots, ...processedSnapshots];
          if (updatedSnapshots.length > MAX_SNAPSHOTS) {
            updatedSnapshots.sort((a, b) => b.timestamp - a.timestamp);
            updatedSnapshots = updatedSnapshots.slice(0, MAX_SNAPSHOTS);
          }

          setSnapshots(updatedSnapshots);
          persistToStorage(updatedSnapshots, lastAutoSave, autoSaveEnabled);

          if (processedSnapshots.length === 1) {
            showToast(`Snapshot "${processedSnapshots[0].name}" imported!`, 'success');
          } else {
            showToast(`${processedSnapshots.length} snapshot(s) imported!`, 'success');
          }
        } catch (error) {
          showToast(
            `Failed to import snapshot: ${error instanceof Error ? error.message : String(error)}`,
            'error'
          );
        }
      };

      reader.readAsText(file);
    },
    [snapshots, lastAutoSave, autoSaveEnabled, persistToStorage, showToast]
  );

  // Toggle auto-save
  const toggleAutoSave = useCallback(
    (enabled: boolean): void => {
      setAutoSaveEnabled(enabled);
      persistToStorage(snapshots, lastAutoSave, enabled);
      showToast(`Auto-save ${enabled ? 'enabled' : 'disabled'}`, 'info');
    },
    [snapshots, lastAutoSave, persistToStorage, showToast]
  );

  return {
    snapshots,
    lastAutoSave,
    autoSaveEnabled,
    hasRecentAutoSave: lastAutoSave ? isRecentTimestamp(lastAutoSave.timestamp) : false,
    saveSnapshot,
    loadSnapshot,
    renameSnapshot,
    deleteSnapshot,
    exportSnapshotToJSON,
    shareSnapshot,
    exportAllSnapshotsToJSON,
    importSnapshotFromJSON,
    toggleAutoSave,
  };
}
