/**
 * Custom hook providing layout algorithms for positioning entity nodes in the ERD canvas.
 *
 * Provides three layout strategies:
 * - **Force-directed**: Physics simulation with repulsion between nodes and spring
 *   attraction along relationship edges. Best for organic, readable layouts.
 * - **Grid**: Simple row/column arrangement. Best for quick overview.
 * - **Auto-arrange**: Topological sort based on relationship dependencies,
 *   placing parent entities above children. Best for hierarchical data.
 *
 * @example
 * ```tsx
 * const { applyForceLayout, applyGridLayout, applyAutoArrange } = useLayoutAlgorithms({
 *   entities, relationships, selectedEntities, entityPositions, setEntityPositions, layoutMode
 * });
 * ```
 */

import { useCallback, useEffect, useRef } from 'react';
import type { Entity, EntityRelationship, EntityPosition } from '@/types';
import type { LayoutMode } from '@/types/erdTypes';
import {
  SPRING_LENGTH,
  SPRING_STRENGTH,
  REPULSION,
  ITERATIONS,
  CENTER_FORCE,
  DAMPING,
  FORCE_CENTER_X,
  FORCE_CENTER_Y,
  GRID_START_X,
  GRID_START_Y,
  GRID_SPACING_X,
  GRID_SPACING_Y,
  LEVEL_HEIGHT,
  HORIZONTAL_SPACING,
} from '@/constants';
import { computeNicolasLayout } from '@/utils/nicolasLayout';

export interface UseLayoutAlgorithmsProps {
  entities: Entity[];
  relationships: EntityRelationship[];
  selectedEntities: Set<string>;
  entityPositions: Record<string, EntityPosition>;
  setEntityPositions: (positions: Record<string, EntityPosition>) => void;
  layoutMode: LayoutMode;
}

