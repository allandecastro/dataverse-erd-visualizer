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
  const {
    customTableColor,
    standardTableColor,
    lookupColor,
    edgeStyle,
    lineNotation,
    lineStroke,
    lineThickness,
    useRelationshipTypeColors,
    oneToManyColor,
    manyToManyColor,
  } = colorSettings;
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

        {/* Line Notation Style */}
        <div>
          <label className={styles.settingsLabel} style={{ color: textSecondary }}>
            Line Notation Style
          </label>
          <select
            key={`linenotation-${isDarkMode}`}
            value={lineNotation || 'simple'}
            onChange={(e) => onColorSettingsChange('lineNotation', e.target.value)}
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
            <option value="simple">Simple Arrows</option>
            <option value="crowsfoot">Crow's Foot Notation</option>
            <option value="uml">UML Style</option>
          </select>
        </div>

        {/* Line Stroke Style */}
        <div>
          <label className={styles.settingsLabel} style={{ color: textSecondary }}>
            Line Stroke Style
          </label>
          <select
            key={`linestroke-${isDarkMode}`}
            value={lineStroke || 'solid'}
            onChange={(e) => onColorSettingsChange('lineStroke', e.target.value)}
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
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </select>
        </div>

        {/* Line Thickness Slider */}
        <div>
          <label className={styles.settingsLabel} style={{ color: textSecondary }}>
            Line Thickness: {lineThickness || 1.5}px
          </label>
          <input
            type="range"
            min="1"
            max="5"
            step="0.5"
            value={lineThickness || 1.5}
            onChange={(e) =>
              onColorSettingsChange('lineThickness', parseFloat(e.target.value).toString())
            }
            className={styles.rangeInput}
            style={{
              width: '100%',
              accentColor: isDarkMode ? '#60a5fa' : '#3b82f6',
            }}
          />
        </div>

        {/* Color by Relationship Type Checkbox */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label
            className={styles.settingsLabel}
            style={{
              color: textSecondary,
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={useRelationshipTypeColors || false}
              onChange={(e) =>
                onColorSettingsChange('useRelationshipTypeColors', e.target.checked.toString())
              }
              style={{ marginRight: '8px', cursor: 'pointer' }}
            />
            Color by Relationship Type
          </label>
        </div>

        {/* Conditional Type Color Pickers */}
        {useRelationshipTypeColors && (
          <>
            <div>
              <label className={styles.settingsLabel} style={{ color: textSecondary }}>
                Single Relationships (1:N / N:1)
              </label>
              <input
                type="color"
                value={oneToManyColor || '#f97316'}
                onChange={(e) => onColorSettingsChange('oneToManyColor', e.target.value)}
                className={styles.colorInput}
                style={{ border: `1px solid ${borderColor}` }}
              />
            </div>
            <div>
              <label className={styles.settingsLabel} style={{ color: textSecondary }}>
                Many-to-Many (N:N)
              </label>
              <input
                type="color"
                value={manyToManyColor || '#8b5cf6'}
                onChange={(e) => onColorSettingsChange('manyToManyColor', e.target.value)}
                className={styles.colorInput}
                style={{ border: `1px solid ${borderColor}` }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
});
