/**
 * @file image-fit-mode-persistence.test.tsx
 * @description 갤러리 닫기/다시 열기 후 이미지 핏 모드가 저장/복원되는지 검증 (RED)
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getPreact } from '@/shared/external/vendors';
import { VerticalGalleryView } from '@/features/gallery/components/vertical-gallery-view/VerticalGalleryView';
import { openGallery, closeGallery } from '@/shared/state/signals/gallery.signals';
import { registerSettingsManager } from '@/shared/container/service-accessors';
import { SettingsService } from '@/features/settings/services/SettingsService';
import { getSetting } from '@/shared/container/settings-access';

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
  };
})();

function queryToolbarButton(root: Element, dataEl: string): HTMLElement | null {
  return root.querySelector(`[data-gallery-element="${dataEl}"]`) as HTMLElement | null;
}

describe('Gallery image fit mode persistence across reopen', () => {
  beforeEach(async () => {
    vi.useFakeTimers();

    // fresh settings service per test
    const svc = new SettingsService();
    await svc.initialize();
    registerSettingsManager(svc);

    // install memory localStorage
    vi.stubGlobal('localStorage', memoryStorage as any);
  });

  afterEach(() => {
    try {
      (memoryStorage as any).clear?.();
    } catch {}
    vi.useRealTimers();
  });

  it('restores last chosen fit mode after closing and reopening', async () => {
    const host = document.createElement('div');

    const items = [
      { id: 'a', url: 'https://example.com/a.jpg', type: 'image' as const, filename: 'a.jpg' },
    ];
    openGallery(items, 0);

    render(
      h(VerticalGalleryView as any, {
        onDownloadCurrent: () => {},
        onDownloadAll: () => {},
      }),
      host
    );

    // 기본값 확인
    const initialFit = getSetting('gallery.imageFitMode', 'fitWidth');
    expect(typeof initialFit).toBe('string');

    // 툴바의 세로 맞춤 클릭
    const btn = queryToolbarButton(host, 'fit-height');
    expect(btn, 'fit-height 버튼을 찾지 못함').toBeTruthy();
    btn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    vi.runAllTimers();

    // 현재 미디어에 반영되었는지 확인
    const media = host.querySelector('img, video') as HTMLElement | null;
    expect(media).toBeTruthy();
    expect(media!.getAttribute('data-fit-mode')).toBe('fitHeight');

    // 갤러리 닫기 → 다시 열기
    render(null as any, host);
    closeGallery();

    // 새 컨테이너에 다시 렌더
    const host2 = document.createElement('div');
    openGallery(items, 0);
    render(
      h(VerticalGalleryView as any, {
        onDownloadCurrent: () => {},
        onDownloadAll: () => {},
      }),
      host2
    );

    // 초기 렌더 직후에도 저장된 모드가 적용되어야 함 또는 짧은 틱 내 교정
    vi.runAllTimers();

    const media2 = host2.querySelector('img, video') as HTMLElement | null;
    expect(media2).toBeTruthy();
    expect(media2!.getAttribute('data-fit-mode')).toBe('fitHeight');

    render(null as any, host2);
    closeGallery();
  });
});
