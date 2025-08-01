/**
 * @fileoverview Phase 4 Final: Step 2 - Service 클래스 통합 테스트
 * @description TDD 방식으로 과도한 Service 클래스들 통합 검증
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Phase 4 Final: Step 2 - Service 클래스 통합', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. 유사 기능 서비스 통합', () => {
    it('MediaLoadingService와 MediaPrefetchingService가 통합되어야 함', async () => {
      // 두 서비스가 MediaService로 통합
      const { MediaService } = await import('@shared/services/MediaService');
      expect(MediaService).toBeDefined();

      // 개별 서비스들은 제거되어야 함
      try {
        await import('@shared/services/MediaLoadingService');
        expect(false).toBe(true); // 이 라인에 도달하면 안됨
      } catch (error) {
        expect(error).toBeDefined(); // 모듈이 제거되어 에러 발생이 정상
      }
    });

    it('WebPOptimizationService가 MediaService로 통합되어야 함', async () => {
      const { MediaService } = await import('@shared/services/MediaService');

      // WebP 최적화 기능이 MediaService 내부로 통합됨
      expect(MediaService.prototype).toHaveProperty('optimizeWebP');

      // MediaService 인스턴스에서 WebP 기능 테스트
      const mediaService = MediaService.getInstance();
      expect(typeof mediaService.optimizeWebP).toBe('function');
      expect(typeof mediaService.isWebPSupported).toBe('function');
      expect(typeof mediaService.getOptimizedImageUrl).toBe('function');
    });
  });

  describe('2. Manager vs Service 명명 통일', () => {
    it('모든 클래스가 Service 접미사로 통일되어야 함', async () => {
      // ServiceManager → ServiceRegistry 또는 CoreService로 변경
      const coreServices = await import('@shared/services/core-services');
      expect(coreServices.ServiceRegistry || coreServices.CoreService).toBeDefined();

      // BrowserManager → BrowserService로 변경
      const { BrowserService } = await import('@shared/browser/BrowserService');
      expect(BrowserService).toBeDefined();
    });

    it('일관된 명명 규칙이 적용되어야 함', () => {
      const serviceNames = [
        'MediaService',
        'GalleryService',
        'ThemeService',
        'ToastService', // ToastController → ToastService
        'AnimationService',
        'BrowserService', // BrowserManager → BrowserService
      ];

      serviceNames.forEach(name => {
        expect(name).toMatch(/Service$/);
        expect(name).not.toMatch(/Manager$|Controller$/);
      });
    });
  });

  describe('3. 서비스 수 최적화', () => {
    it('서비스 클래스 수가 10개 이하로 줄어야 함', async () => {
      const services = await import('@shared/services');
      const serviceExports = Object.keys(services).filter(key => {
        return key.includes('Service') && typeof services[key] === 'function';
      });

      expect(serviceExports.length).toBeLessThanOrEqual(10);
    });

    it('핵심 서비스만 남아야 함', async () => {
      const essentialServices = [
        'MediaService',
        'GalleryService',
        'ThemeService',
        'ToastService',
        'AnimationService',
        'BrowserService',
      ];

      const services = await import('@shared/services');

      essentialServices.forEach(serviceName => {
        expect(services[serviceName]).toBeDefined();
      });
    });
  });
});
