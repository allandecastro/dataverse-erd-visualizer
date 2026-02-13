/**
 * Tests for useERDState Hook
 * Tests core ERD state management including entity selection, filtering, and toast notifications
 */

import { renderHook, act } from '@testing-library/react';
import { useERDState, type UseERDStateProps } from '../useERDState';
import type { Entity, EntityRelationship } from '@/types';

describe('useERDState', () => {
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
    {
      logicalName: 'new_custom',
      displayName: 'Custom Entity',
      objectTypeCode: 10000,
      isCustomEntity: true,
      primaryIdAttribute: 'new_customid',
      primaryNameAttribute: 'new_name',
      attributes: [
        {
          name: 'new_customid',
          displayName: 'Custom ID',
          type: 'UniqueIdentifier',
          isPrimaryKey: true,
        },
      ],
      publisher: 'CustomPublisher',
      alternateKeys: [],
    },
  ];

  const mockRelationships: EntityRelationship[] = [
    {
      from: 'contact',
      to: 'account',
      type: 'N:1',
      schemaName: 'contact_account',
      referencingAttribute: 'parentcustomerid',
      referencedAttribute: 'accountid',
      relationshipType: 'OneToManyRelationship',
    },
  ];

  const defaultProps: UseERDStateProps = {
    entities: mockEntities,
    relationships: mockRelationships,
  };

  describe('Initialization', () => {
    it('should initialize with empty entity selection', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      expect(result.current.selectedEntities.size).toBe(0);
      expect(result.current.filteredEntities).toEqual([]);
      expect(result.current.filteredRelationships).toEqual([]);
    });

    it('should initialize with default dark mode', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      expect(result.current.isDarkMode).toBe(true);
    });

    it('should initialize with default zoom and pan', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      expect(result.current.zoom).toBe(0.8);
      expect(result.current.pan).toEqual({ x: 400, y: 100 });
    });
  });

  describe('Entity Selection', () => {
    it('should toggle entity selection', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      act(() => {
        result.current.toggleEntity('account');
      });

      expect(result.current.selectedEntities.has('account')).toBe(true);
      expect(result.current.selectedEntities.size).toBe(1);
    });

    it('should deselect entity when toggled again', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      act(() => {
        result.current.toggleEntity('account');
      });

      expect(result.current.selectedEntities.has('account')).toBe(true);

      act(() => {
        result.current.toggleEntity('account');
      });

      expect(result.current.selectedEntities.has('account')).toBe(false);
      expect(result.current.selectedEntities.size).toBe(0);
    });

    it('should set multiple entities at once', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      act(() => {
        result.current.setSelectedEntities(new Set(['account', 'contact']));
      });

      expect(result.current.selectedEntities.size).toBe(2);
      expect(result.current.selectedEntities.has('account')).toBe(true);
      expect(result.current.selectedEntities.has('contact')).toBe(true);
    });

    it('should select all entities when selectAll is called without arguments', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      act(() => {
        result.current.selectAll();
      });

      expect(result.current.selectedEntities.size).toBe(3);
      expect(result.current.selectedEntities.has('account')).toBe(true);
      expect(result.current.selectedEntities.has('contact')).toBe(true);
      expect(result.current.selectedEntities.has('new_custom')).toBe(true);
    });

    it('should select only specified entities when selectAll is called with entity names', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      // Pre-select one entity
      act(() => {
        result.current.toggleEntity('new_custom');
      });
      expect(result.current.selectedEntities.size).toBe(1);

      // Select specific entities (should be additive)
      act(() => {
        result.current.selectAll(['account', 'contact']);
      });

      expect(result.current.selectedEntities.size).toBe(3);
      expect(result.current.selectedEntities.has('account')).toBe(true);
      expect(result.current.selectedEntities.has('contact')).toBe(true);
      expect(result.current.selectedEntities.has('new_custom')).toBe(true);
    });

    it('should deselect all entities when deselectAll is called without arguments', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      act(() => {
        result.current.selectAll();
      });
      expect(result.current.selectedEntities.size).toBe(3);

      act(() => {
        result.current.deselectAll();
      });

      expect(result.current.selectedEntities.size).toBe(0);
    });

    it('should deselect only specified entities when deselectAll is called with entity names', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      // Select all first
      act(() => {
        result.current.selectAll();
      });
      expect(result.current.selectedEntities.size).toBe(3);

      // Deselect only specific entities
      act(() => {
        result.current.deselectAll(['account', 'contact']);
      });

      expect(result.current.selectedEntities.size).toBe(1);
      expect(result.current.selectedEntities.has('new_custom')).toBe(true);
      expect(result.current.selectedEntities.has('account')).toBe(false);
      expect(result.current.selectedEntities.has('contact')).toBe(false);
    });
  });

  describe('Filtered Entities and Relationships', () => {
    it('should filter entities based on selection', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      act(() => {
        result.current.setSelectedEntities(new Set(['account']));
      });

      expect(result.current.filteredEntities).toHaveLength(1);
      expect(result.current.filteredEntities[0].logicalName).toBe('account');
    });

    it('should filter relationships to only include selected entities', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      // Select only account (relationship needs both account AND contact)
      act(() => {
        result.current.setSelectedEntities(new Set(['account']));
      });

      expect(result.current.filteredRelationships).toHaveLength(0);

      // Select both entities
      act(() => {
        result.current.setSelectedEntities(new Set(['account', 'contact']));
      });

      expect(result.current.filteredRelationships).toHaveLength(1);
      expect(result.current.filteredRelationships[0].schemaName).toBe('contact_account');
    });

    it('should update filtered data when entities change', () => {
      const { result, rerender } = renderHook(
        ({ entities, relationships }) => useERDState({ entities, relationships }),
        { initialProps: defaultProps }
      );

      act(() => {
        result.current.setSelectedEntities(new Set(['account', 'contact']));
      });

      expect(result.current.filteredEntities).toHaveLength(2);

      // Update entities list
      const newEntities = mockEntities.slice(0, 1); // Only account
      rerender({ entities: newEntities, relationships: mockRelationships });

      expect(result.current.filteredEntities).toHaveLength(1);
    });
  });

  describe('Search and Filters', () => {
    it('should update search query', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      act(() => {
        result.current.setSearchQuery('account');
      });

      expect(result.current.searchQuery).toBe('account');
    });

    it('should update publisher filter', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      act(() => {
        result.current.setPublisherFilter('Microsoft');
      });

      expect(result.current.publisherFilter).toBe('Microsoft');
    });
  });

  describe('Toast Notifications', () => {
    it('should show toast notification', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      act(() => {
        result.current.showToast('Test message', 'success');
      });

      expect(result.current.toast).toEqual({
        message: 'Test message',
        type: 'success',
      });
    });

    it('should clear toast after timeout', async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useERDState(defaultProps));

      act(() => {
        result.current.showToast('Test message');
      });

      expect(result.current.toast).not.toBeNull();

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.toast).toBeNull();

      vi.useRealTimers();
    });

    it('should support different toast types', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      act(() => {
        result.current.showToast('Error message', 'error');
      });

      expect(result.current.toast?.type).toBe('error');

      act(() => {
        result.current.showToast('Info message', 'info');
      });

      expect(result.current.toast?.type).toBe('info');
    });
  });

  describe('Zoom and Pan', () => {
    it('should update zoom level', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      act(() => {
        result.current.setZoom(1.5);
      });

      expect(result.current.zoom).toBe(1.5);
    });

    it('should update pan position', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      act(() => {
        result.current.setPan({ x: 100, y: 200 });
      });

      expect(result.current.pan).toEqual({ x: 100, y: 200 });
    });
  });

  describe('Collapsed Entities', () => {
    it('should set collapsed entities', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      act(() => {
        result.current.setCollapsedEntities(new Set(['account']));
      });

      expect(result.current.collapsedEntities.has('account')).toBe(true);
      expect(result.current.collapsedEntities.size).toBe(1);
    });
  });

  describe('Theme', () => {
    it('should toggle dark mode', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      expect(result.current.isDarkMode).toBe(true);

      act(() => {
        result.current.setIsDarkMode(false);
      });

      expect(result.current.isDarkMode).toBe(false);
    });
  });

  describe('Color Settings', () => {
    it('should initialize with default colorSettings including new line customization properties', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      expect(result.current.colorSettings).toEqual({
        customTableColor: '#0ea5e9',
        standardTableColor: '#64748b',
        lookupColor: '#f97316',
        edgeStyle: 'smoothstep',
        lineNotation: 'simple',
        lineStroke: 'solid',
        lineThickness: 1.5,
        useRelationshipTypeColors: false,
        oneToManyColor: '#f97316',
        manyToOneColor: '#06b6d4',
        manyToManyColor: '#8b5cf6',
      });
    });

    it('should include new colorSettings properties in serializable state', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      const serializedState = result.current.getSerializableState();

      expect(serializedState.colorSettings.lineNotation).toBe('simple');
      expect(serializedState.colorSettings.lineStroke).toBe('solid');
      expect(serializedState.colorSettings.lineThickness).toBe(1.5);
      expect(serializedState.colorSettings.useRelationshipTypeColors).toBe(false);
      expect(serializedState.colorSettings.oneToManyColor).toBe('#f97316');
      expect(serializedState.colorSettings.manyToOneColor).toBe('#06b6d4');
      expect(serializedState.colorSettings.manyToManyColor).toBe('#8b5cf6');
    });

    it('should restore state with new colorSettings properties', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      const customState = {
        selectedEntities: ['account'],
        collapsedEntities: [],
        selectedFields: {},
        fieldOrder: {},
        entityPositions: {},
        layoutMode: 'force' as const,
        zoom: 1,
        pan: { x: 0, y: 0 },
        searchQuery: '',
        publisherFilter: 'all',
        solutionFilter: 'all',
        isDarkMode: false,
        colorSettings: {
          customTableColor: '#ff0000',
          standardTableColor: '#00ff00',
          lookupColor: '#0000ff',
          edgeStyle: 'bezier' as const,
          lineNotation: 'crowsfoot' as const,
          lineStroke: 'dashed' as const,
          lineThickness: 3,
          useRelationshipTypeColors: true,
          oneToManyColor: '#aaaaaa',
          manyToOneColor: '#bbbbbb',
          manyToManyColor: '#cccccc',
        },
        showMinimap: true,
        isSmartZoom: true,
        edgeOffsets: {},
      };

      act(() => {
        result.current.restoreState(customState);
      });

      expect(result.current.colorSettings.lineNotation).toBe('crowsfoot');
      expect(result.current.colorSettings.lineStroke).toBe('dashed');
      expect(result.current.colorSettings.lineThickness).toBe(3);
      expect(result.current.colorSettings.useRelationshipTypeColors).toBe(true);
      expect(result.current.colorSettings.oneToManyColor).toBe('#aaaaaa');
      expect(result.current.colorSettings.manyToOneColor).toBe('#bbbbbb');
      expect(result.current.colorSettings.manyToManyColor).toBe('#cccccc');
    });

    it('should apply default values for missing colorSettings properties (backward compatibility)', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      // Simulate old snapshot without new properties
      const oldState = {
        selectedEntities: ['account'],
        collapsedEntities: [],
        selectedFields: {},
        fieldOrder: {},
        entityPositions: {},
        layoutMode: 'force' as const,
        zoom: 1,
        pan: { x: 0, y: 0 },
        searchQuery: '',
        publisherFilter: 'all',
        solutionFilter: 'all',
        isDarkMode: false,
        colorSettings: {
          customTableColor: '#ff0000',
          standardTableColor: '#00ff00',
          lookupColor: '#0000ff',
          edgeStyle: 'straight' as const,
          // Missing new properties
        } as any,
        showMinimap: false,
        isSmartZoom: false,
        edgeOffsets: {},
      };

      act(() => {
        result.current.restoreState(oldState);
      });

      // Should have default values for new properties
      expect(result.current.colorSettings.lineNotation).toBe('simple');
      expect(result.current.colorSettings.lineStroke).toBe('solid');
      expect(result.current.colorSettings.lineThickness).toBe(1.5);
      expect(result.current.colorSettings.useRelationshipTypeColors).toBe(false);
      expect(result.current.colorSettings.oneToManyColor).toBe('#f97316');
      expect(result.current.colorSettings.manyToOneColor).toBe('#06b6d4');
      expect(result.current.colorSettings.manyToManyColor).toBe('#8b5cf6');

      // Should preserve old properties
      expect(result.current.colorSettings.customTableColor).toBe('#ff0000');
      expect(result.current.colorSettings.lookupColor).toBe('#0000ff');
      expect(result.current.colorSettings.edgeStyle).toBe('straight');
    });
  });

  describe('Entity Color Overrides', () => {
    it('should initialize with empty entityColorOverrides', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      expect(result.current.entityColorOverrides).toEqual({});
    });

    it('should set a color override for an entity', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      act(() => {
        result.current.setEntityColor('account', '#ef4444');
      });

      expect(result.current.entityColorOverrides).toEqual({ account: '#ef4444' });
    });

    it('should set multiple color overrides independently', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      act(() => {
        result.current.setEntityColor('account', '#ef4444');
      });
      act(() => {
        result.current.setEntityColor('contact', '#22c55e');
      });

      expect(result.current.entityColorOverrides).toEqual({
        account: '#ef4444',
        contact: '#22c55e',
      });
    });

    it('should overwrite existing color override for same entity', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      act(() => {
        result.current.setEntityColor('account', '#ef4444');
      });
      act(() => {
        result.current.setEntityColor('account', '#3b82f6');
      });

      expect(result.current.entityColorOverrides).toEqual({ account: '#3b82f6' });
    });

    it('should clear a single entity color override', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      act(() => {
        result.current.setEntityColor('account', '#ef4444');
        result.current.setEntityColor('contact', '#22c55e');
      });
      act(() => {
        result.current.clearEntityColor('account');
      });

      expect(result.current.entityColorOverrides).toEqual({ contact: '#22c55e' });
      expect(result.current.entityColorOverrides.account).toBeUndefined();
    });

    it('should handle clearing a non-existent override gracefully', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      act(() => {
        result.current.clearEntityColor('nonexistent');
      });

      expect(result.current.entityColorOverrides).toEqual({});
    });

    it('should clear all entity color overrides', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      act(() => {
        result.current.setEntityColor('account', '#ef4444');
        result.current.setEntityColor('contact', '#22c55e');
        result.current.setEntityColor('new_custom', '#8b5cf6');
      });
      act(() => {
        result.current.clearAllEntityColors();
      });

      expect(result.current.entityColorOverrides).toEqual({});
    });

    it('should include entityColorOverrides in serializable state', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      act(() => {
        result.current.setEntityColor('account', '#ef4444');
        result.current.setEntityColor('contact', '#22c55e');
      });

      const serialized = result.current.getSerializableState();

      expect(serialized.entityColorOverrides).toEqual({
        account: '#ef4444',
        contact: '#22c55e',
      });
    });

    it('should include empty entityColorOverrides in serializable state', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      const serialized = result.current.getSerializableState();

      expect(serialized.entityColorOverrides).toEqual({});
    });

    it('should restore entityColorOverrides from state', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      const stateWithOverrides = {
        selectedEntities: ['account'],
        collapsedEntities: [],
        selectedFields: {},
        fieldOrder: {},
        entityPositions: {},
        layoutMode: 'force' as const,
        zoom: 1,
        pan: { x: 0, y: 0 },
        searchQuery: '',
        publisherFilter: 'all',
        solutionFilter: 'all',
        isDarkMode: true,
        colorSettings: {
          customTableColor: '#0ea5e9',
          standardTableColor: '#64748b',
          lookupColor: '#f97316',
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
        isSmartZoom: false,
        edgeOffsets: {},
        entityColorOverrides: {
          account: '#ef4444',
          contact: '#22c55e',
        },
      };

      act(() => {
        result.current.restoreState(stateWithOverrides);
      });

      expect(result.current.entityColorOverrides).toEqual({
        account: '#ef4444',
        contact: '#22c55e',
      });
    });

    it('should restore with empty overrides when entityColorOverrides is missing (backward compat)', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      // First set some overrides
      act(() => {
        result.current.setEntityColor('account', '#ef4444');
      });

      // Restore old snapshot without entityColorOverrides
      const oldState = {
        selectedEntities: ['account'],
        collapsedEntities: [],
        selectedFields: {},
        fieldOrder: {},
        entityPositions: {},
        layoutMode: 'force' as const,
        zoom: 1,
        pan: { x: 0, y: 0 },
        searchQuery: '',
        publisherFilter: 'all',
        solutionFilter: 'all',
        isDarkMode: true,
        colorSettings: {
          customTableColor: '#0ea5e9',
          standardTableColor: '#64748b',
          lookupColor: '#f97316',
          edgeStyle: 'smoothstep' as const,
        } as any,
        showMinimap: false,
        isSmartZoom: false,
        edgeOffsets: {},
        // No entityColorOverrides field
      };

      act(() => {
        result.current.restoreState(oldState);
      });

      expect(result.current.entityColorOverrides).toEqual({});
    });

    it('should preserve entity color overrides independently of entity selection', () => {
      const { result } = renderHook(() => useERDState(defaultProps));

      // Set color override
      act(() => {
        result.current.setEntityColor('account', '#ef4444');
      });

      // Deselect and reselect entity
      act(() => {
        result.current.toggleEntity('account');
      });
      act(() => {
        result.current.toggleEntity('account');
      });

      // Override should still be there
      expect(result.current.entityColorOverrides).toEqual({ account: '#ef4444' });
    });
  });
});
