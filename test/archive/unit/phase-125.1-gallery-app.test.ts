// Phase 125.1: GalleryApp 핵심 기능 테스트
// 목표: GalleryApp.ts 커버리지 3.34% → 50%

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { MediaInfo } from '@/shared/types/media.types';
import { GalleryApp } from '@/features/gallery/GalleryApp';
import { initializeVendors } from '@/shared/external/vendors';

const createTestMedia = (count: number): MediaInfo[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${i + 1}`,
    url: `https://example.com/image${i + 1}.jpg`,
    type: 'image' as const,
    filename: `image${i + 1}.jpg`,
  }));
};

describe('Phase 125.1: GalleryApp 핵심 기능', () => {
  beforeEach(() => {
    initializeVendors();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('1. 생성자 및 초기 상태', () => {
    it('인스턴스가 생성되어야 함', () => {
      const app = new GalleryApp();
      expect(app).toBeDefined();
    });

    it('초기 상태는 실행 중이 아니어야 함', () => {
      const app = new GalleryApp();
      expect(app.isRunning()).toBe(false);
    });
  });

  describe('2. initialize()', () => {
    it('초기화를 시도해야 함 (서비스 누락 시 에러)', async () => {
      const app = new GalleryApp();
      // 테스트 환경에서는 gallery.renderer 서비스가 없어 실패 예상
      await expect(app.initialize()).rejects.toThrow('서비스를 찾을 수 없습니다');
    });

    it('초기화 실패 후에는 실행 중이 아니어야 함', async () => {
      const app = new GalleryApp();
      try {
        await app.initialize();
      } catch {
        // 초기화 실패 무시
      }
      expect(app.isRunning()).toBe(false);
    });
  });

  describe('3. openGallery()', () => {
    it('초기화되지 않은 상태에서는 갤러리를 열 수 없음', () => {
      const app = new GalleryApp();
      const media = createTestMedia(3);
      // 초기화되지 않았으므로 무시됨
      expect(() => app.openGallery(media, 0)).not.toThrow();
    });

    it('빈 미디어 배열은 무시되어야 함', () => {
      const app = new GalleryApp();
      expect(() => app.openGallery([], 0)).not.toThrow();
    });

    it('인덱스가 음수면 처리되어야 함', () => {
      const app = new GalleryApp();
      const media = createTestMedia(3);
      expect(() => app.openGallery(media, -1)).not.toThrow();
    });

    it('인덱스가 배열 크기를 초과해도 처리되어야 함', () => {
      const app = new GalleryApp();
      const media = createTestMedia(3);
      expect(() => app.openGallery(media, 100)).not.toThrow();
    });
  });

  describe('4. closeGallery()', () => {
    it('초기화되지 않은 상태에서도 안전하게 닫혀야 함', () => {
      const app = new GalleryApp();
      expect(() => app.closeGallery()).not.toThrow();
    });

    it('이미 닫힌 상태에서 호출해도 오류가 없어야 함', () => {
      const app = new GalleryApp();
      app.closeGallery();
      expect(() => app.closeGallery()).not.toThrow();
    });
  });

  describe('5. updateConfig()', () => {
    it('초기화되지 않은 상태에서도 설정을 업데이트할 수 있어야 함', () => {
      const app = new GalleryApp();
      expect(() =>
        app.updateConfig({
          showTooltips: true,
          enableKeyboardShortcuts: true,
        })
      ).not.toThrow();
    });
  });

  describe('6. isRunning()', () => {
    it('초기화 전에는 false를 반환해야 함', () => {
      const app = new GalleryApp();
      expect(app.isRunning()).toBe(false);
    });

    it('초기화 실패 후에도 false를 반환해야 함', async () => {
      const app = new GalleryApp();
      try {
        await app.initialize();
      } catch {
        // 초기화 실패 무시
      }
      expect(app.isRunning()).toBe(false);
    });

    it('cleanup 후에는 false를 반환해야 함', () => {
      const app = new GalleryApp();
      app.cleanup();
      expect(app.isRunning()).toBe(false);
    });
  });

  describe('7. getDiagnostics()', () => {
    it('초기화되지 않은 상태에서도 진단 정보를 반환해야 함', () => {
      const app = new GalleryApp();
      const diagnostics = app.getDiagnostics();
      expect(diagnostics).toBeDefined();
      expect(typeof diagnostics.isInitialized).toBe('boolean');
      expect(diagnostics.isInitialized).toBe(false);
    });
  });

  describe('8. cleanup()', () => {
    it('초기화되지 않은 상태에서도 정리가 안전해야 함', () => {
      const app = new GalleryApp();
      expect(() => app.cleanup()).not.toThrow();
    });

    it('여러 번 호출해도 안전해야 함', () => {
      const app = new GalleryApp();
      app.cleanup();
      expect(() => app.cleanup()).not.toThrow();
    });

    it('정리 후 isRunning은 false를 반환해야 함', () => {
      const app = new GalleryApp();
      app.cleanup();
      expect(app.isRunning()).toBe(false);
    });
  });
});
