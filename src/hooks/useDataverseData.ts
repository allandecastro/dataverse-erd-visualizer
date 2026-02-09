/**
 * Custom React Hook for Dataverse Data
 * Supports pagination for large entity sets (250+ entities)
 * Supports mock mode for local development/testing
 */

import { useState, useEffect, useCallback, useRef } from 'react';
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
  newRelationshipsDetected: number; // Count of new relationships found since last load
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
  const [newRelationshipsDetected, setNewRelationshipsDetected] = useState<number>(0);

  // Track previous relationships to detect new ones (use ref to avoid circular dependency)
  const previousRelationshipSchemas = useRef<Set<string>>(new Set());
  const isInitialLoad = useRef<boolean>(true);

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

    // Detect new relationships
    const currentSchemas = new Set(result.relationships.map((r) => r.schemaName));
    const newSchemas = Array.from(currentSchemas).filter(
      (schema) => !previousRelationshipSchemas.current.has(schema)
    );

    if (import.meta.env.DEV) {
      console.warn('[Relationship Detection]', {
        isInitialLoad: isInitialLoad.current,
        previousCount: previousRelationshipSchemas.current.size,
        currentCount: currentSchemas.size,
        newCount: newSchemas.length,
        newSchemas: newSchemas,
      });
    }

    // Only show notification if this is not the initial load
    if (!isInitialLoad.current && newSchemas.length > 0) {
      if (import.meta.env.DEV) {
        console.warn(
          `[Auto-refresh] ✅ Detected ${newSchemas.length} new relationship(s):`,
          newSchemas
        );
      }
      setNewRelationshipsDetected(newSchemas.length);
    } else {
      if (import.meta.env.DEV) {
        console.warn('[Auto-refresh] No new relationships to notify');
      }
      setNewRelationshipsDetected(0);
    }

    // Update the previous schemas set and mark initial load complete
    previousRelationshipSchemas.current = currentSchemas;
    isInitialLoad.current = false;

    setEntities(result.entities);
    setRelationships(result.relationships);
  }, []);

  const fetchData = useCallback(
    async (silent = false) => {
      try {
        // Only show loading screen on initial load, not on refresh
        if (!silent) {
          setIsLoading(true);
          setError(null);
          setLoadingProgress({
            phase: 'starting',
            page: 0,
            totalEntities: 0,
            message: 'Initializing...',
          });
        }

        if (isMockMode) {
          await fetchMockData();
        } else {
          await fetchRealData();
        }

        if (!silent) {
          setLoadingProgress(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        console.error('Error fetching Dataverse data:', err);
        if (!silent) {
          setLoadingProgress(null);
        }
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [isMockMode, fetchMockData, fetchRealData]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh on window focus (when user returns from Dataverse customization)
  // This ensures new relationships from lookup fields are automatically detected
  useEffect(() => {
    // Only auto-refresh in real Dataverse mode, not in mock mode
    if (isMockMode) return;

    let lastFocusTime = Date.now();

    const handleFocus = () => {
      const timeSinceLastFocus = Date.now() - lastFocusTime;

      // Only refresh if user was away for more than 5 seconds
      // This prevents unnecessary refreshes on quick tab switches
      if (timeSinceLastFocus > 5000 && !isLoading) {
        if (import.meta.env.DEV) {
          console.warn(
            '[Auto-refresh] Window focused after being away. Reloading metadata silently...'
          );
        }
        fetchData(true); // Silent refresh - keeps diagram state
      }

      lastFocusTime = Date.now();
    };

    const handleBlur = () => {
      lastFocusTime = Date.now();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isMockMode, isLoading, fetchData]);

  return {
    entities,
    relationships,
    isLoading,
    loadingProgress,
    error,
    refetch: fetchData,
    isMockMode,
    newRelationshipsDetected,
  };
}
