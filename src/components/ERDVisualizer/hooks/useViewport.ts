/**
 * Viewport hook for culling and bounds calculation
 * Only renders entities/relationships visible in the current viewport
 */

import { useMemo } from 'react';
import type { Entity, EntityRelationship, EntityPosition } from '@/types';

export interface ViewportBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface UseViewportOptions {
  containerWidth: number;
  containerHeight: number;
  pan: { x: number; y: number };
  zoom: number;
  entities: Entity[];
  relationships: EntityRelationship[];
  entityPositions: Record<string, EntityPosition>;
  padding?: number; // Extra padding around viewport for smoother scrolling
}

export interface UseViewportResult {
  viewportBounds: ViewportBounds;
  visibleEntities: Entity[];
  visibleRelationships: EntityRelationship[];
  visibleEntityNames: Set<string>;
  isEntityVisible: (entityName: string) => boolean;
}

// Card dimensions
const CARD_WIDTH = 300;
const CARD_HEIGHT_EXPANDED_MAX = 500; // Approximate max height

/**
 * Calculate viewport bounds in world coordinates
 */
function calculateViewportBounds(
  containerWidth: number,
  containerHeight: number,
  pan: { x: number; y: number },
  zoom: number,
  padding: number
): ViewportBounds {
  // Convert screen coordinates to world coordinates
  // Screen point (0, 0) -> World point (-pan.x / zoom, -pan.y / zoom)
  const minX = -pan.x / zoom - padding;
  const minY = -pan.y / zoom - padding;
  const maxX = (containerWidth - pan.x) / zoom + padding;
  const maxY = (containerHeight - pan.y) / zoom + padding;

  return { minX, maxX, minY, maxY };
}

/**
 * Check if an entity is within viewport bounds
 */
function isEntityInViewport(
  entityName: string,
  positions: Record<string, EntityPosition>,
  bounds: ViewportBounds
): boolean {
  const pos = positions[entityName];
  if (!pos) return false;

  // Entity bounds (using max possible height)
  const entityMinX = pos.x;
  const entityMaxX = pos.x + CARD_WIDTH;
  const entityMinY = pos.y;
  const entityMaxY = pos.y + CARD_HEIGHT_EXPANDED_MAX;

  // Check for intersection with viewport
  return !(
    entityMaxX < bounds.minX ||
    entityMinX > bounds.maxX ||
    entityMaxY < bounds.minY ||
    entityMinY > bounds.maxY
  );
}

/**
 * Hook for viewport culling - filters entities and relationships to only visible ones
 */
export function useViewport({
  containerWidth,
  containerHeight,
  pan,
  zoom,
  entities,
  relationships,
  entityPositions,
  padding = 200, // Default padding for smoother scrolling
}: UseViewportOptions): UseViewportResult {

  // Calculate viewport bounds
  const viewportBounds = useMemo(() => {
    if (containerWidth === 0 || containerHeight === 0) {
      return { minX: -Infinity, maxX: Infinity, minY: -Infinity, maxY: Infinity };
    }
    return calculateViewportBounds(containerWidth, containerHeight, pan, zoom, padding);
  }, [containerWidth, containerHeight, pan.x, pan.y, zoom, padding]);

  // Filter visible entities
  const { visibleEntities, visibleEntityNames } = useMemo(() => {
    const visible: Entity[] = [];
    const names = new Set<string>();

    for (const entity of entities) {
      if (isEntityInViewport(entity.logicalName, entityPositions, viewportBounds)) {
        visible.push(entity);
        names.add(entity.logicalName);
      }
    }

    return { visibleEntities: visible, visibleEntityNames: names };
  }, [entities, entityPositions, viewportBounds]);

  // Filter visible relationships (at least one entity must be visible)
  const visibleRelationships = useMemo(() => {
    return relationships.filter(rel =>
      visibleEntityNames.has(rel.from) || visibleEntityNames.has(rel.to)
    );
  }, [relationships, visibleEntityNames]);

  // Helper function to check if specific entity is visible
  const isEntityVisible = useMemo(() => {
    return (entityName: string) => visibleEntityNames.has(entityName);
  }, [visibleEntityNames]);

  return {
    viewportBounds,
    visibleEntities,
    visibleRelationships,
    visibleEntityNames,
    isEntityVisible,
  };
}

/**
 * Get statistics about viewport culling effectiveness
 */
export function getViewportStats(
  totalEntities: number,
  visibleEntities: number,
  totalRelationships: number,
  visibleRelationships: number
): { entityCullRate: number; relationshipCullRate: number } {
  return {
    entityCullRate: totalEntities > 0
      ? Math.round((1 - visibleEntities / totalEntities) * 100)
      : 0,
    relationshipCullRate: totalRelationships > 0
      ? Math.round((1 - visibleRelationships / totalRelationships) * 100)
      : 0,
  };
}
