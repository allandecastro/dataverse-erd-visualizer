/**
 * Dialog for confirming whether to add a related table when adding a lookup field
 */

import { X } from 'lucide-react';

export interface AddRelatedTableDialogProps {
  fieldName: string;
  targetEntity: string;
  isDarkMode: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AddRelatedTableDialog({
  fieldName,
  targetEntity,
  isDarkMode,
  onConfirm,
  onCancel,
}: AddRelatedTableDialogProps) {
  // Theme colors
  const bgColor = isDarkMode ? '#1f2937' : '#ffffff';
  const overlayColor = isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)';
  const textColor = isDarkMode ? '#f3f4f6' : '#1f2937';
  const textSecondary = isDarkMode ? '#9ca3af' : '#6b7280';
  const borderColor = isDarkMode ? '#374151' : '#e5e7eb';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: overlayColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: bgColor,
          borderRadius: '12px',
          boxShadow: isDarkMode
            ? '0 20px 40px rgba(0, 0, 0, 0.6)'
            : '0 20px 40px rgba(0, 0, 0, 0.15)',
          maxWidth: '400px',
          width: '90%',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: `1px solid ${borderColor}`,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 600,
              color: textColor,
            }}
          >
            Add Related Table?
          </h3>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              color: textSecondary,
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              color: textColor,
              lineHeight: '1.5',
            }}
          >
            The field <strong style={{ color: '#3b82f6' }}>{fieldName}</strong> is a lookup to the
            table <strong style={{ color: '#f59e0b' }}>{targetEntity}</strong>.
          </p>
          <p
            style={{
              margin: '12px 0 0',
              fontSize: '14px',
              color: textSecondary,
              lineHeight: '1.5',
            }}
          >
            Would you like to add this table to the canvas as well?
          </p>
        </div>

        {/* Actions */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: `1px solid ${borderColor}`,
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              background: isDarkMode ? '#374151' : '#f3f4f6',
              border: `1px solid ${borderColor}`,
              borderRadius: '6px',
              color: textColor,
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            No, just add field
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              border: 'none',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Yes, add table
          </button>
        </div>
      </div>
    </div>
  );
}
