/**
 * ERD Visualizer - Main Component
 * Using React Flow for diagram visualization
 */

import { useRef, useEffect, useCallback, useState, useMemo, lazy, Suspense } from 'react';
import type { Entity, EntityRelationship } from '@/types';

// Hooks
import { useERDState } from './hooks/useERDState';
import { useLayoutAlgorithms } from './hooks/useLayoutAlgorithms';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useSnapshots } from './hooks/useSnapshots';

// Context
import { ThemeProvider, useTheme } from './context';
import { ERDProvider } from './contexts/ERDContext';

// Components - eager loaded (critical path)
import {
  EntitySearch,
  Sidebar,
  Toast,
  Toolbar,
  ErrorBoundary,
  SnapshotManager,
} from './components';
import { ReactFlowERD, type ReactFlowERDRef } from './components/ReactFlowERD';
import { AddRelatedTableDialog } from './components/AddRelatedTableDialog';
import { ColorPickerPopover } from './components/ColorPickerPopover';

// Components - lazy loaded (not immediately needed)
const FeatureGuide = lazy(() =>
  import('./components/FeatureGuide').then((m) => ({ default: m.FeatureGuide }))
);
const FieldDrawer = lazy(() =>
  import('./components/FieldDrawer').then((m) => ({ default: m.FieldDrawer }))
);

// Types and utilities
import type { ColorSettings, LayoutMode } from './types/erdTypes';
import type { ERDSnapshot } from './types/snapshotTypes';
import { exportToMermaid } from './utils/exportUtils';
import { exportToDrawio, downloadDrawio } from './utils/drawioExport';
import { encodeStateToURL, decodeStateFromURL, expandCompactState } from './utils/urlStateCodec';
import { validateURLState, filterInvalidURLEntries } from './utils/urlStateValidation';

interface ERDVisualizerProps {
  entities: Entity[];
  relationships: EntityRelationship[];
  newRelationshipsDetected?: number;
}

