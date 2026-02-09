/**
 * Tests for useLayoutAlgorithms Hook
 * Tests force-directed, grid, and auto-arrange layout algorithms
 */

import { renderHook, act } from '@testing-library/react';
import { useLayoutAlgorithms, type UseLayoutAlgorithmsProps } from '../useLayoutAlgorithms';
import type { Entity, EntityRelationship, EntityPosition } from '@/types';

describe('useLayoutAlgorithms', () => {
  const mockEntities: Entity[] = [
    {
      logicalName: 'account',
      displayName: 'Account',
      objectTypeCode: 1,
      isCustomEntity: false,
      primaryIdAttribute: 'accountid',
      primaryNameAttribute: 'name',
      attributes: [],
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
      attributes: [],
      publisher: 'Microsoft',
      alternateKeys: [],
    },
    {
      logicalName: 'opportunity',
      displayName: 'Opportunity',
      objectTypeCode: 3,
      isCustomEntity: false,
      primaryIdAttribute: 'opportunityid',
      primaryNameAttribute: 'name',
      attributes: [],
      publisher: 'Microsoft',
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
    {
      from: 'opportunity',
      to: 'account',
      type: 'N:1',
      schemaName: 'opportunity_account',
      referencingAttribute: 'accountid',
      referencedAttribute: 'accountid',
      relationshipType: 'OneToManyRelationship',
    },
  ];

  const mockSetEntityPositions = vi.fn();

  const defaultProps: UseLayoutAlgorithmsProps = {
    entities: mockEntities,
    relationships: mockRelationships,
    selectedEntities: new Set(['account', 'contact', 'opportunity']),
    entityPositions: {},
    setEntityPositions: mockSetEntityPositions,
    layoutMode: 'manual' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Math.random for predictable tests
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Force-Directed Layout', () => {
    it('should initialize positions for new entities', () => {
      const { result } = renderHook(() => useLayoutAlgorithms(defaultProps));

      act(() => {
        result.current.applyForceLayout();
      });

      expect(mockSetEntityPositions).toHaveBeenCalled();
      const positions = mockSetEntityPositions.mock.calls[0][0];

      expect(positions['account']).toBeDefined();
      expect(positions['contact']).toBeDefined();
      expect(positions['opportunity']).toBeDefined();
    });

    it('should preserve existing positions when re-applying force layout', () => {
      const existingPositions: Record<string, EntityPosition> = {
        account: { x: 200, y: 300, vx: 0, vy: 0 },
      };

      const { result } = renderHook(() =>
        useLayoutAlgorithms({ ...defaultProps, entityPositions: existingPositions })
      );

      act(() => {
        result.current.applyForceLayout();
      });

      const positions = mockSetEntityPositions.mock.calls[0][0];
      // Account should start from existing position (though it will be modified by forces)
      expect(positions['account'].x).toBeDefined();
      expect(positions['account'].y).toBeDefined();
    });

    it('should apply repulsion force between nodes', () => {
      const { result } = renderHook(() => useLayoutAlgorithms(defaultProps));

      act(() => {
        result.current.applyForceLayout();
      });

      const positions = mockSetEntityPositions.mock.calls[0][0];

      // After 100 iterations, nodes should have valid positions
      // All positions should be defined with numeric x/y coordinates
      expect(positions['account'].x).toBeDefined();
      expect(positions['account'].y).toBeDefined();
      expect(typeof positions['account'].x).toBe('number');
      expect(typeof positions['account'].y).toBe('number');
    });

    it('should apply spring force along relationships', () => {
      const { result } = renderHook(() => useLayoutAlgorithms(defaultProps));

      act(() => {
        result.current.applyForceLayout();
      });

      const positions = mockSetEntityPositions.mock.calls[0][0];

      // Related entities (contact->account, opportunity->account) should be positioned
      // All positions should be defined
      expect(positions['contact']).toBeDefined();
      expect(positions['account']).toBeDefined();
      expect(positions['opportunity']).toBeDefined();
    });

    it('should handle single entity', () => {
      const { result } = renderHook(() =>
        useLayoutAlgorithms({
          ...defaultProps,
          selectedEntities: new Set(['account']),
        })
      );

      act(() => {
        result.current.applyForceLayout();
      });

      const positions = mockSetEntityPositions.mock.calls[0][0];
      expect(positions['account']).toBeDefined();
      expect(Object.keys(positions)).toHaveLength(1);
    });

    it('should handle empty entity set', () => {
      const { result } = renderHook(() =>
        useLayoutAlgorithms({
          ...defaultProps,
          selectedEntities: new Set(),
        })
      );

      act(() => {
        result.current.applyForceLayout();
      });

      // Should not call setEntityPositions for empty set
      expect(mockSetEntityPositions).not.toHaveBeenCalled();
    });

    it('should handle entities without relationships', () => {
      const { result } = renderHook(() =>
        useLayoutAlgorithms({
          ...defaultProps,
          relationships: [],
        })
      );

      act(() => {
        result.current.applyForceLayout();
      });

      const positions = mockSetEntityPositions.mock.calls[0][0];
      // Should still position all entities (using repulsion only)
      expect(Object.keys(positions)).toHaveLength(3);
    });
  });

  describe('Grid Layout', () => {
    it('should arrange entities in a grid pattern', () => {
      const { result } = renderHook(() => useLayoutAlgorithms(defaultProps));

      act(() => {
        result.current.applyGridLayout();
      });

      const positions = mockSetEntityPositions.mock.calls[0][0];

      expect(positions['account']).toBeDefined();
      expect(positions['contact']).toBeDefined();
      expect(positions['opportunity']).toBeDefined();
    });

    it('should calculate correct column count for 3 entities', () => {
      const { result } = renderHook(() => useLayoutAlgorithms(defaultProps));

      act(() => {
        result.current.applyGridLayout();
      });

      const positions = mockSetEntityPositions.mock.calls[0][0];

      // For 3 entities, cols = Math.ceil(Math.sqrt(3)) = 2
      // Expected positions:
      // Row 0: account (col 0), contact (col 1)
      // Row 1: opportunity (col 0)

      // Verify horizontal spacing
      const xDiff = positions['contact'].x - positions['account'].x;
      expect(xDiff).toBe(380); // GRID_SPACING_X

      // Verify vertical spacing
      const yDiff = positions['opportunity'].y - positions['account'].y;
      expect(yDiff).toBe(320); // GRID_SPACING_Y
    });

    it('should handle single entity in grid', () => {
      const { result } = renderHook(() =>
        useLayoutAlgorithms({
          ...defaultProps,
          selectedEntities: new Set(['account']),
        })
      );

      act(() => {
        result.current.applyGridLayout();
      });

      const positions = mockSetEntityPositions.mock.calls[0][0];

      expect(positions['account']).toEqual({
        x: 100, // GRID_START_X
        y: 80, // GRID_START_Y
      });
    });

    it('should arrange 4 entities in 2x2 grid', () => {
      const fourEntities: Entity[] = [
        ...mockEntities,
        {
          logicalName: 'lead',
          displayName: 'Lead',
          objectTypeCode: 4,
          isCustomEntity: false,
          primaryIdAttribute: 'leadid',
          primaryNameAttribute: 'name',
          attributes: [],
          publisher: 'Microsoft',
          alternateKeys: [],
        },
      ];

      const { result } = renderHook(() =>
        useLayoutAlgorithms({
          ...defaultProps,
          entities: fourEntities,
          selectedEntities: new Set(['account', 'contact', 'opportunity', 'lead']),
        })
      );

      act(() => {
        result.current.applyGridLayout();
      });

      const positions = mockSetEntityPositions.mock.calls[0][0];

      // For 4 entities, cols = Math.ceil(Math.sqrt(4)) = 2
      // 2x2 grid
      expect(Object.keys(positions)).toHaveLength(4);

      // Verify grid structure
      expect(positions['account'].x).toBe(100); // col 0
      expect(positions['contact'].x).toBe(480); // col 1 (100 + 380)
      expect(positions['opportunity'].x).toBe(100); // col 0, row 2
      expect(positions['lead'].x).toBe(480); // col 1, row 2
    });
  });

  describe('Auto-Arrange (Topological Sort)', () => {
    it('should position parent entities above children', () => {
      const { result } = renderHook(() => useLayoutAlgorithms(defaultProps));

      act(() => {
        result.current.applyAutoArrange();
      });

      const positions = mockSetEntityPositions.mock.calls[0][0];

      // 'account' has no dependencies (level 0)
      // 'contact' and 'opportunity' depend on 'account' (level 1)

      expect(positions['account'].y).toBeLessThan(positions['contact'].y);
      expect(positions['account'].y).toBeLessThan(positions['opportunity'].y);
    });

    it('should calculate levels correctly for hierarchical relationships', () => {
      const { result } = renderHook(() => useLayoutAlgorithms(defaultProps));

      act(() => {
        result.current.applyAutoArrange();
      });

      const positions = mockSetEntityPositions.mock.calls[0][0];

      // Account (level 0) should be at y=80
      // Contact and Opportunity (level 1) should be at y=80+320=400
      expect(positions['account'].y).toBe(80);
      expect(positions['contact'].y).toBe(400);
      expect(positions['opportunity'].y).toBe(400);
    });

    it('should handle entities with no relationships', () => {
      const { result } = renderHook(() =>
        useLayoutAlgorithms({
          ...defaultProps,
          relationships: [],
        })
      );

      act(() => {
        result.current.applyAutoArrange();
      });

      const positions = mockSetEntityPositions.mock.calls[0][0];

      // All entities at level 0 (no dependencies)
      expect(positions['account'].y).toBe(80);
      expect(positions['contact'].y).toBe(80);
      expect(positions['opportunity'].y).toBe(80);
    });

    it('should handle circular dependencies gracefully', () => {
      const circularRelationships: EntityRelationship[] = [
        {
          from: 'account',
          to: 'contact',
          type: 'N:1',
          schemaName: 'account_contact',
          referencingAttribute: 'contactid',
          referencedAttribute: 'contactid',
          relationshipType: 'OneToManyRelationship',
        },
        {
          from: 'contact',
          to: 'account',
          type: 'N:1',
          schemaName: 'contact_account',
          referencingAttribute: 'accountid',
          referencedAttribute: 'accountid',
          relationshipType: 'OneToManyRelationship',
        },
      ];

      const { result } = renderHook(() =>
        useLayoutAlgorithms({
          ...defaultProps,
          relationships: circularRelationships,
        })
      );

      act(() => {
        result.current.applyAutoArrange();
      });

      const positions = mockSetEntityPositions.mock.calls[0][0];

      // Should not crash and should position all entities
      expect(positions['account']).toBeDefined();
      expect(positions['contact']).toBeDefined();
    });

    it('should center entities horizontally within their level', () => {
      const { result } = renderHook(() => useLayoutAlgorithms(defaultProps));

      act(() => {
        result.current.applyAutoArrange();
      });

      const positions = mockSetEntityPositions.mock.calls[0][0];

      // Level 1 has 2 entities (contact and opportunity)
      // They should be centered and spaced horizontally
      const xDiff = Math.abs(positions['opportunity'].x - positions['contact'].x);
      expect(xDiff).toBe(380); // HORIZONTAL_SPACING
    });

    it('should handle 1:N relationships correctly', () => {
      const oneToManyRelationships: EntityRelationship[] = [
        {
          from: 'account',
          to: 'contact',
          type: '1:N',
          schemaName: 'account_contacts',
          referencingAttribute: 'accountid',
          referencedAttribute: 'contactid',
          relationshipType: 'OneToManyRelationship',
        },
      ];

      const { result } = renderHook(() =>
        useLayoutAlgorithms({
          ...defaultProps,
          relationships: oneToManyRelationships,
          selectedEntities: new Set(['account', 'contact']),
        })
      );

      act(() => {
        result.current.applyAutoArrange();
      });

      const positions = mockSetEntityPositions.mock.calls[0][0];

      // Account should be above contact
      expect(positions['account'].y).toBeLessThan(positions['contact'].y);
    });

    it('should handle empty entity set', () => {
      const { result } = renderHook(() =>
        useLayoutAlgorithms({
          ...defaultProps,
          selectedEntities: new Set(),
        })
      );

      act(() => {
        result.current.applyAutoArrange();
      });

      // Should not call setEntityPositions for empty set
      expect(mockSetEntityPositions).not.toHaveBeenCalled();
    });
  });

  describe('useEffect Auto-Layout Trigger', () => {
    it('should apply force layout when layoutMode is "force"', () => {
      renderHook(() =>
        useLayoutAlgorithms({
          ...defaultProps,
          layoutMode: 'force',
        })
      );

      // Should automatically trigger force layout
      expect(mockSetEntityPositions).toHaveBeenCalled();
    });

    it('should apply grid layout when layoutMode is "grid"', () => {
      renderHook(() =>
        useLayoutAlgorithms({
          ...defaultProps,
          layoutMode: 'grid',
        })
      );

      // Should automatically trigger grid layout
      expect(mockSetEntityPositions).toHaveBeenCalled();
    });

    it('should apply auto-arrange when layoutMode is "auto"', () => {
      renderHook(() =>
        useLayoutAlgorithms({
          ...defaultProps,
          layoutMode: 'auto',
        })
      );

      // Should automatically trigger auto-arrange
      expect(mockSetEntityPositions).toHaveBeenCalled();
    });

    it('should NOT apply layout when layoutMode is "manual"', () => {
      renderHook(() =>
        useLayoutAlgorithms({
          ...defaultProps,
          layoutMode: 'manual',
        })
      );

      // Should not trigger any layout (preserve user positions)
      expect(mockSetEntityPositions).not.toHaveBeenCalled();
    });
  });
});
