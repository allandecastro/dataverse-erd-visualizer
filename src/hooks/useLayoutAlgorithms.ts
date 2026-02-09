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

import { useCallback, useEffect } from 'react';
import type { Entity, EntityRelationship, EntityPosition } from '@/types';
import type { LayoutMode } from '@/types/erdTypes';
import {
  SPRING_LENGTH,
  SPRING_STRENGTH,
  REPULSION,
  ITERATIONS,
  CENTER_FORCE,
  DAMPING,
  GRID_START_X,
  GRID_START_Y,
  GRID_SPACING_X,
  GRID_SPACING_Y,
  LEVEL_HEIGHT,
  HORIZONTAL_SPACING,
} from '@/constants';

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

    for (let iter = 0; iter < ITERATIONS; iter++) {
      const alpha = 1 - iter / ITERATIONS;

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

      const centerX = 600;
      const centerY = 400;
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

  // Apply layout when mode changes (skip for 'manual' mode to preserve user-defined positions)
  useEffect(() => {
    if (layoutMode === 'force') {
      applyForceLayout();
    } else if (layoutMode === 'grid') {
      applyGridLayout();
    } else if (layoutMode === 'auto') {
      applyAutoArrange();
    }
    // 'manual' mode: Skip auto-layout, preserve existing positions
    // Note: Only trigger on layoutMode and selectedEntities changes to avoid infinite loops
    // The layout functions themselves are stable due to their useCallback wrappers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutMode, selectedEntities]);

  return {
    applyForceLayout,
    applyGridLayout,
    applyAutoArrange,
  };
}
