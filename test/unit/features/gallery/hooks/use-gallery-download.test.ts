import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const state = vi.hoisted(() => ({
  downloadBulk: vi.fn(),
  downloadFailedEntries: vi.fn(),
  downloadSingle: vi.fn(),
  displayedIndex: 0 as number | null,
  getDownloadMedia: vi.fn(),
  notify: vi.fn(),
  notifySafely: vi.fn(),
  setDownloadStatus: vi.fn(),
  setBulkDownloadOutcome: vi.fn(),
  setError: vi.fn(),
  translate: vi.fn((key: string) => key),
  status: 'idle',
  bulkOutcome: null as object | null,
  sessionRevision: 1,
}));

vi.mock('@platform/index', () => ({
  getNotificationAdapter: () => state.notify,
  notifySafely: state.notifySafely,
}));
vi.mock('@shared/services/download/download-orchestrator', () => ({
  getDownloadOrchestrator: () => ({
    downloadBulk: state.downloadBulk,
    downloadFailedEntries: state.downloadFailedEntries,
    downloadSingle: state.downloadSingle,
  }),
}));
vi.mock('@shared/services/language-service', () => ({
  getLanguageService: () => ({ translate: state.translate }),
}));
vi.mock('@shared/services/media-service', () => ({
  getMediaService: () => ({ getDownloadMedia: state.getDownloadMedia }),
}));
vi.mock('@shared/state/signals/gallery.signals', () => ({
  gallerySignals: {
    get sessionRevision() {
      return state.sessionRevision;
    },
    currentIndex: 0,
    mediaItems: [
      { id: 'first', type: 'image', url: 'https://example.test/first.jpg' },
      { id: 'shown', type: 'image', url: 'https://example.test/shown.jpg' },
    ],
  },
  getDisplayedMediaIndex: () => state.displayedIndex,
  setError: state.setError,
}));
vi.mock('@shared/state/signals/gallery-download-signals', () => ({
  downloadState: {
    get status() {
      return state.status;
    },
    get bulkOutcome() {
      return state.bulkOutcome;
    },
  },
  setDownloadStatus: (status: string) => {
    state.status = status;
    state.setDownloadStatus(status);
  },
  setBulkDownloadOutcome: (outcome: object | null) => {
    state.bulkOutcome = outcome;
    state.setBulkDownloadOutcome(outcome);
  },
}));
vi.mock('@features/gallery/hooks/dismiss-bulk-download-outcome', () => ({
  dismissBulkDownloadOutcome: () => {
    state.bulkOutcome = null;
  },
}));

import { createDownloadHandler } from '@features/gallery/hooks/use-gallery-download';

