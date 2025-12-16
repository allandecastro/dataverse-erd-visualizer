/**
 * Custom hook for managing ERD Visualizer state
 */

import { useState, useCallback, useEffect } from 'react';
import type { Entity, EntityRelationship, EntityPosition } from '@/types';
import type { ToastType, ToastState, LayoutMode, ColorSettings } from '../types';

export interface UseERDStateProps {
  entities: Entity[];
  relationships: EntityRelationship[];
}

export function useERDState({ entities, relationships }: UseERDStateProps) {
  // Theme
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Entity selection
  const [selectedEntities, setSelectedEntities] = useState<Set<string>>(
    new Set(entities.map(e => e.logicalName))
  );

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

  // Auto-select all Lookup fields on mount
  useEffect(() => {
    const initialSelectedFields: Record<string, Set<string>> = {};
    entities.forEach(entity => {
      const lookupFields = entity.attributes
        .filter(attr => attr.type === 'Lookup' || attr.type === 'Owner')
        .map(attr => attr.name);

      if (lookupFields.length > 0) {
        initialSelectedFields[entity.logicalName] = new Set(lookupFields);
      }
    });
    setSelectedFields(initialSelectedFields);
  }, [entities]);

  // Show toast notification
  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Filtered entities and relationships
  const filteredEntities = entities.filter(entity => {
    const matchesSearch = entity.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entity.logicalName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPublisher = publisherFilter === 'all' || entity.publisher === publisherFilter;
    const matchesSolution = solutionFilter === 'all' || entity.solution === solutionFilter;
    return matchesSearch && matchesPublisher && matchesSolution && selectedEntities.has(entity.logicalName);
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

  // Get publishers and solutions for filters
  const publishers: string[] = ['all', ...new Set(entities.map(e => e.publisher).filter((p): p is string => Boolean(p)))];
  const solutions: string[] = ['all', ...new Set(entities.map(e => e.solution).filter((s): s is string => Boolean(s)))];

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
