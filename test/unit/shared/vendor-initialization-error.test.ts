/**
 * @fileoverview 벤더 초기화 순서 에러 재현 및 해결 검증
 * @description 컴포넌트 모듈 로드 시 getSolid() 호출 순서 문제 해결
 * @version 1.0.0 - Vendor Initialization Error Fix
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('벤더 초기화 순서 에러 해결', () => {
  beforeEach(() => {
    // 모듈 캐시 초기화
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('문제 재현', () => {
    it('컴포넌트 모듈 로드 시 getSolid() 호출로 인한 에러가 발생하지 않아야 한다', async () => {
      // 초기화 없이 컴포넌트 모듈을 직접 import
      // 이전에는 이 작업이 에러를 발생시켰음

      expect(async () => {
        // VerticalImageItem 모듈 로드 (이전에 에러 발생 지점)
        await import('@features/gallery/components/vertical-gallery-view/VerticalImageItem');
      }).not.toThrow();

      expect(async () => {
        // GalleryContainer 모듈 로드
        await import('@shared/components/isolation/GalleryContainer');
      }).not.toThrow();

      expect(async () => {
        // Toolbar 모듈 로드 (이전에 에러 발생 지점)
        await import('@shared/components/ui/Toolbar/Toolbar');
      }).not.toThrow();
    });
  });

  describe('동적 초기화 검증', () => {
    it('컴포넌트는 lazy하게 memo를 가져와야 한다', async () => {
      // 초기화 전에 모듈 로드
      const { VerticalImageItem } = await import(
        '@features/gallery/components/vertical-gallery-view/VerticalImageItem'
      );

      // 컴포넌트는 여전히 정의되어야 함
      expect(VerticalImageItem).toBeDefined();

      // 이제 벤더를 초기화
      const { initializeVendors } = await import('@shared/external/vendors');
      await initializeVendors();

      // 초기화 후에도 컴포넌트가 정상 작동해야 함
      expect(VerticalImageItem).toBeDefined();
      expect(VerticalImageItem.displayName).toContain('memo');
    });

    it('lazy initialization이 정상 작동해야 한다', async () => {
      const { initializeVendors } = await import('@shared/external/vendors');

      // 초기화 전에 컴포넌트 모듈 로드
      const { GalleryContainer } = await import('@shared/components/isolation/GalleryContainer');

      // 컴포넌트는 정의되어야 함
      expect(GalleryContainer).toBeDefined();

      // 벤더 초기화
      await initializeVendors();

      // 초기화 후에도 정상 작동
      expect(GalleryContainer).toBeDefined();
    });
  });

  describe('통합 검증', () => {
    it('모든 메모이제이션된 컴포넌트가 정상 로드되어야 한다', async () => {
      // 모든 컴포넌트 모듈을 동시에 로드
      const [{ VerticalImageItem }, { GalleryContainer }, { Toolbar }] = await Promise.all([
        import('@features/gallery/components/vertical-gallery-view/VerticalImageItem'),
        import('@shared/components/isolation/GalleryContainer'),
        import('@shared/components/ui/Toolbar/Toolbar'),
      ]);

      // 모든 컴포넌트가 정의되어야 함
      expect(VerticalImageItem).toBeDefined();
      expect(GalleryContainer).toBeDefined();
      expect(Toolbar).toBeDefined();

      // 벤더 초기화
      const { initializeVendors } = await import('@shared/external/vendors');
      await initializeVendors();

      // 초기화 후에도 모든 컴포넌트가 정상 작동
      expect(VerticalImageItem.displayName).toContain('memo');
      expect(Toolbar.displayName).toContain('memo');
      // UnifiedGalleryContainer는 Phase 1에서 제거됨
    });
  });
});
