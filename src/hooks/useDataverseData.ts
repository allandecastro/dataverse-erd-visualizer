/**
 * Custom React Hook for Dataverse Data
 * Supports pagination for large entity sets (250+ entities)
 * Supports mock mode for local development/testing
 */

import { useState, useEffect, useCallback } from 'react';
import { dataverseApi } from '@/services/dataverseApi';
import {
  generateMockEntities,
  generateMockRelationships,
  simulateDelay,
} from '@/services/mockData';
import type { Entity, EntityRelationship } from '@/types';

export interface LoadingProgress {
  phase: string;
  page: number;
  totalEntities: number;
  message: string;
}

export interface UseDataverseDataResult {
  entities: Entity[];
  relationships: EntityRelationship[];
  isLoading: boolean;
  loadingProgress: LoadingProgress | null;
  error: Error | null;
  refetch: () => Promise<void>;
  isMockMode: boolean;
}

export interface UseDataverseDataOptions {
  useMockData?: boolean;
}

function getProgressMessage(info: { page: number; totalEntities: number; phase: string }): string {
  if (info.phase === 'fetching_entities') {
    return `Fetching entities (page ${info.page}, ${info.totalEntities} found)...`;
  }
  if (info.phase === 'extracting_relationships') {
    return `Extracting relationships from ${info.totalEntities} entities...`;
  }
  if (info.phase === 'fetching_solutions') {
    return `Fetching solutions and mappings...`;
  }
  if (info.phase.startsWith('fetching_attributes:')) {
    const [current, total] = info.phase.split(':')[1].split('/');
    return `Fetching attributes (${current}/${total} entities)...`;
  }
  if (info.phase === 'mock_loading') {
    return 'Loading mock data...';
  }
  return 'Loading...';
}

/**
 * Detect if we're running in a Dataverse environment
 */
function isDataverseEnvironment(): boolean {
  try {
    // Method 1: Check for Xrm object on window (standard web resource)
    if (typeof window !== 'undefined' && window.Xrm) {
      return true;
    }

    // Method 2: Check for global Xrm (sometimes not on window directly)
    if (typeof Xrm !== 'undefined') {
      return true;
    }

    // Method 3: Check parent window for iframe scenario
    try {
      if (window.parent && window.parent !== window) {
        const parentXrm = (window.parent as Window & { Xrm?: unknown })?.Xrm;
        if (parentXrm) {
          return true;
        }
      }
    } catch {
      // Cross-origin access blocked - ignore
    }

    // Method 4: Check URL pattern for Dataverse domains
    const url = window.location.href.toLowerCase();
    if (
      url.includes('.dynamics.com') ||
      url.includes('.crm.dynamics.com') ||
      url.includes('crm4.dynamics.com') ||
      url.includes('webresources')
    ) {
      // We're on a Dataverse URL, assume Xrm will be available
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export function useDataverseData(options?: UseDataverseDataOptions): UseDataverseDataResult {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [relationships, setRelationships] = useState<EntityRelationship[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Determine if we should use mock data
  // Priority: 1) explicit option, 2) URL param, 3) auto-detect environment
  const urlMockParam = new URLSearchParams(window.location.search).get('mock');
  const shouldUseMockData =
    options?.useMockData ??
    (urlMockParam !== null ? urlMockParam === 'true' : !isDataverseEnvironment());

  const [isMockMode] = useState(shouldUseMockData);

  const fetchMockData = useCallback(async () => {
    setLoadingProgress({
      phase: 'mock_loading',
      page: 0,
      totalEntities: 0,
      message: 'Loading mock data...',
    });

    // Simulate network delay for realistic testing
    await simulateDelay(800);

    const mockEntities = generateMockEntities();
    const mockRelationships = generateMockRelationships();

    setEntities(mockEntities);
    setRelationships(mockRelationships);
  }, []);

  const fetchRealData = useCallback(async () => {
    // Fetch entity metadata and relationships with progress reporting
    const result = await dataverseApi.fetchEntityMetadata((info) => {
      setLoadingProgress({
        ...info,
        message: getProgressMessage(info),
      });
    });

    setEntities(result.entities);
    setRelationships(result.relationships);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setLoadingProgress({
        phase: 'starting',
        page: 0,
        totalEntities: 0,
        message: 'Initializing...',
      });

      if (isMockMode) {
        await fetchMockData();
      } else {
        await fetchRealData();
      }

      setLoadingProgress(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      console.error('Error fetching Dataverse data:', err);
      setLoadingProgress(null);
    } finally {
      setIsLoading(false);
    }
  }, [isMockMode, fetchMockData, fetchRealData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    entities,
    relationships,
    isLoading,
    loadingProgress,
    error,
    refetch: fetchData,
    isMockMode,
  };
}
