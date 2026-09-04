/**
 * Tests for the solution-import methods on DataverseApiService.
 * Covers async import start (success / forbidden / error), status polling, and
 * import-job progress reads.
 */

import { dataverseApi, SolutionImportForbiddenError } from '../dataverseApi';

const mockFetch = vi.fn();

describe('DataverseApiService — solution import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
    // A Dataverse context is provided globally by the test setup (Xrm stub).
  });

  describe('importSolutionAsync', () => {
    it('posts the base64 payload and returns the async + import job ids', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          AsyncOperationId: 'async-1',
          ImportJobKey: 'job-1',
        }),
      });

      const result = await dataverseApi.importSolutionAsync('QkFTRTY0');

      expect(result).toEqual({ asyncOperationId: 'async-1', importJobId: 'job-1' });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/ImportSolutionAsync');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body.CustomizationFile).toBe('QkFTRTY0');
      expect(body.OverwriteUnmanagedCustomizations).toBe(false);
      expect(body.PublishWorkflows).toBe(true);
      expect(body.ImportJobId).toBeTruthy();
    });

    it('falls back to the generated import job id when the response omits ImportJobKey', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ AsyncOperationId: 'async-2' }),
      });

      const result = await dataverseApi.importSolutionAsync('x');
      expect(result.asyncOperationId).toBe('async-2');
      // Import job id defaults to the client-generated GUID sent in the request.
      const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(result.importJobId).toBe(sentBody.ImportJobId);
    });

    it('throws SolutionImportForbiddenError on HTTP 403', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 403, statusText: 'Forbidden' });

      await expect(dataverseApi.importSolutionAsync('x')).rejects.toBeInstanceOf(
        SolutionImportForbiddenError
      );
    });

    it('throws with the server message on other failures', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        json: async () => ({ error: { message: 'Boom' } }),
      });

      await expect(dataverseApi.importSolutionAsync('x')).rejects.toThrow(/Boom/);
    });
  });

  describe('getAsyncOperationStatus', () => {
    it('maps statecode/statuscode/message', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ statecode: 3, statuscode: 30, message: undefined }),
      });

      const status = await dataverseApi.getAsyncOperationStatus('async-1');
      expect(status).toEqual({ stateCode: 3, statusCode: 30, message: undefined });
    });

    it('throws on a failed status read', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
      });

      await expect(dataverseApi.getAsyncOperationStatus('async-1')).rejects.toThrow(
        /404|Not Found/
      );
    });
  });

  describe('getImportJobProgress', () => {
    it('returns the numeric progress', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({ progress: 42.5 }) });
      await expect(dataverseApi.getImportJobProgress('job-1')).resolves.toBe(42.5);
    });

    it('returns null when the import job cannot be read yet', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' });
      await expect(dataverseApi.getImportJobProgress('job-1')).resolves.toBeNull();
    });

    it('returns null on a network error', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));
      await expect(dataverseApi.getImportJobProgress('job-1')).resolves.toBeNull();
    });
  });
});
