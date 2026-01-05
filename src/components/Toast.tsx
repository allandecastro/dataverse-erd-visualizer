/**
 * Toast notification component
 */

import { useTheme } from '@/context';
import type { ToastType } from '@/types/erdTypes';
import styles from '@/styles/Toast.module.css';

export interface ToastProps {
  message: string;
  type: ToastType;
}

export function Toast({ message, type }: ToastProps) {
  const { isDarkMode } = useTheme();

  const typeClass =
    type === 'success'
      ? isDarkMode
        ? styles.successDark
        : styles.success
      : isDarkMode
        ? styles.errorDark
        : styles.error;

  return (
    <div className={`${styles.toast} ${typeClass}`}>
      {message}
    </div>
  );
}
