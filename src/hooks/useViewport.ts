/**
 * Sub-hook for zoom and pan viewport state.
 * Extracted from useERDState for focused responsibility.
 */

import { useState, useCallback } from 'react';
import {
  VIEWPORT_DEFAULT_ZOOM,
  VIEWPORT_DEFAULT_PAN,
  VIEWPORT_MIN_ZOOM,
  VIEWPORT_MAX_ZOOM,
} from '@/constants';

export function useViewport() {
  const [zoom, setZoom] = useState(VIEWPORT_DEFAULT_ZOOM);
  const [pan, setPan] = useState(VIEWPORT_DEFAULT_PAN);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 0.1, VIEWPORT_MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - 0.1, VIEWPORT_MIN_ZOOM));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(VIEWPORT_DEFAULT_ZOOM);
    setPan(VIEWPORT_DEFAULT_PAN);
  }, []);

  return {
    zoom,
    setZoom,
    pan,
    setPan,
    handleZoomIn,
    handleZoomOut,
    handleResetView,
  };
}
