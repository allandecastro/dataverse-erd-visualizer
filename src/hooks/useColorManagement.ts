/**
 * Sub-hook for entity color overrides and group management.
 * Extracted from useERDState for focused responsibility.
 */

import { useState, useCallback, useMemo } from 'react';
import type { EntityColorMap, GroupNameMap } from '@/types/erdTypes';
import { deriveGroups } from '@/utils/groupUtils';

export function useColorManagement() {
  const [entityColorOverrides, setEntityColorOverrides] = useState<EntityColorMap>({});
  const [groupNames, setGroupNamesState] = useState<GroupNameMap>({});
  const [groupFilter, setGroupFilter] = useState('all');

  const setEntityColor = useCallback((entityName: string, color: string) => {
    setEntityColorOverrides((prev) => ({ ...prev, [entityName]: color }));
  }, []);

  const clearEntityColor = useCallback((entityName: string) => {
    setEntityColorOverrides((prev) => {
      const next = { ...prev };
      delete next[entityName];
      return next;
    });
  }, []);

  const clearAllEntityColors = useCallback(() => {
    setEntityColorOverrides({});
    setGroupNamesState({});
    setGroupFilter('all');
  }, []);

  const setGroupName = useCallback((color: string, name: string) => {
    const normalized = color.toLowerCase();
    setGroupNamesState((prev) => ({ ...prev, [normalized]: name }));
  }, []);

  const clearGroupName = useCallback((color: string) => {
    const normalized = color.toLowerCase();
    setGroupNamesState((prev) => {
      const next = { ...prev };
      delete next[normalized];
      return next;
    });
  }, []);

  const derivedGroups = useMemo(
    () => deriveGroups(entityColorOverrides, groupNames),
    [entityColorOverrides, groupNames]
  );

  return {
    entityColorOverrides,
    setEntityColorOverrides,
    groupNames,
    setGroupNamesState,
    groupFilter,
    setGroupFilter,
    setEntityColor,
    clearEntityColor,
    clearAllEntityColors,
    setGroupName,
    clearGroupName,
    derivedGroups,
  };
}
