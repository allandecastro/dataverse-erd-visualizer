/**
 * Tests for useSnapshots Hook
 * CRITICAL: Tests snapshot CRUD, auto-save, validation, and import/export
 */

import { renderHook, act } from '@testing-library/react';
import {
  useSnapshots,
  extractSnapshotsFromImport,
  deduplicateImportedSnapshots,
  buildEntityLookupMaps,
  type UseSnapshotsProps,
} from '../useSnapshots';
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
    colorSettings: {
      customTableColor: '#f0f9ff',
      standardTableColor: '#ffffff',
      lookupColor: '#fee2e2',
      edgeStyle: 'smoothstep' as const,
      lineNotation: 'simple' as const,
      lineStroke: 'solid' as const,
      lineThickness: 1.5,
      useRelationshipTypeColors: false,
      oneToManyColor: '#f97316',
      manyToOneColor: '#06b6d4',
      manyToManyColor: '#8b5cf6',
    },
    showMinimap: false,
    isSmartZoom: true,
    edgeOffsets: {},
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

// ===========================================================================
// Extracted Helper Functions (unit tests)
// ===========================================================================

describe('extractSnapshotsFromImport', () => {
  const mockSnapshot: ERDSnapshot = {
    id: 'snap1',
    name: 'Test',
    timestamp: Date.now(),
    version: '1.0.0',
    state: {
      selectedEntities: ['account'],
      collapsedEntities: [],
      selectedFields: {},
      fieldOrder: {},
      entityPositions: {},
      zoom: 1,
      pan: { x: 0, y: 0 },
      layoutMode: 'force',
      searchQuery: '',
      publisherFilter: '',
      solutionFilter: '',
      isDarkMode: false,
      colorSettings: {
        customTableColor: '#f0f9ff',
        standardTableColor: '#ffffff',
        lookupColor: '#fee2e2',
        edgeStyle: 'smoothstep',
        lineNotation: 'simple',
        lineStroke: 'solid',
        lineThickness: 1.5,
        useRelationshipTypeColors: false,
      },
      showMinimap: false,
      isSmartZoom: true,
      edgeOffsets: {},
    },
  };

  it('should extract single snapshot from erdVisualizerSnapshot format', () => {
    const data = { erdVisualizerSnapshot: true, snapshot: mockSnapshot };
    const result = extractSnapshotsFromImport(data);
    expect(result).toHaveLength(1);
    expect(result![0]).toEqual(mockSnapshot);
  });

  it('should extract multiple snapshots from erdVisualizerSnapshotsExport format', () => {
    const data = {
      erdVisualizerSnapshotsExport: true,
      snapshots: [mockSnapshot, { ...mockSnapshot, id: 'snap2', name: 'Second' }],
    };
    const result = extractSnapshotsFromImport(data);
    expect(result).toHaveLength(2);
    expect(result![1].name).toBe('Second');
  });

  it('should return null for unrecognized format', () => {
    expect(extractSnapshotsFromImport({ random: 'data' })).toBeNull();
  });

  it('should return null when single format has no snapshot field', () => {
    expect(extractSnapshotsFromImport({ erdVisualizerSnapshot: true })).toBeNull();
  });

  it('should return null when export format has no snapshots array', () => {
    expect(extractSnapshotsFromImport({ erdVisualizerSnapshotsExport: true })).toBeNull();
  });

  it('should return null when export format has non-array snapshots', () => {
    expect(
      extractSnapshotsFromImport({ erdVisualizerSnapshotsExport: true, snapshots: 'invalid' })
    ).toBeNull();
  });
});

