/**
 * Dialog for confirming whether to add a related table when adding a lookup field
 */

import { memo } from 'react';
import { X } from 'lucide-react';
import styles from '@/styles/AddRelatedTableDialog.module.css';

export interface AddRelatedTableDialogProps {
  fieldName: string;
  targetEntity: string;
  isDarkMode: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const AddRelatedTableDialog = memo(function AddRelatedTableDialog({
  fieldName,
  targetEntity,
  isDarkMode,
  onConfirm,
  onCancel,
}: AddRelatedTableDialogProps) {
  return (
    <div
      className={`${styles.overlay} ${isDarkMode ? styles.overlayDark : styles.overlayLight}`}
      onClick={onCancel}
    >
      <div
        className={`${styles.dialog} ${isDarkMode ? styles.dialogDark : styles.dialogLight}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${styles.header} ${isDarkMode ? styles.headerDark : styles.headerLight}`}>
          <h3 className={`${styles.title} ${isDarkMode ? styles.titleDark : styles.titleLight}`}>
            Add Related Table?
          </h3>
          <button
            onClick={onCancel}
            className={`${styles.closeButton} ${isDarkMode ? styles.closeButtonDark : styles.closeButtonLight}`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          <p
            className={`${styles.message} ${isDarkMode ? styles.messageDark : styles.messageLight}`}
          >
            The field <strong className={styles.fieldName}>{fieldName}</strong> is a lookup to the
            table <strong className={styles.targetEntity}>{targetEntity}</strong>.
          </p>
          <p
            className={`${styles.subMessage} ${isDarkMode ? styles.subMessageDark : styles.subMessageLight}`}
          >
            Would you like to add this table to the canvas as well?
          </p>
        </div>

        {/* Actions */}
        <div
          className={`${styles.actions} ${isDarkMode ? styles.actionsDark : styles.actionsLight}`}
        >
          <button
            onClick={onCancel}
            className={`${styles.cancelButton} ${isDarkMode ? styles.cancelButtonDark : styles.cancelButtonLight}`}
          >
            No, just add field
          </button>
          <button onClick={onConfirm} className={styles.confirmButton}>
            Yes, add table
          </button>
        </div>
      </div>
    </div>
  );
});
