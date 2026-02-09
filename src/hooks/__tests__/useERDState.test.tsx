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
      attributes: [
        {
          logicalName: 'accountid',
          displayName: 'Account ID',
          type: 'UniqueIdentifier',
          isPrimaryKey: true,
        },
        { logicalName: 'name', displayName: 'Name', type: 'String', isPrimaryKey: false },
      ],
      publisher: 'Microsoft',
      alternateKeys: [],
    },
    {
      logicalName: 'contact',
      displayName: 'Contact',
      attributes: [
        {
          logicalName: 'contactid',
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
      attributes: [
        {
          logicalName: 'new_customid',
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
});
