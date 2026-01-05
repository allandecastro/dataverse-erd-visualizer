/**
 * Theme Context Definition
 *
 * Separated from ThemeContext.tsx for React Fast Refresh compatibility.
 * The context is defined here and used by both ThemeProvider and hooks.
 */

import { createContext } from 'react';
import type { ThemeColors } from '@/types/erdTypes';
import type { ExtendedThemeColors } from './themeUtils';

export interface ThemeContextValue {
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

/**
 * Theme context for providing theme state throughout the app
 */
export const ThemeContext = createContext<ThemeContextValue | null>(null);
