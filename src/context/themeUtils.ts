/**
 * Theme utility functions - Color calculations for light/dark mode
 *
 * Separated from ThemeContext.tsx for React Fast Refresh compatibility.
 */

import type { ThemeColors } from '@/types/erdTypes';

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

/**
 * Calculates theme colors based on dark mode state
 */
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

/**
 * Calculates extended theme colors based on dark mode state
 */
export function getExtendedThemeColors(isDarkMode: boolean): ExtendedThemeColors {
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
