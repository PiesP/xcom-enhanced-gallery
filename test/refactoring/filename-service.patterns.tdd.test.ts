import { describe, it, expect, vi, beforeEach } from 'vitest';

import { SERVICE_KEYS } from '@/constants';

describe('FilenameService - filenamePattern original/timestamp (TDD RED)', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-02T03:04:05.000Z'));

    // reset service manager and register mock settings
    const { CoreService } = await import('@shared/services/service-manager');
    CoreService.resetInstance();
    const sm = CoreService.getInstance();

    const store: any = {
      download: {
        filenamePattern: 'original',
        customTemplate: '{user}_{tweetId}_{index}',
      },
    };

    const mockSettingsService = {
      isInitialized: () => true,
      get: (key: string) => {
        const parts = key.split('.');
        let v: any = store;
        for (const p of parts) v = v?.[p];
        return v;
      },
      set: vi.fn(),
      updateBatch: vi.fn(),
      getAllSettings: () => store,
      subscribe: () => () => {},
    } as any;

    sm.register(SERVICE_KEYS.SETTINGS_MANAGER, mockSettingsService);
  });

  it('uses original filename when pattern=original and media.filename is provided', async () => {
    const { generateMediaFilename } = await import('@shared/media');
    const filename = generateMediaFilename(
      {
        url: 'https://pbs.twimg.com/media/ABC123?format=jpg&name=large',
        type: 'image',
        quality: 'large',
        filename: 'Photo_0001.JPG',
        id: '123_media_0',
        tweetId: '999999',
        tweetUsername: 'tester',
      },
      { index: 1 }
    );
    expect(filename).toBe('Photo_0001.JPG');
  });

  it('falls back to timestamp pattern when pattern=timestamp', async () => {
    const { CoreService } = await import('@shared/services/service-manager');
    const sm = CoreService.getInstance();
    const svc: any = sm.get(SERVICE_KEYS.SETTINGS_MANAGER);
    svc.get = (key: string) => (key === 'download.filenamePattern' ? 'timestamp' : undefined);

    const { generateMediaFilename } = await import('@shared/media');
    const filename = generateMediaFilename(
      {
        url: 'https://pbs.twimg.com/media/XYZ987?format=png&name=small',
        type: 'image',
        quality: 'small',
        id: '777_media_2',
      },
      { index: 1 }
    );
    // 2025-01-02T03:04:05.000Z => 1735787045000 (ms)
    expect(filename).toMatch(/^1735787045000_1\.(png|jpg|jpeg|gif|webp|bmp)$/);
  });
});
