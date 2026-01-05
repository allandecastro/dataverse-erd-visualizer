/**
 * Sidebar color settings panel
 */

import { memo } from 'react';
import type { ColorSettings } from '@/types/erdTypes';
import styles from '@/styles/Sidebar.module.css';

export interface SidebarSettingsProps {
  isDarkMode: boolean;
  colorSettings: ColorSettings;
  borderColor: string;
  textColor: string;
  textSecondary: string;
  onColorSettingsChange: (key: keyof ColorSettings, value: string) => void;
}

export const SidebarSettings = memo(function SidebarSettings({
  isDarkMode,
  colorSettings,
  borderColor,
  textColor,
  textSecondary,
  onColorSettingsChange,
}: SidebarSettingsProps) {
  const { customTableColor, standardTableColor, lookupColor, edgeStyle } = colorSettings;
  const panelBg = isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)';
  const inputBg = isDarkMode ? '#1a1a1a' : '#ffffff';
  const selectArrowBg = `linear-gradient(45deg, transparent 50%, ${textColor} 50%), linear-gradient(135deg, ${textColor} 50%, transparent 50%)`;

  return (
    <div
      className={styles.settingsPanel}
      style={{
        background: panelBg,
        border: `1px solid ${borderColor}`,
      }}
    >
      <div className={styles.settingsTitle}>Color Settings</div>
      <div className={styles.settingsGrid}>
        <div>
          <label className={styles.settingsLabel} style={{ color: textSecondary }}>
            Custom Table Color
          </label>
          <input
            type="color"
            value={customTableColor}
            onChange={(e) => onColorSettingsChange('customTableColor', e.target.value)}
            className={styles.colorInput}
            style={{ border: `1px solid ${borderColor}` }}
          />
        </div>
        <div>
          <label className={styles.settingsLabel} style={{ color: textSecondary }}>
            Standard Table Color
          </label>
          <input
            type="color"
            value={standardTableColor}
            onChange={(e) => onColorSettingsChange('standardTableColor', e.target.value)}
            className={styles.colorInput}
            style={{ border: `1px solid ${borderColor}` }}
          />
        </div>
        <div>
          <label className={styles.settingsLabel} style={{ color: textSecondary }}>
            Lookup Field Color
          </label>
          <input
            type="color"
            value={lookupColor}
            onChange={(e) => onColorSettingsChange('lookupColor', e.target.value)}
            className={styles.colorInput}
            style={{ border: `1px solid ${borderColor}` }}
          />
        </div>
        <div>
          <label className={styles.settingsLabel} style={{ color: textSecondary }}>
            Relationship Line Style
          </label>
          <select
            key={`edgestyle-${isDarkMode}`}
            value={edgeStyle}
            onChange={(e) => onColorSettingsChange('edgeStyle', e.target.value)}
            className={styles.settingsSelect}
            style={{
              background: inputBg,
              border: `1px solid ${borderColor}`,
              color: textColor,
              backgroundImage: selectArrowBg,
            }}
          >
            <option value="smoothstep">Smooth Step (Recommended)</option>
            <option value="bezier">Bezier Curve</option>
            <option value="straight">Straight</option>
          </select>
        </div>
      </div>
    </div>
  );
});
