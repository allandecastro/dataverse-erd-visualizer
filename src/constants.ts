/**
 * Shared constants for ERD Visualizer components
 * Centralized to ensure consistency between on-screen rendering and exports
 */

// =============================================================================
// TABLE/ENTITY LAYOUT CONSTANTS
// =============================================================================
// These values MUST match between TableNode.tsx and export utilities

/**
 * Entity table card width (px)
 */
export const CARD_WIDTH = 300;

/**
 * Entity table header height - contains display name (px)
 */
export const HEADER_HEIGHT = 36;

/**
 * Subheader height - contains logical name (px)
 */
export const SUBHEADER_HEIGHT = 24;

/**
 * Height of each field row in the entity table (px)
 */
export const FIELD_ROW_HEIGHT = 28;

/**
 * Top padding for the fields section (px)
 */
export const FIELD_PADDING_TOP = 4;

// Legacy constants (kept for backward compatibility, consider removing)
export const ATTRIBUTES_TITLE_HEIGHT = 30;
export const FIELD_HEIGHT = 44;
export const FIELD_HALF_HEIGHT = 22;

// =============================================================================
// GRID LAYOUT CONSTANTS
// =============================================================================
// Grid layout positioning for entity tables

/**
 * Starting X position for grid layout (px)
 */
export const GRID_START_X = 100;

/**
 * Starting Y position for grid layout (px)
 */
export const GRID_START_Y = 80;

/**
 * Horizontal spacing between entities in grid layout (px)
 */
export const GRID_SPACING_X = 380;

/**
 * Vertical spacing between entity rows in grid layout (px)
 */
export const GRID_SPACING_Y = 320;

// =============================================================================
// FORCE-DIRECTED LAYOUT CONSTANTS (Physics Simulation)
// =============================================================================
// Parameters for the force-directed graph layout algorithm

/**
 * Optimal distance between connected nodes (px)
 * Larger values spread entities further apart
 */
export const SPRING_LENGTH = 280;

/**
 * Strength of the spring force between connected entities (0-1)
 * Higher values pull connected entities closer together
 */
export const SPRING_STRENGTH = 0.01;

/**
 * Repulsion force constant between all entity pairs
 * Higher values push entities further apart
 */
export const REPULSION = 8000;

/**
 * Velocity damping factor per iteration (0-1)
 * Controls how quickly the simulation stabilizes
 */
export const DAMPING = 0.9;

/**
 * Number of simulation iterations for force-directed layout
 */
export const ITERATIONS = 100;

/**
 * Weak force pulling entities toward canvas center (0-1)
 * Prevents entities from drifting too far from origin
 */
export const CENTER_FORCE = 0.001;

// =============================================================================
// AUTO-ARRANGE LAYOUT CONSTANTS
// =============================================================================
// Hierarchical layout based on relationship dependencies

/**
 * Vertical spacing between hierarchy levels (px)
 */
export const LEVEL_HEIGHT = 320;

/**
 * Horizontal spacing between entities at the same level (px)
 */
export const HORIZONTAL_SPACING = 380;

// =============================================================================
// EXPORT CONSTANTS
// =============================================================================
// Parameters for image/diagram exports

/**
 * Padding around diagram for PNG/SVG exports (px)
 * Generous padding to include edges and labels that extend beyond nodes
 */
export const EXPORT_PADDING = 300;

/**
 * Minimum zoom level for exports
 */
export const EXPORT_MIN_ZOOM = 0.5;

/**
 * Maximum zoom level for exports
 */
export const EXPORT_MAX_ZOOM = 2;

// =============================================================================
// VIEWPORT CONSTANTS
// =============================================================================
// Default viewport settings and limits

/**
 * Minimum zoom level for the diagram canvas
 */
export const VIEWPORT_MIN_ZOOM = 0.1;

/**
 * Maximum zoom level for the diagram canvas
 */
export const VIEWPORT_MAX_ZOOM = 2;