describe('createDownloadHandler bulk resource limits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.displayedIndex = 0;
    state.status = 'idle';
    state.bulkOutcome = null;
    state.sessionRevision = 1;
    state.translate.mockImplementation((key: string) => key);
  });

  it('shows resource-limit guidance when a partial ZIP was saved', async () => {
    state.downloadBulk.mockResolvedValue({
      success: true,
      status: 'partial',
      filesProcessed: 2,
      filesSuccessful: 1,
      code: 'RESOURCE_LIMIT',
    });

    await createDownloadHandler().handleDownload('all');

    expect(state.setDownloadStatus.mock.calls.map(([status]) => status)).toEqual([
      'working',
      'handedOff',
    ]);
    expect(state.setError).toHaveBeenLastCalledWith('msg.dl.part.resourceLimit', 'bulkDownload');
    expect(state.notifySafely).toHaveBeenCalledWith(
      state.notify,
      'msg.dl.part.t',
      'msg.dl.part.resourceLimit'
    );
    expect(state.translate).toHaveBeenCalledWith('msg.dl.part.resourceLimit', {
      count: 1,
      failed: 1,
    });
    expect(state.setBulkDownloadOutcome).toHaveBeenLastCalledWith({
      total: 2,
      included: 1,
      omitted: 1,
      handedOff: true,
      reason: 'resourceLimit',
      sourceUnavailable: false,
    });
  });

  it('downloads the displayed item after scroll focus moves beyond the manually selected item', async () => {
    state.displayedIndex = 1;
    state.downloadSingle.mockResolvedValue({ success: true });

    await createDownloadHandler().handleDownload('current');

    expect(state.downloadSingle).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'shown' }),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(state.setDownloadStatus).toHaveBeenLastCalledWith('handedOff');
  });

  it.each([false, true])(
    'discloses both unavailable originals and resource rejection, partial=%s',
    async (partial) => {
      state.downloadBulk.mockResolvedValue({
        success: partial,
        status: partial ? 'partial' : 'error',
        filesProcessed: 3,
        filesSuccessful: partial ? 1 : 0,
        code: 'RESOURCE_LIMIT',
        sourceUnavailable: true,
      });
      await createDownloadHandler().handleDownload('all');
      expect(state.setDownloadStatus).toHaveBeenLastCalledWith(partial ? 'handedOff' : 'error');
      expect(state.setError).toHaveBeenLastCalledWith(
        `${partial ? 'msg.dl.part.resourceLimit' : 'msg.dl.resourceLimit'} msg.dl.sourceUnavailable`,
        'bulkDownload'
      );
      expect(state.notifySafely).toHaveBeenCalledWith(
        state.notify,
        partial ? 'msg.dl.part.t' : 'msg.dl.one.err.t',
        `${partial ? 'msg.dl.part.resourceLimit' : 'msg.dl.resourceLimit'} msg.dl.sourceUnavailable`
      );
    }
  );

  it('discloses the original-source failure for a single photo', async () => {
    state.downloadSingle.mockResolvedValue({
      success: false,
      code: 'SOURCE_UNAVAILABLE',
      error: 'Original source is unverified',
    });
    await createDownloadHandler().handleDownload('current');
    expect(state.setError).toHaveBeenLastCalledWith('msg.dl.sourceUnavailable');
    expect(state.setDownloadStatus).toHaveBeenLastCalledWith('error');
  });

  it('shows localized recovery guidance for an over-budget single download', async () => {
    state.downloadSingle.mockResolvedValue({
      success: false,
      code: 'RESOURCE_LIMIT',
      error: 'Response requires 100 bytes (limit 10)',
    });
    await createDownloadHandler().handleDownload('current');
    expect(state.setDownloadStatus).toHaveBeenLastCalledWith('error');
    expect(state.setError).toHaveBeenLastCalledWith('msg.dl.resourceLimit');
    expect(state.notifySafely).toHaveBeenCalledWith(
      state.notify,
      'msg.dl.one.err.t',
      'msg.dl.resourceLimit'
    );
    expect(state.translate).not.toHaveBeenCalledWith('msg.dl.one.err.b', expect.anything());
  });

  it('passes only opened media items to the bulk ZIP boundary in their displayed order', async () => {
    state.downloadBulk.mockResolvedValue({
      success: true,
      status: 'success',
      filesProcessed: 2,
      filesSuccessful: 2,
      code: 'NONE',
    });

    await createDownloadHandler().handleDownload('all');

    expect(state.downloadBulk).toHaveBeenCalledWith(
      [expect.objectContaining({ id: 'first' }), expect.objectContaining({ id: 'shown' })],
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('keeps a resource-limit result with no saved files as a download failure', async () => {
    state.downloadBulk.mockResolvedValue({
      success: false,
      status: 'error',
      filesProcessed: 1,
      filesSuccessful: 0,
      code: 'RESOURCE_LIMIT',
    });

    await createDownloadHandler().handleDownload('all');

    expect(state.setDownloadStatus.mock.calls.map(([status]) => status)).toEqual([
      'working',
      'error',
    ]);
    expect(state.setError).toHaveBeenLastCalledWith('msg.dl.resourceLimit', 'bulkDownload');
    expect(state.notifySafely).toHaveBeenCalledWith(
      state.notify,
      'msg.dl.one.err.t',
      'msg.dl.resourceLimit'
    );
  });

  it('does not report a cancelled bulk download as an error', async () => {
    state.downloadBulk.mockResolvedValue({
      success: false,
      status: 'error',
      filesProcessed: 0,
      filesSuccessful: 0,
      code: 'CANCELLED',
    });

    await createDownloadHandler().handleDownload('all');

    expect(state.setDownloadStatus.mock.calls.map(([status]) => status)).toEqual([
      'working',
      'idle',
    ]);
    expect(state.setError).toHaveBeenCalledTimes(1);
    expect(state.setError).toHaveBeenLastCalledWith(null);
    expect(state.notifySafely).not.toHaveBeenCalled();
  });

  it('reports a successful adapter return as handed off without claiming a saved file', async () => {
    state.downloadBulk.mockResolvedValue({
      success: true,
      status: 'success',
      filesProcessed: 2,
      filesSuccessful: 2,
      code: 'NONE',
    });

    await createDownloadHandler().handleDownload('all');

    expect(state.setDownloadStatus.mock.calls.map(([status]) => status)).toEqual([
      'working',
      'handedOff',
    ]);
  });

  it('ignores a cancelled gallery operation that settles after the next download', async () => {
    let resolvePrevious: ((value: unknown) => void) | undefined;
    const previousResult = new Promise((resolve) => {
      resolvePrevious = resolve;
    });
    state.downloadBulk.mockReturnValueOnce(previousResult).mockResolvedValueOnce({
      success: true,
      status: 'success',
      filesProcessed: 1,
      filesSuccessful: 1,
      code: 'NONE',
    });

    const handler = createDownloadHandler();
    const previousDownload = handler.handleDownload('all');
    await vi.waitFor(() => expect(state.downloadBulk).toHaveBeenCalledOnce());

    handler.cancelDownloads();
    await handler.handleDownload('all');

    resolvePrevious?.({
      success: false,
      status: 'error',
      filesProcessed: 1,
      filesSuccessful: 0,
      error: 'late failure from previous gallery',
      code: 'ALL_FAILED',
    });
    await previousDownload;

    expect(state.setDownloadStatus.mock.calls.map(([status]) => status)).toEqual([
      'working',
      'idle',
      'working',
      'handedOff',
    ]);
    expect(state.setError).toHaveBeenCalledTimes(2);
    expect(state.setError).toHaveBeenLastCalledWith(null);
    expect(state.notifySafely).not.toHaveBeenCalled();
    expect(state.setBulkDownloadOutcome).toHaveBeenLastCalledWith({
      total: 2,
      included: 1,
      omitted: 1,
      handedOff: true,
      reason: 'none',
      sourceUnavailable: false,
    });
  });

  it('reports both source unavailability and resource limits in the persistent result', async () => {
    state.downloadBulk.mockResolvedValue({
      success: true,
      status: 'partial',
      filesProcessed: 2,
      filesSuccessful: 1,
      code: 'RESOURCE_LIMIT',
      sourceUnavailable: true,
    });

    await createDownloadHandler().handleDownload('all');

    expect(state.setBulkDownloadOutcome).toHaveBeenLastCalledWith({
      total: 2,
      included: 1,
      omitted: 1,
      handedOff: true,
      reason: 'resourceLimit',
      sourceUnavailable: true,
    });
  });

  it('distinguishes a verified original HTTP rejection from an unverified original', async () => {
    state.downloadBulk.mockResolvedValue({
      success: true,
      status: 'partial',
      filesProcessed: 2,
      filesSuccessful: 1,
      failures: [{ url: 'https://pbs.twimg.com/media/first.jpg?name=orig', error: 'HTTP:403' }],
      sourceFetchStatuses: [403],
      code: 'NONE',
    });

    await createDownloadHandler().handleDownload('all');

    expect(state.setBulkDownloadOutcome).toHaveBeenLastCalledWith({
      total: 2,
      included: 1,
      omitted: 1,
      handedOff: true,
      reason: 'sourceFetchFailed',
      sourceUnavailable: false,
      sourceFetchStatuses: [403],
    });
  });

  it('does not count prepared ZIP files as included when the browser rejects the save', async () => {
    state.downloadBulk.mockResolvedValue({
      success: false,
      status: 'error',
      filesProcessed: 2,
      filesSuccessful: 1,
      filename: 'gallery.zip',
      failedEntries: [
        { index: 0, url: 'https://example.test/first.jpg', filename: 'first.jpg', error: 'failed' },
      ],
      code: 'ALL_FAILED',
      error: 'Save rejected',
    });

    const handler = createDownloadHandler();
    await handler.handleDownload('all');
    await handler.recoverFailedEntries();
    expect(state.downloadFailedEntries).not.toHaveBeenCalled();

    expect(state.setBulkDownloadOutcome).toHaveBeenLastCalledWith({
      total: 2,
      included: 0,
      omitted: 2,
      handedOff: false,
      reason: 'zipSaveFailed',
      sourceUnavailable: false,
    });
  });

  it('retries only the failed original identity and name in a separate action', async () => {
    state.downloadBulk.mockResolvedValue({
      success: true,
      status: 'partial',
      filesProcessed: 2,
      filesSuccessful: 1,
      filename: 'gallery.zip',
      failedEntries: [
        {
          index: 0,
          url: 'https://example.test/first.jpg',
          filename: 'first-1.jpg',
          error: 'HTTP:503',
        },
      ],
      code: 'NONE',
    });
    state.downloadFailedEntries.mockResolvedValue({
      success: true,
      status: 'success',
      filesProcessed: 1,
      filesSuccessful: 1,
      filename: 'gallery-missing.zip',
      failedEntries: [],
      code: 'NONE',
    });
    const handler = createDownloadHandler();
    await handler.handleDownload('all');
    expect(state.bulkOutcome).toMatchObject({ recoverableCount: 1, included: 1, omitted: 1 });

    await handler.recoverFailedEntries();

    expect(state.downloadFailedEntries).toHaveBeenCalledExactlyOnceWith(
      [
        expect.objectContaining({
          index: 0,
          url: 'https://example.test/first.jpg',
          filename: 'first-1.jpg',
          media: expect.objectContaining({ id: 'first', url: 'https://example.test/first.jpg' }),
        }),
      ],
      'gallery.zip',
      1,
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(state.bulkOutcome).toMatchObject({
      supplementary: true,
      total: 1,
      included: 1,
      omitted: 0,
    });
    expect(state.bulkOutcome).not.toHaveProperty('recoverableCount');
  });

  it('revokes failed-entry recovery on gallery replacement or dismissal', async () => {
    state.downloadBulk.mockResolvedValue({
      success: true,
      status: 'partial',
      filesProcessed: 2,
      filesSuccessful: 1,
      filename: 'gallery.zip',
      failedEntries: [
        { index: 0, url: 'https://example.test/first.jpg', filename: 'first.jpg', error: 'failed' },
      ],
      code: 'NONE',
    });
    const handler = createDownloadHandler();
    await handler.handleDownload('all');
    state.sessionRevision += 1;
    await handler.recoverFailedEntries();
    expect(state.downloadFailedEntries).not.toHaveBeenCalled();

    state.sessionRevision += 1;
    await handler.handleDownload('all');
    handler.dismissOutcome();
    await handler.recoverFailedEntries();
    expect(state.downloadFailedEntries).not.toHaveBeenCalled();
  });

  it('aborts an unresolved recovery on dismissal and ignores a late adapter handoff', async () => {
    state.downloadBulk.mockResolvedValue({
      success: true,
      status: 'partial',
      filesProcessed: 2,
      filesSuccessful: 1,
      filename: 'gallery.zip',
      failedEntries: [
        { index: 0, url: 'https://example.test/first.jpg', filename: 'first.jpg', error: 'failed' },
      ],
      code: 'NONE',
    });
    let resolveRecovery: ((value: unknown) => void) | undefined;
    state.downloadFailedEntries.mockReturnValue(
      new Promise((resolve) => {
        resolveRecovery = resolve;
      })
    );
    const handler = createDownloadHandler();
    await handler.handleDownload('all');
    const pending = handler.recoverFailedEntries();
    await vi.waitFor(() => expect(state.downloadFailedEntries).toHaveBeenCalledOnce());
    const signal = state.downloadFailedEntries.mock.calls[0]?.[3]?.signal as AbortSignal;
    expect(signal.aborted).toBe(false);

    handler.dismissOutcome();
    expect(signal.aborted).toBe(true);
    expect(state.status).toBe('idle');
    expect(state.bulkOutcome).toBeNull();
    const outcomeCalls = state.setBulkDownloadOutcome.mock.calls.length;
    resolveRecovery?.({
      success: true,
      status: 'success',
      filesProcessed: 1,
      filesSuccessful: 1,
      filename: 'gallery-missing.zip',
      failedEntries: [],
      code: 'NONE',
    });
    await pending;
    expect(state.setBulkDownloadOutcome).toHaveBeenCalledTimes(outcomeCalls);
    expect(state.bulkOutcome).toBeNull();
    await handler.recoverFailedEntries();
    expect(state.downloadFailedEntries).toHaveBeenCalledOnce();
  });

  it('dismissing a previous result does not cancel a separate ordinary download', async () => {
    state.downloadBulk.mockResolvedValueOnce({
      success: true,
      status: 'partial',
      filesProcessed: 2,
      filesSuccessful: 1,
      filename: 'gallery.zip',
      failedEntries: [
        { index: 0, url: 'https://example.test/first.jpg', filename: 'first.jpg', error: 'failed' },
      ],
      code: 'NONE',
    });
    let resolveOrdinary: ((value: unknown) => void) | undefined;
    state.downloadBulk.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveOrdinary = resolve;
      })
    );
    const handler = createDownloadHandler();
    await handler.handleDownload('all');
    const pending = handler.handleDownload('all');
    await vi.waitFor(() => expect(state.downloadBulk).toHaveBeenCalledTimes(2));
    const signal = state.downloadBulk.mock.calls[1]?.[1]?.signal as AbortSignal;
    handler.dismissOutcome();
    expect(signal.aborted).toBe(false);
    expect(state.status).toBe('working');
    resolveOrdinary?.({
      success: true,
      status: 'success',
      filesProcessed: 2,
      filesSuccessful: 2,
      filename: 'next.zip',
      code: 'NONE',
    });
    await pending;
    expect(state.bulkOutcome).toMatchObject({ included: 2, omitted: 0 });
  });
});
