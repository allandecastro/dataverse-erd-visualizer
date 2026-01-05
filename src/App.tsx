/**
 * ERD Visualizer - Main Component
 * Using React Flow for diagram visualization
 */

import { useRef, useEffect, useCallback, useState, lazy, Suspense } from 'react';
import type { Entity, EntityRelationship } from '@/types';

// Hooks
import { useERDState } from './hooks/useERDState';
import { useLayoutAlgorithms } from './hooks/useLayoutAlgorithms';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Context
import { ThemeProvider, useTheme } from './context';

// Components - eager loaded (critical path)
import { EntitySearch, Sidebar, Toast, Toolbar, ErrorBoundary } from './components';
import { ReactFlowERD, type ReactFlowERDRef } from './components/ReactFlowERD';
import { AddRelatedTableDialog } from './components/AddRelatedTableDialog';

// Components - lazy loaded (not immediately needed)
const FeatureGuide = lazy(() =>
  import('./components/FeatureGuide').then((m) => ({ default: m.FeatureGuide }))
);
const FieldDrawer = lazy(() =>
  import('./components/FieldDrawer').then((m) => ({ default: m.FieldDrawer }))
);

// Types and utilities
import type { ColorSettings } from './types/erdTypes';
import {
  copyToClipboardAsPNG,
  exportToMermaid,
  exportToSVG,
  downloadSVG,
} from './utils/exportUtils';
import { exportToDrawio, downloadDrawio } from './utils/drawioExport';

interface ERDVisualizerProps {
  entities: Entity[];
  relationships: EntityRelationship[];
}

export default function ERDVisualizer({ entities, relationships }: ERDVisualizerProps) {
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
    collapsedEntities,
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
  });

  // Export handlers
  const handleCopyPNG = useCallback(async () => {
    try {
      await copyToClipboardAsPNG({
        entities: filteredEntities,
        relationships: filteredRelationships,
        entityPositions,
        selectedFields,
        collapsedEntities,
        isDarkMode,
        colorSettings,
      });
      showToast('Diagram copied to clipboard as PNG!', 'success');
    } catch (err) {
      console.error('Error copying PNG:', err);
      showToast('Failed to copy to clipboard', 'error');
    }
  }, [
    filteredEntities,
    filteredRelationships,
    entityPositions,
    selectedFields,
    collapsedEntities,
    isDarkMode,
    colorSettings,
    showToast,
  ]);

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
    showToast,
  ]);

  const handleExportSVG = useCallback(() => {
    try {
      const svgString = exportToSVG({
        entities: filteredEntities,
        relationships: filteredRelationships,
        entityPositions,
        selectedFields,
        collapsedEntities,
        isDarkMode,
        colorSettings,
      });
      downloadSVG(svgString);
      showToast('SVG diagram downloaded!', 'success');
    } catch (err) {
      console.error('Error exporting SVG:', err);
      showToast('Failed to export SVG', 'error');
    }
  }, [
    filteredEntities,
    filteredRelationships,
    entityPositions,
    selectedFields,
    collapsedEntities,
    isDarkMode,
    colorSettings,
    showToast,
  ]);

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
    showToast,
    isExportingDrawio,
  ]);

  // Color settings change handler
  const handleColorSettingsChange = useCallback(
    (key: keyof ColorSettings, value: string) => {
      setColorSettings((prev) => ({ ...prev, [key]: value }));
    },
    [setColorSettings]
  );

  // Handle position changes from React Flow (when nodes are dragged)
  const handlePositionsChange = useCallback(
    (positions: Record<string, { x: number; y: number }>) => {
      setEntityPositions(positions);
    },
    [setEntityPositions]
  );

  // Build ordered fields map for all entities
  const orderedFieldsMap = filteredEntities.reduce(
    (acc, entity) => {
      acc[entity.logicalName] = getOrderedFields(entity.logicalName);
      return acc;
    },
    {} as Record<string, string[]>
  );

  // Field drawer handlers
  const handleOpenFieldDrawer = useCallback(
    (entityName: string) => {
      setFieldDrawerEntity(entityName);
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
        onCopyPNG={handleCopyPNG}
        onExportMermaid={handleExportMermaid}
        onExportSVG={handleExportSVG}
        onExportDrawio={handleExportDrawio}
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
      />
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
  layoutMode: 'force' | 'grid' | 'auto';
  showSettings: boolean;
  colorSettings: ColorSettings;
  showMinimap: boolean;
  entityPositions: Record<string, { x: number; y: number }>;
  orderedFieldsMap: Record<string, string[]>;
  edgeOffsets: Record<string, { x: number; y: number }>;
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
  onSearchChange: (value: string) => void;
  onPublisherFilterChange: (value: string) => void;
  onSolutionFilterChange: (value: string) => void;
  onLayoutModeChange: (mode: 'force' | 'grid' | 'auto') => void;
  onToggleSettings: () => void;
  onColorSettingsChange: (key: keyof ColorSettings, value: string) => void;
  onPositionsChange: (positions: Record<string, { x: number; y: number }>) => void;
  onToggleMinimap: () => void;
  onOpenFieldDrawer: (entityName: string) => void;
  onRemoveField: (entityName: string, fieldName: string) => void;
  onEdgeOffsetChange: (edgeId: string, offset: { x: number; y: number }) => void;
  onCopyPNG: () => void;
  onExportMermaid: () => void;
  onExportSVG: () => void;
  onExportDrawio: () => void;
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
  onCopyPNG,
  onExportMermaid,
  onExportSVG,
  onExportDrawio,
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
}: ERDVisualizerContentProps) {
  // Use theme from context
  const { isDarkMode, themeColors } = useTheme();
  const { bgColor, textColor } = themeColors;

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
            orderedFieldsMap={orderedFieldsMap}
            onOpenFieldDrawer={onOpenFieldDrawer}
            onRemoveField={onRemoveField}
            edgeOffsets={edgeOffsets}
            onEdgeOffsetChange={onEdgeOffsetChange}
          />
        </main>
      </div>

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} />}

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
    </div>
  );
}
