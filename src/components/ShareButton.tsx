/**
 * Share Button Component
 * Generates shareable URL and copies to clipboard
 */

import { useState, useCallback } from 'react';
import { Share2, Check, AlertCircle } from 'lucide-react';
import { useTheme } from '@/context';
import styles from '@/styles/Toolbar.module.css';

export interface ShareButtonProps {
  onGenerateShareURL: () => { url: string; warning?: string } | { error: string };
}

type ButtonState = 'idle' | 'copying' | 'copied' | 'error';

export function ShareButton({ onGenerateShareURL }: ShareButtonProps) {
  const { isDarkMode, themeColors } = useTheme();
  const { borderColor, textColor } = themeColors;
  const [buttonState, setButtonState] = useState<ButtonState>('idle');

  const buttonBg = isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)';
  const shortcutBg = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

  const handleShare = useCallback(async () => {
    setButtonState('copying');

    try {
      // Generate URL
      const result = onGenerateShareURL();

      if ('error' in result) {
        throw new Error(result.error);
      }

      // Copy to clipboard
      await navigator.clipboard.writeText(result.url);

      // Show success state
      setButtonState('copied');

      // Reset after 2 seconds
      setTimeout(() => setButtonState('idle'), 2000);

      // Note: Warning toast is handled by parent component (App.tsx)
    } catch (error) {
      console.error('[ShareButton] Failed to copy URL:', error);
      setButtonState('error');
      setTimeout(() => setButtonState('idle'), 3000);
    }
  }, [onGenerateShareURL]);

  return (
    <button
      onClick={handleShare}
      disabled={buttonState === 'copying'}
      title="Generate shareable URL (Ctrl+Shift+C)"
      className={styles.searchButton}
      style={{
        background: buttonBg,
        border: `1px solid ${borderColor}`,
        color: textColor,
        opacity: buttonState === 'copying' ? 0.6 : 1,
        cursor: buttonState === 'copying' ? 'wait' : 'pointer',
      }}
    >
      {buttonState === 'idle' && <Share2 size={16} />}
      {buttonState === 'copying' && <Share2 size={16} />}
      {buttonState === 'copied' && <Check size={16} style={{ color: '#10b981' }} />}
      {buttonState === 'error' && <AlertCircle size={16} style={{ color: '#ef4444' }} />}

      {buttonState === 'copied' ? 'Copied!' : 'Share'}

      {buttonState === 'idle' && (
        <span className={styles.shortcutBadge} style={{ background: shortcutBg }}>
          Ctrl+Shift+C
        </span>
      )}
    </button>
  );
}
