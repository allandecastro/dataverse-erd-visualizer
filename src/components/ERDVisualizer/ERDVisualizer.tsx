/**
 * ERD Visualizer - Main Component
 * Refactored into smaller, reusable components
 */

import { useRef, useEffect, useCallback } from 'react';
import type { Entity, EntityRelationship } from '@/types';

// Hooks
import { useERDState } from './hooks/useERDState';
import { useLayoutAlgorithms } from './hooks/useLayoutAlgorithms';

// Components
import { EntityCard, Minimap, RelationshipLines, Sidebar, Toast, Toolbar } from './components';

// Types and utilities
import { getThemeColors, type ColorSettings } from './types';
import { copyToClipboardAsPNG, exportToMermaid, exportToSVG, downloadSVG } from './utils/exportUtils';

interface ERDVisualizerProps {
  entities: Entity[];
  relationships: EntityRelationship[];
}

export default function ERDVisualizer({ entities, relationships }: ERDVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fieldSelectorRef = useRef<HTMLDivElement>(null);

  // State management
  const state = useERDState({ entities, relationships });
  const {
    isDarkMode, setIsDarkMode,
    selectedEntities, toggleEntity, selectAll, deselectAll,
    searchQuery, setSearchQuery,
    publisherFilter, setPublisherFilter,
    solutionFilter, setSolutionFilter,
    publishers, solutions,
    zoom, setZoom, pan, setPan,
    isDragging, setIsDragging, dragStart, setDragStart,
    entityPositions, setEntityPositions, layoutMode, setLayoutMode,
    collapsedEntities, toggleCollapse, collapseAll, expandAll,
    hoveredEntity, setHoveredEntity,
    draggingEntity, setDraggingEntity, dragEntityOffset, setDragEntityOffset,
    selectedFields, showFieldSelector, setShowFieldSelector,
    fieldSearchQueries, setFieldSearchQueries,
    toggleFieldSelection, selectAllFields, clearAllFields,
    showSettings, setShowSettings,
    colorSettings, setColorSettings,
    showMinimap, setShowMinimap,
    isSmartZoom, setIsSmartZoom,
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

  // Close field selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFieldSelector && fieldSelectorRef.current && !fieldSelectorRef.current.contains(event.target as Node)) {
        const settingsButton = (event.target as HTMLElement).closest('button');
        if (!settingsButton || settingsButton.querySelector('svg')?.outerHTML?.includes('Settings') === false) {
          setShowFieldSelector(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFieldSelector, setShowFieldSelector]);

  // Wheel zoom handler
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();

    if (isSmartZoom) {
      const container = containerRef.current;
      if (!container) return;

      const mouseX = (e.clientX - pan.x) / zoom;
      const mouseY = (e.clientY - pan.y) / zoom;

      const nearbyEntities = filteredEntities.filter(entity => {
        const pos = entityPositions[entity.logicalName] || { x: 0, y: 0 };
        const distance = Math.sqrt(Math.pow(pos.x - mouseX, 2) + Math.pow(pos.y - mouseY, 2));
        return distance < 500;
      });

      const densityFactor = Math.max(0.5, Math.min(2, nearbyEntities.length / 3));
      const delta = e.deltaY > 0 ? -0.05 * densityFactor : 0.05 * densityFactor;

      const newZoom = Math.max(0.3, Math.min(2, zoom + delta));

      const mouseXAfter = (e.clientX - pan.x) / newZoom;
      const mouseYAfter = (e.clientY - pan.y) / newZoom;

      setPan({
        x: pan.x - (mouseXAfter - mouseX) * newZoom,
        y: pan.y - (mouseYAfter - mouseY) * newZoom
      });
      setZoom(newZoom);
    } else {
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      setZoom(z => Math.max(0.3, Math.min(2, z + delta)));
    }
  }, [isSmartZoom, pan, zoom, filteredEntities, entityPositions, setPan, setZoom]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).closest('.erd-canvas')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan, setIsDragging, setDragStart]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && !draggingEntity) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else if (draggingEntity) {
      const newX = (e.clientX - pan.x - dragEntityOffset.x) / zoom;
      const newY = (e.clientY - pan.y - dragEntityOffset.y) / zoom;

      setEntityPositions(prev => ({
        ...prev,
        [draggingEntity]: { x: newX, y: newY }
      }));
    }
  }, [isDragging, draggingEntity, dragStart, dragEntityOffset, pan, zoom, setPan, setEntityPositions]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDraggingEntity(null);
  }, [setIsDragging, setDraggingEntity]);

  const handleEntityMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, entityName: string) => {
    e.stopPropagation();
    const pos = entityPositions[entityName] || { x: 0, y: 0 };

    setDraggingEntity(entityName);
    setDragEntityOffset({
      x: (e.clientX - pan.x) / zoom - pos.x,
      y: (e.clientY - pan.y) / zoom - pos.y
    });
  }, [entityPositions, pan, zoom, setDraggingEntity, setDragEntityOffset]);

  // Setup wheel listener
  useEffect(() => {
    const canvas = containerRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // Setup mouse move/up listeners
  useEffect(() => {
    if (isDragging || draggingEntity) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, draggingEntity, handleMouseMove, handleMouseUp]);

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

  // Minimap navigation
  const handleMinimapNavigate = useCallback((canvasX: number, canvasY: number) => {
    const container = containerRef.current;
    if (container) {
      setPan({
        x: container.clientWidth / 2 - canvasX * zoom,
        y: container.clientHeight / 2 - canvasY * zoom
      });
    }
  }, [zoom, setPan]);

  // Color settings change handler
  const handleColorSettingsChange = useCallback((key: keyof ColorSettings, value: string) => {
    setColorSettings(prev => ({ ...prev, [key]: value }));
  }, [setColorSettings]);

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
          zoom={zoom}
          isSmartZoom={isSmartZoom}
          showMinimap={showMinimap}
          isDarkMode={isDarkMode}
          themeColors={themeColors}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitToScreen={fitToScreen}
          onResetView={handleResetView}
          onToggleSmartZoom={() => setIsSmartZoom(!isSmartZoom)}
          onToggleMinimap={() => setShowMinimap(!showMinimap)}
          onCopyPNG={handleCopyPNG}
          onExportMermaid={handleExportMermaid}
          onExportSVG={handleExportSVG}
        />

        {/* Canvas */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          style={{
            flex: 1,
            overflow: 'hidden',
            cursor: isDragging ? 'grabbing' : 'grab',
            position: 'relative',
            background: bgColor
          }}
        >
          <div
            ref={canvasRef}
            className="erd-canvas"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              position: 'relative',
              width: '100%',
              height: '100%'
            }}
          >
            {/* Relationship Lines */}
            <RelationshipLines
              relationships={filteredRelationships}
              entities={entities}
              entityPositions={entityPositions}
              selectedFields={selectedFields}
              collapsedEntities={collapsedEntities}
              isDarkMode={isDarkMode}
              lookupColor={colorSettings.lookupColor}
            />

            {/* Entity Cards */}
            {filteredEntities.map((entity) => {
              const pos = entityPositions[entity.logicalName] || { x: 0, y: 0 };
              const tableColor = entity.isCustomEntity ? colorSettings.customTableColor : colorSettings.standardTableColor;
              const entitySelectedFields = selectedFields[entity.logicalName] || new Set();
              const fieldSearch = fieldSearchQueries[entity.logicalName] || '';

              return (
                <EntityCard
                  key={entity.logicalName}
                  entity={entity}
                  position={pos}
                  isHovered={hoveredEntity === entity.logicalName}
                  isDraggingThis={draggingEntity === entity.logicalName}
                  isCollapsed={collapsedEntities.has(entity.logicalName)}
                  tableColor={tableColor}
                  selectedFields={entitySelectedFields}
                  showFieldSelector={showFieldSelector === entity.logicalName}
                  fieldSearchQuery={fieldSearch}
                  isDarkMode={isDarkMode}
                  colorSettings={colorSettings}
                  themeColors={themeColors}
                  onMouseEnter={() => setHoveredEntity(entity.logicalName)}
                  onMouseLeave={() => setHoveredEntity(null)}
                  onMouseDown={(e) => handleEntityMouseDown(e, entity.logicalName)}
                  onToggleCollapse={() => toggleCollapse(entity.logicalName)}
                  onToggleFieldSelector={() => setShowFieldSelector(showFieldSelector === entity.logicalName ? null : entity.logicalName)}
                  onToggleField={(fieldName) => toggleFieldSelection(entity.logicalName, fieldName)}
                  onSelectAllFields={() => selectAllFields(entity.logicalName)}
                  onClearAllFields={() => clearAllFields(entity.logicalName)}
                  onFieldSearchChange={(value) => setFieldSearchQueries(prev => ({ ...prev, [entity.logicalName]: value }))}
                  onCloseFieldSelector={() => setShowFieldSelector(null)}
                />
              );
            })}
          </div>

          {/* Minimap */}
          {showMinimap && (
            <Minimap
              entities={filteredEntities}
              entityPositions={entityPositions}
              pan={pan}
              zoom={zoom}
              containerRef={containerRef}
              isDarkMode={isDarkMode}
              colorSettings={colorSettings}
              themeColors={themeColors}
              onNavigate={handleMinimapNavigate}
            />
          )}
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
    </div>
  );
}
