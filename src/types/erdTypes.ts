/**
 * Shared types for ERD Visualizer components
 */

import type { Entity, EntityPosition, AttributeType, LayoutMode } from '@/types';
export type { LayoutMode } from '@/types';

// Toast notification types
export type ToastType = 'success' | 'error' | 'info' | 'warning';

// Edge/relationship line style types
export type EdgeStyle = 'smoothstep' | 'straight' | 'bezier' | 'step';

// Line notation style types
export type LineNotationStyle = 'simple' | 'crowsfoot' | 'uml';

// Line stroke style types
export type LineStrokeStyle = 'solid' | 'dashed' | 'dotted';

// Cardinality end types for crow's foot notation
export type CardinalityEnd = 'one' | 'many' | 'one-optional' | 'many-optional';

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

// Color settings for entities and relationships
export interface ColorSettings {
  customTableColor: string;
  standardTableColor: string;
  lookupColor: string;
  edgeStyle: EdgeStyle;

  // Line customization settings
  lineNotation: LineNotationStyle;
  lineStroke: LineStrokeStyle;
  lineThickness: number; // 1-5 range
  useRelationshipTypeColors: boolean;
  oneToManyColor?: string;
  manyToOneColor?: string;
  manyToManyColor?: string;
}

/** Valid range for lineThickness */
export const LINE_THICKNESS_MIN = 0.5;
export const LINE_THICKNESS_MAX = 5;
export const LINE_THICKNESS_DEFAULT = 1.5;

/** Validate a hex color string (3, 4, 6, or 8 digit formats). */
export function isValidHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value);
}

/**
 * Parse a string value into the correct type for a ColorSettings key.
 * Handles type coercion for numeric (lineThickness) and boolean (useRelationshipTypeColors) fields.
 */
export function parseColorSettingValue(
  key: keyof ColorSettings,
  value: string
): string | number | boolean {
  if (key === 'lineThickness') {
    const parsed = parseFloat(value);
    if (Number.isNaN(parsed)) return LINE_THICKNESS_DEFAULT;
    return Math.max(LINE_THICKNESS_MIN, Math.min(LINE_THICKNESS_MAX, parsed));
  }
  if (key === 'useRelationshipTypeColors') {
    return value === 'true';
  }
  return value;
}

// Derived group — computed at runtime from entityColorOverrides + groupNames
export interface DerivedGroup {
  color: string; // hex color key (lowercase)
  name: string; // user-assigned name or auto-label ("Red", "Blue", etc.)
  entityNames: string[]; // sorted logical names of entities in this group
}

// =============================================================================
// Semantic type aliases for commonly repeated Record patterns
// =============================================================================

/** Entity logical name → selected field names */
export type EntityFieldMap = Record<string, Set<string>>;

/** Entity logical name → ordered field names array */
export type EntityFieldOrder = Record<string, string[]>;

/** Entity logical name → position on canvas */
export type EntityPositionMap = Record<string, EntityPosition>;

/** Entity logical name → hex color override */
export type EntityColorMap = Record<string, string>;

/** Hex color → user-assigned group name */
export type GroupNameMap = Record<string, string>;