/**
 * Default zoom level when diagram loads
 */
export const VIEWPORT_DEFAULT_ZOOM = 0.8;

/**
 * Default pan position when diagram loads
 */
export const VIEWPORT_DEFAULT_PAN = { x: 400, y: 100 };

/**
 * X offset for centering camera on node when focusing (px)
 * Accounts for node width to center the view properly
 */
export const NODE_CENTER_OFFSET_X = 140;

/**
 * Y offset for centering camera on node when focusing (px)
 * Accounts for node height to center the view properly
 */
export const NODE_CENTER_OFFSET_Y = 100;

// =============================================================================
// TIMING CONSTANTS
// =============================================================================
// Delays and durations for various UI interactions

/**
 * Debounce delay for auto-save (milliseconds)
 * Prevents excessive saves while user is actively editing
 */
export const AUTO_SAVE_DEBOUNCE = 2000;

/**
 * Duration for toast notifications (milliseconds)
 */
export const TOAST_DURATION = 3000;

/**
 * Default animation duration for transitions (milliseconds)
 */
export const ANIMATION_DURATION = 300;

// =============================================================================
// RELATIONSHIP DISPLAY
// =============================================================================
// Cardinality symbol mappings for relationship display
export const CARDINALITY_SYMBOLS: Record<string, { from: string; to: string }> = {
  'N:1': { from: 'N', to: '1' },
  '1:N': { from: '1', to: 'N' },
  'N:N': { from: 'N', to: 'N' },
};

// SVG Logo as data URL (for Dataverse web resource compatibility)
export const LOGO_DATA_URL = `data:image/svg+xml,${encodeURIComponent(`<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="dvGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:rgb(236, 72, 153)"/><stop offset="100%" style="stop-color:rgb(139, 92, 246)"/></linearGradient><clipPath id="logoClip"><rect x="0" y="0" width="400" height="400" rx="40"/></clipPath></defs><g clip-path="url(#logoClip)"><rect x="0" y="0" width="400" height="400" rx="40" fill="url(#dvGrad)"/><rect x="60" y="60" width="100" height="80" rx="8" fill="#ffffff"/><rect x="60" y="60" width="100" height="24" rx="8" fill="#1e1b4b"/><line x1="70" y1="98" x2="140" y2="98" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/><line x1="70" y1="114" x2="130" y2="114" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/><line x1="70" y1="130" x2="120" y2="130" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/><rect x="240" y="60" width="100" height="80" rx="8" fill="#ffffff"/><rect x="240" y="60" width="100" height="24" rx="8" fill="#1e1b4b"/><line x1="250" y1="98" x2="320" y2="98" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/><line x1="250" y1="114" x2="310" y2="114" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/><line x1="250" y1="130" x2="300" y2="130" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/><rect x="150" y="200" width="100" height="80" rx="8" fill="#ffffff"/><rect x="150" y="200" width="100" height="24" rx="8" fill="#1e1b4b"/><line x1="160" y1="238" x2="230" y2="238" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/><line x1="160" y1="254" x2="220" y2="254" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/><line x1="160" y1="270" x2="210" y2="270" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/><path d="M 160 100 L 240 100" stroke="#fbbf24" stroke-width="4" fill="none"/><path d="M 110 140 L 110 170 L 175 200" stroke="#fbbf24" stroke-width="4" fill="none"/><path d="M 290 140 L 290 170 L 225 200" stroke="#fbbf24" stroke-width="4" fill="none"/><circle cx="160" cy="100" r="6" fill="#fbbf24"/><circle cx="240" cy="100" r="6" fill="#fbbf24"/><circle cx="110" cy="140" r="6" fill="#fbbf24"/><circle cx="175" cy="200" r="6" fill="#fbbf24"/><circle cx="290" cy="140" r="6" fill="#fbbf24"/><circle cx="225" cy="200" r="6" fill="#fbbf24"/></g></svg>`)}`;
