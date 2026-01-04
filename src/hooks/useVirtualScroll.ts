/**
 * Virtual scrolling hook for efficiently rendering large lists
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

export interface VirtualScrollOptions {
  itemCount: number;
  itemHeight: number;
  containerHeight: number;
  overscan?: number; // Number of items to render above/below visible area
}

export interface VirtualScrollResult {
  visibleItems: { index: number; offsetTop: number }[];
  totalHeight: number;
  startIndex: number;
  endIndex: number;
  scrollTop: number;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function useVirtualScroll({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 5,
}: VirtualScrollOptions): VirtualScrollResult {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate total height of all items
  const totalHeight = itemCount * itemHeight;

  // Calculate visible range
  const { startIndex, endIndex, visibleItems } = useMemo(() => {
    // Calculate first visible item index
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);

    // Calculate number of visible items (plus overscan)
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2 * overscan;

    // Calculate last visible item index
    const end = Math.min(itemCount - 1, start + visibleCount);

    // Generate visible items with their offsets
    const items: { index: number; offsetTop: number }[] = [];
    for (let i = start; i <= end; i++) {
      items.push({
        index: i,
        offsetTop: i * itemHeight,
      });
    }

    return {
      startIndex: start,
      endIndex: end,
      visibleItems: items,
    };
  }, [scrollTop, itemHeight, containerHeight, itemCount, overscan]);

  // Handle scroll events
  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
  }, []);

  // Sync scroll position when container ref changes
  useEffect(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  return {
    visibleItems,
    totalHeight,
    startIndex,
    endIndex,
    scrollTop,
    onScroll,
    containerRef,
  };
}
