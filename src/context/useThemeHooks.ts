/**
 * Theme hooks - Access theme context values
 *
 * Separated from ThemeContext.tsx for React Fast Refresh compatibility.
 */

import { useContext } from 'react';
import { ThemeContext, type ThemeContextValue } from './themeContextDef';
import { getExtendedThemeColors, type ExtendedThemeColors } from './themeUtils';

/**
 * Hook to access theme context
 *
 * @throws Error if used outside of ThemeProvider
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Hook to access only theme colors (lighter alternative)
 * Can be used outside ThemeProvider with fallback to light mode
 */
export function useThemeColors(isDarkMode?: boolean): ExtendedThemeColors {
  const context = useContext(ThemeContext);

  // If context exists, use its colors
  if (context) {
    return context.colors;
  }

  // If no context but isDarkMode is passed, calculate colors
  if (isDarkMode !== undefined) {
    return getExtendedThemeColors(isDarkMode);
  }

  // Default to light mode
  return getExtendedThemeColors(false);
}
