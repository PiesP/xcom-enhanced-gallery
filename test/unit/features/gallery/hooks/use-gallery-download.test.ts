import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import type { MediaInfo } from '@shared/types/media.types';

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
  mediaItems: [] as MediaInfo[],
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
    get mediaItems() {
      return state.mediaItems;
    },
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
    state.mediaItems = [
      { id: 'first', type: 'image', url: 'https://example.test/first.jpg' },
      { id: 'shown', type: 'image', url: 'https://example.test/shown.jpg' },
    ];
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

  it.each(['ALL_FAILED', 'RESOURCE_LIMIT'])(
    'retains a complete proven pre-save %s failure across explicit attempts',
    async (code) => {
      const failed = {
        index: 0,
        url: 'https://example.test/first.jpg',
        filename: 'first-1.jpg',
        error: 'HTTP:503',
      };
      state.downloadBulk.mockResolvedValue({
        success: true,
        status: 'partial',
        filesProcessed: 2,
        filesSuccessful: 1,
        filename: 'gallery.zip',
        failedEntries: [failed],
        code: 'NONE',
      });
      state.downloadFailedEntries
        .mockResolvedValueOnce({
          success: false,
          status: 'error',
          filesProcessed: 1,
          filesSuccessful: 0,
          failedEntries: [failed],
          code,
          saveAttempted: false,
        })
        .mockResolvedValueOnce({
          success: false,
          status: 'error',
          filesProcessed: 1,
          filesSuccessful: 0,
          failedEntries: [failed],
          code,
          saveAttempted: false,
        })
        .mockResolvedValueOnce({
          success: true,
          status: 'success',
          filesProcessed: 1,
          filesSuccessful: 1,
          failedEntries: [],
          code: 'NONE',
          filename: 'gallery-missing-3.zip',
        });
      const handler = createDownloadHandler();
      await handler.handleDownload('all');
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        await handler.recoverFailedEntries();
        expect(state.status).toBe('error');
        expect(state.bulkOutcome).toMatchObject({
          recoverableCount: 1,
          total: 1,
          included: 0,
          omitted: 1,
          supplementary: true,
        });
      }
      await handler.recoverFailedEntries();
      expect(state.status).toBe('handedOff');
      expect(state.bulkOutcome).not.toHaveProperty('recoverableCount');
      const calls = state.downloadFailedEntries.mock.calls;
      expect(calls).toHaveLength(3);
      expect(calls.map((call) => call[2])).toEqual([1, 2, 3]);
      expect(calls.map((call) => call[0])).toEqual([calls[0]![0], calls[0]![0], calls[0]![0]]);
      expect(calls[0]![0]).toEqual([
        expect.objectContaining({
          index: 0,
          url: failed.url,
          filename: failed.filename,
          media: expect.objectContaining({ id: 'first', url: failed.url }),
        }),
      ]);
    }
  );

  it.each([
    {},
    { saveAttempted: true },
    { saveAttempted: false, filesSuccessful: 1 },
    { saveAttempted: false, filesProcessed: 2 },
    { saveAttempted: false, failedEntries: [] },
    {
      saveAttempted: false,
      failedEntries: [{ index: 0, url: 'https://other.test/a', filename: 'first.jpg' }],
    },
    {
      saveAttempted: false,
      failedEntries: [{ index: 0, url: 'https://example.test/first.jpg', filename: 'changed.jpg' }],
    },
    {
      saveAttempted: false,
      failedEntries: [
        { index: 0, url: 'https://example.test/first.jpg', filename: 'first.jpg' },
        { index: 0, url: 'https://example.test/first.jpg', filename: 'first.jpg' },
      ],
    },
  ])('revokes recovery when pre-save proof or identity is incomplete: %j', async (override) => {
    const failed = {
      index: 0,
      url: 'https://example.test/first.jpg',
      filename: 'first.jpg',
      error: 'HTTP:503',
    };
    state.downloadBulk.mockResolvedValue({
      success: true,
      status: 'partial',
      filesProcessed: 2,
      filesSuccessful: 1,
      filename: 'gallery.zip',
      failedEntries: [failed],
      code: 'NONE',
    });
    state.downloadFailedEntries.mockResolvedValue({
      success: false,
      status: 'error',
      filesProcessed: 1,
      filesSuccessful: 0,
      failedEntries: [failed],
      code: 'ALL_FAILED',
      ...override,
    });
    const handler = createDownloadHandler();
    await handler.handleDownload('all');
    await handler.recoverFailedEntries();
    await handler.recoverFailedEntries();
    expect(state.downloadFailedEntries).toHaveBeenCalledOnce();
    expect(state.bulkOutcome).not.toHaveProperty('recoverableCount');
  });

  it('keeps multiple missing identities ordered and retires only recovered entries', async () => {
    state.mediaItems = ['saved', 'missing-a', 'missing-b', 'last'].map((id) => ({
      id,
      type: 'image',
      url: `https://example.test/${id}.jpg`,
      tweetId: `owner-${id}`,
    }));
    const failedA = {
      index: 1,
      url: state.mediaItems[1]!.url,
      filename: 'assigned-a.jpg',
      error: 'HTTP:503',
    };
    const failedB = {
      index: 2,
      url: state.mediaItems[2]!.url,
      filename: 'assigned-b.jpg',
      error: 'HTTP:503',
    };
    state.downloadBulk.mockResolvedValue({
      success: true,
      status: 'partial',
      filesProcessed: 4,
      filesSuccessful: 2,
      filename: 'gallery.zip',
      failedEntries: [failedB, failedA],
      code: 'NONE',
    });
    state.downloadFailedEntries
      .mockResolvedValueOnce({
        success: false,
        status: 'error',
        filesProcessed: 2,
        filesSuccessful: 0,
        failedEntries: [
          { ...failedB, index: 1 },
          { ...failedA, index: 0 },
        ],
        code: 'ALL_FAILED',
        saveAttempted: false,
      })
      .mockResolvedValueOnce({
        success: true,
        status: 'partial',
        filesProcessed: 2,
        filesSuccessful: 1,
        failedEntries: [{ ...failedB, index: 1 }],
        code: 'NONE',
        filename: 'gallery-missing-2.zip',
      })
      .mockResolvedValueOnce({
        success: true,
        status: 'success',
        filesProcessed: 1,
        filesSuccessful: 1,
        failedEntries: [],
        code: 'NONE',
        filename: 'gallery-missing-3.zip',
      });
    const handler = createDownloadHandler();
    await handler.handleDownload('all');
    state.mediaItems = []; // Recovery owns its original snapshot, not the live selection.
    await handler.recoverFailedEntries();
    expect(state.downloadFailedEntries).toHaveBeenCalledOnce();
    expect(state.bulkOutcome).toMatchObject({ recoverableCount: 2 });
    await handler.recoverFailedEntries();
    expect(state.bulkOutcome).toMatchObject({ recoverableCount: 1 });
    await handler.recoverFailedEntries();
    const entries = state.downloadFailedEntries.mock.calls.map((call) => call[0]);
    expect(entries[0]).toEqual(entries[1]);
    expect(
      entries[0].map((entry: { index: number; filename: string; media: MediaInfo }) => [
        entry.index,
        entry.filename,
        entry.media.tweetId,
      ])
    ).toEqual([
      [1, 'assigned-a.jpg', 'owner-missing-a'],
      [2, 'assigned-b.jpg', 'owner-missing-b'],
    ]);
    expect(entries[2]).toEqual([entries[0][1]]);
    expect(state.downloadFailedEntries.mock.calls.map((call) => call[2])).toEqual([1, 2, 3]);
    expect(state.downloadBulk).toHaveBeenCalledOnce();
    await handler.recoverFailedEntries();
    expect(state.downloadFailedEntries).toHaveBeenCalledTimes(3);
  });

  it('does not create missing-entry recovery for an initially all-failed selection', async () => {
    state.downloadBulk.mockResolvedValue({
      success: false,
      status: 'error',
      filesProcessed: 2,
      filesSuccessful: 0,
      saveAttempted: false,
      code: 'ALL_FAILED',
      filename: 'gallery.zip',
      failedEntries: [
        {
          index: 0,
          url: 'https://example.test/first.jpg',
          filename: 'first.jpg',
          error: 'HTTP:503',
        },
        {
          index: 1,
          url: 'https://example.test/shown.jpg',
          filename: 'shown.jpg',
          error: 'HTTP:503',
        },
      ],
    });
    const handler = createDownloadHandler();
    await handler.handleDownload('all');
    await handler.recoverFailedEntries();
    expect(state.downloadFailedEntries).not.toHaveBeenCalled();
    expect(state.bulkOutcome).not.toHaveProperty('recoverableCount');
  });

  it.each(['cancel', 'dismiss', 'replace'] as const)(
    'revokes a retained pre-save failure on %s',
    async (action) => {
      const failed = {
        index: 0,
        url: 'https://example.test/first.jpg',
        filename: 'first.jpg',
        error: 'HTTP:503',
      };
      state.downloadBulk.mockResolvedValue({
        success: true,
        status: 'partial',
        filesProcessed: 2,
        filesSuccessful: 1,
        filename: 'gallery.zip',
        failedEntries: [failed],
        code: 'NONE',
      });
      state.downloadFailedEntries.mockResolvedValue({
        success: false,
        status: 'error',
        filesProcessed: 1,
        filesSuccessful: 0,
        saveAttempted: false,
        failedEntries: [failed],
        code: 'ALL_FAILED',
      });
      const handler = createDownloadHandler();
      await handler.handleDownload('all');
      await handler.recoverFailedEntries();
      expect(state.bulkOutcome).toMatchObject({ recoverableCount: 1 });
      if (action === 'cancel') {
        handler.cancelDownloads();
      } else if (action === 'dismiss') {
        handler.dismissOutcome();
      } else {
        state.sessionRevision += 1;
      }
      await handler.recoverFailedEntries();
      expect(state.downloadFailedEntries).toHaveBeenCalledOnce();
    }
  );

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
