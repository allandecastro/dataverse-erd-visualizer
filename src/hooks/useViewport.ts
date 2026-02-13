/**
 * Sub-hook for zoom and pan viewport state.
 * Extracted from useERDState for focused responsibility.
 */

import { useState, useCallback } from 'react';

export function useViewport() {
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 400, y: 100 });

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 0.1, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - 0.1, 0.3));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(0.8);
    setPan({ x: 400, y: 100 });
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
