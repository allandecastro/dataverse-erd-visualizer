/**
 * Shared types for ERD Visualizer components
 */

import type { Entity, EntityRelationship, EntityPosition, AttributeType } from '@/types';

// Toast notification types
export type ToastType = 'success' | 'error' | 'info' | 'warning';

// Layout mode types
export type LayoutMode = 'force' | 'grid' | 'auto';

// Toast state
export interface ToastState {
  message: string;
  type: ToastType;
}

// Theme colors derived from dark/light mode
export interface ThemeColors {
  bgColor: string;
  panelBg: string;
  borderColor: string;
  cardBg: string;
  textColor: string;
  textSecondary: string;
}

// Color settings for entities
export interface ColorSettings {
  customTableColor: string;
  standardTableColor: string;
  lookupColor: string;
}

// ERD State shared across components
export interface ERDState {
  // Theme
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;

  // Entity selection
  selectedEntities: Set<string>;
  setSelectedEntities: (value: Set<string>) => void;

  // Filters
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  publisherFilter: string;
  setPublisherFilter: (value: string) => void;
  solutionFilter: string;
  setSolutionFilter: (value: string) => void;

  // Zoom and pan
  zoom: number;
  setZoom: (value: number | ((prev: number) => number)) => void;
  pan: { x: number; y: number };
  setPan: (value: { x: number; y: number }) => void;

  // Drag state
  isDragging: boolean;
  setIsDragging: (value: boolean) => void;
  dragStart: { x: number; y: number };
  setDragStart: (value: { x: number; y: number }) => void;

  // Entity positions and layout
  entityPositions: Record<string, EntityPosition>;
  setEntityPositions: (value: Record<string, EntityPosition> | ((prev: Record<string, EntityPosition>) => Record<string, EntityPosition>)) => void;
  layoutMode: LayoutMode;
  setLayoutMode: (value: LayoutMode) => void;

  // Collapse state
  collapsedEntities: Set<string>;
  setCollapsedEntities: (value: Set<string>) => void;

  // Hover state
  hoveredEntity: string | null;
  setHoveredEntity: (value: string | null) => void;

  // Entity dragging
  draggingEntity: string | null;
  setDraggingEntity: (value: string | null) => void;
  dragEntityOffset: { x: number; y: number };
  setDragEntityOffset: (value: { x: number; y: number }) => void;

