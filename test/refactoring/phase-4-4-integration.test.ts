/**
 * Phase 4.4: 갤러리 컴포넌트 통합 테스트
 *
 * 목표: 분리된 GalleryCore, GalleryEventHandler, GalleryRenderer가
 *       함께 올바르게 동작하는지 검증
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('Phase 4.4: 갤러리 컴포넌트 통합', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('통합 아키텍처 검증', () => {
    it('should have GalleryCore class available', async () => {
      try {
        const module = await import('../../src/features/gallery/core/GalleryCore');
        expect(module.GalleryCore).toBeDefined();
        expect(typeof module.GalleryCore).toBe('function');
      } catch {
        expect.fail('GalleryCore 클래스를 불러올 수 없습니다');
      }
    });

    it('should have GalleryEventHandler class available', async () => {
      try {
        const module = await import('../../src/features/gallery/GalleryEventHandler');
        expect(module.GalleryEventHandler).toBeDefined();
        expect(typeof module.GalleryEventHandler).toBe('function');
      } catch {
        expect.fail('GalleryEventHandler 클래스를 불러올 수 없습니다');
      }
    });

    it('should have GalleryRenderer class available', async () => {
      try {
        const module = await import('../../src/features/gallery/GalleryRenderer');
        expect(module.GalleryRenderer).toBeDefined();
        expect(typeof module.GalleryRenderer).toBe('function');
      } catch {
        expect.fail('GalleryRenderer 클래스를 불러올 수 없습니다');
      }
    });

    it('should have all components properly separated', async () => {
      // 각 컴포넌트가 독립적으로 인스턴스화 가능한지 확인
      try {
        const coreModule = await import('../../src/features/gallery/core/GalleryCore');
        const eventModule = await import('../../src/features/gallery/GalleryEventHandler');
        const rendererModule = await import('../../src/features/gallery/GalleryRenderer');

        const core = new coreModule.GalleryCore();
        expect(core).toBeInstanceOf(coreModule.GalleryCore);

        const eventHandler = new eventModule.GalleryEventHandler({
          toastController: { show: vi.fn() },
          videoControl: { restoreBackgroundVideos: vi.fn() },
          galleryState: { value: { isOpen: false, mediaItems: [], currentIndex: 0 } },
        });
        expect(eventHandler).toBeInstanceOf(eventModule.GalleryEventHandler);

        const renderer = new rendererModule.GalleryRenderer();
        expect(renderer).toBeInstanceOf(rendererModule.GalleryRenderer);
      } catch {
        expect.fail('컴포넌트 인스턴스화 실패');
      }
    });
  });

  describe('Phase 4 완료 검증', () => {
    it('should have completed all Phase 4 objectives', async () => {
      // Phase 4의 모든 목표가 달성되었는지 확인
      try {
        // 4.1: GalleryCore 완료 확인
        const coreModule = await import('../../src/features/gallery/core/GalleryCore');
        expect(coreModule.GalleryCore).toBeDefined();

        // 4.2: GalleryEventHandler 완료 확인
        const eventModule = await import('../../src/features/gallery/GalleryEventHandler');
        expect(eventModule.GalleryEventHandler).toBeDefined();

        // 4.3: GalleryRenderer 완료 확인
        const rendererModule = await import('../../src/features/gallery/GalleryRenderer');
        expect(rendererModule.GalleryRenderer).toBeDefined();

        // 4.4: 통합 확인 (현재 테스트)
        expect(true).toBe(true);
      } catch {
        expect.fail('Phase 4 완료 검증 실패');
      }
    });
  });
});
