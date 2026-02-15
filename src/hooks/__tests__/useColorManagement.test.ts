/**
 * Tests for useColorManagement sub-hook
 */

import { renderHook, act } from '@testing-library/react';
import { useColorManagement } from '../useColorManagement';

describe('useColorManagement', () => {
  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useColorManagement());

    expect(result.current.entityColorOverrides).toEqual({});
    expect(result.current.groupNames).toEqual({});
    expect(result.current.groupFilter).toBe('all');
    expect(result.current.derivedGroups).toEqual([]);
  });

  describe('entity colors', () => {
    it('should set entity color', () => {
      const { result } = renderHook(() => useColorManagement());

      act(() => result.current.setEntityColor('account', '#ef4444'));

      expect(result.current.entityColorOverrides).toEqual({ account: '#ef4444' });
    });

    it('should clear entity color', () => {
      const { result } = renderHook(() => useColorManagement());

      act(() => result.current.setEntityColor('account', '#ef4444'));
      act(() => result.current.clearEntityColor('account'));

      expect(result.current.entityColorOverrides).toEqual({});
    });

    it('should clear all entity colors, group names, and filter', () => {
      const { result } = renderHook(() => useColorManagement());

      act(() => {
        result.current.setEntityColor('account', '#ef4444');
        result.current.setEntityColor('contact', '#3b82f6');
        result.current.setGroupName('#ef4444', 'Sales');
        result.current.setGroupFilter('#ef4444');
      });

      act(() => result.current.clearAllEntityColors());

      expect(result.current.entityColorOverrides).toEqual({});
      expect(result.current.groupNames).toEqual({});
      expect(result.current.groupFilter).toBe('all');
    });
  });

  describe('group names', () => {
    it('should set group name with normalized color', () => {
      const { result } = renderHook(() => useColorManagement());

      act(() => result.current.setGroupName('#EF4444', 'Sales'));

      expect(result.current.groupNames).toEqual({ '#ef4444': 'Sales' });
    });

    it('should clear group name', () => {
      const { result } = renderHook(() => useColorManagement());

      act(() => result.current.setGroupName('#ef4444', 'Sales'));
      act(() => result.current.clearGroupName('#EF4444'));

      expect(result.current.groupNames).toEqual({});
    });
  });

  describe('derived groups', () => {
    it('should derive groups from color overrides', () => {
      const { result } = renderHook(() => useColorManagement());

      act(() => {
        result.current.setEntityColor('account', '#ef4444');
        result.current.setEntityColor('contact', '#ef4444');
        result.current.setEntityColor('lead', '#3b82f6');
      });

      expect(result.current.derivedGroups).toHaveLength(2);

      const redGroup = result.current.derivedGroups.find((g) => g.color === '#ef4444');
      expect(redGroup).toBeDefined();
      expect(redGroup!.entityNames).toContain('account');
      expect(redGroup!.entityNames).toContain('contact');

      const blueGroup = result.current.derivedGroups.find((g) => g.color === '#3b82f6');
      expect(blueGroup).toBeDefined();
      expect(blueGroup!.entityNames).toContain('lead');
    });

    it('should use group names for named groups', () => {
      const { result } = renderHook(() => useColorManagement());

      act(() => {
        result.current.setEntityColor('account', '#ef4444');
        result.current.setGroupName('#ef4444', 'Sales');
      });

      const group = result.current.derivedGroups.find((g) => g.color === '#ef4444');
      expect(group?.name).toBe('Sales');
    });
  });
});