  // Field selection
  selectedFields: Record<string, Set<string>>;
  setSelectedFields: (value: Record<string, Set<string>> | ((prev: Record<string, Set<string>>) => Record<string, Set<string>>)) => void;
  showFieldSelector: string | null;
  setShowFieldSelector: (value: string | null) => void;
  fieldSearchQueries: Record<string, string>;
  setFieldSearchQueries: (value: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;

  // Settings
  showSettings: boolean;
  setShowSettings: (value: boolean) => void;
  colorSettings: ColorSettings;
  setColorSettings: (value: ColorSettings | ((prev: ColorSettings) => ColorSettings)) => void;

  // Features
  showMinimap: boolean;
  setShowMinimap: (value: boolean) => void;
  isSmartZoom: boolean;
  setIsSmartZoom: (value: boolean) => void;

  // Toast
  toast: ToastState | null;
  showToast: (message: string, type?: ToastType) => void;
}

// Props for EntityCard component
export interface EntityCardProps {
  entity: Entity;
  position: EntityPosition;
  isHovered: boolean;
  isDragging: boolean;
  isCollapsed: boolean;
  tableColor: string;
  selectedFields: Set<string>;
  showFieldSelector: boolean;
  fieldSearchQuery: string;
  isDarkMode: boolean;
  colorSettings: ColorSettings;
  themeColors: ThemeColors;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onToggleCollapse: () => void;
  onToggleFieldSelector: () => void;
  onToggleField: (fieldName: string) => void;
  onSelectAllFields: () => void;
  onClearAllFields: () => void;
  onFieldSearchChange: (value: string) => void;
  onCloseFieldSelector: () => void;
}

// Props for FieldSelector component
export interface FieldSelectorProps {
  entity: Entity;
  selectedFields: Set<string>;
  searchQuery: string;
  tableColor: string;
  isDarkMode: boolean;
  themeColors: ThemeColors;
  onToggleField: (fieldName: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onSearchChange: (value: string) => void;
  onClose: () => void;
  getFieldTypeColor: (type: AttributeType) => string;
}

// Props for RelationshipLines component
export interface RelationshipLinesProps {
  relationships: EntityRelationship[];
  entities: Entity[];
  entityPositions: Record<string, EntityPosition>;
  selectedFields: Record<string, Set<string>>;
  collapsedEntities: Set<string>;
  isDarkMode: boolean;
  lookupColor: string;
}

// Props for Sidebar component
export interface SidebarProps {
  entities: Entity[];
  selectedEntities: Set<string>;
  searchQuery: string;
  publisherFilter: string;
  solutionFilter: string;
  layoutMode: LayoutMode;
  isDarkMode: boolean;
  showSettings: boolean;
  colorSettings: ColorSettings;
  collapsedEntities: Set<string>;
  themeColors: ThemeColors;
  onToggleEntity: (entityName: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onSearchChange: (value: string) => void;
  onPublisherFilterChange: (value: string) => void;
  onSolutionFilterChange: (value: string) => void;
  onLayoutModeChange: (mode: LayoutMode) => void;
  onToggleDarkMode: () => void;
  onToggleSettings: () => void;
  onColorSettingsChange: (settings: Partial<ColorSettings>) => void;
}

// Props for Toolbar component
export interface ToolbarProps {
  filteredEntitiesCount: number;
  filteredRelationshipsCount: number;
  zoom: number;
  isSmartZoom: boolean;
  showMinimap: boolean;
  isDarkMode: boolean;
  themeColors: ThemeColors;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onResetView: () => void;
  onToggleSmartZoom: () => void;
  onToggleMinimap: () => void;
  onCopyPNG: () => void;
  onExportMermaid: () => void;
  onExportSVG: () => void;
}

// Props for Minimap component
export interface MinimapProps {
  entities: Entity[];
  entityPositions: Record<string, EntityPosition>;
  pan: { x: number; y: number };
  zoom: number;
  containerRef: React.RefObject<HTMLDivElement>;
  isDarkMode: boolean;
  colorSettings: ColorSettings;
  themeColors: ThemeColors;
  onNavigate: (x: number, y: number) => void;
}

// Props for Toast component
export interface ToastProps {
  message: string;
  type: ToastType;
  isDarkMode: boolean;
}

// Mermaid type mapping
export const MERMAID_TYPE_MAP: Record<AttributeType, string> = {
  'String': 'string',
  'Integer': 'int',
  'Decimal': 'decimal',
  'Money': 'decimal',
  'DateTime': 'datetime',
  'Boolean': 'boolean',
  'Picklist': 'string',
  'Lookup': 'string',
  'Owner': 'string',
  'Memo': 'text',
  'UniqueIdentifier': 'uuid',
  'Customer': 'string',
  'State': 'string',
  'Status': 'string',
  'Double': 'decimal',
  'BigInt': 'bigint',
};

// Helper to get theme colors based on dark mode
export function getThemeColors(isDarkMode: boolean): ThemeColors {
  return {
    bgColor: isDarkMode ? '#1a1a1a' : '#f0f0f0',
    panelBg: isDarkMode ? '#242424' : '#ffffff',
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    cardBg: isDarkMode ? '#2d2d2d' : '#ffffff',
    textColor: isDarkMode ? '#e2e8f0' : '#1e293b',
    textSecondary: isDarkMode ? '#94a3b8' : '#64748b',
  };
}

// Helper to get field type color
export function getFieldTypeColor(type: AttributeType, lookupColor: string): string {
  const colors: Record<string, string> = {
    'String': '#10b981',
    'Memo': '#06b6d4',
    'Integer': '#f59e0b',
    'Decimal': '#f59e0b',
    'Money': '#84cc16',
    'DateTime': '#8b5cf6',
    'Boolean': '#ec4899',
    'Picklist': '#3b82f6',
    'Lookup': lookupColor,
    'Owner': lookupColor,
    'UniqueIdentifier': '#fbbf24'
  };
  return colors[type] || '#6b7280';
}
