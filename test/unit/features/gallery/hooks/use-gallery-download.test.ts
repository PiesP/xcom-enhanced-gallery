import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  downloadBulk: vi.fn(),
  getDownloadMedia: vi.fn(),
  notify: vi.fn(),
  notifySafely: vi.fn(),
  setDownloading: vi.fn(),
  setError: vi.fn(),
  translate: vi.fn((key: string) => key),
}));

vi.mock('@platform/index', () => ({
  getNotificationAdapter: () => state.notify,
  notifySafely: state.notifySafely,
}));
vi.mock('@shared/services/download/download-orchestrator', () => ({
  getDownloadOrchestrator: () => ({ downloadBulk: state.downloadBulk }),
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
    mediaItems: [{ id: 'safe', type: 'image', url: 'https://example.test/safe.jpg' }],
  },
  setError: state.setError,
}));
vi.mock('@shared/state/signals/gallery-download-signals', () => ({
  setDownloading: state.setDownloading,
}));

import { createDownloadHandler } from '@features/gallery/hooks/use-gallery-download';

describe('createDownloadHandler bulk resource limits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    expect(state.setError).toHaveBeenLastCalledWith('msg.dl.zipTooLarge');
    expect(state.notifySafely).toHaveBeenCalledWith(
      state.notify,
      'msg.dl.one.err.t',
      'msg.dl.zipTooLarge'
    );
    expect(state.translate).not.toHaveBeenCalledWith('msg.dl.part.b', expect.anything());
  });
});
