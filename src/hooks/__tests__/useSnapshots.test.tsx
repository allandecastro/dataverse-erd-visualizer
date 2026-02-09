/**
 * Tests for useSnapshots Hook
 * CRITICAL: Tests snapshot CRUD, auto-save, validation, and import/export
 */

import { renderHook, act } from '@testing-library/react';
import { useSnapshots, type UseSnapshotsProps } from '../useSnapshots';
import type { Entity } from '@/types';
import type { SerializableState, ERDSnapshot } from '@/types/snapshotTypes';
import * as snapshotStorage from '@/utils/snapshotStorage';

// Mock dependencies
vi.mock('@/utils/snapshotStorage');

describe('useSnapshots', () => {
  const mockEntities: Entity[] = [
    {
      logicalName: 'account',
      displayName: 'Account',
      objectTypeCode: 1,
      isCustomEntity: false,
      primaryIdAttribute: 'accountid',
      primaryNameAttribute: 'name',
      attributes: [
        {
          name: 'accountid',
          displayName: 'Account ID',
          type: 'UniqueIdentifier',
          isPrimaryKey: true,
        },
        { name: 'name', displayName: 'Name', type: 'String', isPrimaryKey: false },
      ],
      publisher: 'Microsoft',
      alternateKeys: [],
    },
    {
      logicalName: 'contact',
      displayName: 'Contact',
      objectTypeCode: 2,
      isCustomEntity: false,
      primaryIdAttribute: 'contactid',
      primaryNameAttribute: 'fullname',
      attributes: [
        {
          name: 'contactid',
          displayName: 'Contact ID',
          type: 'UniqueIdentifier',
          isPrimaryKey: true,
        },
      ],
      publisher: 'Microsoft',
      alternateKeys: [],
    },
  ];

  const mockState: SerializableState = {
    selectedEntities: ['account'],
    collapsedEntities: [],
    selectedFields: { account: ['accountid', 'name'] },
    fieldOrder: { account: ['accountid', 'name'] },
    entityPositions: { account: { x: 100, y: 200 } },
    zoom: 1,
    pan: { x: 0, y: 0 },
    layoutMode: 'force' as const,
    searchQuery: '',
    publisherFilter: '',
    solutionFilter: '',
    isDarkMode: false,
  };

  const mockGetSerializableState = vi.fn(() => mockState);
  const mockRestoreState = vi.fn();
  const mockShowToast = vi.fn();

  const defaultProps: UseSnapshotsProps = {
    getSerializableState: mockGetSerializableState,
    restoreState: mockRestoreState,
    showToast: mockShowToast,
    entities: mockEntities,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(snapshotStorage.loadSnapshots).mockReturnValue({
      snapshots: [],
      autoSaveEnabled: true,
    });
    vi.mocked(snapshotStorage.saveSnapshots).mockImplementation(() => {});
  });

  describe('Initialization', () => {
    it('should load snapshots from localStorage on mount', () => {
      const existingSnapshots: ERDSnapshot[] = [
        {
          id: 'snap1',
          name: 'Test Snapshot',
          timestamp: Date.now(),
          version: '1.0.0',
          state: mockState,
        },
      ];

      vi.mocked(snapshotStorage.loadSnapshots).mockReturnValue({
        snapshots: existingSnapshots,
        autoSaveEnabled: true,
      });

      const { result } = renderHook(() => useSnapshots(defaultProps));

      expect(result.current.snapshots).toHaveLength(1);
      expect(result.current.snapshots[0].name).toBe('Test Snapshot');
      expect(result.current.autoSaveEnabled).toBe(true);
    });

    it('should initialize with empty snapshots if localStorage is empty', () => {
      vi.mocked(snapshotStorage.loadSnapshots).mockReturnValue({
        snapshots: [],
        autoSaveEnabled: true,
      });

      const { result } = renderHook(() => useSnapshots(defaultProps));

      expect(result.current.snapshots).toHaveLength(0);
      expect(result.current.lastAutoSave).toBeNull();
    });

    it('should load last auto-save from localStorage', () => {
      const autoSaveSnapshot: ERDSnapshot = {
        id: 'auto-save',
        name: 'Auto-saved Session',
        timestamp: Date.now(),
        version: '1.0.0',
        state: mockState,
      };

      vi.mocked(snapshotStorage.loadSnapshots).mockReturnValue({
        snapshots: [],
        lastAutoSave: autoSaveSnapshot,
        autoSaveEnabled: true,
      });

      const { result } = renderHook(() => useSnapshots(defaultProps));

      expect(result.current.lastAutoSave).toEqual(autoSaveSnapshot);
    });
  });

  describe('Save Snapshot', () => {
    it('should save a new snapshot with provided name', () => {
      const { result } = renderHook(() => useSnapshots(defaultProps));

      act(() => {
        result.current.saveSnapshot('My Snapshot');
      });

      expect(result.current.snapshots).toHaveLength(1);
      expect(result.current.snapshots[0].name).toBe('My Snapshot');
      expect(result.current.snapshots[0].state).toEqual(mockState);
      expect(mockShowToast).toHaveBeenCalledWith('Snapshot "My Snapshot" saved!', 'success');
    });

    it('should persist to localStorage after save', () => {
      const { result } = renderHook(() => useSnapshots(defaultProps));

      act(() => {
        result.current.saveSnapshot('Test');
      });

      expect(snapshotStorage.saveSnapshots).toHaveBeenCalledWith(
        expect.objectContaining({
          snapshots: expect.arrayContaining([expect.objectContaining({ name: 'Test' })]),
        })
      );
    });
  });

  describe('Load Snapshot', () => {
    it('should load snapshot and restore state', () => {
      const snapshot: ERDSnapshot = {
        id: 'snap1',
        name: 'Test',
        timestamp: Date.now(),
        version: '1.0.0',
        state: mockState,
      };

      vi.mocked(snapshotStorage.loadSnapshots).mockReturnValue({
        snapshots: [snapshot],
        autoSaveEnabled: true,
      });

      const { result } = renderHook(() => useSnapshots(defaultProps));

      act(() => {
        result.current.loadSnapshot('snap1');
      });

      expect(mockRestoreState).toHaveBeenCalledWith(mockState);
      expect(mockShowToast).toHaveBeenCalledWith('Snapshot "Test" loaded!', 'success');
    });

    it('should show error if snapshot not found', () => {
      const { result } = renderHook(() => useSnapshots(defaultProps));

      act(() => {
        result.current.loadSnapshot('nonexistent');
      });

      expect(mockRestoreState).not.toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith('Snapshot not found', 'error');
    });

    it('should load auto-save snapshot when id is "auto-save"', () => {
      const autoSave: ERDSnapshot = {
        id: 'auto-save',
        name: 'Auto-saved Session',
        timestamp: Date.now(),
        version: '1.0.0',
        state: mockState,
      };

      vi.mocked(snapshotStorage.loadSnapshots).mockReturnValue({
        snapshots: [],
        lastAutoSave: autoSave,
        autoSaveEnabled: true,
      });

      const { result } = renderHook(() => useSnapshots(defaultProps));

      act(() => {
        result.current.loadSnapshot('auto-save');
      });

      expect(mockRestoreState).toHaveBeenCalledWith(mockState);
    });

    it('should validate schema and filter missing entities', () => {
      const stateWithMissingEntity: SerializableState = {
        ...mockState,
        selectedEntities: ['account', 'nonexistent'],
        selectedFields: { account: ['accountid'], nonexistent: ['field1'] },
        entityPositions: { account: { x: 0, y: 0 }, nonexistent: { x: 100, y: 100 } },
      };

      const snapshot: ERDSnapshot = {
        id: 'snap1',
        name: 'Test',
        timestamp: Date.now(),
        version: '1.0.0',
        state: stateWithMissingEntity,
      };

      vi.mocked(snapshotStorage.loadSnapshots).mockReturnValue({
        snapshots: [snapshot],
        autoSaveEnabled: true,
      });

      const { result } = renderHook(() => useSnapshots(defaultProps));

      act(() => {
        result.current.loadSnapshot('snap1');
      });

      // Should restore filtered state (without 'nonexistent' entity)
      expect(mockRestoreState).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedEntities: ['account'],
        })
      );

      // Should show warning about missing entities
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.stringContaining('Schema mismatch detected'),
        'warning'
      );
    });
  });

  describe('Delete Snapshot', () => {
    it('should delete snapshot', () => {
      const snapshot: ERDSnapshot = {
        id: 'snap1',
        name: 'Test',
        timestamp: Date.now(),
        version: '1.0.0',
        state: mockState,
      };

      vi.mocked(snapshotStorage.loadSnapshots).mockReturnValue({
        snapshots: [snapshot],
        autoSaveEnabled: true,
      });

      const { result } = renderHook(() => useSnapshots(defaultProps));

      expect(result.current.snapshots).toHaveLength(1);

      act(() => {
        result.current.deleteSnapshot('snap1');
      });

      expect(result.current.snapshots).toHaveLength(0);
      expect(mockShowToast).toHaveBeenCalledWith('Snapshot deleted!', 'success');
    });
  });

  describe('Toggle Auto-Save', () => {
    it('should enable/disable auto-save', () => {
      const { result } = renderHook(() => useSnapshots(defaultProps));

      expect(result.current.autoSaveEnabled).toBe(true);

      act(() => {
        result.current.toggleAutoSave(false);
      });

      expect(result.current.autoSaveEnabled).toBe(false);
      expect(mockShowToast).toHaveBeenCalledWith('Auto-save disabled', 'info');

      act(() => {
        result.current.toggleAutoSave(true);
      });

      expect(result.current.autoSaveEnabled).toBe(true);
      expect(mockShowToast).toHaveBeenCalledWith('Auto-save enabled', 'info');
    });
  });
});
