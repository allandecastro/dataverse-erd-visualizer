/**
 * Color Picker Popover - Floating popover for per-entity color selection
 * Renders via React Portal to escape React Flow's transform/z-index constraints
 */

import { useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Pipette, RotateCcw, Check } from 'lucide-react';
import styles from '@/styles/ColorPickerPopover.module.css';

export interface ColorPickerPopoverProps {
  entityName: string;
  currentColor: string;
  hasOverride: boolean;
  isDarkMode: boolean;
  anchorPosition: { x: number; y: number };
  usedColors: string[]; // Colors currently used in the diagram (for reuse)
  onColorChange: (entityName: string, color: string) => void;
  onColorReset: (entityName: string) => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#0ea5e9', // Sky
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#64748b', // Slate
];

export function ColorPickerPopover({
  entityName,
  currentColor,
  hasOverride,
  isDarkMode,
  anchorPosition,
  usedColors,
  onColorChange,
  onColorReset,
  onClose,
}: ColorPickerPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // All unique colors currently assigned to entities in the diagram
  const uniqueUsedColors = usedColors;

  // Adjust position to keep popover within viewport
  const getPosition = useCallback(() => {
    const popoverWidth = 220;
    // Add extra height when "Used in diagram" section is visible
    const popoverHeight = 180 + (uniqueUsedColors.length > 0 ? 44 : 0);
    let x = anchorPosition.x;
    let y = anchorPosition.y;

    // Keep within viewport bounds
    if (x + popoverWidth > window.innerWidth) {
      x = anchorPosition.x - popoverWidth - 8;
    }
    if (y + popoverHeight > window.innerHeight) {
      y = window.innerHeight - popoverHeight - 8;
    }
    if (y < 8) y = 8;

    return { left: x, top: y };
  }, [anchorPosition, uniqueUsedColors.length]);

  const handleSwatchClick = (color: string) => {
    onColorChange(entityName, color);
    onClose();
  };

  const handleCustomColor = () => {
    colorInputRef.current?.click();
  };

  const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onColorChange(entityName, e.target.value);
  };

  const handleReset = () => {
    onColorReset(entityName);
    onClose();
  };

  const position = getPosition();
  const normalizedCurrent = currentColor.toLowerCase();

  const popoverClasses = [
    styles.popover,
    isDarkMode ? styles.popoverDark : styles.popoverLight,
  ].join(' ');

  return createPortal(
    <>
      {/* Backdrop to catch outside clicks */}
      <div className={styles.backdrop} onClick={onClose} />

      {/* Popover */}
      <div
        ref={popoverRef}
        className={popoverClasses}
        style={{ left: position.left, top: position.top }}
        role="dialog"
        aria-label="Choose table color"
      >
        <div className={`${styles.title} ${isDarkMode ? styles.titleDark : styles.titleLight}`}>
          Table Color
        </div>

        {/* Preset swatches */}
        <div className={styles.swatchGrid}>
          {PRESET_COLORS.map((color) => {
            const isActive = normalizedCurrent === color.toLowerCase();
            return (
              <button
                key={color}
                className={`${styles.swatch} ${isActive ? styles.swatchActive : ''}`}
                style={{ background: color, color: color }}
                onClick={() => handleSwatchClick(color)}
                title={color}
                aria-label={`Select color ${color}`}
                aria-pressed={isActive}
              >
                {isActive && <Check size={14} color="#ffffff" />}
              </button>
            );
          })}
        </div>

        {/* Used in diagram - shows custom colors from other entities for reuse */}
        {uniqueUsedColors.length > 0 && (
          <>
            <div
              className={`${styles.sectionLabel} ${isDarkMode ? styles.titleDark : styles.titleLight}`}
            >
              Used in diagram
            </div>
            <div className={styles.usedColorRow}>
              {uniqueUsedColors.map((color) => {
                const isActive = normalizedCurrent === color.toLowerCase();
                return (
                  <button
                    key={color}
                    className={`${styles.swatch} ${isActive ? styles.swatchActive : ''}`}
                    style={{ background: color, color: color }}
                    onClick={() => handleSwatchClick(color)}
                    title={color}
                    aria-label={`Select color ${color}`}
                    aria-pressed={isActive}
                  >
                    {isActive && <Check size={14} color="#ffffff" />}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div
          className={`${styles.divider} ${isDarkMode ? styles.dividerDark : styles.dividerLight}`}
        />

        {/* Action buttons */}
        <div className={styles.buttonRow}>
          <button
            className={`${styles.customButton} ${isDarkMode ? styles.customButtonDark : styles.customButtonLight}`}
            onClick={handleCustomColor}
          >
            <Pipette size={12} />
            Custom
          </button>

          {hasOverride && (
            <button
              className={`${styles.resetButton} ${isDarkMode ? styles.resetButtonDark : styles.resetButtonLight}`}
              onClick={handleReset}
            >
              <RotateCcw size={12} />
              Reset
            </button>
          )}
        </div>

        {/* Hidden native color input */}
        <input
          ref={colorInputRef}
          type="color"
          value={currentColor}
          onChange={handleColorInputChange}
          className={styles.hiddenInput}
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>
    </>,
    document.body
  );
}
