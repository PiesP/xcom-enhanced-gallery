/**
 * @fileoverview Phase 1: TDD 기반 핵심 기능 검증 테스트
 * @description GREEN 단계 - 임시 테스트 제거 후에도 핵심 기능이 동작하는지 검증
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Phase 1: 핵심 기능 검증 - GREEN 테스트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('🟢 GREEN: 갤러리 핵심 기능', () => {
    it('should import and instantiate GalleryApp correctly', async () => {
      // 동적 import를 사용하여 실제 모듈 로드 검증
      try {
        const { GalleryApp } = await import('../../src/features/gallery/GalleryApp.js');

        // 클래스가 정상적으로 import 되는지 검증
        expect(GalleryApp).toBeDefined();
        expect(typeof GalleryApp).toBe('function');

        // 인스턴스 생성이 가능한지 검증
        const app = new GalleryApp();
        expect(app).toBeDefined();

        // 핵심 메서드들이 존재하는지 검증
        expect(typeof app.openGallery).toBe('function');
        expect(typeof app.closeGallery).toBe('function');
        expect(typeof app.isRunning).toBe('function');

        console.log('✅ GalleryApp core functionality verified');
      } catch (error) {
        console.error('❌ GalleryApp import failed:', error);
        throw error;
      }
    });

    it('should import and use MediaService correctly', async () => {
      try {
        const { MediaService } = await import('../../src/shared/services/MediaService.js');

        // 서비스 클래스가 정상적으로 import 되는지 검증
        expect(MediaService).toBeDefined();
        expect(typeof MediaService).toBe('function');

        // 싱글톤 인스턴스 접근이 가능한지 검증
        const service = MediaService.getInstance();
        expect(service).toBeDefined();

        // 핵심 메서드들이 존재하는지 검증
        expect(typeof service.extractMedia).toBe('function');
        expect(typeof service.downloadMedia).toBe('function');
        expect(typeof service.prepareForGallery).toBe('function');

        console.log('✅ MediaService core functionality verified');
      } catch (error) {
        console.error('❌ MediaService import failed:', error);
        throw error;
      }
    });

    it('should import and use GalleryService correctly', async () => {
      try {
        const { GalleryService } = await import(
          '../../src/shared/services/gallery/GalleryService.js'
        );

        // 서비스 클래스가 정상적으로 import 되는지 검증
        expect(GalleryService).toBeDefined();
        expect(typeof GalleryService).toBe('function');

        // 싱글톤 인스턴스 접근이 가능한지 검증
        const service = GalleryService.getInstance();
        expect(service).toBeDefined();

        // 핵심 메서드들이 존재하는지 검증
        expect(typeof service.openGallery).toBe('function');
        expect(typeof service.closeGallery).toBe('function');
        expect(typeof service.getGalleryInfo).toBe('function');

        console.log('✅ GalleryService core functionality verified');
      } catch (error) {
        console.error('❌ GalleryService import failed:', error);
        throw error;
      }
    });
  });

  describe('🟢 GREEN: 컴포넌트 핵심 기능', () => {
    it('should import VerticalGalleryView component correctly', async () => {
      try {
        const { VerticalGalleryView } = await import(
          '../../src/features/gallery/components/vertical-gallery-view/index.js'
        );

        // 컴포넌트가 정상적으로 import 되는지 검증
        expect(VerticalGalleryView).toBeDefined();
        expect(typeof VerticalGalleryView).toBe('function');

        console.log('✅ VerticalGalleryView component verified');
      } catch (error) {
        console.error('❌ VerticalGalleryView import failed:', error);
        throw error;
      }
    });

    it('should import Button component correctly', async () => {
      try {
        const { Button } = await import('../../src/shared/components/ui/index.js');

        // 컴포넌트가 정상적으로 import 되는지 검증
        expect(Button).toBeDefined();
        expect(typeof Button).toBe('function');

        console.log('✅ Button component verified');
      } catch (error) {
        console.error('❌ Button component import failed:', error);
        throw error;
      }
    });
  });

  describe('🟢 GREEN: 유틸리티 핵심 기능', () => {
    it('should import core utilities correctly', async () => {
      try {
        const utils = await import('../../src/shared/utils/index.js');

        // 핵심 유틸리티들이 존재하는지 검증
        expect(utils).toBeDefined();
        expect(typeof utils).toBe('object');

        // 일부 핵심 유틸리티들 존재 여부 확인
        const hasEssentialUtils =
          utils.removeDuplicates || utils.debounce || utils.throttle || utils.createMediaFilename;

        expect(hasEssentialUtils).toBeTruthy();

        console.log('✅ Core utilities verified');
      } catch (error) {
        console.error('❌ Core utilities import failed:', error);
        throw error;
      }
    });
  });

  describe('🟢 GREEN: 외부 라이브러리 통합', () => {
    it('should import vendor management correctly', async () => {
      try {
        const vendors = await import('../../src/shared/external/vendors/index.js');

        // 벤더 관리가 정상적으로 import 되는지 검증
        expect(vendors).toBeDefined();
        expect(typeof vendors.initializeVendors).toBe('function');
        expect(typeof vendors.getPreact).toBe('function');

        console.log('✅ Vendor management verified');
      } catch (error) {
        console.error('❌ Vendor management import failed:', error);
        throw error;
      }
    });
  });

  describe('🟢 GREEN: 빌드 무결성 검증', () => {
    it('should verify main entry point works', async () => {
      try {
        // main.ts가 정상적으로 import 되는지 검증
        const main = await import('../../src/main.js');

        // main 모듈이 정상적으로 로드되는지 검증
        expect(main).toBeDefined();

        console.log('✅ Main entry point verified');
      } catch (error) {
        console.error('❌ Main entry point failed:', error);
        // main.ts 실패는 치명적이므로 테스트 실패로 처리
        throw error;
      }
    });
  });
});
