import { describe, expect, it, vi } from 'vitest';

const { userscriptDownload } = vi.hoisted(() => ({
  userscriptDownload: vi.fn(async () => undefined),
}));

vi.mock('@platform/detect', () => ({ IS_MV3: false }));
vi.mock('@shared/external/userscript/adapter', () => ({
  getUserscript: () => ({
    download: userscriptDownload,
    downloadBlob: vi.fn(async () => undefined),
  }),
}));

import { getDownloadAdapter } from '@platform/platform-adapters';

describe('userscript download platform adapter', () => {
  it('forwards AbortSignal to the userscript API', async () => {
    const controller = new AbortController();

    await getDownloadAdapter().download('https://example.com/image.jpg', 'image.jpg', undefined, controller.signal);

    expect(userscriptDownload).toHaveBeenCalledWith(
      'https://example.com/image.jpg',
      'image.jpg',
      controller.signal
    );
  });
});
