/**
 * URL State Codec - Encodes/decodes diagram state to/from URL hash
 * Uses LZ-String compression for efficient URL encoding
 */

import * as LZString from 'lz-string';
import type { EntityPosition } from '@/types';
import type { LayoutMode } from '@/types/erdTypes';
import type { SerializableState } from '@/types/snapshotTypes';

const CODEC_VERSION = '1.0.0';
const MAX_SAFE_URL_LENGTH = 2000; // Conservative limit for broad browser support

/**
 * Compact state format for URL sharing
 * Uses single-letter keys to minimize URL size
 */
export interface CompactState {
  e: string[]; // selectedEntities
  p: Record<string, { x: number; y: number }>; // entityPositions (no vx/vy)
  z: number; // zoom
  pn: { x: number; y: number }; // pan
  l: LayoutMode; // layoutMode
  f: {
    // filters
    s: string; // searchQuery
    pub: string; // publisherFilter
    sol: string; // solutionFilter
  };
  d: boolean; // isDarkMode
  v: string; // version
  co?: Record<string, string>; // entityColorOverrides (optional, only present when non-empty)
  gn?: Record<string, string>; // groupNames (optional, only present when non-empty)
  gf?: string; // groupFilter (optional, only present when not 'all')
}

/**
 * Result of URL decoding operation
 */
export interface DecodeResult {
  success: boolean;
  state?: CompactState;
  error?: string;
}

/** Minimal state shape accepted by encodeStateToURL */
export type MinimalShareState = Parameters<typeof encodeStateToURL>[0];

/**
 * Build minimal state for URL sharing.
 * Strips heavy fields (colorSettings, fields, edgeOffsets) to keep URLs small.
 * Shared between App.tsx handleGenerateShareURL and useSnapshots shareSnapshot.
 */
export function buildMinimalShareState(state: SerializableState): MinimalShareState {
  return {
    selectedEntities: state.selectedEntities,
    entityPositions: state.entityPositions,
    zoom: state.zoom,
    pan: state.pan,
    layoutMode: state.layoutMode,
    searchQuery: state.searchQuery,
    publisherFilter: state.publisherFilter,
    solutionFilter: state.solutionFilter,
    isDarkMode: state.isDarkMode,
    ...(state.entityColorOverrides &&
      Object.keys(state.entityColorOverrides).length > 0 && {
        entityColorOverrides: state.entityColorOverrides,
      }),
    ...(state.groupNames &&
      Object.keys(state.groupNames).length > 0 && { groupNames: state.groupNames }),
    ...(state.groupFilter && state.groupFilter !== 'all' && { groupFilter: state.groupFilter }),
  };
}

/**
 * Strip velocity fields from positions to save space
 * Also rounds coordinates to integers for smaller JSON
 */
function compactPositions(
  positions: Record<string, EntityPosition>
): Record<string, { x: number; y: number }> {
  return Object.fromEntries(
    Object.entries(positions).map(([key, pos]) => [
      key,
      { x: Math.round(pos.x), y: Math.round(pos.y) },
    ])
  );
}

/**
 * Restore velocity fields for force layout
 */
function expandPositions(
  compact: Record<string, { x: number; y: number }>
): Record<string, EntityPosition> {
  return Object.fromEntries(
    Object.entries(compact).map(([key, pos]) => [key, { x: pos.x, y: pos.y, vx: 0, vy: 0 }])
  );
}

/**
 * Encode minimal state to URL-safe compressed string
 * @param state Serializable state from useERDState
 * @returns Base64 URL-safe compressed string
 */
