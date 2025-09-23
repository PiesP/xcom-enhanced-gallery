/**
 * @file image-fit-mode-delayed-restore.red.test.tsx
 * @description SettingsService가 늦게 등록되는 경우(초기 마운트 시 서비스 부재),
 *              구독을 통해 핏 모드가 동기화되는지 검증 (RED)
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getPreact } from '@/shared/external/vendors';
import { VerticalGalleryView } from '@/features/gallery/components/vertical-gallery-view/VerticalGalleryView';
import { openGallery, closeGallery } from '@/shared/state/signals/gallery.signals';
import { registerSettingsManager } from '@/shared/container/service-accessors';
import { SettingsService } from '@/features/settings/services/SettingsService';
import { setSetting } from '@/shared/container/settings-access';

const { h, render } = getPreact();

// Memory localStorage polyfill
const memoryStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = String(v);
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      store = {};
    },
    __raw: () => store,
  };
})();

function seedSettings(raw: unknown) {
  memoryStorage.setItem('xeg-app-settings', JSON.stringify(raw));
}

function queryToolbarButton(root: Element, dataEl: string): HTMLElement | null {
  return root.querySelector(`[data-gallery-element="${dataEl}"]`) as HTMLElement | null;
}

describe('[RED] Delayed restore via subscription when settings registers late', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // install memory localStorage before service usage
    vi.stubGlobal('localStorage', memoryStorage as any);
  });

  afterEach(() => {
    try {
      (memoryStorage as any).clear?.();
    } catch {}
    vi.useRealTimers();
  });

  it('updates media fit mode after late service registration and setSetting call', async () => {
    // Persisted settings indicate fitHeight
    seedSettings({
      gallery: { imageFitMode: 'fitHeight' },
      download: {},
      tokens: {},
      performance: { cacheTTL: 30000 },
      accessibility: {},
      version: 1,
      lastModified: Date.now(),
    });

    const host = document.createElement('div');
    const items = [
      { id: 'a', url: 'https://example.com/a.jpg', type: 'image' as const, filename: 'a.jpg' },
    ];

    // Mount WITHOUT registering settings service first
    openGallery(items, 0);
    render(
      h(VerticalGalleryView as any, {
        onDownloadCurrent: () => {},
        onDownloadAll: () => {},
      }),
      host
    );

    // Initial media should reflect default (fitWidth) because service is absent
    const media = host.querySelector('img, video') as HTMLElement | null;
    expect(media).toBeTruthy();
    const initialAttr = media!.getAttribute('data-fit-mode');
    expect(initialAttr).toBe('fitWidth');

    // Now register SettingsService (which will load fitHeight from storage)
    const svc = new SettingsService();
    await svc.initialize();
    registerSettingsManager(svc);

    // Trigger a settings event (even if same value) to simulate user toggling in another place
    await setSetting('gallery.imageFitMode', 'fitHeight');

    // Allow effects/updates to flush
    vi.runAllTimers();

    // EXPECTATION for GREEN: component subscribes and updates to fitHeight
    const after = media!.getAttribute('data-fit-mode');
    expect(after).toBe('fitHeight');

    render(null as any, host);
    closeGallery();
  });
});
