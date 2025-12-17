/**
 * Custom hook for managing ERD Visualizer state
 */

import { useState, useCallback } from 'react';
import type { Entity, EntityRelationship, EntityPosition } from '@/types';
import type { ToastType, ToastState, LayoutMode, ColorSettings } from '../types';

export interface UseERDStateProps {
  entities: Entity[];
  relationships: EntityRelationship[];
}

export function useERDState({ entities, relationships }: UseERDStateProps) {
  // Theme
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Entity selection - start with none selected by default
  const [selectedEntities, setSelectedEntities] = useState<Set<string>>(new Set());

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [publisherFilter, setPublisherFilter] = useState('all');
  const [solutionFilter, setSolutionFilter] = useState('all');

  // Zoom and pan
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 400, y: 100 });

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Entity positions and layout
  const [entityPositions, setEntityPositions] = useState<Record<string, EntityPosition>>({});
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('force');

  // Collapse state
  const [collapsedEntities, setCollapsedEntities] = useState<Set<string>>(new Set());

  // Hover state
  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null);

  // Entity dragging
  const [draggingEntity, setDraggingEntity] = useState<string | null>(null);
  const [dragEntityOffset, setDragEntityOffset] = useState({ x: 0, y: 0 });

  // Field selection
  const [selectedFields, setSelectedFields] = useState<Record<string, Set<string>>>({});
  const [showFieldSelector, setShowFieldSelector] = useState<string | null>(null);
  const [fieldSearchQueries, setFieldSearchQueries] = useState<Record<string, string>>({});

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [colorSettings, setColorSettings] = useState<ColorSettings>({
    customTableColor: '#60a5fa',
    standardTableColor: '#a78bfa',
    lookupColor: '#ef4444',
  });

  // Features
  const [showMinimap, setShowMinimap] = useState(false);
  const [isSmartZoom, setIsSmartZoom] = useState(false);

  // Toast
  const [toast, setToast] = useState<ToastState | null>(null);

  // No auto-select - fields start empty, PK is shown automatically

  // Show toast notification
  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Helper to get publisher from entity
  const getEntityPublisher = (entity: Entity): string => {
    if (entity.publisher) return entity.publisher;
    if (!entity.isCustomEntity) return 'Microsoft';
    const underscoreIndex = entity.logicalName.indexOf('_');
    if (underscoreIndex > 0) {
      return entity.logicalName.substring(0, underscoreIndex);
    }
    return 'Unknown';
  };

  // Filtered entities and relationships
  // Note: searchQuery is NOT used here - it only filters the sidebar selection list
  // The canvas shows all selected entities regardless of search
  const filteredEntities = entities.filter(entity => {
    const entityPublisher = getEntityPublisher(entity);
    const matchesPublisher = publisherFilter === 'all' || entityPublisher === publisherFilter;
    // Entity can belong to multiple solutions - match if ANY solution matches the filter
    const matchesSolution = solutionFilter === 'all' || (entity.solutions?.includes(solutionFilter) ?? false);
    return matchesPublisher && matchesSolution && selectedEntities.has(entity.logicalName);
  });

  const filteredRelationships = relationships.filter(rel =>
    selectedEntities.has(rel.from) && selectedEntities.has(rel.to)
  );

  // Entity selection helpers
  const toggleEntity = useCallback((entityName: string) => {
    setSelectedEntities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entityName)) {
        newSet.delete(entityName);
      } else {
        newSet.add(entityName);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedEntities(new Set(entities.map(e => e.logicalName)));
  }, [entities]);

  const deselectAll = useCallback(() => {
    setSelectedEntities(new Set());
  }, []);

  // Collapse helpers
  const toggleCollapse = useCallback((entityName: string) => {
    setCollapsedEntities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entityName)) {
        newSet.delete(entityName);
      } else {
        newSet.add(entityName);
      }
      return newSet;
    });
  }, []);

  const collapseAll = useCallback(() => {
    setCollapsedEntities(new Set(entities.map(e => e.logicalName)));
  }, [entities]);

  const expandAll = useCallback(() => {
    setCollapsedEntities(new Set());
  }, []);

  // Field selection helpers
  const toggleFieldSelection = useCallback((entityName: string, fieldName: string) => {
    setSelectedFields(prev => {
      const entityFields = prev[entityName] || new Set();
      const newSet = new Set(entityFields);
      if (newSet.has(fieldName)) {
        newSet.delete(fieldName);
      } else {
        newSet.add(fieldName);
      }
      return { ...prev, [entityName]: newSet };
    });
  }, []);

  const selectAllFields = useCallback((entityName: string) => {
    const entity = entities.find(e => e.logicalName === entityName);
    if (entity) {
      setSelectedFields(prev => ({
        ...prev,
        [entityName]: new Set(entity.attributes.map(a => a.name))
      }));
    }
  }, [entities]);

  const clearAllFields = useCallback((entityName: string) => {
    setSelectedFields(prev => ({
      ...prev,
      [entityName]: new Set()
    }));
  }, []);

  // Zoom helpers
  const handleZoomIn = useCallback(() => {
    setZoom(z => Math.min(z + 0.1, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(z => Math.max(z - 0.1, 0.3));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(0.8);
    setPan({ x: 400, y: 100 });
  }, []);

  // Derive publishers and solutions for filters
  const publishers: string[] = ['all', ...new Set(entities.map(e => getEntityPublisher(e)))].sort();
  // Flatten all solutions from all entities (each entity can belong to multiple solutions)
  const allSolutions = entities.flatMap(e => e.solutions || []);
  const solutions: string[] = ['all', ...new Set(allSolutions)].sort();

  return {
    // Theme
    isDarkMode,
    setIsDarkMode,

    // Entity selection
    selectedEntities,
    setSelectedEntities,
    toggleEntity,
    selectAll,
    deselectAll,

    // Filters
    searchQuery,
    setSearchQuery,
    publisherFilter,
    setPublisherFilter,
    solutionFilter,
    setSolutionFilter,
    publishers,
    solutions,

    // Zoom and pan
    zoom,
    setZoom,
    pan,
    setPan,
    handleZoomIn,
    handleZoomOut,
    handleResetView,

    // Drag state
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,

    // Entity positions and layout
    entityPositions,
    setEntityPositions,
    layoutMode,
    setLayoutMode,

    // Collapse state
    collapsedEntities,
    setCollapsedEntities,
    toggleCollapse,
    collapseAll,
    expandAll,

    // Hover state
    hoveredEntity,
    setHoveredEntity,

    // Entity dragging
    draggingEntity,
    setDraggingEntity,
    dragEntityOffset,
    setDragEntityOffset,

    // Field selection
    selectedFields,
    setSelectedFields,
    showFieldSelector,
    setShowFieldSelector,
    fieldSearchQueries,
    setFieldSearchQueries,
    toggleFieldSelection,
    selectAllFields,
    clearAllFields,

    // Settings
    showSettings,
    setShowSettings,
    colorSettings,
    setColorSettings,

    // Features
    showMinimap,
    setShowMinimap,
    isSmartZoom,
    setIsSmartZoom,

    // Toast
    toast,
    showToast,

    // Filtered data
    filteredEntities,
    filteredRelationships,
  };
}
