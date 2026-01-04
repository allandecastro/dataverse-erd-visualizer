/**
 * Theme Context - Provides centralized theme state and colors
 *
 * Eliminates prop drilling for isDarkMode and themeColors across the component tree.
 * Components can access theme via useTheme() hook instead of receiving props.
 */

import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from 'react';
import type { ThemeColors } from '@/types/erdTypes';

/**
 * Calculates theme colors based on dark mode state
 */
function getThemeColors(isDarkMode: boolean): ThemeColors {
  return {
    bgColor: isDarkMode ? '#1a1a1a' : '#f0f0f0',
    panelBg: isDarkMode ? '#242424' : '#ffffff',
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    cardBg: isDarkMode ? '#2d2d2d' : '#ffffff',
    textColor: isDarkMode ? '#e2e8f0' : '#1e293b',
    textSecondary: isDarkMode ? '#94a3b8' : '#64748b',
  };
}

/**
 * Extended theme colors for specific UI elements
 */
export interface ExtendedThemeColors extends ThemeColors {
  headerBg: string;
  inputBg: string;
  inputBorder: string;
  hoverBg: string;
  focusRing: string;
  errorColor: string;
  successColor: string;
  warningColor: string;
}

function getExtendedThemeColors(isDarkMode: boolean): ExtendedThemeColors {
  const base = getThemeColors(isDarkMode);
  return {
    ...base,
    headerBg: isDarkMode ? '#111827' : '#f3f4f6',
    inputBg: isDarkMode ? '#374151' : '#ffffff',
    inputBorder: isDarkMode ? '#4b5563' : '#d1d5db',
    hoverBg: isDarkMode ? '#374151' : '#f9fafb',
    focusRing: isDarkMode ? '#60a5fa' : '#2563eb',
    errorColor: '#ef4444',
    successColor: '#10b981',
    warningColor: '#f59e0b',
  };
}

interface ThemeContextValue {
  /** Whether dark mode is active */
  isDarkMode: boolean;
  /** Toggle dark mode on/off */
  toggleDarkMode: () => void;
  /** Set dark mode explicitly */
  setIsDarkMode: (value: boolean) => void;
  /** Core theme colors */
  themeColors: ThemeColors;
  /** Extended theme colors for all UI elements */
  colors: ExtendedThemeColors;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

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

  const value = useMemo<ThemeContextValue>(
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
