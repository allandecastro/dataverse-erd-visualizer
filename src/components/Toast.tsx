/**
 * Toast notification component
 */

import type { ToastProps } from '@/types/erdTypes';

export function Toast({ message, type, isDarkMode }: ToastProps) {
  const bgColor =
    type === 'success'
      ? isDarkMode
        ? 'rgba(16, 185, 129, 0.9)'
        : 'rgba(16, 185, 129, 0.95)'
      : isDarkMode
        ? 'rgba(239, 68, 68, 0.9)'
        : 'rgba(239, 68, 68, 0.95)';

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '12px 20px',
          background: bgColor,
          color: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          zIndex: 10000,
          fontSize: '14px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'slideIn 0.3s ease-out',
        }}
      >
        {message}
      </div>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
