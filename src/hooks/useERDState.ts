/**
 * Custom hook for managing ERD Visualizer state.
 * Composes focused sub-hooks for color management, viewport, and entity selection.
 */

import { useState, useCallback, useMemo } from 'react';
import type { Entity, EntityRelationship, EntityPosition } from '@/types';
import type {
  ToastType,
  ToastState,
  LayoutMode,
  ColorSettings,
  EntityFieldMap,
  EntityFieldOrder,
  EntityPositionMap,
  EdgeOffsetMap,
} from '@/types/erdTypes';
import { getEntityPublisher } from '@/utils/entityUtils';
import { useColorManagement } from './useColorManagement';
import { useViewport } from './useViewport';
import { useEntitySelection } from './useEntitySelection';

export interface UseERDStateProps {
  entities: Entity[];
  relationships: EntityRelationship[];
}

export function useERDState({ entities, relationships }: UseERDStateProps) {
  // === Composed sub-hooks ===
  const {
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
  } = useColorManagement();

  const { zoom, setZoom, pan, setPan, handleZoomIn, handleZoomOut, handleResetView } =
    useViewport();

  const { selectedEntities, setSelectedEntities, toggleEntity, selectAll, deselectAll } =
    useEntitySelection(entities);

  // === Local state ===

  // Theme
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [publisherFilter, setPublisherFilter] = useState('all');
  const [solutionFilter, setSolutionFilter] = useState('all');

  // Entity positions and layout
  const [entityPositions, setEntityPositions] = useState<EntityPositionMap>({});
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('force');

  // Collapse state
  const [collapsedEntities, setCollapsedEntities] = useState<Set<string>>(new Set());

  // Field selection
  const [selectedFields, setSelectedFields] = useState<EntityFieldMap>({});
  const [showFieldSelector, setShowFieldSelector] = useState<string | null>(null);
  const [fieldSearchQueries, setFieldSearchQueries] = useState<Record<string, string>>({});

  // Field drawer state
  const [fieldDrawerEntity, setFieldDrawerEntity] = useState<string | null>(null);
  const [fieldOrder, setFieldOrder] = useState<EntityFieldOrder>({});

  // Add related table dialog
  const [pendingLookupField, setPendingLookupField] = useState<{
    entityName: string;
    fieldName: string;
    targetEntity: string;
  } | null>(null);

  // Edge offsets for manual adjustment of relationship lines (x and y offsets)
  const [edgeOffsets, setEdgeOffsets] = useState<EdgeOffsetMap>({});

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [colorSettings, setColorSettings] = useState<ColorSettings>({
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
  });

  // Features
  const [showMinimap, setShowMinimap] = useState(false);
  const [isSmartZoom, setIsSmartZoom] = useState(false);

  // Toast
  const [toast, setToast] = useState<ToastState | null>(null);

  // === Callbacks ===

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Filtered entities and relationships for the canvas
  const filteredEntities = useMemo(
    () => entities.filter((entity) => selectedEntities.has(entity.logicalName)),
    [entities, selectedEntities]
  );

  const filteredRelationships = useMemo(
    () =>
      relationships.filter((rel) => selectedEntities.has(rel.from) && selectedEntities.has(rel.to)),
    [relationships, selectedEntities]
  );

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
    setFieldOrder((prev) => {
      const currentOrder = prev[entityName] || [];
      if (currentOrder.includes(fieldName)) return prev;
      return {
        ...prev,
        [entityName]: [...currentOrder, fieldName],
      };
    });
    setSelectedFields((prev) => {
      const fields = prev[entityName] || new Set();
      return { ...prev, [entityName]: new Set([...fields, fieldName]) };
    });
  }, []);

  // Remove field from selection and order
  const removeField = useCallback((entityName: string, fieldName: string) => {
    setFieldOrder((prev) => ({
      ...prev,
      [entityName]: (prev[entityName] || []).filter((f) => f !== fieldName),
    }));
    setSelectedFields((prev) => {
      const fields = new Set(prev[entityName] || []);
      fields.delete(fieldName);
      return { ...prev, [entityName]: fields };
    });
  }, []);

  // Get ordered fields for an entity (PK first, then FIFO order)
  const getOrderedFields = useCallback(
    (entityName: string) => {
      const entity = entities.find((e) => e.logicalName === entityName);
      if (!entity) return [];

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

      for (const fieldName of order) {
        if (fieldName !== pkName && selected.has(fieldName)) {
          orderedFields.push(fieldName);
        }
      }

      return orderedFields;
    },
    [entities, selectedFields, fieldOrder, collapsedEntities]
  );

  // Update edge offset for manual path adjustment
  const updateEdgeOffset = useCallback((edgeId: string, offset: { x: number; y: number }) => {
    setEdgeOffsets((prev) => ({
      ...prev,
      [edgeId]: offset,
    }));
  }, []);

  // Derive publishers and solutions for filters
  const publishers = useMemo(
    () => ['all', ...new Set(entities.map((e) => getEntityPublisher(e)))].sort(),
    [entities]
  );

  const solutions = useMemo(() => {
    const allSolutions = entities.flatMap((e) => e.solutions || []);
    return ['all', ...new Set(allSolutions)].sort();
  }, [entities]);

  // === Serialization ===

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
      groupNames,
      groupFilter,
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
    groupNames,
    groupFilter,
  ]);

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
      groupNames?: Record<string, string>;
      groupFilter?: string;
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
      const restoredColors = state.entityColorOverrides || {};
      setEntityColorOverrides(restoredColors);
      setGroupNamesState(state.groupNames || {});

      // Validate groupFilter: ensure the color still exists in entityColorOverrides
      const restoredFilter = state.groupFilter || 'all';
      if (
        restoredFilter === 'all' ||
        restoredFilter === '__ungrouped__' ||
        Object.values(restoredColors).some((c) => c.toLowerCase() === restoredFilter.toLowerCase())
      ) {
        setGroupFilter(restoredFilter);
      } else {
        setGroupFilter('all'); // Color no longer exists — fall back
      }
    },
    // Setters from sub-hooks are stable (React guarantees useState setters don't change),
    // but the React Compiler requires them listed since they originate outside this hook.
    [
      setSelectedEntities,
      setZoom,
      setPan,
      setEntityColorOverrides,
      setGroupNamesState,
      setGroupFilter,
    ]
  );

  return {
    // Theme
    isDarkMode,
    setIsDarkMode,

    // Entity selection (from useEntitySelection)
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

    // Zoom and pan (from useViewport)
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

    // Per-entity color overrides (from useColorManagement)
    entityColorOverrides,
    setEntityColor,
    clearEntityColor,
    clearAllEntityColors,

    // Entity grouping (from useColorManagement)
    groupNames,
    setGroupName,
    clearGroupName,
    derivedGroups,
    groupFilter,
    setGroupFilter,

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
