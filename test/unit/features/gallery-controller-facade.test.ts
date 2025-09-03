// @vitest-environment jsdom
/**
 * RED: GalleryController 초기 퍼사드 스펙
 * 목표:
 * 1) 플래그 OFF 시 initialize() no-op 이어도 open() 통해 기존 GalleryApp 경로로 갤러리 열림
 * 2) 플래그 ON (강제) 시 initialize 후 diagnostics.isInitialized === true
 * 3) open(media) 후 diagnostics.isOpen === true & mediaCount 반영
 */
import { describe, it, expect, beforeEach } from 'vitest';

// 플래그 강제 유틸
function forceFlag(name: string, value: boolean) {
  (globalThis as unknown as { __XEG_FORCE_FLAGS__?: Record<string, boolean> }).__XEG_FORCE_FLAGS__ =
    {
      ...((globalThis as unknown as { __XEG_FORCE_FLAGS__?: Record<string, boolean> })
        .__XEG_FORCE_FLAGS__ || {}),
      [name]: value,
    };
}

// 미디어 더미
const dummyMedia = (n = 1) =>
  Array.from({ length: n }).map((_, i) => ({
    id: `m_${i}`,
    url: `https://pbs.twimg.com/media/test_${i}.jpg?format=jpg&name=orig`,
    originalUrl: `https://pbs.twimg.com/media/test_${i}.jpg?format=jpg&name=orig`,
    type: 'image' as const,
    filename: `media_${i + 1}.jpg`,
  }));

describe('GalleryController Facade (Phase 13) RED', () => {
  beforeEach(() => {
    // 플래그 리셋
    forceFlag('FEATURE_GALLERY_CONTROLLER', false);
  });

  it('플래그 OFF: initialize() no-op 이어도 open() 통해 갤러리 열림 (state.open=true 기대)', async () => {
    const { GalleryController } = await import('@/features/gallery/GalleryController');
    const controller = new GalleryController();
    await controller.initialize(); // no-op 예상
    await controller.open(dummyMedia(2), 0);
    const state = controller.getState();
    expect(state.open).toBe(true);
    expect(state.count).toBe(2);
  });

  it('플래그 ON: initialize() 후 initialized=true (GREEN)', async () => {
    forceFlag('FEATURE_GALLERY_CONTROLLER', true);
    const { GalleryController } = await import('@/features/gallery/GalleryController');
    const controller = new GalleryController();
    await controller.initialize();
    const state = controller.getState();
    expect(state.initialized).toBe(true);
  });
});