describe('deduplicateImportedSnapshots', () => {
  const baseSnapshot: ERDSnapshot = {
    id: 'original-id',
    name: 'My Snapshot',
    timestamp: Date.now(),
    version: '1.0.0',
    state: {
      selectedEntities: [],
      collapsedEntities: [],
      selectedFields: {},
      fieldOrder: {},
      entityPositions: {},
      zoom: 1,
      pan: { x: 0, y: 0 },
      layoutMode: 'force',
      searchQuery: '',
      publisherFilter: '',
      solutionFilter: '',
      isDarkMode: false,
      colorSettings: {
        customTableColor: '#f0f9ff',
        standardTableColor: '#ffffff',
        lookupColor: '#fee2e2',
        edgeStyle: 'smoothstep',
        lineNotation: 'simple',
        lineStroke: 'solid',
        lineThickness: 1.5,
        useRelationshipTypeColors: false,
      },
      showMinimap: false,
      isSmartZoom: true,
      edgeOffsets: {},
    },
  };

  it('should assign new unique IDs to imported snapshots', () => {
    const result = deduplicateImportedSnapshots([baseSnapshot], []);
    expect(result[0].id).not.toBe('original-id');
  });

  it('should keep name unchanged when no conflict exists', () => {
    const result = deduplicateImportedSnapshots([baseSnapshot], []);
    expect(result[0].name).toBe('My Snapshot');
  });

  it('should deduplicate name when it conflicts with existing names', () => {
    const result = deduplicateImportedSnapshots([baseSnapshot], ['My Snapshot']);
    expect(result[0].name).not.toBe('My Snapshot');
    expect(result[0].name).toContain('My Snapshot');
  });

  it('should deduplicate names within the imported batch', () => {
    const batch = [baseSnapshot, { ...baseSnapshot, id: 'id2' }];
    const result = deduplicateImportedSnapshots(batch, []);
    expect(result[0].name).toBe('My Snapshot');
    expect(result[1].name).not.toBe('My Snapshot');
  });

  it('should preserve snapshot state data', () => {
    const result = deduplicateImportedSnapshots([baseSnapshot], []);
    expect(result[0].state).toEqual(baseSnapshot.state);
    expect(result[0].version).toBe(baseSnapshot.version);
  });
});

describe('buildEntityLookupMaps', () => {
  const entities: Entity[] = [
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
        { name: 'revenue', displayName: 'Revenue', type: 'Money', isPrimaryKey: false },
      ],
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
        { name: 'fullname', displayName: 'Full Name', type: 'String', isPrimaryKey: false },
      ],
      alternateKeys: [],
    },
  ];

  it('should build entityMap with logicalName as key', () => {
    const { entityMap } = buildEntityLookupMaps(entities);
    expect(entityMap.size).toBe(2);
    expect(entityMap.get('account')?.displayName).toBe('Account');
    expect(entityMap.get('contact')?.displayName).toBe('Contact');
  });

  it('should return undefined for non-existent entity', () => {
    const { entityMap } = buildEntityLookupMaps(entities);
    expect(entityMap.get('nonexistent')).toBeUndefined();
  });

  it('should build fieldMaps with attribute name Sets per entity', () => {
    const { fieldMaps } = buildEntityLookupMaps(entities);
    expect(fieldMaps.size).toBe(2);

    const accountFields = fieldMaps.get('account')!;
    expect(accountFields.has('accountid')).toBe(true);
    expect(accountFields.has('name')).toBe(true);
    expect(accountFields.has('revenue')).toBe(true);
    expect(accountFields.has('nonexistent')).toBe(false);
  });

  it('should handle empty entity list', () => {
    const { entityMap, fieldMaps } = buildEntityLookupMaps([]);
    expect(entityMap.size).toBe(0);
    expect(fieldMaps.size).toBe(0);
  });

  it('should handle entity with no attributes', () => {
    const emptyEntity: Entity = {
      logicalName: 'empty',
      displayName: 'Empty',
      objectTypeCode: 999,
      isCustomEntity: false,
      primaryIdAttribute: 'emptyid',
      primaryNameAttribute: 'name',
      attributes: [],
      alternateKeys: [],
    };
    const { fieldMaps } = buildEntityLookupMaps([emptyEntity]);
    expect(fieldMaps.get('empty')?.size).toBe(0);
  });
});
