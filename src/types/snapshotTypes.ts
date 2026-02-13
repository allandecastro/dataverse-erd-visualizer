/**
 * Snapshot type definitions for saving and restoring diagram states
 */

import type { EntityPosition } from '@/types';
import type { LayoutMode, ColorSettings } from '@/types/erdTypes';

/**
 * Serializable state extracted from useERDState for snapshots
 * All Sets are converted to Arrays for JSON serialization
 */
export interface SerializableState {
  // Entity selection
  selectedEntities: string[]; // Set → Array
  collapsedEntities: string[]; // Set → Array

  // Field selection and ordering
  selectedFields: Record<string, string[]>; // Record<string, Set> → Record<string, Array>
  fieldOrder: Record<string, string[]>;

  // Layout and positions
  entityPositions: Record<string, EntityPosition>;
  layoutMode: LayoutMode;

  // Viewport
  zoom: number;
  pan: { x: number; y: number };

  // Filters (sidebar state)
  searchQuery: string;
  publisherFilter: string;
  solutionFilter: string;

  // Visual settings
  isDarkMode: boolean;
  colorSettings: ColorSettings;
  showMinimap: boolean;
  isSmartZoom: boolean;

  // Edge adjustments
  edgeOffsets: Record<string, { x: number; y: number }>;

  // Per-entity color overrides (entity logicalName → hex color)
  entityColorOverrides?: Record<string, string>;

  // Group names (hex color → user-assigned group name)
  groupNames?: Record<string, string>;

  // Active group filter (color hex or 'all' / '__ungrouped__')
  groupFilter?: string;
}

/**
 * Complete snapshot of diagram state with metadata
 */
export interface ERDSnapshot {
  // Metadata
  id: string; // UUID for unique identification
  name: string; // User-provided custom name
  timestamp: number; // Unix timestamp (Date.now())
  version: string; // Schema version for future migrations (e.g., "1.0.0")

  // Complete diagram state
  state: SerializableState;
}

/**
 * Metadata-only view of a snapshot (for listing)
 */
export interface SnapshotMetadata {
  id: string;
  name: string;
  timestamp: number;
  version: string;
}

/**
 * Complete storage data structure for localStorage
 * Contains all snapshots plus auto-save and settings
 */
export interface SnapshotsStorageData {
  snapshots: ERDSnapshot[]; // User-saved snapshots (max 10)
  lastAutoSave?: ERDSnapshot; // Special auto-save slot
  autoSaveEnabled: boolean; // User preference for auto-save
}

/**
 * Validation result when loading/importing snapshots
 */
export interface SnapshotValidationResult {
  isValid: boolean;
  missingEntities: string[];
  missingFields: Array<{ entity: string; field: string }>;
}

/**
 * JSON export format for snapshots
 */
export interface SnapshotExportData {
  erdVisualizerSnapshot: true; // Marker for validation
  version: string; // Export format version
  exported: number; // Export timestamp
  snapshot: ERDSnapshot; // The actual snapshot
}
