/**
 * Tests for useUpdateCheck — the auto-update orchestration hook.
 * Services are mocked so we exercise the state machine (check-on-mount,
 * download → import → poll, and error handling) in isolation.
 * Note: the build-time global __APP_VERSION__ is defined as '0.0.0' in vitest.config.ts.
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { useUpdateCheck } from '../useUpdateCheck';
import type { LatestRelease } from '@/services/githubReleaseService';
import { getLatestRelease, getManagedSolutionBase64 } from '@/services/githubReleaseService';
import { dataverseApi, SolutionImportForbiddenError } from '@/services/dataverseApi';
import {
  getUpdateCheckEnabled,
  getDismissedVersion,
  setDismissedVersion,
} from '@/services/updatePreferences';

// Keep the real version-comparison logic, mock only the network entry points.
vi.mock('@/services/githubReleaseService', async () => {
  const actual = (await vi.importActual('@/services/githubReleaseService')) as Record<
    string,
    unknown
  >;
  return {
    ...actual,
    getLatestRelease: vi.fn(),
    getManagedSolutionBase64: vi.fn(),
  };
});

vi.mock('@/services/updatePreferences', () => ({
  getUpdateCheckEnabled: vi.fn(() => true),
  getDismissedVersion: vi.fn(() => null),
  setDismissedVersion: vi.fn(),
}));

vi.mock('@/services/dataverseApi', async () => {
  const actual = (await vi.importActual('@/services/dataverseApi')) as Record<string, unknown>;
  return {
    SolutionImportForbiddenError: actual.SolutionImportForbiddenError,
    dataverseApi: {
      isInDataverseContext: vi.fn(() => true),
      importSolutionAsync: vi.fn(),
      getAsyncOperationStatus: vi.fn(),
      getImportJobProgress: vi.fn(),
    },
  };
});

const releaseV1: LatestRelease = {
  tagName: 'v1.0.0.0',
  version: '1.0.0.0',
  htmlUrl: 'https://github.com/x/y/releases/tag/v1.0.0.0',
  managedAsset: {
    apiUrl: 'https://api.github.com/assets/2',
    browserDownloadUrl: 'https://github.com/x/y/managed.zip',
    name: 'DataverseERDVisualizer_1.0.0.0_managed.zip',
    size: 10,
  },
};

const mockGetLatestRelease = vi.mocked(getLatestRelease);
const mockGetSolution = vi.mocked(getManagedSolutionBase64);
const mockGetUpdateCheckEnabled = vi.mocked(getUpdateCheckEnabled);
const mockGetDismissedVersion = vi.mocked(getDismissedVersion);
const mockSetDismissedVersion = vi.mocked(setDismissedVersion);
const mockImport = vi.mocked(dataverseApi.importSolutionAsync);
const mockAsyncStatus = vi.mocked(dataverseApi.getAsyncOperationStatus);
const mockProgress = vi.mocked(dataverseApi.getImportJobProgress);
const mockIsInContext = vi.mocked(dataverseApi.isInDataverseContext);

describe('useUpdateCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUpdateCheckEnabled.mockReturnValue(true);
    mockGetDismissedVersion.mockReturnValue(null);
    mockIsInContext.mockReturnValue(true);
  });

  describe('check on mount', () => {
    it('stays idle and skips the network when checks are disabled', async () => {
      mockGetUpdateCheckEnabled.mockReturnValue(false);

      const { result } = renderHook(() => useUpdateCheck());

      expect(result.current.status.phase).toBe('idle');
      expect(mockGetLatestRelease).not.toHaveBeenCalled();
    });

    it('surfaces an available update when a newer release exists', async () => {
      mockGetLatestRelease.mockResolvedValue(releaseV1);

      const { result } = renderHook(() => useUpdateCheck());

      await waitFor(() => expect(result.current.status.phase).toBe('available'));
      if (result.current.status.phase === 'available') {
        expect(result.current.status.current).toBe('0.0.0');
        expect(result.current.status.latest.version).toBe('1.0.0.0');
      }
    });

    it('reports up to date when the latest release is not newer', async () => {
      mockGetLatestRelease.mockResolvedValue({ ...releaseV1, version: '0.0.0' });

      const { result } = renderHook(() => useUpdateCheck());

      await waitFor(() => expect(result.current.status.phase).toBe('upToDate'));
    });

    it('does not prompt for a version the user dismissed', async () => {
      mockGetDismissedVersion.mockReturnValue('1.0.0.0');
      mockGetLatestRelease.mockResolvedValue(releaseV1);

      const { result } = renderHook(() => useUpdateCheck());

      await waitFor(() => expect(result.current.status.phase).toBe('upToDate'));
    });

    it('stays silent when the check itself fails', async () => {
      mockGetLatestRelease.mockRejectedValue(new Error('network down'));

      const { result } = renderHook(() => useUpdateCheck());

      await waitFor(() => expect(result.current.status.phase).toBe('idle'));
    });
  });

  describe('dismiss', () => {
    it('remembers the version only when dismissing an available update', async () => {
      mockGetLatestRelease.mockResolvedValue(releaseV1);
      const { result } = renderHook(() => useUpdateCheck());
      await waitFor(() => expect(result.current.status.phase).toBe('available'));

      act(() => result.current.dismiss());

      expect(mockSetDismissedVersion).toHaveBeenCalledWith('1.0.0.0');
      expect(result.current.status.phase).toBe('idle');
    });
  });

  describe('startUpdate', () => {
    it('downloads, imports and reaches "done" on success', async () => {
      vi.useFakeTimers();
      try {
        mockGetLatestRelease.mockResolvedValue(releaseV1);
        mockGetSolution.mockResolvedValue('BASE64ZIP');
        mockImport.mockResolvedValue({ asyncOperationId: 'async-1', importJobId: 'job-1' });
        mockProgress.mockResolvedValue(100);
        mockAsyncStatus.mockResolvedValue({ stateCode: 3, statusCode: 30 });

        const { result } = renderHook(() => useUpdateCheck());
        await act(async () => {
          await vi.advanceTimersByTimeAsync(0);
        });
        expect(result.current.status.phase).toBe('available');

        await act(async () => {
          const promise = result.current.startUpdate();
          await vi.advanceTimersByTimeAsync(3000);
          await promise;
        });

        expect(mockGetSolution).toHaveBeenCalledWith(releaseV1);
        expect(mockImport).toHaveBeenCalledWith('BASE64ZIP');
        expect(result.current.status.phase).toBe('done');
      } finally {
        vi.useRealTimers();
      }
    });

    it('reports an admin-privilege error when the import is forbidden', async () => {
      mockGetLatestRelease.mockResolvedValue(releaseV1);
      mockGetSolution.mockResolvedValue('BASE64ZIP');
      mockImport.mockRejectedValue(new SolutionImportForbiddenError());

      const { result } = renderHook(() => useUpdateCheck());
      await waitFor(() => expect(result.current.status.phase).toBe('available'));

      await act(async () => {
        await result.current.startUpdate();
      });

      expect(result.current.status.phase).toBe('error');
      if (result.current.status.phase === 'error') {
        expect(result.current.status.message).toMatch(/System Administrator/);
      }
    });

    it('errors before importing when outside a Dataverse context', async () => {
      mockGetLatestRelease.mockResolvedValue(releaseV1);
      mockIsInContext.mockReturnValue(false);

      const { result } = renderHook(() => useUpdateCheck());
      await waitFor(() => expect(result.current.status.phase).toBe('available'));

      await act(async () => {
        await result.current.startUpdate();
      });

      expect(result.current.status.phase).toBe('error');
      expect(mockImport).not.toHaveBeenCalled();
    });
  });
});
