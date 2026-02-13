/**
 * Custom hook for managing ERD Visualizer state
 */

import { useState, useCallback, useMemo } from 'react';
import type { Entity, EntityRelationship, EntityPosition } from '@/types';
import type { ToastType, ToastState, LayoutMode, ColorSettings } from '@/types/erdTypes';
import { getEntityPublisher } from '@/utils/entityUtils';

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

  // Entity positions and layout
  const [entityPositions, setEntityPositions] = useState<Record<string, EntityPosition>>({});
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('force');

  // Collapse state
  const [collapsedEntities, setCollapsedEntities] = useState<Set<string>>(new Set());

  // Field selection
  const [selectedFields, setSelectedFields] = useState<Record<string, Set<string>>>({});
  const [showFieldSelector, setShowFieldSelector] = useState<string | null>(null);
  const [fieldSearchQueries, setFieldSearchQueries] = useState<Record<string, string>>({});

  // Field drawer state
  const [fieldDrawerEntity, setFieldDrawerEntity] = useState<string | null>(null);
  const [fieldOrder, setFieldOrder] = useState<Record<string, string[]>>({});

  // Add related table dialog
  const [pendingLookupField, setPendingLookupField] = useState<{
    entityName: string;
    fieldName: string;
    targetEntity: string;
  } | null>(null);

  // Edge offsets for manual adjustment of relationship lines (x and y offsets)
  const [edgeOffsets, setEdgeOffsets] = useState<Record<string, { x: number; y: number }>>({});

  // Per-entity color overrides (entity logicalName → hex color)
  const [entityColorOverrides, setEntityColorOverrides] = useState<Record<string, string>>({});

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [colorSettings, setColorSettings] = useState<ColorSettings>({
    customTableColor: '#0ea5e9',
    standardTableColor: '#64748b',
    lookupColor: '#f97316',
    edgeStyle: 'smoothstep',
    // Line customization defaults
    lineNotation: 'simple',
    lineStroke: 'solid',
    lineThickness: 1.5,
    useRelationshipTypeColors: false,
    oneToManyColor: '#f97316',
    manyToOneColor: '#06b6d4',
    manyToManyColor: '#8b5cf6',
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

  // Note: getEntityPublisher is now imported from @/utils/entityUtils

  // Filtered entities and relationships for the canvas
  // Publisher/Solution filters only affect the sidebar list, NOT the canvas
  // The canvas shows all selected entities regardless of filters
  const filteredEntities = useMemo(
    () => entities.filter((entity) => selectedEntities.has(entity.logicalName)),
    [entities, selectedEntities]
  );

  const filteredRelationships = useMemo(
    () =>
      relationships.filter((rel) => selectedEntities.has(rel.from) && selectedEntities.has(rel.to)),
    [relationships, selectedEntities]
  );

  // Entity selection helpers
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
        // Add specific entities to selection (filter-aware)
        setSelectedEntities((prev) => {
          const newSet = new Set(prev);
          entityNames.forEach((name) => newSet.add(name));
          return newSet;
        });
      } else {
        // Select all entities
        setSelectedEntities(new Set(entities.map((e) => e.logicalName)));
      }
    },
    [entities]
  );

  const deselectAll = useCallback((entityNames?: string[]) => {
    if (entityNames) {
      // Remove specific entities from selection (filter-aware)
      setSelectedEntities((prev) => {
        const newSet = new Set(prev);
        entityNames.forEach((name) => newSet.delete(name));
        return newSet;
      });
    } else {
      // Deselect everything
      setSelectedEntities(new Set());
    }
  }, []);

  // Collapse helpers
  const toggleCollapse = useCallback((entityName: string) => {
    setCollapsedEntities((prev) => {
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
    setCollapsedEntities(new Set(entities.map((e) => e.logicalName)));
  }, [entities]);

  const expandAll = useCallback(() => {
    setCollapsedEntities(new Set());
  }, []);

  // Field selection helpers
  const toggleFieldSelection = useCallback((entityName: string, fieldName: string) => {
    setSelectedFields((prev) => {
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

  const selectAllFields = useCallback(
    (entityName: string) => {
      const entity = entities.find((e) => e.logicalName === entityName);
      if (entity) {
        setSelectedFields((prev) => ({
          ...prev,
          [entityName]: new Set(entity.attributes.map((a) => a.name)),
        }));
      }
    },
    [entities]
  );

  const clearAllFields = useCallback((entityName: string) => {
    setSelectedFields((prev) => ({
      ...prev,
      [entityName]: new Set(),
    }));
  }, []);

  // Add field with FIFO ordering
  const addField = useCallback((entityName: string, fieldName: string) => {
    // Add to order if not already present
    setFieldOrder((prev) => {
      const currentOrder = prev[entityName] || [];
      if (currentOrder.includes(fieldName)) return prev;
      return {
        ...prev,
        [entityName]: [...currentOrder, fieldName],
      };
    });
    // Add to selected fields
    setSelectedFields((prev) => {
      const fields = prev[entityName] || new Set();
      return { ...prev, [entityName]: new Set([...fields, fieldName]) };
    });
  }, []);

  // Remove field from selection and order
  const removeField = useCallback((entityName: string, fieldName: string) => {
    // Remove from order
    setFieldOrder((prev) => ({
      ...prev,
      [entityName]: (prev[entityName] || []).filter((f) => f !== fieldName),
    }));
    // Remove from selected fields
    setSelectedFields((prev) => {
      const fields = new Set(prev[entityName] || []);
      fields.delete(fieldName);
      return { ...prev, [entityName]: fields };
    });
  }, []);

  // Get ordered fields for an entity (PK first, then FIFO order)
  // Respects collapsedEntities state - collapsed entities only show PK
  const getOrderedFields = useCallback(
    (entityName: string) => {
      const entity = entities.find((e) => e.logicalName === entityName);
      if (!entity) return [];

      // Get PK attribute
      const pkAttr = entity.attributes.find((a) => a.isPrimaryKey);
      const pkName = pkAttr?.name;

      // If entity is collapsed, only show PK (minimal view)
      if (collapsedEntities.has(entityName)) {
        return pkName ? [pkName] : [];
      }

      const selected = selectedFields[entityName] || new Set();
      const order = fieldOrder[entityName] || [];

      // Build ordered list: PK first, then fields in FIFO order
      const orderedFields: string[] = [];
      if (pkName) orderedFields.push(pkName);

      // Add fields in their FIFO order
      for (const fieldName of order) {
        if (fieldName !== pkName && selected.has(fieldName)) {
          orderedFields.push(fieldName);
        }
      }

      return orderedFields;
    },
    [entities, selectedFields, fieldOrder, collapsedEntities]
  );

  // Update edge offset for manual path adjustment (supports both x and y)
  const updateEdgeOffset = useCallback((edgeId: string, offset: { x: number; y: number }) => {
    setEdgeOffsets((prev) => ({
      ...prev,
      [edgeId]: offset,
    }));
  }, []);

  // Per-entity color override helpers
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
  }, []);

  // Zoom helpers
  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 0.1, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - 0.1, 0.3));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(0.8);
    setPan({ x: 400, y: 100 });
  }, []);

  // Derive publishers and solutions for filters (memoized to prevent recalculation)
  const publishers = useMemo(
    () => ['all', ...new Set(entities.map((e) => getEntityPublisher(e)))].sort(),
    [entities]
  );

  // Flatten all solutions from all entities (each entity can belong to multiple solutions)
  const solutions = useMemo(() => {
    const allSolutions = entities.flatMap((e) => e.solutions || []);
    return ['all', ...new Set(allSolutions)].sort();
  }, [entities]);

  // Snapshot helpers: Extract serializable state for snapshots
  const getSerializableState = useCallback(() => {
    return {
      selectedEntities: Array.from(selectedEntities),
      collapsedEntities: Array.from(collapsedEntities),
      selectedFields: Object.fromEntries(
        Object.entries(selectedFields).map(([key, set]) => [key, Array.from(set)])
      ),
      fieldOrder,
      entityPositions,
      layoutMode,
      zoom,
      pan,
      searchQuery,
      publisherFilter,
      solutionFilter,
      isDarkMode,
      colorSettings,
      showMinimap,
      isSmartZoom,
      edgeOffsets,
      entityColorOverrides,
    };
  }, [
    selectedEntities,
    collapsedEntities,
    selectedFields,
    fieldOrder,
    entityPositions,
    layoutMode,
    zoom,
    pan,
    searchQuery,
    publisherFilter,
    solutionFilter,
    isDarkMode,
    colorSettings,
    showMinimap,
    isSmartZoom,
    edgeOffsets,
    entityColorOverrides,
  ]);

  // Snapshot helpers: Restore state from snapshot
  const restoreState = useCallback(
    (state: {
      selectedEntities: string[];
      collapsedEntities: string[];
      selectedFields: Record<string, string[]>;
      fieldOrder: Record<string, string[]>;
      entityPositions: Record<string, EntityPosition>;
      layoutMode: LayoutMode;
      zoom: number;
      pan: { x: number; y: number };
      searchQuery: string;
      publisherFilter: string;
      solutionFilter: string;
      isDarkMode: boolean;
      colorSettings: ColorSettings;
      showMinimap: boolean;
      isSmartZoom: boolean;
      edgeOffsets: Record<string, { x: number; y: number }>;
      entityColorOverrides?: Record<string, string>;
    }) => {
      setSelectedEntities(new Set(state.selectedEntities));
      setCollapsedEntities(new Set(state.collapsedEntities));
      setSelectedFields(
        Object.fromEntries(
          Object.entries(state.selectedFields).map(([key, arr]) => [key, new Set(arr)])
        )
      );
      setFieldOrder(state.fieldOrder);
      setEntityPositions(state.entityPositions);
      // If positions exist, use manual mode to preserve them; otherwise use saved layout mode
      const hasPositions = Object.keys(state.entityPositions).length > 0;
      setLayoutMode(hasPositions ? 'manual' : state.layoutMode);
      setZoom(state.zoom);
      setPan(state.pan);
      setSearchQuery(state.searchQuery);
      setPublisherFilter(state.publisherFilter);
      setSolutionFilter(state.solutionFilter);
      setIsDarkMode(state.isDarkMode);

      // Backward compatibility: merge with defaults for missing properties
      const defaultColorSettings: ColorSettings = {
        customTableColor: '#0ea5e9',
        standardTableColor: '#64748b',
        lookupColor: '#f97316',
        edgeStyle: 'smoothstep',
        lineNotation: 'simple',
        lineStroke: 'solid',
        lineThickness: 1.5,
        useRelationshipTypeColors: false,
        oneToManyColor: '#f97316',
        manyToOneColor: '#06b6d4',
        manyToManyColor: '#8b5cf6',
      };
      setColorSettings({
        ...defaultColorSettings,
        ...state.colorSettings,
      });

      setShowMinimap(state.showMinimap);
      setIsSmartZoom(state.isSmartZoom);
      setEdgeOffsets(state.edgeOffsets);
      setEntityColorOverrides(state.entityColorOverrides || {});
    },
    []
  );

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

    // Field drawer
    fieldDrawerEntity,
    setFieldDrawerEntity,
    fieldOrder,
    setFieldOrder,
    addField,
    removeField,
    getOrderedFields,

    // Pending lookup dialog
    pendingLookupField,
    setPendingLookupField,

    // Edge offsets for manual adjustment
    edgeOffsets,
    updateEdgeOffset,

    // Settings
    showSettings,
    setShowSettings,
    colorSettings,
    setColorSettings,

    // Per-entity color overrides
    entityColorOverrides,
    setEntityColor,
    clearEntityColor,
    clearAllEntityColors,

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

    // Snapshot helpers
    getSerializableState,
    restoreState,
  };
}
