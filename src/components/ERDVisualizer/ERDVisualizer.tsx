/**
 * ERD Visualizer - Main Component
 * Using React Flow for diagram visualization
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import type { Entity, EntityRelationship } from '@/types';

// Hooks
import { useERDState } from './hooks/useERDState';
import { useLayoutAlgorithms } from './hooks/useLayoutAlgorithms';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Components
import { EntitySearch, FeatureGuide, Sidebar, Toast, Toolbar } from './components';
import { ReactFlowERD, type ReactFlowERDRef } from './components/ReactFlowERD';

// Types and utilities
import { getThemeColors, type ColorSettings } from './types';
import { copyToClipboardAsPNG, exportToMermaid, exportToSVG, downloadSVG } from './utils/exportUtils';
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
    isDarkMode, setIsDarkMode,
    selectedEntities, toggleEntity, selectAll, deselectAll,
    searchQuery, setSearchQuery,
    publisherFilter, setPublisherFilter,
    solutionFilter, setSolutionFilter,
    publishers, solutions,
    setZoom, setPan,
    entityPositions, setEntityPositions, layoutMode, setLayoutMode,
    collapsedEntities, collapseAll, expandAll,
    selectedFields,
    showSettings, setShowSettings,
    colorSettings, setColorSettings,
    showMinimap, setShowMinimap,
    toast, showToast,
    filteredEntities, filteredRelationships,
    handleZoomIn, handleZoomOut, handleResetView,
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

  // Theme colors
  const themeColors = getThemeColors(isDarkMode);
  const { bgColor } = themeColors;

  // Search dialog state
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Feature guide state
  const [showGuide, setShowGuide] = useState(false);

  // Draw.io export state
  const [isExportingDrawio, setIsExportingDrawio] = useState(false);
  const [drawioExportProgress, setDrawioExportProgress] = useState<{ progress: number; message: string } | undefined>();

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

  // Keyboard navigation - pan step
  const PAN_STEP = 50;

  // Pan handlers for keyboard navigation
  const handlePanLeft = useCallback(() => {
    setPan(p => ({ ...p, x: p.x + PAN_STEP }));
  }, [setPan]);

  const handlePanRight = useCallback(() => {
    setPan(p => ({ ...p, x: p.x - PAN_STEP }));
  }, [setPan]);

  const handlePanUp = useCallback(() => {
    setPan(p => ({ ...p, y: p.y + PAN_STEP }));
  }, [setPan]);

  const handlePanDown = useCallback(() => {
    setPan(p => ({ ...p, y: p.y - PAN_STEP }));
  }, [setPan]);

  // Navigate to entity using React Flow's focusOnNode
  const navigateToEntity = useCallback((entityName: string) => {
    if (reactFlowRef.current) {
      reactFlowRef.current.focusOnNode(entityName);
    }
    setIsSearchOpen(false);
  }, []);

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    onPanLeft: handlePanLeft,
    onPanRight: handlePanRight,
    onPanUp: handlePanUp,
    onPanDown: handlePanDown,
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onFitToScreen: () => fitToScreen(),
    onResetView: handleResetView,
    onSelectAll: selectAll,
    onDeselectAll: deselectAll,
    onOpenSearch: () => setIsSearchOpen(true),
  });

  // Fit to screen
  const fitToScreen = useCallback(() => {
    if (Object.keys(entityPositions).length === 0) return;

    const positions = Object.values(entityPositions);
    const minX = Math.min(...positions.map(p => p.x)) - 50;
    const maxX = Math.max(...positions.map(p => p.x)) + 350;
    const minY = Math.min(...positions.map(p => p.y)) - 50;
    const maxY = Math.max(...positions.map(p => p.y)) + 350;

    const container = containerRef.current;
    if (!container) return;

    const width = maxX - minX;
    const height = maxY - minY;
    const scaleX = container.clientWidth / width;
    const scaleY = container.clientHeight / height;
    const newZoom = Math.min(scaleX, scaleY, 1.5) * 0.9;

    setZoom(newZoom);
    setPan({
      x: (container.clientWidth - width * newZoom) / 2 - minX * newZoom,
      y: (container.clientHeight - height * newZoom) / 2 - minY * newZoom
    });
  }, [entityPositions, setZoom, setPan]);

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
  }, [filteredEntities, filteredRelationships, entityPositions, selectedFields, collapsedEntities, isDarkMode, colorSettings, showToast]);

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
      navigator.clipboard.writeText(mermaid).then(() => {
        showToast('Mermaid code copied to clipboard!', 'success');
      }).catch((err) => {
        console.error('Failed to copy:', err);
        showToast('Failed to copy Mermaid code', 'error');
      });
    } catch (err) {
      console.error('Error generating Mermaid:', err);
      showToast('Failed to generate Mermaid code', 'error');
    }
  }, [filteredEntities, filteredRelationships, entityPositions, selectedFields, collapsedEntities, isDarkMode, colorSettings, showToast]);

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
  }, [filteredEntities, filteredRelationships, entityPositions, selectedFields, collapsedEntities, isDarkMode, colorSettings, showToast]);

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
  }, [filteredEntities, filteredRelationships, entityPositions, selectedFields, collapsedEntities, colorSettings, showToast, isExportingDrawio]);

  // Color settings change handler
  const handleColorSettingsChange = useCallback((key: keyof ColorSettings, value: string) => {
    setColorSettings(prev => ({ ...prev, [key]: value }));
  }, [setColorSettings]);

  // Handle position changes from React Flow (when nodes are dragged)
  const handlePositionsChange = useCallback((positions: Record<string, { x: number; y: number }>) => {
    setEntityPositions(positions);
  }, [setEntityPositions]);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      backgroundColor: bgColor,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: themeColors.textColor
    }}>
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
        isDarkMode={isDarkMode}
        showSettings={showSettings}
        colorSettings={colorSettings}
        themeColors={themeColors}
        onToggleEntity={toggleEntity}
        onSelectAll={selectAll}
        onDeselectAll={deselectAll}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
        onSearchChange={setSearchQuery}
        onPublisherFilterChange={setPublisherFilter}
        onSolutionFilterChange={setSolutionFilter}
        onLayoutModeChange={setLayoutMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onToggleSettings={() => setShowSettings(!showSettings)}
        onColorSettingsChange={handleColorSettingsChange}
      />

      {/* Main Canvas Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Toolbar */}
        <Toolbar
          filteredEntitiesCount={filteredEntities.length}
          filteredRelationshipsCount={filteredRelationships.length}
          showMinimap={showMinimap}
          isDarkMode={isDarkMode}
          themeColors={themeColors}
          isExportingDrawio={isExportingDrawio}
          drawioExportProgress={drawioExportProgress}
          onFitToScreen={fitToScreen}
          onResetView={handleResetView}
          onToggleMinimap={() => setShowMinimap(!showMinimap)}
          onCopyPNG={handleCopyPNG}
          onExportMermaid={handleExportMermaid}
          onExportSVG={handleExportSVG}
          onExportDrawio={handleExportDrawio}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenGuide={() => setShowGuide(true)}
        />

        {/* React Flow Canvas */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
            background: bgColor
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
            onPositionsChange={handlePositionsChange}
          />
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Entity Search Dialog */}
      <EntitySearch
        entities={filteredEntities}
        isOpen={isSearchOpen}
        isDarkMode={isDarkMode}
        themeColors={themeColors}
        onClose={() => setIsSearchOpen(false)}
        onNavigateToEntity={navigateToEntity}
      />

      {/* Feature Guide Modal */}
      <FeatureGuide
        isOpen={showGuide}
        isDarkMode={isDarkMode}
        themeColors={themeColors}
        onClose={handleCloseGuide}
        onDontShowAgain={handleDontShowAgain}
      />
    </div>
  );
}