/** Relationship schema name → manual edge offset */
export type EdgeOffsetMap = Record<string, { x: number; y: number }>;

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

  // Entity positions and layout
  entityPositions: Record<string, EntityPosition>;
  setEntityPositions: (
    value:
      | Record<string, EntityPosition>
      | ((prev: Record<string, EntityPosition>) => Record<string, EntityPosition>)
  ) => void;
  layoutMode: LayoutMode;
  setLayoutMode: (value: LayoutMode) => void;

  // Collapse state
  collapsedEntities: Set<string>;
  setCollapsedEntities: (value: Set<string>) => void;

  // Field selection
  selectedFields: Record<string, Set<string>>;
  setSelectedFields: (
    value:
      | Record<string, Set<string>>
      | ((prev: Record<string, Set<string>>) => Record<string, Set<string>>)
  ) => void;
  showFieldSelector: string | null;
  setShowFieldSelector: (value: string | null) => void;
  fieldSearchQueries: Record<string, string>;
  setFieldSearchQueries: (
    value: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)
  ) => void;

  // Settings
  showSettings: boolean;
  setShowSettings: (value: boolean) => void;
  colorSettings: ColorSettings;
  setColorSettings: (value: ColorSettings | ((prev: ColorSettings) => ColorSettings)) => void;

  // Per-entity color overrides
  entityColorOverrides: Record<string, string>;
  setEntityColor: (entityName: string, color: string) => void;
  clearEntityColor: (entityName: string) => void;
  clearAllEntityColors: () => void;

  // Entity grouping (derived from color overrides)
  groupNames: Record<string, string>;
  setGroupName: (color: string, name: string) => void;
  clearGroupName: (color: string) => void;
  derivedGroups: DerivedGroup[];
  groupFilter: string;
  setGroupFilter: (value: string) => void;

  // Features
  showMinimap: boolean;
  setShowMinimap: (value: boolean) => void;
  isSmartZoom: boolean;
  setIsSmartZoom: (value: boolean) => void;

  // Toast
  toast: ToastState | null;
  showToast: (message: string, type?: ToastType) => void;
}

// Props for Sidebar component (uses useTheme() for dark mode and theme colors)
export interface SidebarProps {
  entities: Entity[];
  selectedEntities: Set<string>;
  searchQuery: string;
  publisherFilter: string;
  solutionFilter: string;
  publishers: string[];
  solutions: string[];
  layoutMode: LayoutMode;
  showSettings: boolean;
  colorSettings: ColorSettings;
  onToggleEntity: (entityName: string) => void;
  onSelectAll: (entityNames?: string[]) => void;
  onDeselectAll: (entityNames?: string[]) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onSearchChange: (value: string) => void;
  onPublisherFilterChange: (value: string) => void;
  onSolutionFilterChange: (value: string) => void;
  onLayoutModeChange: (mode: LayoutMode) => void;
  onToggleSettings: () => void;
  onColorSettingsChange: (key: keyof ColorSettings, value: string) => void;
  entityColorOverrideCount: number;
  onResetAllEntityColors: () => void;
}

// Props for Toolbar component (uses useTheme() for dark mode and theme colors)
export interface ToolbarProps {
  filteredEntitiesCount: number;
  filteredRelationshipsCount: number;
  isExportingDrawio?: boolean;
  drawioExportProgress?: { progress: number; message: string };
  onCopyPNG: () => void;
  onExportMermaid: () => void;
  onExportSVG: () => void;
  onExportDrawio: () => void;
  onOpenSearch: () => void;
  onOpenGuide: () => void;
}

// Props for Toast component (uses useTheme() for dark mode)
export interface ToastProps {
  message: string;
  type: ToastType;
}

// Mermaid type mapping
export const MERMAID_TYPE_MAP: Record<AttributeType, string> = {
  String: 'string',
  Integer: 'int',
  Decimal: 'decimal',
  Money: 'decimal',
  DateTime: 'datetime',
  Boolean: 'boolean',
  Picklist: 'string',
  Lookup: 'string',
  Owner: 'string',
  Memo: 'text',
  UniqueIdentifier: 'uuid',
  Customer: 'string',
  State: 'string',
  Status: 'string',
  Double: 'decimal',
  BigInt: 'bigint',
};

// Note: getThemeColors() is defined in src/context/themeUtils.ts (single source of truth)

// Helper to get field type color
export function getFieldTypeColor(type: AttributeType, lookupColor: string): string {
  const colors: Record<string, string> = {
    String: '#10b981',
    Memo: '#06b6d4',
    Integer: '#f59e0b',
    Decimal: '#f59e0b',
    Money: '#84cc16',
    DateTime: '#8b5cf6',
    Boolean: '#ec4899',
    Picklist: '#3b82f6',
    Lookup: lookupColor,
    Owner: lookupColor,
    UniqueIdentifier: '#fbbf24',
  };
  return colors[type] || '#6b7280';
}
