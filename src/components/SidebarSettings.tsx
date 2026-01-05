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

  // SVG chevron arrow for select dropdown
  const arrowColor = isDarkMode ? '%23e2e8f0' : '%231e293b';
  const selectArrowBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${arrowColor}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

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
              backgroundColor: inputBg,
              border: `1px solid ${borderColor}`,
              color: textColor,
              backgroundImage: selectArrowBg,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'calc(100% - 10px) center',
              backgroundSize: '12px 12px',
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
