/**
 * Sub-hook for entity selection state (toggle, select all, deselect all).
 * Extracted from useERDState for focused responsibility.
 */

import { useState, useCallback } from 'react';
import type { Entity } from '@/types';

export function useEntitySelection(entities: Entity[]) {
  const [selectedEntities, setSelectedEntities] = useState<Set<string>>(new Set());

  const toggleEntity = useCallback((entityName: string) => {
    setSelectedEntities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(entityName)) {
        newSet.delete(entityName);
      } else {
        newSet.add(entityName);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(
    (entityNames?: string[]) => {
      if (entityNames) {
        if (entityNames.length === 0) return;
        setSelectedEntities((prev) => {
          const newSet = new Set(prev);
          entityNames.forEach((name) => newSet.add(name));
          return newSet;
        });
      } else {
        setSelectedEntities(new Set(entities.map((e) => e.logicalName)));
      }
    },
    [entities]
  );

  const deselectAll = useCallback((entityNames?: string[]) => {
    if (entityNames) {
      if (entityNames.length === 0) return;
      setSelectedEntities((prev) => {
        const newSet = new Set(prev);
        entityNames.forEach((name) => newSet.delete(name));
        return newSet;
      });
    } else {
      setSelectedEntities(new Set());
    }
  }, []);

  return {
    selectedEntities,
    setSelectedEntities,
    toggleEntity,
    selectAll,
    deselectAll,
  };
}
