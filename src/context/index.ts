/**
 * Context exports for ERD Visualizer
 */

// Provider component
export { ThemeProvider } from './ThemeContext';
export type { ThemeProviderProps } from './ThemeContext';

// Context types and values
export type { ThemeContextValue } from './themeContextDef';

// Theme utilities and types
export type { ExtendedThemeColors } from './themeUtils';
export { getThemeColors, getExtendedThemeColors } from './themeUtils';

// Hooks exported from separate file for React Fast Refresh compatibility
export { useTheme, useThemeColors } from './useThemeHooks';
