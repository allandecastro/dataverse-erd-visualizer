/**
 * useUpdateCheck
 * Checks GitHub for a newer release on load and orchestrates the download +
 * in-place import of the managed solution into the current Dataverse environment.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getLatestReleaseInfo,
  isUpdateAvailable,
  getManagedSolutionBase64,
  type LatestRelease,
} from '@/services/githubReleaseService';
import { dataverseApi, SolutionImportForbiddenError } from '@/services/dataverseApi';
import {
  getUpdateCheckEnabled,
  getDismissedVersion,
  setDismissedVersion,
  getCachedLatest,
  setCachedLatest,
  isCacheFresh,
} from '@/services/updatePreferences';

export type UpdateStatus =
  | { phase: 'idle' }
  | { phase: 'checking' }
  | { phase: 'upToDate' }
  | { phase: 'available'; current: string; latest: LatestRelease }
  | { phase: 'downloading'; latest: LatestRelease }
  | { phase: 'importing'; latest: LatestRelease; progress: number | null }
  | { phase: 'done'; latest: LatestRelease }
  | { phase: 'error'; message: string; latest?: LatestRelease };

/** How often to poll the async import operation (ms) */
const POLL_INTERVAL_MS = 3000;
/** Safety cap on polling attempts (~10 min at 3s) */
const MAX_POLL_ATTEMPTS = 200;

/** statecode 3 = Completed */
const ASYNC_STATE_COMPLETED = 3;
/** statuscode 30 = Succeeded */
const ASYNC_STATUS_SUCCEEDED = 30;

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Resolve the latest release, throttled: reuse a fresh cached result, otherwise
 * fetch and cache. On a failed fetch, fall back to a stale cache if present.
 */
async function resolveLatestRelease(): Promise<LatestRelease> {
  const cached = getCachedLatest();
  if (cached && isCacheFresh(cached)) {
    return cached.release;
  }
  try {
    const fresh = await getLatestReleaseInfo();
    setCachedLatest(fresh);
    return fresh;
  } catch (error) {
    if (cached) return cached.release;
    throw error;
  }
}

export function useUpdateCheck() {
  // Start in "checking" when enabled so the first render already reflects the
  // pending check without a synchronous setState inside the effect.
  const [status, setStatus] = useState<UpdateStatus>(() =>
    getUpdateCheckEnabled() ? { phase: 'checking' } : { phase: 'idle' }
  );
  const hasCheckedRef = useRef(false);
  const isUpdatingRef = useRef(false);

  // Run the version check once on mount.
  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    if (!getUpdateCheckEnabled()) return;

    let cancelled = false;

    (async () => {
      try {
        const latest = await resolveLatestRelease();
        if (cancelled) return;

        const current = __APP_VERSION__;
        const dismissed = getDismissedVersion();

        if (isUpdateAvailable(current, latest.version) && latest.version !== dismissed) {
          setStatus({ phase: 'available', current, latest });
        } else {
          setStatus({ phase: 'upToDate' });
        }
      } catch {
        // A failed check should stay silent — never block the app on the network.
        if (!cancelled) setStatus({ phase: 'idle' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /** Download the managed solution and import it in place. */
  const startUpdate = useCallback(async () => {
    if (isUpdatingRef.current) return;
    if (status.phase !== 'available') return;
    const { latest } = status;

    if (!dataverseApi.isInDataverseContext()) {
      setStatus({
        phase: 'error',
        message: 'Updating requires running inside a Dataverse environment.',
        latest,
      });
      return;
    }

    isUpdatingRef.current = true;
    try {
      // 1. Fetch the managed solution zip as base64 (Pages script include first,
      //    then a direct binary download fallback).
      setStatus({ phase: 'downloading', latest });
      const base64 = await getManagedSolutionBase64(latest);

      // 2. Start the async import.
      setStatus({ phase: 'importing', latest, progress: null });
      const { asyncOperationId, importJobId } = await dataverseApi.importSolutionAsync(base64);

      // 3. Poll until the async operation completes.
      for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        await delay(POLL_INTERVAL_MS);

        const progress = importJobId ? await dataverseApi.getImportJobProgress(importJobId) : null;
        setStatus({ phase: 'importing', latest, progress });

        if (!asyncOperationId) continue;

        const op = await dataverseApi.getAsyncOperationStatus(asyncOperationId);
        if (op.stateCode === ASYNC_STATE_COMPLETED) {
          if (op.statusCode === ASYNC_STATUS_SUCCEEDED) {
            setStatus({ phase: 'done', latest });
          } else {
            setStatus({
              phase: 'error',
              message: op.message || 'The solution import did not complete successfully.',
              latest,
            });
          }
          return;
        }
      }

      setStatus({
        phase: 'error',
        message: 'The solution import is taking longer than expected. Check the environment.',
        latest,
      });
    } catch (error) {
      const message =
        error instanceof SolutionImportForbiddenError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'The update failed. You can download and import the solution manually.';
      setStatus({ phase: 'error', message, latest });
    } finally {
      isUpdatingRef.current = false;
    }
  }, [status]);

  /**
   * Dismiss the banner. Only an explicit "Later" on an available update is
   * remembered — closing an error is not persisted, so a failed attempt still
   * re-prompts on the next load (letting the user retry).
   */
  const dismiss = useCallback(() => {
    if (status.phase === 'available') {
      setDismissedVersion(status.latest.version);
    }
    setStatus({ phase: 'idle' });
  }, [status]);

  return { status, startUpdate, dismiss };
}