export function useLayoutAlgorithms({
  entities,
  relationships,
  selectedEntities,
  entityPositions,
  setEntityPositions,
  layoutMode,
}: UseLayoutAlgorithmsProps) {
  /**
   * Force-directed layout using physics simulation.
   *
   * Algorithm:
   * 1. Initialize random positions for new nodes, preserve existing positions
   * 2. Run 100 iterations of force simulation:
   *    - Apply repulsive force between all node pairs (inverse square law)
   *    - Apply attractive spring force along relationship edges
   *    - Apply weak centering force toward canvas center
   * 3. Apply velocity with damping (0.9) each iteration
   *
   * Parameters: springLength=280, springStrength=0.01, repulsion=8000
   */
  const applyForceLayout = useCallback(() => {
    const filteredEntities = entities.filter((e) => selectedEntities.has(e.logicalName));
    const filteredRelationships = relationships.filter(
      (rel) => selectedEntities.has(rel.from) && selectedEntities.has(rel.to)
    );

    if (filteredEntities.length === 0) return;

    // Check how many entities already have positions — if most do, only place new ones
    // instead of running the expensive O(n²) force simulation
    const entitiesWithPositions = filteredEntities.filter((e) => entityPositions[e.logicalName]);
    const newEntities = filteredEntities.filter((e) => !entityPositions[e.logicalName]);

    if (entitiesWithPositions.length > 0 && newEntities.length > 0) {
      // Most entities already positioned — just grid-place new ones near existing layout
      const newPositions: Record<string, EntityPosition> = { ...entityPositions };
      const cols = Math.ceil(Math.sqrt(newEntities.length)) || 1;

      // Find the bounding box of existing positions to place new entities nearby
      let maxY = 0;
      entitiesWithPositions.forEach((e) => {
        const pos = entityPositions[e.logicalName];
        if (pos && pos.y > maxY) maxY = pos.y;
      });

      newEntities.forEach((entity, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        newPositions[entity.logicalName] = {
          x: GRID_START_X + col * GRID_SPACING_X,
          y: maxY + GRID_SPACING_Y + row * GRID_SPACING_Y,
        };
      });

      setEntityPositions(newPositions);
      return;
    }

    // Full force simulation — only runs when no entities have positions yet
    // (e.g., first layout or explicit layout mode change)
    const newPositions: Record<string, EntityPosition> = {};

    filteredEntities.forEach((entity) => {
      if (!entityPositions[entity.logicalName]) {
        newPositions[entity.logicalName] = {
          x: 100 + Math.random() * 800,
          y: 100 + Math.random() * 600,
          vx: 0,
          vy: 0,
        };
      } else {
        newPositions[entity.logicalName] = {
          ...entityPositions[entity.logicalName],
          vx: 0,
          vy: 0,
        };
      }
    });

    // Cap iterations based on entity count to avoid blocking the UI
    const iterationCount = filteredEntities.length > 100 ? Math.min(ITERATIONS, 30) : ITERATIONS;

    for (let iter = 0; iter < iterationCount; iter++) {
      const alpha = 1 - iter / iterationCount;

      filteredEntities.forEach((entity1) => {
        filteredEntities.forEach((entity2) => {
          if (entity1.logicalName === entity2.logicalName) return;

          const pos1 = newPositions[entity1.logicalName];
          const pos2 = newPositions[entity2.logicalName];

          const dx = pos2.x - pos1.x;
          const dy = pos2.y - pos1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          const force = REPULSION / (dist * dist);
          const fx = (dx / dist) * force * alpha;
          const fy = (dy / dist) * force * alpha;

          pos1.vx = (pos1.vx || 0) - fx;
          pos1.vy = (pos1.vy || 0) - fy;
          pos2.vx = (pos2.vx || 0) + fx;
          pos2.vy = (pos2.vy || 0) + fy;
        });
      });

      filteredRelationships.forEach((rel) => {
        const pos1 = newPositions[rel.from];
        const pos2 = newPositions[rel.to];

        if (!pos1 || !pos2) return;

        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        const force = (dist - SPRING_LENGTH) * SPRING_STRENGTH;
        const fx = (dx / dist) * force * alpha;
        const fy = (dy / dist) * force * alpha;

        pos1.vx = (pos1.vx || 0) + fx;
        pos1.vy = (pos1.vy || 0) + fy;
        pos2.vx = (pos2.vx || 0) - fx;
        pos2.vy = (pos2.vy || 0) - fy;
      });

      const centerX = FORCE_CENTER_X;
      const centerY = FORCE_CENTER_Y;
      filteredEntities.forEach((entity) => {
        const pos = newPositions[entity.logicalName];
        const dx = centerX - pos.x;
        const dy = centerY - pos.y;
        pos.vx = (pos.vx || 0) + dx * CENTER_FORCE * alpha;
        pos.vy = (pos.vy || 0) + dy * CENTER_FORCE * alpha;
      });

      filteredEntities.forEach((entity) => {
        const pos = newPositions[entity.logicalName];
        pos.x += pos.vx || 0;
        pos.y += pos.vy || 0;
        pos.vx = (pos.vx || 0) * DAMPING;
        pos.vy = (pos.vy || 0) * DAMPING;
      });
    }

    setEntityPositions(newPositions);
  }, [entities, selectedEntities, relationships, entityPositions, setEntityPositions]);

  /**
   * Simple grid layout arranging entities in rows and columns.
   *
   * Calculates optimal column count as sqrt(entityCount), then places
   * entities left-to-right, top-to-bottom with fixed spacing.
   *
   * Spacing: 380px horizontal, 320px vertical
   * Starting position: (100, 80)
   */
  const applyGridLayout = useCallback(() => {
    const filteredEntities = entities.filter((e) => selectedEntities.has(e.logicalName));
    const cols = Math.ceil(Math.sqrt(filteredEntities.length));
    const newPositions: Record<string, EntityPosition> = {};

    filteredEntities.forEach((entity, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      newPositions[entity.logicalName] = {
        x: GRID_START_X + col * GRID_SPACING_X,
        y: GRID_START_Y + row * GRID_SPACING_Y,
      };
    });

    setEntityPositions(newPositions);
  }, [entities, selectedEntities, setEntityPositions]);

  /**
   * Hierarchical auto-arrange based on relationship dependencies.
   *
   * Algorithm:
   * 1. Build dependency graph from N:1 and 1:N relationships
   * 2. Calculate levels using topological sort (entities with no dependencies = level 0)
   * 3. Group entities by level
   * 4. Position each level horizontally centered, with vertical spacing between levels
   *
   * Results in parent/referenced entities at top, child/dependent entities below.
   * Spacing: 380px horizontal, 320px vertical per level
   */
  const applyAutoArrange = useCallback(() => {
    const filteredEntities = entities.filter((e) => selectedEntities.has(e.logicalName));
    const filteredRelationships = relationships.filter(
      (rel) => selectedEntities.has(rel.from) && selectedEntities.has(rel.to)
    );

    if (filteredEntities.length === 0) return;

    const newPositions: Record<string, EntityPosition> = {};

    // Build dependency graph
    const dependencies: Record<string, string[]> = {};
    const dependents: Record<string, string[]> = {};
    filteredEntities.forEach((e) => {
      dependencies[e.logicalName] = [];
      dependents[e.logicalName] = [];
    });

    filteredRelationships.forEach((rel) => {
      if (rel.type === 'N:1') {
        dependencies[rel.from]?.push(rel.to);
        dependents[rel.to]?.push(rel.from);
      } else if (rel.type === '1:N') {
        dependencies[rel.to]?.push(rel.from);
        dependents[rel.from]?.push(rel.to);
      }
    });

    // Calculate levels (topological sort-like)
    const levels: Record<string, number> = {};
    const visited = new Set<string>();

    const calculateLevel = (entityName: string, currentLevel: number = 0): number => {
      if (visited.has(entityName)) return levels[entityName] || 0;
      visited.add(entityName);

      const deps = dependencies[entityName] || [];
      if (deps.length === 0) {
        levels[entityName] = 0;
        return 0;
      }

      const maxDepLevel = Math.max(
        ...deps.map((dep: string) => calculateLevel(dep, currentLevel + 1))
      );
      levels[entityName] = maxDepLevel + 1;
      return levels[entityName];
    };

    filteredEntities.forEach((e) => calculateLevel(e.logicalName));

    // Group by level
    const levelGroups: Record<number, string[]> = {};
    Object.keys(levels).forEach((entityName) => {
      const level = levels[entityName];
      if (!levelGroups[level]) levelGroups[level] = [];
      levelGroups[level].push(entityName);
    });

    // Position entities

    Object.keys(levelGroups).forEach((levelStr) => {
      const level = parseInt(levelStr);
      const group = levelGroups[level];
      const y = GRID_START_Y + level * LEVEL_HEIGHT;
      const totalWidth = group.length * HORIZONTAL_SPACING;
      const startX = Math.max(GRID_START_X, (1200 - totalWidth) / 2);

      group.forEach((entityName: string, index: number) => {
        newPositions[entityName] = {
          x: startX + index * HORIZONTAL_SPACING,
          y: y,
        };
      });
    });

    setEntityPositions(newPositions);
  }, [entities, selectedEntities, relationships, setEntityPositions]);

  /**
   * NICOLAS layout: community-aware hierarchical layout.
   *
   * Algorithm:
   * 1. Leiden community detection groups entities by relationship density
   * 2. Sugiyama hierarchical layout within each community
   * 3. Strip-packing of community bounding boxes for inter-community placement
   * 4. Optional L2 grouping for large entity sets (15+)
   */
  const applyNicolasLayout = useCallback(() => {
    const filteredEntities = entities.filter((e) => selectedEntities.has(e.logicalName));
    if (filteredEntities.length === 0) return;

    const filteredRelationships = relationships.filter(
      (rel) => selectedEntities.has(rel.from) && selectedEntities.has(rel.to)
    );

    const newPositions = computeNicolasLayout(
      filteredEntities,
      filteredRelationships,
      selectedEntities
    );

    setEntityPositions(newPositions);
  }, [entities, selectedEntities, relationships, setEntityPositions]);

  // Apply layout when mode or selection changes.
  // Debounce selection changes to avoid blocking the UI during bulk selection (e.g. "Select All").
  // Layout mode changes (user explicitly choosing a layout) apply immediately.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const prevLayoutModeRef = useRef(layoutMode);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    const layoutModeChanged = prevLayoutModeRef.current !== layoutMode;
    prevLayoutModeRef.current = layoutMode;
    const isFirstRender = isFirstRenderRef.current;
    isFirstRenderRef.current = false;

    if (layoutMode === 'manual') return;

    const applyLayout = () => {
      if (layoutMode === 'force') applyForceLayout();
      else if (layoutMode === 'grid') applyGridLayout();
      else if (layoutMode === 'auto') applyAutoArrange();
      else if (layoutMode === 'nicolas') applyNicolasLayout();
    };

    if (isFirstRender || layoutModeChanged) {
      clearTimeout(debounceRef.current);
      applyLayout();
    } else {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(applyLayout, 300);
    }

    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutMode, selectedEntities]);

  return {
    applyForceLayout,
    applyGridLayout,
    applyAutoArrange,
    applyNicolasLayout,
  };
}
