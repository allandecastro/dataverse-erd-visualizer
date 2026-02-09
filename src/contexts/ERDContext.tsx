/**
 * ERD Context Provider
 * Provides global state management for the ERD diagram to eliminate prop drilling
 * Wraps useERDState hook and makes it available via useERD() hook
 */

import { createContext, useContext, type ReactNode } from 'react';
import type { ERDState } from '@/types/erdTypes';

/**
 * Context for ERD diagram state
 * Contains all shared state: theme, entities, filters, zoom, layout, etc.
 */
const ERDContext = createContext<ERDState | null>(null);

export interface ERDProviderProps {
  children: ReactNode;
  /** ERD state from useERDState hook */
  state: ERDState;
}

/**
 * Provider component that wraps the app and provides ERD state
 * Should be placed high in the component tree to make state available to all children
 *
 * The state should be created via useERDState() in the parent component
 *
 * @example
 * ```tsx
 * function App() {
 *   const state = useERDState({ entities, relationships });
 *   return (
 *     <ERDProvider state={state}>
 *       <ERDVisualizerContent />
 *     </ERDProvider>
 *   );
 * }
 * ```
 */
export function ERDProvider({ children, state }: ERDProviderProps) {
  return <ERDContext.Provider value={state}>{children}</ERDContext.Provider>;
}

/**
 * Hook to access ERD state from any component
 * Must be used within an ERDProvider component
 *
 * @throws Error if used outside of ERDProvider
 * @returns ERDState object with all state and setters
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isDarkMode, selectedEntities, zoom, setZoom } = useERD();
 *   // ... use state
 * }
 * ```
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useERD(): ERDState {
  const context = useContext(ERDContext);
  if (!context) {
    throw new Error('useERD must be used within ERDProvider');
  }
  return context;
}
