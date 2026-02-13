/**
 * Tests for useEntitySelection sub-hook
 */

import { renderHook, act } from '@testing-library/react';
import { useEntitySelection } from '../useEntitySelection';
import type { Entity } from '@/types';

const mockEntities: Entity[] = [
  {
    logicalName: 'account',
    displayName: 'Account',
    isCustomEntity: false,
    attributes: [],
    objectTypeCode: 1,
    primaryIdAttribute: 'accountid',
    primaryNameAttribute: 'name',
  },
  {
    logicalName: 'contact',
    displayName: 'Contact',
    isCustomEntity: false,
    attributes: [],
    objectTypeCode: 2,
    primaryIdAttribute: 'contactid',
    primaryNameAttribute: 'fullname',
  },
  {
    logicalName: 'lead',
    displayName: 'Lead',
    isCustomEntity: false,
    attributes: [],
    objectTypeCode: 3,
    primaryIdAttribute: 'leadid',
    primaryNameAttribute: 'fullname',
  },
];

describe('useEntitySelection', () => {
  it('should initialize with empty selection', () => {
    const { result } = renderHook(() => useEntitySelection(mockEntities));

    expect(result.current.selectedEntities.size).toBe(0);
  });

  describe('toggleEntity', () => {
    it('should add entity to selection', () => {
      const { result } = renderHook(() => useEntitySelection(mockEntities));

      act(() => result.current.toggleEntity('account'));

      expect(result.current.selectedEntities.has('account')).toBe(true);
      expect(result.current.selectedEntities.size).toBe(1);
    });

    it('should remove entity from selection on second toggle', () => {
      const { result } = renderHook(() => useEntitySelection(mockEntities));

      act(() => result.current.toggleEntity('account'));
      act(() => result.current.toggleEntity('account'));

      expect(result.current.selectedEntities.has('account')).toBe(false);
      expect(result.current.selectedEntities.size).toBe(0);
    });
  });

  describe('selectAll', () => {
    it('should select all entities when called without args', () => {
      const { result } = renderHook(() => useEntitySelection(mockEntities));

      act(() => result.current.selectAll());

      expect(result.current.selectedEntities.size).toBe(3);
      expect(result.current.selectedEntities.has('account')).toBe(true);
      expect(result.current.selectedEntities.has('contact')).toBe(true);
      expect(result.current.selectedEntities.has('lead')).toBe(true);
    });

    it('should add specific entities when called with array', () => {
      const { result } = renderHook(() => useEntitySelection(mockEntities));

      act(() => result.current.selectAll(['account', 'contact']));

      expect(result.current.selectedEntities.size).toBe(2);
      expect(result.current.selectedEntities.has('lead')).toBe(false);
    });

    it('should not modify selection for empty array', () => {
      const { result } = renderHook(() => useEntitySelection(mockEntities));

      act(() => result.current.toggleEntity('account'));
      act(() => result.current.selectAll([]));

      expect(result.current.selectedEntities.size).toBe(1);
    });
  });

  describe('deselectAll', () => {
    it('should deselect all entities when called without args', () => {
      const { result } = renderHook(() => useEntitySelection(mockEntities));

      act(() => result.current.selectAll());
      act(() => result.current.deselectAll());

      expect(result.current.selectedEntities.size).toBe(0);
    });

    it('should remove specific entities when called with array', () => {
      const { result } = renderHook(() => useEntitySelection(mockEntities));

      act(() => result.current.selectAll());
      act(() => result.current.deselectAll(['account', 'contact']));

      expect(result.current.selectedEntities.size).toBe(1);
      expect(result.current.selectedEntities.has('lead')).toBe(true);
    });

    it('should not modify selection for empty array', () => {
      const { result } = renderHook(() => useEntitySelection(mockEntities));

      act(() => result.current.selectAll());
      act(() => result.current.deselectAll([]));

      expect(result.current.selectedEntities.size).toBe(3);
    });
  });

  it('should allow setting selection directly', () => {
    const { result } = renderHook(() => useEntitySelection(mockEntities));

    act(() => result.current.setSelectedEntities(new Set(['account', 'lead'])));

    expect(result.current.selectedEntities.size).toBe(2);
    expect(result.current.selectedEntities.has('account')).toBe(true);
    expect(result.current.selectedEntities.has('lead')).toBe(true);
  });
});
