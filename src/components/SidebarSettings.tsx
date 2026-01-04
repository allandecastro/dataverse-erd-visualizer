/**
 * Sidebar color settings panel
 */

import type { ColorSettings } from '@/types/erdTypes';

export interface SidebarSettingsProps {
  isDarkMode: boolean;
  colorSettings: ColorSettings;
  borderColor: string;
  textColor: string;
  textSecondary: string;
  onColorSettingsChange: (key: keyof ColorSettings, value: string) => void;
}

export function SidebarSettings({
  isDarkMode,
  colorSettings,
  borderColor,
  textColor,
  textSecondary,
  onColorSettingsChange,
}: SidebarSettingsProps) {
  const { customTableColor, standardTableColor, lookupColor, edgeStyle } = colorSettings;

  const selectStyle = {
    width: '100%',
    padding: '8px 32px 8px 10px',
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    border: `1px solid ${borderColor}`,
    borderRadius: '6px',
    color: textColor,
    fontSize: '12px',
    outline: 'none',
    cursor: 'pointer',
    WebkitAppearance: 'none' as const,
    MozAppearance: 'none' as const,
    appearance: 'none' as const,
    backgroundImage: `linear-gradient(45deg, transparent 50%, ${textColor} 50%), linear-gradient(135deg, ${textColor} 50%, transparent 50%)`,
    backgroundPosition: 'calc(100% - 16px) calc(1em + 2px), calc(100% - 11px) calc(1em + 2px)',
    backgroundSize: '5px 5px, 5px 5px',
    backgroundRepeat: 'no-repeat',
  };

  return (
    <div
      style={{
        marginBottom: '16px',
        padding: '12px',
        background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
        borderRadius: '6px',
        border: `1px solid ${borderColor}`,
      }}
    >
      <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '10px' }}>
        Color Settings
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div>
          <label
            style={{
              fontSize: '11px',
              color: textSecondary,
              display: 'block',
              marginBottom: '4px',
            }}
          >
            Custom Table Color
          </label>
          <input
            type="color"
            value={customTableColor}
            onChange={(e) => onColorSettingsChange('customTableColor', e.target.value)}
            style={{
              width: '100%',
              height: '32px',
              borderRadius: '4px',
              border: `1px solid ${borderColor}`,
              cursor: 'pointer',
            }}
          />
        </div>
        <div>
          <label
            style={{
              fontSize: '11px',
              color: textSecondary,
              display: 'block',
              marginBottom: '4px',
            }}
          >
            Standard Table Color
          </label>
          <input
            type="color"
            value={standardTableColor}
            onChange={(e) => onColorSettingsChange('standardTableColor', e.target.value)}
            style={{
              width: '100%',
              height: '32px',
              borderRadius: '4px',
              border: `1px solid ${borderColor}`,
              cursor: 'pointer',
            }}
          />
        </div>
        <div>
          <label
            style={{
              fontSize: '11px',
              color: textSecondary,
              display: 'block',
              marginBottom: '4px',
            }}
          >
            Lookup Field Color
          </label>
          <input
            type="color"
            value={lookupColor}
            onChange={(e) => onColorSettingsChange('lookupColor', e.target.value)}
            style={{
              width: '100%',
              height: '32px',
              borderRadius: '4px',
              border: `1px solid ${borderColor}`,
              cursor: 'pointer',
            }}
          />
        </div>
        <div>
          <label
            style={{
              fontSize: '11px',
              color: textSecondary,
              display: 'block',
              marginBottom: '4px',
            }}
          >
            Relationship Line Style
          </label>
          <select
            key={`edgestyle-${isDarkMode}`}
            value={edgeStyle}
            onChange={(e) => onColorSettingsChange('edgeStyle', e.target.value)}
            style={selectStyle}
          >
            <option value="smoothstep">Smooth Step (Recommended)</option>
            <option value="bezier">Bezier Curve</option>
            <option value="straight">Straight</option>
          </select>
        </div>
      </div>
    </div>
  );
}
