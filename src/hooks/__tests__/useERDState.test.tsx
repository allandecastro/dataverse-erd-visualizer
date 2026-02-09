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
});
