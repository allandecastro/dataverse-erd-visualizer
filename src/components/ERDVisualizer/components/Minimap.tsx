/**
 * Minimap navigation component
 */

import type { MinimapProps } from '../types';

export function Minimap({
  entities,
  entityPositions,
  pan,
  zoom,
  containerRef,
  isDarkMode,
  colorSettings,
  themeColors,
  onNavigate,
}: MinimapProps) {
  const { borderColor, textSecondary } = themeColors;
  const { customTableColor, standardTableColor } = colorSettings;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert minimap coordinates to canvas coordinates
    const canvasX = x * 50;
    const canvasY = y * 50;

    onNavigate(canvasX, canvasY);
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      right: '20px',
      width: '200px',
      height: '150px',
      background: isDarkMode ? 'rgba(36, 36, 36, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      border: `1px solid ${borderColor}`,
      borderRadius: '8px',
      padding: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      zIndex: 1000
    }}>
      <div style={{ fontSize: '10px', fontWeight: '600', marginBottom: '6px', color: textSecondary }}>
        Minimap - Click to Navigate
      </div>
      <div
        onClick={handleClick}
        style={{
          position: 'relative',
          width: '100%',
          height: 'calc(100% - 20px)',
          background: isDarkMode ? '#1a1a1a' : '#f0f0f0',
          borderRadius: '4px',
          overflow: 'hidden',
          cursor: 'pointer'
        }}
      >
        {/* Viewport rectangle */}
        {containerRef.current && (() => {
          const container = containerRef.current;
          const viewportX = -pan.x / zoom / 50;
          const viewportY = -pan.y / zoom / 50;
          const viewportWidth = container.clientWidth / zoom / 50;
          const viewportHeight = container.clientHeight / zoom / 50;

          return (
            <div style={{
              position: 'absolute',
              left: `${Math.max(0, viewportX)}px`,
              top: `${Math.max(0, viewportY)}px`,
              width: `${Math.min(184, viewportWidth)}px`,
              height: `${Math.min(124, viewportHeight)}px`,
              border: '2px solid #60a5fa',
              background: 'rgba(96, 165, 250, 0.1)',
              borderRadius: '2px',
              pointerEvents: 'none'
            }} />
          );
        })()}

        {/* Entity dots */}
        {entities.map(entity => {
          const pos = entityPositions[entity.logicalName] || { x: 0, y: 0 };
          return (
            <div
              key={entity.logicalName}
              style={{
                position: 'absolute',
                left: `${(pos.x / 50)}px`,
                top: `${(pos.y / 50)}px`,
                width: '6px',
                height: '6px',
                background: entity.isCustomEntity ? customTableColor : standardTableColor,
                borderRadius: '1px'
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
