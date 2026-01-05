/**
 * Theme Provider Component
 *
 * Provides centralized theme state and colors to the component tree.
 * Components can access theme via useTheme() hook instead of receiving props.
 *
 * Note: Context definition is in themeContextDef.ts and utility functions
 * are in themeUtils.ts for React Fast Refresh compatibility.
 */

import { useState, useMemo, useCallback, type ReactNode } from 'react';
import { ThemeContext } from './themeContextDef';
import { getThemeColors, getExtendedThemeColors } from './themeUtils';

export interface ThemeProviderProps {
  children: ReactNode;
  /** Initial dark mode state */
  initialDarkMode?: boolean;
  /** External control for dark mode state */
  isDarkMode?: boolean;
  /** External setter for dark mode state */
  onDarkModeChange?: (value: boolean) => void;
}

/**
 * Theme Provider component
 *
 * Can be used in two modes:
 * 1. Controlled: Pass isDarkMode and onDarkModeChange props
 * 2. Uncontrolled: Uses internal state, optionally initialized with initialDarkMode
 */
export function ThemeProvider({
  children,
  initialDarkMode = false,
  isDarkMode: controlledDarkMode,
  onDarkModeChange,
}: ThemeProviderProps) {
  const [internalDarkMode, setInternalDarkMode] = useState(initialDarkMode);

  // Use controlled value if provided, otherwise use internal state
  const isDarkMode = controlledDarkMode ?? internalDarkMode;

  const setIsDarkMode = useCallback(
    (value: boolean) => {
      if (onDarkModeChange) {
        onDarkModeChange(value);
      } else {
        setInternalDarkMode(value);
      }
    },
    [onDarkModeChange]
  );

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(!isDarkMode);
  }, [isDarkMode, setIsDarkMode]);

  const themeColors = useMemo(() => getThemeColors(isDarkMode), [isDarkMode]);
  const colors = useMemo(() => getExtendedThemeColors(isDarkMode), [isDarkMode]);

  const value = useMemo(
    () => ({
      isDarkMode,
      toggleDarkMode,
      setIsDarkMode,
      themeColors,
      colors,
    }),
    [isDarkMode, toggleDarkMode, setIsDarkMode, themeColors, colors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
