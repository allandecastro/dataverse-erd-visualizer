import { useDataverseData } from '@/hooks/useDataverseData';
import ERDVisualizer from '@/components/ERDVisualizer/ERDVisualizer';

export default function App() {
  const { entities, relationships, isLoading, loadingProgress, error, isMockMode } = useDataverseData();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#1a1a1a',
        color: '#e2e8f0',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(96, 165, 250, 0.3)',
            borderTop: '4px solid #60a5fa',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <div style={{ fontSize: '18px', fontWeight: '600' }}>
            {isMockMode ? 'Loading Mock Data...' : 'Loading Dataverse Metadata...'}
          </div>
          <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '8px' }}>
            {loadingProgress?.message || 'Initializing...'}
          </div>
          {loadingProgress && loadingProgress.totalEntities > 0 && (
            <div style={{
              fontSize: '13px',
              color: '#60a5fa',
              marginTop: '12px',
              padding: '8px 16px',
              background: 'rgba(96, 165, 250, 0.1)',
              borderRadius: '6px'
            }}>
              {loadingProgress.totalEntities} entities found
            </div>
          )}
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#1a1a1a',
        color: '#e2e8f0',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ 
          maxWidth: '600px', 
          padding: '40px',
          background: '#2d2d2d',
          borderRadius: '12px',
          border: '2px solid #ef4444'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444', marginBottom: '16px' }}>
            ⚠️ Error Loading Dataverse
          </div>
          <div style={{ fontSize: '16px', marginBottom: '20px' }}>
            {error.message}
          </div>
          <div style={{ 
            fontSize: '14px', 
            color: '#94a3b8',
            background: '#1a1a1a',
            padding: '16px',
            borderRadius: '6px',
            fontFamily: 'monospace'
          }}>
            <strong>Troubleshooting:</strong><br />
            • Verify you have read permissions on Entity Definitions<br />
            • Check if Web API is accessible<br />
            • Ensure you're running in Dataverse context<br />
            • Open browser console for detailed error
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              background: '#60a5fa',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {isMockMode && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: '#ffffff',
          padding: '6px 16px',
          borderRadius: '0 0 8px 8px',
          fontSize: '12px',
          fontWeight: '600',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '14px' }}>🧪</span>
          MOCK MODE - Using sample data for testing
          <span style={{
            fontSize: '10px',
            opacity: 0.8,
            marginLeft: '8px'
          }}>
            ({entities.length} entities, {relationships.length} relationships)
          </span>
        </div>
      )}
      <ERDVisualizer entities={entities} relationships={relationships} />
    </>
  );
}
