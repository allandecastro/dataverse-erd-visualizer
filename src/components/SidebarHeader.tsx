/**
 * Sidebar header with logo, title, theme toggle and social links
 */

import { Moon, Sun, Settings } from 'lucide-react';
import { LOGO_DATA_URL } from '@/constants';

export interface SidebarHeaderProps {
  isDarkMode: boolean;
  showSettings: boolean;
  borderColor: string;
  textColor: string;
  textSecondary: string;
  onToggleDarkMode: () => void;
  onToggleSettings: () => void;
}

export function SidebarHeader({
  isDarkMode,
  showSettings,
  borderColor,
  textColor,
  textSecondary,
  onToggleDarkMode,
  onToggleSettings,
}: SidebarHeaderProps) {
  const buttonStyle = {
    flex: 1,
    padding: '8px',
    background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    border: `1px solid ${borderColor}`,
    borderRadius: '6px',
    color: textColor,
    cursor: 'pointer',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: '6px',
    fontSize: '12px',
  };

  return (
    <>
      {/* Header row: Logo + Title + Social icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <a
          href="https://github.com/allandecastro/dataverse-erd-visualizer"
          target="_blank"
          rel="noopener noreferrer"
          title="View on GitHub"
          style={{ display: 'flex', flexShrink: 0, transition: 'opacity 0.2s' }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <img
            src={LOGO_DATA_URL}
            alt="Dataverse ERD Visualizer"
            style={{ width: '36px', height: '36px', borderRadius: '6px', cursor: 'pointer' }}
          />
        </a>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: '14px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Dataverse ERD Visualizer
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
            <span style={{ fontSize: '10px', color: textSecondary, fontWeight: '500' }}>
              v{__APP_VERSION__}
            </span>
            <span
              style={{
                fontSize: '8px',
                fontWeight: '700',
                padding: '1px 4px',
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                color: '#ffffff',
                borderRadius: '3px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              BETA
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
          <a
            href="https://github.com/allandecastro/dataverse-erd-visualizer"
            target="_blank"
            rel="noopener noreferrer"
            title="View on GitHub"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '26px',
              height: '26px',
              borderRadius: '5px',
              background: isDarkMode ? '#ffffff' : '#24292f',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill={isDarkMode ? '#24292f' : '#ffffff'}
            >
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
          <a
            href="https://www.linkedin.com/in/allandecastro/"
            target="_blank"
            rel="noopener noreferrer"
            title="Connect on LinkedIn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '26px',
              height: '26px',
              borderRadius: '5px',
              background: '#0A66C2',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffffff">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
        </div>
      </div>

      {/* Theme and Settings */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button onClick={onToggleDarkMode} style={buttonStyle}>
          {isDarkMode ? <Moon size={14} /> : <Sun size={14} />}
          {isDarkMode ? 'Dark' : 'Light'}
        </button>
        <button
          onClick={onToggleSettings}
          style={{
            padding: '8px',
            background: showSettings
              ? isDarkMode
                ? 'rgba(96, 165, 250, 0.2)'
                : 'rgba(37, 99, 235, 0.2)'
              : isDarkMode
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.05)',
            border: `1px solid ${showSettings ? (isDarkMode ? '#60a5fa' : '#2563eb') : borderColor}`,
            borderRadius: '6px',
            color: textColor,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Settings size={16} />
        </button>
      </div>
    </>
  );
}
