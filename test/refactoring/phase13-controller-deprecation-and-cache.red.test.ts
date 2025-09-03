// @vitest-environment jsdom
/**
 * @fileoverview Phase13 RED: GalleryController - legacy GalleryApp deprecation 로그 & state snapshot 캐싱 요구
 * 기대 사항 (GREEN 목표):
 * 1) FEATURE_GALLERY_CONTROLLER 강제 ON 상태에서 GalleryApp 직접 사용 시 logger.warn 1회만 출력 (중복 호출 억제)
 * 2) GalleryController.getState() 호출은 상태 변화 없으면 동일 객체(reference) 재사용 (GC churn 감소)
 * 3) open() 후 state 객체 reference 변경, openCount/lastOpenAt 단조 증가
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GalleryController } from '@/features/gallery/GalleryController';
import { GalleryApp } from '@/features/gallery/GalleryApp';
import { logger } from '@/shared/logging/logger';
import { CoreService } from '@/shared/services/ServiceManager';
import { SERVICE_KEYS } from '@/constants';

(globalThis as any).__XEG_FORCE_FLAGS__ = {
  ...(globalThis as any).__XEG_FORCE_FLAGS__,
  FEATURE_GALLERY_CONTROLLER: true,
};

const media = [
  { id: 'a', url: 'https://example.com/a.jpg', type: 'image' },
  { id: 'b', url: 'https://example.com/b.jpg', type: 'image' },
] as any;

describe('Phase13 RED: deprecation + state snapshot cache', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Mock GalleryRenderer service (minimal interface)
    const core = CoreService.getInstance();
    if (!core.has(SERVICE_KEYS.GALLERY_RENDERER)) {
      core.register(SERVICE_KEYS.GALLERY_RENDERER, {
        setOnCloseCallback: () => {},
        render: () => {},
      } as any);
    }
  });

  it('GalleryApp 사용 시 deprecation warn 1회만 출력', async () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const app = new GalleryApp();
    await app.initialize();
    await app.openGallery(media, 0);
    await app.openGallery(media, 1);
    app.closeGallery();
    // RED: 현재 구현에서는 경고 미출력 → 0회 → 실패 예상 (GREEN 시 1회)
    expect(warnSpy.mock.calls.length).toBe(1);
  });

  it('getState() 캐싱: 상태 변화 없으면 reference 유지, 변화 시 갱신', async () => {
    const c = new GalleryController();
    const s1 = c.getState();
    const s2 = c.getState();
    // RED: 현재는 매 호출 새 객체 → 동일 reference 기대 실패
    expect(s2).toBe(s1);
    await c.open(media, 0);
    const s3 = c.getState();
    expect(s3).not.toBe(s1);
    const s4 = c.getState();
    expect(s4).toBe(s3);
  });
});