export function encodeStateToURL(state: {
  selectedEntities: string[];
  entityPositions: Record<string, EntityPosition>;
  zoom: number;
  pan: { x: number; y: number };
  layoutMode: LayoutMode;
  searchQuery: string;
  publisherFilter: string;
  solutionFilter: string;
  isDarkMode: boolean;
  entityColorOverrides?: Record<string, string>;
  groupNames?: Record<string, string>;
  groupFilter?: string;
}): string {
  try {
    // Build compact state object
    const compactState: CompactState = {
      e: state.selectedEntities,
      p: compactPositions(state.entityPositions),
      z: Math.round(state.zoom * 100) / 100, // Round to 2 decimals
      pn: {
        x: Math.round(state.pan.x),
        y: Math.round(state.pan.y),
      },
      l: state.layoutMode,
      f: {
        s: state.searchQuery,
        pub: state.publisherFilter,
        sol: state.solutionFilter,
      },
      d: state.isDarkMode,
      v: CODEC_VERSION,
    };

    // Only include color overrides if non-empty (saves URL space)
    if (state.entityColorOverrides && Object.keys(state.entityColorOverrides).length > 0) {
      compactState.co = state.entityColorOverrides;
    }

    // Only include group names if non-empty
    if (state.groupNames && Object.keys(state.groupNames).length > 0) {
      compactState.gn = state.groupNames;
    }

    // Only include group filter if not default
    if (state.groupFilter && state.groupFilter !== 'all') {
      compactState.gf = state.groupFilter;
    }

    // Serialize to JSON
    const json = JSON.stringify(compactState);

    // Compress using LZ-String
    const compressed = LZString.compressToEncodedURIComponent(json);

    return compressed;
  } catch (error) {
    throw new Error(
      `Failed to encode state: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Decode URL hash to compact state object
 * @param hash URL hash string (without # prefix)
 * @returns Decoded state or error
 */
export function decodeStateFromURL(hash: string): DecodeResult {
  try {
    // Remove # prefix if present
    const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;

    if (!cleanHash) {
      return { success: false, error: 'Empty hash' };
    }

    // Decompress
    const decompressed = LZString.decompressFromEncodedURIComponent(cleanHash);

    if (!decompressed) {
      return { success: false, error: 'Decompression failed (corrupted data)' };
    }

    // Parse JSON
    const parsed = JSON.parse(decompressed) as CompactState;

    // Validate structure
    if (!parsed.e || !Array.isArray(parsed.e)) {
      return { success: false, error: 'Invalid state structure (missing entities)' };
    }

    if (!parsed.v) {
      return { success: false, error: 'Missing version field' };
    }

    // Version check (for future migrations)
    if (parsed.v !== CODEC_VERSION) {
      console.warn(`[URLCodec] Version mismatch: ${parsed.v} vs ${CODEC_VERSION}`);
      // In future, add migration logic here
    }

    return { success: true, state: parsed };
  } catch (error) {
    return {
      success: false,
      error: `Decode error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Convert CompactState to SerializableState format
 * Fills in missing fields with defaults (they won't be overridden)
 * @param compact Compact state from URL
 * @returns Partial serializable state for restoreState()
 */
export function expandCompactState(compact: CompactState): Partial<SerializableState> {
  return {
    selectedEntities: compact.e,
    entityPositions: expandPositions(compact.p),
    zoom: compact.z,
    pan: compact.pn,
    layoutMode: compact.l,
    searchQuery: compact.f.s,
    publisherFilter: compact.f.pub,
    solutionFilter: compact.f.sol,
    isDarkMode: compact.d,
    // Restore per-entity color overrides if present
    ...(compact.co ? { entityColorOverrides: compact.co } : {}),
    // Restore group names if present
    ...(compact.gn ? { groupNames: compact.gn } : {}),
    // Restore group filter if present (defaults to 'all' when absent)
    ...(compact.gf ? { groupFilter: compact.gf } : {}),
    // Fields NOT restored from URL (use existing state or defaults):
    // - collapsedEntities
    // - selectedFields
    // - fieldOrder
    // - colorSettings
    // - showMinimap
    // - isSmartZoom
    // - edgeOffsets
  };
}

/**
 * Get the proper base URL for sharing, preserving Dynamics 365 navigation context.
 *
 * When the app runs as a Dynamics 365 web resource, it's loaded in an iframe.
 * window.location points to the iframe URL (e.g., /{guid}/webresources/name.html)
 * but the share URL should use the parent navigation URL
 * (e.g., /main.aspx?appid=...&pagetype=webresource&webresourceName=name.html)
 * so recipients land in the correct Dynamics 365 app context.
 */
export function getShareBaseUrl(): string {
  try {
    // If we're in an iframe, try to use the parent's URL (same-origin access)
    if (window.parent && window.parent !== window) {
      const parentUrl = window.parent.location.href;
      // Strip any existing hash from parent URL
      const hashIndex = parentUrl.indexOf('#');
      return hashIndex >= 0 ? parentUrl.slice(0, hashIndex) : parentUrl;
    }
  } catch {
    // Cross-origin access blocked — fall back to current window
  }

  // Fallback: use current window location (development mode or direct access)
  return window.location.origin + window.location.pathname + window.location.search;
}

/**
 * Get the URL hash containing encoded state.
 *
 * When loaded inside a Dynamics 365 iframe, the hash is on the parent URL
 * (main.aspx?...#encoded_state), not the iframe URL. This function checks
 * both locations.
 *
 * @returns Hash string without # prefix, or empty string if none found
 */
export function getStateHash(): string {
  // Check current window hash first
  const currentHash = window.location.hash.slice(1);
  if (currentHash) return currentHash;

  // If in an iframe, check parent window hash (Dynamics 365 scenario)
  try {
    if (window.parent && window.parent !== window) {
      const parentHash = window.parent.location.hash.slice(1);
      if (parentHash) return parentHash;
    }
  } catch {
    // Cross-origin access blocked — no parent hash available
  }

  return '';
}

/**
 * Estimate URL size for given state
 * @param state State to encode
 * @returns Approximate URL length in characters
 */
export function estimateURLSize(state: Parameters<typeof encodeStateToURL>[0]): number {
  const encoded = encodeStateToURL(state);
  // Full URL = base URL + hash + encoded state
  const baseUrl = getShareBaseUrl();
  return baseUrl.length + 1 + encoded.length; // +1 for #
}

/**
 * Check if URL size is within safe limits
 * @param state State to check
 * @returns True if URL is safe for most browsers
 */
export function isURLSafe(state: Parameters<typeof encodeStateToURL>[0]): boolean {
  return estimateURLSize(state) <= MAX_SAFE_URL_LENGTH;
}
