/**
 * Tests for useViewport sub-hook
 */

import { renderHook, act } from '@testing-library/react';
import { useViewport } from '../useViewport';
import {
  VIEWPORT_DEFAULT_ZOOM,
  VIEWPORT_DEFAULT_PAN,
  VIEWPORT_MIN_ZOOM,
  VIEWPORT_MAX_ZOOM,
} from '@/constants';

describe('useViewport', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useViewport());

    expect(result.current.zoom).toBe(VIEWPORT_DEFAULT_ZOOM);
    expect(result.current.pan).toEqual(VIEWPORT_DEFAULT_PAN);
  });

  it('should zoom in by 0.1', () => {
    const { result } = renderHook(() => useViewport());

    act(() => result.current.handleZoomIn());

    expect(result.current.zoom).toBeCloseTo(VIEWPORT_DEFAULT_ZOOM + 0.1);
  });

  it('should zoom out by 0.1', () => {
    const { result } = renderHook(() => useViewport());

    act(() => result.current.handleZoomOut());

    expect(result.current.zoom).toBeCloseTo(VIEWPORT_DEFAULT_ZOOM - 0.1);
  });

  it(`should not zoom beyond maximum (${VIEWPORT_MAX_ZOOM})`, () => {
    const { result } = renderHook(() => useViewport());

    // Zoom in many times
    for (let i = 0; i < 20; i++) {
      act(() => result.current.handleZoomIn());
    }

    expect(result.current.zoom).toBe(VIEWPORT_MAX_ZOOM);
  });

  it(`should not zoom below minimum (${VIEWPORT_MIN_ZOOM})`, () => {
    const { result } = renderHook(() => useViewport());

    // Zoom out many times
    for (let i = 0; i < 20; i++) {
      act(() => result.current.handleZoomOut());
    }

    expect(result.current.zoom).toBeCloseTo(VIEWPORT_MIN_ZOOM);
  });

  it('should reset view to defaults', () => {
    const { result } = renderHook(() => useViewport());

    // Change zoom and pan
    act(() => {
      result.current.setZoom(1.5);
      result.current.setPan({ x: 200, y: 300 });
    });

    expect(result.current.zoom).toBe(1.5);
    expect(result.current.pan).toEqual({ x: 200, y: 300 });

    // Reset
    act(() => result.current.handleResetView());

    expect(result.current.zoom).toBe(VIEWPORT_DEFAULT_ZOOM);
    expect(result.current.pan).toEqual(VIEWPORT_DEFAULT_PAN);
  });

  it('should allow setting zoom directly', () => {
    const { result } = renderHook(() => useViewport());

    act(() => result.current.setZoom(1.5));

    expect(result.current.zoom).toBe(1.5);
  });

  it('should allow setting pan directly', () => {
    const { result } = renderHook(() => useViewport());

    act(() => result.current.setPan({ x: 100, y: 200 }));

    expect(result.current.pan).toEqual({ x: 100, y: 200 });
  });
});