export default function ERDVisualizer({
  entities,
  relationships,
  newRelationshipsDetected,
}: ERDVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reactFlowRef = useRef<ReactFlowERDRef>(null);

  // State management
  const state = useERDState({ entities, relationships });
  const {
    isDarkMode,
    setIsDarkMode,
    selectedEntities,
    setSelectedEntities,
    toggleEntity,
    selectAll,
    deselectAll,
    searchQuery,
    setSearchQuery,
    publisherFilter,
    setPublisherFilter,
    solutionFilter,
    setSolutionFilter,
    publishers,
    solutions,
    entityPositions,
    setEntityPositions,
    layoutMode,
    setLayoutMode,
    zoom,
    pan,
    collapsedEntities,
    toggleCollapse,
    collapseAll,
    expandAll,
    selectedFields,
    showSettings,
    setShowSettings,
    colorSettings,
    setColorSettings,
    showMinimap,
    setShowMinimap,
    toast,
    showToast,
    filteredEntities,
    filteredRelationships,
    // Field drawer
    fieldDrawerEntity,
    setFieldDrawerEntity,
    getOrderedFields,
    addField,
    removeField,
    pendingLookupField,
    setPendingLookupField,
    // Edge offsets for manual adjustment
    edgeOffsets,
    updateEdgeOffset,
    // Per-entity color overrides
    entityColorOverrides,
    setEntityColor,
    clearEntityColor,
    clearAllEntityColors,
  } = state;

  // Layout algorithms
  useLayoutAlgorithms({
    entities,
    relationships,
    selectedEntities,
    entityPositions,
    setEntityPositions,
    layoutMode,
  });

  // Search dialog state
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Feature guide state
  const [showGuide, setShowGuide] = useState(false);

  // Snapshot manager state
  const [showSnapshotManager, setShowSnapshotManager] = useState(false);

  // Snapshots hook
  const snapshotState = useSnapshots({
    getSerializableState: state.getSerializableState,
    restoreState: state.restoreState,
    showToast,
    entities,
  });

  // Color picker popover state
  const [colorPickerState, setColorPickerState] = useState<{
    entityName: string;
    anchorPosition: { x: number; y: number };
  } | null>(null);

  const handleOpenColorPicker = useCallback((entityName: string, anchorRect: DOMRect) => {
    setColorPickerState({
      entityName,
      anchorPosition: { x: anchorRect.right + 4, y: anchorRect.top },
    });
  }, []);

  const handleCloseColorPicker = useCallback(() => {
    setColorPickerState(null);
  }, []);

  // Draw.io export state
  const [isExportingDrawio, setIsExportingDrawio] = useState(false);
  const [drawioExportProgress, setDrawioExportProgress] = useState<
    { progress: number; message: string } | undefined
  >();

  // Check if user has seen the guide before
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('erd-visualizer-guide-seen');
    if (!hasSeenGuide) {
      // Show guide on first visit (slight delay for better UX)
      const timer = setTimeout(() => setShowGuide(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCloseGuide = useCallback(() => {
    setShowGuide(false);
  }, []);

  const handleDontShowAgain = useCallback(() => {
    localStorage.setItem('erd-visualizer-guide-seen', 'true');
    setShowGuide(false);
  }, []);

  // URL state restoration - HIGHEST PRIORITY (runs once on mount)
  useEffect(() => {
    const hash = window.location.hash.slice(1); // Remove # prefix

    if (!hash) return; // No URL state, let localStorage auto-save handle it

    // console.log('[App] Detected URL hash, attempting to restore state');

    try {
      // Decode URL state
      const decoded = decodeStateFromURL(hash);

      if (!decoded.success || !decoded.state) {
        console.error('[App] Failed to decode URL state:', decoded.error);
        showToast(`Invalid share URL: ${decoded.error}`, 'error');
        // Clear bad hash
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        return;
      }

      // Validate state against available entities
      const validation = validateURLState(decoded.state, entities);

      if (!validation.isValid && validation.missingEntities.length > 0) {
        console.warn('[App] URL contains missing entities:', validation.missingEntities);
        showToast(
          `Shared URL references ${validation.missingEntities.length} ${
            validation.missingEntities.length === 1 ? 'entity' : 'entities'
          } not in your environment. Skipping missing items.`,
          'warning'
        );

        // Filter out missing entities
        const filteredState = filterInvalidURLEntries(decoded.state, validation);
        const expandedState = expandCompactState(filteredState);
        const mergedState = { ...state.getSerializableState(), ...expandedState };
        state.restoreState(mergedState);
        showToast(
          `Shared state loaded (${validation.missingEntities.length} ${
            validation.missingEntities.length === 1 ? 'entity' : 'entities'
          } skipped)`,
          'success'
        );
      } else {
        // Valid state, restore directly
        const expandedState = expandCompactState(decoded.state);
        const mergedState = { ...state.getSerializableState(), ...expandedState };
        state.restoreState(mergedState);
        showToast('Shared state loaded successfully!', 'success');
      }

      // Keep hash in URL (allows refresh to restore same state)
      // If you want to clear hash, uncomment below:
      // window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch (error) {
      console.error('[App] Error restoring URL state:', error);
      showToast('Failed to restore shared state', 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - run ONCE on mount

  // Show notification when new relationships are detected
  useEffect(() => {
    console.log('[App] newRelationshipsDetected changed:', newRelationshipsDetected);
    if (newRelationshipsDetected && newRelationshipsDetected > 0) {
      const message =
        newRelationshipsDetected === 1
          ? 'New relationship detected! The diagram has been updated.'
          : `${newRelationshipsDetected} new relationships detected! The diagram has been updated.`;
      console.log('[App] Showing toast:', message);
      showToast(message, 'success');
    }
  }, [newRelationshipsDetected, showToast]);

  // Navigate to entity using React Flow's focusOnNode
  const navigateToEntity = useCallback((entityName: string) => {
    if (reactFlowRef.current) {
      reactFlowRef.current.focusOnNode(entityName);
    }
    setIsSearchOpen(false);
  }, []);

  // Handle layout mode change and center view
  const handleLayoutModeChange = useCallback(
    (mode: typeof layoutMode) => {
      setLayoutMode(mode);
      // Wait for layout algorithm to complete, then fit view
      setTimeout(() => {
        if (reactFlowRef.current) {
          reactFlowRef.current.fitView();
        }
      }, 100);
    },
    [setLayoutMode]
  );

  // Setup keyboard shortcuts (canvas navigation is handled by React Flow)
  useKeyboardShortcuts({
    onSelectAll: selectAll,
    onDeselectAll: deselectAll,
    onOpenSearch: () => setIsSearchOpen(true),
    onSaveSnapshot: () => snapshotState.saveSnapshot(''),
    onOpenSnapshots: () => setShowSnapshotManager(true),
    onShareURL: () => {
      const result = handleGenerateShareURL();
      if ('url' in result) {
        navigator.clipboard.writeText(result.url);
        // Toast is already shown in handleGenerateShareURL
      }
      // Error toast is already shown in handleGenerateShareURL
    },
  });

  // Build ordered fields map for all entities (memoized to prevent unnecessary re-renders)
  const orderedFieldsMap = useMemo(
    () =>
      filteredEntities.reduce(
        (acc, entity) => {
          acc[entity.logicalName] = getOrderedFields(entity.logicalName);
          return acc;
        },
        {} as Record<string, string[]>
      ),
    [filteredEntities, getOrderedFields]
  );

  // Export handlers
  const handleCopyPNG = useCallback(async () => {
    try {
      if (!reactFlowRef.current) {
        throw new Error('React Flow not initialized');
      }
      const blob = await reactFlowRef.current.exportToPng();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      showToast('Diagram copied to clipboard as PNG!', 'success');
    } catch (err) {
      console.error('Error copying PNG:', err);
      showToast('Failed to copy to clipboard', 'error');
    }
  }, [showToast]);

  const handleExportMermaid = useCallback(() => {
    try {
      const mermaid = exportToMermaid({
        entities: filteredEntities,
        relationships: filteredRelationships,
        entityPositions,
        selectedFields,
        collapsedEntities,
        isDarkMode,
        colorSettings,
        orderedFieldsMap,
      });
      navigator.clipboard
        .writeText(mermaid)
        .then(() => {
          showToast('Mermaid code copied to clipboard!', 'success');
        })
        .catch((err) => {
          console.error('Failed to copy:', err);
          showToast('Failed to copy Mermaid code', 'error');
        });
    } catch (err) {
      console.error('Error generating Mermaid:', err);
      showToast('Failed to generate Mermaid code', 'error');
    }
  }, [
    filteredEntities,
    filteredRelationships,
    entityPositions,
    selectedFields,
    collapsedEntities,
    isDarkMode,
    colorSettings,
    orderedFieldsMap,
    showToast,
  ]);

  const handleExportSVG = useCallback(async () => {
    try {
      if (!reactFlowRef.current) {
        throw new Error('React Flow not initialized');
      }
      const svgString = await reactFlowRef.current.exportToSvg();
      // Download the SVG
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'erd-diagram.svg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('SVG diagram downloaded!', 'success');
    } catch (err) {
      console.error('Error exporting SVG:', err);
      showToast('Failed to export SVG', 'error');
    }
  }, [showToast]);

  const handleExportDrawio = useCallback(async () => {
    if (isExportingDrawio) return;

    try {
      setIsExportingDrawio(true);
      setDrawioExportProgress({ progress: 0, message: 'Starting export...' });

      const blob = await exportToDrawio({
        entities: filteredEntities,
        relationships: filteredRelationships,
        entityPositions,
        selectedFields,
        collapsedEntities,
        colorSettings,
        entityColorOverrides,
        onProgress: (progress, message) => {
          setDrawioExportProgress({ progress, message });
        },
      });

      downloadDrawio(blob);
      showToast('Draw.io diagram downloaded! Open with draw.io or import into Visio.', 'success');
    } catch (err) {
      console.error('Error exporting Draw.io:', err);
      showToast('Failed to export Draw.io file', 'error');
    } finally {
      setIsExportingDrawio(false);
      setDrawioExportProgress(undefined);
    }
  }, [
    filteredEntities,
    filteredRelationships,
    entityPositions,
    selectedFields,
    collapsedEntities,
    colorSettings,
    entityColorOverrides,
    showToast,
    isExportingDrawio,
  ]);

  // Generate shareable URL
  const handleGenerateShareURL = useCallback(():
    | { url: string; warning?: string }
    | { error: string } => {
    try {
      const currentState = state.getSerializableState();

      // Build minimal state for URL
      const minimalState = {
        selectedEntities: currentState.selectedEntities,
        entityPositions: currentState.entityPositions,
        zoom: currentState.zoom,
        pan: currentState.pan,
        layoutMode: currentState.layoutMode,
        searchQuery: currentState.searchQuery,
        publisherFilter: currentState.publisherFilter,
        solutionFilter: currentState.solutionFilter,
        isDarkMode: currentState.isDarkMode,
        entityColorOverrides: currentState.entityColorOverrides,
      };

      // Encode state
      const encoded = encodeStateToURL(minimalState);

      // Build full URL
      const baseUrl = window.location.origin + window.location.pathname + window.location.search;
      const shareUrl = `${baseUrl}#${encoded}`;

      // Check URL length
      const urlLength = shareUrl.length;
      if (urlLength > 32000) {
        return {
          error: 'Diagram too large to share via URL (32KB limit). Use Export Snapshot instead.',
        };
      }
      if (urlLength > 2000) {
        showToast(`URL is ${urlLength} characters (may not work in older browsers)`, 'warning');
        return {
          url: shareUrl,
          warning: `URL is ${urlLength} characters (may not work in older browsers)`,
        };
      }

      showToast('Share URL copied to clipboard!', 'success');
      return { url: shareUrl };
    } catch (error) {
      console.error('[App] Failed to generate share URL:', error);
      const errorMessage = `Failed to generate URL: ${
        error instanceof Error ? error.message : String(error)
      }`;
      showToast(errorMessage, 'error');
      return { error: errorMessage };
    }
  }, [state, showToast]);

  // Color settings change handler
  const handleColorSettingsChange = useCallback(
    (key: keyof ColorSettings, value: string) => {
      setColorSettings((prev) => {
        // Handle type conversions for non-string fields
        let parsedValue: string | number | boolean = value;

        if (key === 'lineThickness') {
          parsedValue = parseFloat(value);
        } else if (key === 'useRelationshipTypeColors') {
          parsedValue = value === 'true';
        }

        return { ...prev, [key]: parsedValue };
      });
    },
    [setColorSettings]
  );

  // Handle position changes from React Flow (when nodes are dragged)
  const handlePositionsChange = useCallback(
    (positions: Record<string, { x: number; y: number }>) => {
      setEntityPositions(positions);
      // Switch to manual mode to preserve user-defined positions
      if (layoutMode !== 'manual') {
        setLayoutMode('manual');
      }
    },
    [setEntityPositions, layoutMode, setLayoutMode]
  );

  // Field drawer handlers
  const handleOpenFieldDrawer = useCallback(
    (entityName: string) => {
      // Toggle: close if clicking the same table, otherwise switch to the new one
      setFieldDrawerEntity((current) => (current === entityName ? null : entityName));
    },
    [setFieldDrawerEntity]
  );

  const handleCloseFieldDrawer = useCallback(() => {
    setFieldDrawerEntity(null);
  }, [setFieldDrawerEntity]);

  const handleAddField = useCallback(
    (fieldName: string) => {
      if (fieldDrawerEntity) {
        addField(fieldDrawerEntity, fieldName);
      }
    },
    [fieldDrawerEntity, addField]
  );

  const handleRemoveField = useCallback(
    (entityName: string, fieldName: string) => {
      removeField(entityName, fieldName);
    },
    [removeField]
  );

  // Handle lookup field - check if target entity is already selected
  const handleLookupFieldAdd = useCallback(
    (fieldName: string, targetEntity: string) => {
      if (!fieldDrawerEntity) return;

      // Check if target entity is already in the canvas
      if (selectedEntities.has(targetEntity)) {
        // Just add the field
        addField(fieldDrawerEntity, fieldName);
      } else {
        // Show dialog to ask user
        setPendingLookupField({
          entityName: fieldDrawerEntity,
          fieldName,
          targetEntity,
        });
      }
    },
    [fieldDrawerEntity, selectedEntities, addField, setPendingLookupField]
  );

  // Handle lookup dialog confirmation
  const handleConfirmAddRelatedTable = useCallback(() => {
    if (pendingLookupField) {
      // Add the field
      addField(pendingLookupField.entityName, pendingLookupField.fieldName);
      // Add the target entity to selection
      setSelectedEntities((prev) => new Set([...prev, pendingLookupField.targetEntity]));
      // Close dialog
      setPendingLookupField(null);
    }
  }, [pendingLookupField, addField, setSelectedEntities, setPendingLookupField]);

  const handleCancelAddRelatedTable = useCallback(() => {
    if (pendingLookupField) {
      // Just add the field without the related table
      addField(pendingLookupField.entityName, pendingLookupField.fieldName);
      setPendingLookupField(null);
    }
  }, [pendingLookupField, addField, setPendingLookupField]);

  // Get the entity for field drawer
  const fieldDrawerEntityData = fieldDrawerEntity
    ? entities.find((e) => e.logicalName === fieldDrawerEntity)
    : null;

  return (
    <ThemeProvider isDarkMode={isDarkMode} onDarkModeChange={setIsDarkMode}>
      <ERDProvider state={state}>
        <ERDVisualizerContent
          entities={entities}
          filteredEntities={filteredEntities}
          filteredRelationships={filteredRelationships}
          selectedEntities={selectedEntities}
          searchQuery={searchQuery}
          publisherFilter={publisherFilter}
          solutionFilter={solutionFilter}
          publishers={publishers}
          solutions={solutions}
          layoutMode={layoutMode}
          showSettings={showSettings}
          colorSettings={colorSettings}
          showMinimap={showMinimap}
          entityPositions={entityPositions}
          orderedFieldsMap={orderedFieldsMap}
          edgeOffsets={edgeOffsets}
          zoom={zoom}
          pan={pan}
          toast={toast}
          isSearchOpen={isSearchOpen}
          showGuide={showGuide}
          isExportingDrawio={isExportingDrawio}
          drawioExportProgress={drawioExportProgress}
          fieldDrawerEntity={fieldDrawerEntity}
          fieldDrawerEntityData={fieldDrawerEntityData}
          selectedFields={selectedFields}
          pendingLookupField={pendingLookupField}
          containerRef={containerRef}
          reactFlowRef={reactFlowRef}
          onToggleEntity={toggleEntity}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
          onExpandAll={expandAll}
          onCollapseAll={collapseAll}
          collapsedEntities={collapsedEntities}
          onToggleCollapse={toggleCollapse}
          onSearchChange={setSearchQuery}
          onPublisherFilterChange={setPublisherFilter}
          onSolutionFilterChange={setSolutionFilter}
          onLayoutModeChange={handleLayoutModeChange}
          onToggleSettings={() => setShowSettings(!showSettings)}
          onColorSettingsChange={handleColorSettingsChange}
          onPositionsChange={handlePositionsChange}
          onToggleMinimap={() => setShowMinimap(!showMinimap)}
          onOpenFieldDrawer={handleOpenFieldDrawer}
          onRemoveField={handleRemoveField}
          onEdgeOffsetChange={updateEdgeOffset}
          entityColorOverrides={entityColorOverrides}
          onOpenColorPicker={handleOpenColorPicker}
          onColorPickerChange={setEntityColor}
          onColorPickerReset={clearEntityColor}
          onCloseColorPicker={handleCloseColorPicker}
          colorPickerState={colorPickerState}
          onResetAllEntityColors={clearAllEntityColors}
          onCopyPNG={handleCopyPNG}
          onExportMermaid={handleExportMermaid}
          onExportSVG={handleExportSVG}
          onExportDrawio={handleExportDrawio}
          onGenerateShareURL={handleGenerateShareURL}
          onOpenSearch={() => setIsSearchOpen(true)}
          onCloseSearch={() => setIsSearchOpen(false)}
          onOpenGuide={() => setShowGuide(true)}
          onCloseGuide={handleCloseGuide}
          onDontShowAgain={handleDontShowAgain}
          onNavigateToEntity={navigateToEntity}
          onAddField={handleAddField}
          onCloseFieldDrawer={handleCloseFieldDrawer}
          onLookupFieldAdd={handleLookupFieldAdd}
          onConfirmAddRelatedTable={handleConfirmAddRelatedTable}
          onCancelAddRelatedTable={handleCancelAddRelatedTable}
          // Snapshots
          showSnapshotManager={showSnapshotManager}
          snapshots={snapshotState.snapshots}
          lastAutoSave={snapshotState.lastAutoSave}
          autoSaveEnabled={snapshotState.autoSaveEnabled}
          onOpenSnapshots={() => setShowSnapshotManager(true)}
          onCloseSnapshots={() => setShowSnapshotManager(false)}
          onSaveSnapshot={snapshotState.saveSnapshot}
          onLoadSnapshot={snapshotState.loadSnapshot}
          onRenameSnapshot={snapshotState.renameSnapshot}
          onDeleteSnapshot={snapshotState.deleteSnapshot}
          onExportSnapshot={snapshotState.exportSnapshotToJSON}
          onShareSnapshot={snapshotState.shareSnapshot}
          onExportAllSnapshots={snapshotState.exportAllSnapshotsToJSON}
          onImportSnapshot={snapshotState.importSnapshotFromJSON}
          onToggleAutoSave={snapshotState.toggleAutoSave}
        />
      </ERDProvider>
    </ThemeProvider>
  );
}

/**
 * Inner component that uses ThemeContext
 */
interface ERDVisualizerContentProps {
  entities: Entity[];
  filteredEntities: Entity[];
  filteredRelationships: EntityRelationship[];
  selectedEntities: Set<string>;
  searchQuery: string;
  publisherFilter: string;
  solutionFilter: string;
  publishers: string[];
  solutions: string[];
  layoutMode: LayoutMode;
  showSettings: boolean;
  colorSettings: ColorSettings;
  showMinimap: boolean;
  entityPositions: Record<string, { x: number; y: number }>;
  orderedFieldsMap: Record<string, string[]>;
  edgeOffsets: Record<string, { x: number; y: number }>;
  zoom: number;
  pan: { x: number; y: number };
  toast: { message: string; type: 'success' | 'error' | 'info' | 'warning' } | null;
  isSearchOpen: boolean;
  showGuide: boolean;
  isExportingDrawio: boolean;
  drawioExportProgress?: { progress: number; message: string };
  fieldDrawerEntity: string | null;
  fieldDrawerEntityData: Entity | null | undefined;
  selectedFields: Record<string, Set<string>>;
  pendingLookupField: { entityName: string; fieldName: string; targetEntity: string } | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
  reactFlowRef: React.RefObject<ReactFlowERDRef | null>;
  onToggleEntity: (name: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  collapsedEntities: Set<string>;
  onToggleCollapse: (entityName: string) => void;
  onSearchChange: (value: string) => void;
  onPublisherFilterChange: (value: string) => void;
  onSolutionFilterChange: (value: string) => void;
  onLayoutModeChange: (mode: LayoutMode) => void;
  onToggleSettings: () => void;
  onColorSettingsChange: (key: keyof ColorSettings, value: string) => void;
  onPositionsChange: (positions: Record<string, { x: number; y: number }>) => void;
  onToggleMinimap: () => void;
  onOpenFieldDrawer: (entityName: string) => void;
  onRemoveField: (entityName: string, fieldName: string) => void;
  onEdgeOffsetChange: (edgeId: string, offset: { x: number; y: number }) => void;
  // Per-entity color overrides
  entityColorOverrides: Record<string, string>;
  onOpenColorPicker: (entityName: string, anchorRect: DOMRect) => void;
  onColorPickerChange: (entityName: string, color: string) => void;
  onColorPickerReset: (entityName: string) => void;
  onCloseColorPicker: () => void;
  colorPickerState: { entityName: string; anchorPosition: { x: number; y: number } } | null;
  onResetAllEntityColors: () => void;
  onCopyPNG: () => void;
  onExportMermaid: () => void;
  onExportSVG: () => void;
  onExportDrawio: () => void;
  onGenerateShareURL: () => { url: string; warning?: string } | { error: string };
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  onOpenGuide: () => void;
  onCloseGuide: () => void;
  onDontShowAgain: () => void;
  onNavigateToEntity: (entityName: string) => void;
  onAddField: (fieldName: string) => void;
  onCloseFieldDrawer: () => void;
  onLookupFieldAdd: (fieldName: string, targetEntity: string) => void;
  onConfirmAddRelatedTable: () => void;
  onCancelAddRelatedTable: () => void;
  // Snapshots
  showSnapshotManager: boolean;
  snapshots: ERDSnapshot[];
  lastAutoSave: ERDSnapshot | null;
  autoSaveEnabled: boolean;
  onOpenSnapshots: () => void;
  onCloseSnapshots: () => void;
  onSaveSnapshot: (name: string) => void;
  onLoadSnapshot: (id: string) => void;
  onRenameSnapshot: (id: string, newName: string) => void;
  onDeleteSnapshot: (id: string) => void;
  onExportSnapshot: (id: string) => void;
  onShareSnapshot: (id: string) => void;
  onExportAllSnapshots: () => void;
  onImportSnapshot: (file: File) => void;
  onToggleAutoSave: (enabled: boolean) => void;
}

function ERDVisualizerContent({
  entities,
  filteredEntities,
  filteredRelationships,
  selectedEntities,
  searchQuery,
  publisherFilter,
  solutionFilter,
  publishers,
  solutions,
  layoutMode,
  showSettings,
  colorSettings,
  showMinimap,
  entityPositions,
  orderedFieldsMap,
  edgeOffsets,
  zoom,
  pan,
  toast,
  isSearchOpen,
  showGuide,
  isExportingDrawio,
  drawioExportProgress,
  fieldDrawerEntity,
  fieldDrawerEntityData,
  selectedFields,
  pendingLookupField,
  containerRef,
  reactFlowRef,
  onToggleEntity,
  onSelectAll,
  onDeselectAll,
  onExpandAll,
  onCollapseAll,
  collapsedEntities,
  onToggleCollapse,
  onSearchChange,
  onPublisherFilterChange,
  onSolutionFilterChange,
  onLayoutModeChange,
  onToggleSettings,
  onColorSettingsChange,
  onPositionsChange,
  onToggleMinimap,
  onOpenFieldDrawer,
  onRemoveField,
  onEdgeOffsetChange,
  entityColorOverrides,
  onOpenColorPicker,
  onColorPickerChange,
  onColorPickerReset,
  onCloseColorPicker,
  colorPickerState,
  onResetAllEntityColors,
  onCopyPNG,
  onExportMermaid,
  onExportSVG,
  onExportDrawio,
  onGenerateShareURL,
  onOpenSearch,
  onCloseSearch,
  onOpenGuide,
  onCloseGuide,
  onDontShowAgain,
  onNavigateToEntity,
  onAddField,
  onCloseFieldDrawer,
  onLookupFieldAdd,
  onConfirmAddRelatedTable,
  onCancelAddRelatedTable,
  // Snapshots
  showSnapshotManager,
  snapshots,
  lastAutoSave,
  autoSaveEnabled,
  onOpenSnapshots,
  onCloseSnapshots,
  onSaveSnapshot,
  onLoadSnapshot,
  onRenameSnapshot,
  onDeleteSnapshot,
  onExportSnapshot,
  onShareSnapshot,
  onExportAllSnapshots,
  onImportSnapshot,
  onToggleAutoSave,
}: ERDVisualizerContentProps) {
  // Use theme from context
  const { isDarkMode, themeColors } = useTheme();
  const { bgColor, textColor } = themeColors;

  const getEntityDefaultColor = useCallback(
    (entityName: string) => {
      const entity = entities.find((e) => e.logicalName === entityName);
      const isCustom =
        entity?.publisher &&
        !['Microsoft', 'Microsoft Dynamics 365', 'Microsoft Dynamics CRM'].includes(
          entity.publisher
        );
      return isCustom ? colorSettings.customTableColor : colorSettings.standardTableColor;
    },
    [entities, colorSettings.customTableColor, colorSettings.standardTableColor]
  );

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: bgColor,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: textColor,
      }}
    >
      {/* Skip Links for Accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <a href="#entity-list" className="skip-link" style={{ left: 180 }}>
        Skip to entity list
      </a>

      {/* Sidebar */}
      <Sidebar
        entities={entities}
        selectedEntities={selectedEntities}
        searchQuery={searchQuery}
        publisherFilter={publisherFilter}
        solutionFilter={solutionFilter}
        publishers={publishers}
        solutions={solutions}
        layoutMode={layoutMode}
        showSettings={showSettings}
        colorSettings={colorSettings}
        onToggleEntity={onToggleEntity}
        onSelectAll={onSelectAll}
        onDeselectAll={onDeselectAll}
        onExpandAll={onExpandAll}
        onCollapseAll={onCollapseAll}
        onSearchChange={onSearchChange}
        onPublisherFilterChange={onPublisherFilterChange}
        onSolutionFilterChange={onSolutionFilterChange}
        onLayoutModeChange={onLayoutModeChange}
        onToggleSettings={onToggleSettings}
        onColorSettingsChange={onColorSettingsChange}
        entityColorOverrideCount={Object.keys(entityColorOverrides).length}
        onResetAllEntityColors={onResetAllEntityColors}
      />

      {/* Main Canvas Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Toolbar */}
        <Toolbar
          filteredEntitiesCount={filteredEntities.length}
          filteredRelationshipsCount={filteredRelationships.length}
          isExportingDrawio={isExportingDrawio}
          drawioExportProgress={drawioExportProgress}
          onCopyPNG={onCopyPNG}
          onExportMermaid={onExportMermaid}
          onExportSVG={onExportSVG}
          onExportDrawio={onExportDrawio}
          onOpenSearch={onOpenSearch}
          onOpenGuide={onOpenGuide}
          onOpenSnapshots={onOpenSnapshots}
          onGenerateShareURL={onGenerateShareURL}
        />

        {/* React Flow Canvas */}
        <main
          id="main-content"
          ref={containerRef}
          role="main"
          aria-label="Entity Relationship Diagram Canvas"
          style={{
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
            background: bgColor,
          }}
        >
          <ReactFlowERD
            ref={reactFlowRef}
            entities={filteredEntities}
            relationships={filteredRelationships}
            isDarkMode={isDarkMode}
            colorSettings={colorSettings}
            showMinimap={showMinimap}
            layoutMode={layoutMode}
            entityPositions={entityPositions}
            onPositionsChange={onPositionsChange}
            onToggleMinimap={onToggleMinimap}
            zoom={zoom}
            pan={pan}
            orderedFieldsMap={orderedFieldsMap}
            onOpenFieldDrawer={onOpenFieldDrawer}
            onRemoveField={onRemoveField}
            edgeOffsets={edgeOffsets}
            onEdgeOffsetChange={onEdgeOffsetChange}
            collapsedEntities={collapsedEntities}
            onToggleCollapse={onToggleCollapse}
            entityColorOverrides={entityColorOverrides}
            onOpenColorPicker={onOpenColorPicker}
          />
        </main>
      </div>

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Color Picker Popover */}
      {colorPickerState && (
        <ColorPickerPopover
          entityName={colorPickerState.entityName}
          currentColor={
            entityColorOverrides[colorPickerState.entityName] ||
            getEntityDefaultColor(colorPickerState.entityName)
          }
          hasOverride={!!entityColorOverrides[colorPickerState.entityName]}
          isDarkMode={isDarkMode}
          anchorPosition={colorPickerState.anchorPosition}
          usedColors={[...new Set(Object.values(entityColorOverrides))]}
          onColorChange={onColorPickerChange}
          onColorReset={onColorPickerReset}
          onClose={onCloseColorPicker}
        />
      )}

      {/* Entity Search Dialog */}
      <EntitySearch
        entities={filteredEntities}
        isOpen={isSearchOpen}
        onClose={onCloseSearch}
        onNavigateToEntity={onNavigateToEntity}
      />

      {/* Feature Guide Modal - lazy loaded */}
      {showGuide && (
        <ErrorBoundary sectionName="Feature Guide" isDarkMode={isDarkMode}>
          <Suspense fallback={null}>
            <FeatureGuide
              isOpen={showGuide}
              onClose={onCloseGuide}
              onDontShowAgain={onDontShowAgain}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* Field Drawer - lazy loaded */}
      {fieldDrawerEntityData && (
        <ErrorBoundary sectionName="Field Drawer" isDarkMode={isDarkMode}>
          <Suspense fallback={null}>
            <FieldDrawer
              entity={fieldDrawerEntityData}
              selectedFields={selectedFields[fieldDrawerEntity!] || new Set()}
              onAddField={onAddField}
              onRemoveField={(fieldName) => onRemoveField(fieldDrawerEntity!, fieldName)}
              onClose={onCloseFieldDrawer}
              onLookupFieldAdd={onLookupFieldAdd}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* Add Related Table Dialog */}
      {pendingLookupField && (
        <AddRelatedTableDialog
          fieldName={pendingLookupField.fieldName}
          targetEntity={pendingLookupField.targetEntity}
          isDarkMode={isDarkMode}
          onConfirm={onConfirmAddRelatedTable}
          onCancel={onCancelAddRelatedTable}
        />
      )}

      {/* Snapshot Manager Modal */}
      {showSnapshotManager && (
        <ErrorBoundary sectionName="Snapshot Manager" isDarkMode={isDarkMode}>
          <SnapshotManager
            snapshots={snapshots}
            lastAutoSave={lastAutoSave}
            autoSaveEnabled={autoSaveEnabled}
            onClose={onCloseSnapshots}
            onSaveSnapshot={onSaveSnapshot}
            onLoadSnapshot={onLoadSnapshot}
            onRenameSnapshot={onRenameSnapshot}
            onDeleteSnapshot={onDeleteSnapshot}
            onExportSnapshot={onExportSnapshot}
            onShareSnapshot={onShareSnapshot}
            onExportAllSnapshots={onExportAllSnapshots}
            onImportSnapshot={onImportSnapshot}
            onToggleAutoSave={onToggleAutoSave}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}
