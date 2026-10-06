import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  downloadBulk: vi.fn(),
  downloadSingle: vi.fn(),
  displayedIndex: 0 as number | null,
  getDownloadMedia: vi.fn(),
  notify: vi.fn(),
  notifySafely: vi.fn(),
  setDownloadStatus: vi.fn(),
  setError: vi.fn(),
  translate: vi.fn((key: string) => key),
}));

vi.mock('@platform/index', () => ({
  getNotificationAdapter: () => state.notify,
  notifySafely: state.notifySafely,
}));
vi.mock('@shared/services/download/download-orchestrator', () => ({
  getDownloadOrchestrator: () => ({ downloadBulk: state.downloadBulk, downloadSingle: state.downloadSingle }),
}));
vi.mock('@shared/services/language-service', () => ({
  getLanguageService: () => ({ translate: state.translate }),
}));
vi.mock('@shared/services/media-service', () => ({
  getMediaService: () => ({ getDownloadMedia: state.getDownloadMedia }),
}));
vi.mock('@shared/state/signals/gallery.signals', () => ({
  gallerySignals: {
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
  setDownloadStatus: state.setDownloadStatus,
}));

import { createDownloadHandler } from '@features/gallery/hooks/use-gallery-download';

describe('createDownloadHandler bulk resource limits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.displayedIndex = 0;
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
    expect(state.setError).toHaveBeenLastCalledWith('msg.dl.part.resourceLimit');
    expect(state.notifySafely).toHaveBeenCalledWith(
      state.notify,
      'msg.dl.part.t',
      'msg.dl.part.resourceLimit'
    );
    expect(state.translate).toHaveBeenCalledWith('msg.dl.part.resourceLimit', {
      count: 1,
      failed: 1,
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
      [
        expect.objectContaining({ id: 'first' }),
        expect.objectContaining({ id: 'shown' }),
      ],
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
    expect(state.setError).toHaveBeenLastCalledWith('msg.dl.zipTooLarge');
    expect(state.notifySafely).toHaveBeenCalledWith(
      state.notify,
      'msg.dl.one.err.t',
      'msg.dl.zipTooLarge'
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
    state.downloadBulk
      .mockReturnValueOnce(previousResult)
      .mockResolvedValueOnce({
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
  });
});
