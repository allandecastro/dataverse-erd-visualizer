/**
 * UpdateBanner
 * Persistent, dismissible banner shown at the top of the app when a newer
 * release is available on GitHub. Lets an admin download and import the managed
 * solution into the current Dataverse environment in place.
 */

import { AlertTriangle, CheckCircle2, Download, RefreshCw, X } from 'lucide-react';
import { useUpdateCheck } from '@/hooks/useUpdateCheck';
import styles from '@/styles/UpdateBanner.module.css';

export function UpdateBanner() {
  const { status, startUpdate, dismiss } = useUpdateCheck();

  // Nothing to show while idle / checking / already up to date.
  if (status.phase === 'idle' || status.phase === 'checking' || status.phase === 'upToDate') {
    return null;
  }

  const variantClass =
    status.phase === 'error'
      ? styles.error
      : status.phase === 'done'
        ? styles.success
        : styles.info;

  return (
    <div className={`${styles.banner} ${variantClass}`} role="status" aria-live="polite">
      <span className={styles.icon}>
        {status.phase === 'error' ? (
          <AlertTriangle size={18} />
        ) : status.phase === 'done' ? (
          <CheckCircle2 size={18} />
        ) : status.phase === 'downloading' || status.phase === 'importing' ? (
          <RefreshCw size={18} className={styles.spinner} />
        ) : (
          <Download size={18} />
        )}
      </span>

      <div className={styles.content}>
        {status.phase === 'available' && (
          <>
            <span className={styles.message}>
              A new version is available: v{status.current} → v{status.latest.version}
            </span>
            <a
              className={styles.releaseLink}
              href={status.latest.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View release notes
            </a>
          </>
        )}

        {status.phase === 'downloading' && (
          <>
            <span className={styles.message}>Downloading update v{status.latest.version}…</span>
            <div className={styles.progressTrack}>
              <div className={`${styles.progressBar} ${styles.progressIndeterminate}`} />
            </div>
          </>
        )}

        {status.phase === 'importing' && (
          <>
            <span className={styles.message}>
              Importing solution into Dataverse
              {typeof status.progress === 'number' ? ` — ${Math.round(status.progress)}%` : '…'}
            </span>
            <div className={styles.progressTrack}>
              <div
                className={
                  typeof status.progress === 'number'
                    ? styles.progressBar
                    : `${styles.progressBar} ${styles.progressIndeterminate}`
                }
                style={
                  typeof status.progress === 'number'
                    ? { width: `${Math.max(0, Math.min(100, status.progress))}%` }
                    : undefined
                }
              />
            </div>
          </>
        )}

        {status.phase === 'done' && (
          <span className={styles.message}>
            Version {status.latest.version} installed. Reload to use the updated app.
          </span>
        )}

        {status.phase === 'error' && (
          <>
            <span className={styles.message}>{status.message}</span>
            {status.latest?.htmlUrl && (
              <a
                className={styles.releaseLink}
                href={status.latest.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download and import manually
              </a>
            )}
          </>
        )}
      </div>

      <div className={styles.actions}>
        {status.phase === 'available' && (
          <>
            <button className={styles.primaryButton} onClick={startUpdate}>
              <Download size={14} />
              Update now
            </button>
            <button className={styles.secondaryButton} onClick={dismiss}>
              Later
            </button>
          </>
        )}

        {status.phase === 'done' && (
          <button className={styles.primaryButton} onClick={() => window.location.reload()}>
            <RefreshCw size={14} />
            Reload
          </button>
        )}
      </div>

      {/* Downloading / importing are non-cancellable; hide the close button then. */}
      {status.phase !== 'downloading' && status.phase !== 'importing' && (
        <button className={styles.closeButton} onClick={dismiss} aria-label="Dismiss">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
