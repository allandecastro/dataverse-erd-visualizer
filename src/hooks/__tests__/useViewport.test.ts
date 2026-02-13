/**
 * Tests for useViewport sub-hook
 */

import { renderHook, act } from '@testing-library/react';
import { useViewport } from '../useViewport';

describe('useViewport', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useViewport());

    expect(result.current.zoom).toBe(0.8);
    expect(result.current.pan).toEqual({ x: 400, y: 100 });
  });

  it('should zoom in by 0.1', () => {
    const { result } = renderHook(() => useViewport());

    act(() => result.current.handleZoomIn());

    expect(result.current.zoom).toBeCloseTo(0.9);
  });

  it('should zoom out by 0.1', () => {
    const { result } = renderHook(() => useViewport());

    act(() => result.current.handleZoomOut());

    expect(result.current.zoom).toBeCloseTo(0.7);
  });

  it('should not zoom beyond maximum (2)', () => {
    const { result } = renderHook(() => useViewport());

    // Zoom in many times
    for (let i = 0; i < 20; i++) {
      act(() => result.current.handleZoomIn());
    }

    expect(result.current.zoom).toBe(2);
  });

  it('should not zoom below minimum (0.3)', () => {
    const { result } = renderHook(() => useViewport());

    // Zoom out many times
    for (let i = 0; i < 20; i++) {
      act(() => result.current.handleZoomOut());
    }

    expect(result.current.zoom).toBeCloseTo(0.3);
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

    expect(result.current.zoom).toBe(0.8);
    expect(result.current.pan).toEqual({ x: 400, y: 100 });
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
