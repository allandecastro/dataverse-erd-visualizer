/**
 * Root component that loads data and renders the ERD Visualizer
 */

import { useDataverseData } from '@/hooks/useDataverseData';
import App from './App';

export function Root() {
  const {
    entities,
    relationships,
    isLoading,
    loadingProgress,
    error,
    isMockMode,
    newRelationshipsDetected,
  } = useDataverseData();

  if (import.meta.env.DEV) {
    console.warn('[Root] newRelationshipsDetected:', newRelationshipsDetected);
  }

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#111827',
          color: '#f3f4f6',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ fontSize: '24px', marginBottom: '16px' }}>Loading Dataverse Metadata...</div>
        {loadingProgress && (
          <div style={{ fontSize: '14px', color: '#9ca3af' }}>{loadingProgress.message}</div>
        )}
        {isMockMode && (
          <div style={{ fontSize: '12px', color: '#60a5fa', marginTop: '8px' }}>
            Mock Mode - Using sample data
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#111827',
          color: '#f3f4f6',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ fontSize: '24px', marginBottom: '16px', color: '#ef4444' }}>
          Error Loading Data
        </div>
        <div style={{ fontSize: '14px', color: '#9ca3af', maxWidth: '400px', textAlign: 'center' }}>
          {error.message}
        </div>
      </div>
    );
  }

  return (
    <App
      entities={entities}
      relationships={relationships}
      newRelationshipsDetected={newRelationshipsDetected}
    />
  );
}
