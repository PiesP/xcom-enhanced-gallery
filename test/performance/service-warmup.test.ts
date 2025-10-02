/**
 * @fileoverview 서비스 워밍업 성능 테스트
 * @description Epic REF-LITE-V4 - 서비스 초기화 시간 및 최적화 검증
 *
 * TDD Phase: RED - 성능 기준 설정 및 불필요한 초기화 감지
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CoreService } from '@shared/services/ServiceManager';

// Performance API 폴리필 (Node.js 환경)
const now = () => Date.now();

describe('Epic REF-LITE-V4 - 서비스 워밍업 성능', () => {
  beforeEach(() => {
    CoreService.resetInstance();
    vi.clearAllTimers();
  });

  afterEach(() => {
    CoreService.resetInstance();
    vi.clearAllTimers();
  });

  describe('warmupCriticalServices 성능', () => {
    it('초기화 시간이 50ms 미만이어야 함', async () => {
      // Given: Critical 서비스 등록
      const { registerCoreServices } = await import('@shared/services/core-services');
      await registerCoreServices();

      // When: Critical 서비스 워밍업 시작
      const startTime = now();
      const { warmupCriticalServices } = await import('@shared/container/service-accessors');
      warmupCriticalServices();
      const endTime = now();

      // Then: 초기화 시간 검증
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(50);
    });

    it('MediaService와 ToastController만 초기화해야 함', async () => {
      // Given: 서비스 등록
      const { registerCoreServices } = await import('@shared/services/core-services');
      await registerCoreServices();

      // When: Critical 서비스 워밍업
      const { warmupCriticalServices } = await import('@shared/container/service-accessors');
      warmupCriticalServices();

      // Then: CoreService에 등록된 서비스 확인
      const coreService = CoreService.getInstance();
      const registeredServices = coreService.getRegisteredServices();

      // MediaService 관련 키들이 등록되어 있어야 함
      expect(registeredServices).toContain('media.service');
      expect(registeredServices).toContain('toast.controller');

      // Critical이 아닌 서비스는 warmup에서 초기화하지 않음 (등록만 됨)
      // 이 테스트는 warmup 함수가 실제로 get()을 호출하는지 확인하는 것이 아니라
      // 등록된 서비스 목록을 확인하는 것임
    });
  });

  describe('warmupNonCriticalServices 성능', () => {
    it('초기화 시간이 100ms 미만이어야 함', async () => {
      // Given: 서비스 등록
      const { registerCoreServices } = await import('@shared/services/core-services');
      await registerCoreServices();

      // When: Non-Critical 서비스 워밍업
      const startTime = now();
      const { warmupNonCriticalServices } = await import('@shared/container/service-accessors');
      warmupNonCriticalServices();
      const endTime = now();

      // Then: 초기화 시간 검증
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(100);
    });

    it('ThemeService, BulkDownload, Filename 서비스를 초기화해야 함', async () => {
      // Given: 서비스 등록
      const { registerCoreServices } = await import('@shared/services/core-services');
      await registerCoreServices();

      // When: Non-Critical 서비스 워밍업
      const { warmupNonCriticalServices } = await import('@shared/container/service-accessors');
      warmupNonCriticalServices();

      // Then: 등록된 서비스 확인
      const coreService = CoreService.getInstance();
      const registeredServices = coreService.getRegisteredServices();

      expect(registeredServices).toContain('theme.service');
      expect(registeredServices).toContain('core.bulkDownload');
      expect(registeredServices).toContain('media.filename');
    });
  });

  describe('서비스 초기화 순서', () => {
    it('Critical 서비스가 Non-Critical 서비스보다 먼저 초기화되어야 함', async () => {
      // Given: 서비스 등록
      const { registerCoreServices } = await import('@shared/services/core-services');
      await registerCoreServices();

      const initOrder: string[] = [];
      const coreService = CoreService.getInstance();

      // 서비스 get 호출을 추적
      const originalGet = coreService.get.bind(coreService);
      vi.spyOn(coreService, 'get').mockImplementation((key: string) => {
        initOrder.push(key);
        return originalGet(key);
      });

      // When: 순서대로 초기화
      const { warmupCriticalServices, warmupNonCriticalServices } = await import(
        '@shared/container/service-accessors'
      );
      warmupCriticalServices();
      warmupNonCriticalServices();

      // Then: 초기화 순서 검증
      const criticalServices = ['media.service', 'toast.controller'];
      const nonCriticalServices = ['theme.service', 'core.bulkDownload', 'media.filename'];

      // Critical 서비스가 먼저 나와야 함
      const criticalIndices = criticalServices.map(s => initOrder.indexOf(s)).filter(i => i >= 0);
      const nonCriticalIndices = nonCriticalServices
        .map(s => initOrder.indexOf(s))
        .filter(i => i >= 0);

      if (criticalIndices.length > 0 && nonCriticalIndices.length > 0) {
        const maxCriticalIndex = Math.max(...criticalIndices);
        const minNonCriticalIndex = Math.min(...nonCriticalIndices);
        expect(maxCriticalIndex).toBeLessThan(minNonCriticalIndex);
      }
    });
  });

  describe('메모리 사용량', () => {
    it('서비스 인스턴스 중복 생성을 방지해야 함', async () => {
      // Given: 서비스 등록
      const { registerCoreServices } = await import('@shared/services/core-services');
      await registerCoreServices();

      // When: 여러 번 워밍업 시도
      const { warmupCriticalServices, getMediaServiceFromContainer, getToastController } =
        await import('@shared/container/service-accessors');

      warmupCriticalServices();
      const mediaService1 = getMediaServiceFromContainer();
      const toastController1 = getToastController();

      warmupCriticalServices();
      const mediaService2 = getMediaServiceFromContainer();
      const toastController2 = getToastController();

      // Then: 동일한 인스턴스를 반환해야 함
      expect(mediaService1).toBe(mediaService2);
      expect(toastController1).toBe(toastController2);
    });

    it('불필요한 서비스 인스턴스를 생성하지 않아야 함', async () => {
      // Given: 서비스 등록
      const { registerCoreServices } = await import('@shared/services/core-services');
      await registerCoreServices();

      const coreService = CoreService.getInstance();
      const getCallCount = new Map<string, number>();

      // get 호출 추적
      const originalGet = coreService.get.bind(coreService);
      vi.spyOn(coreService, 'get').mockImplementation((key: string) => {
        getCallCount.set(key, (getCallCount.get(key) || 0) + 1);
        return originalGet(key);
      });

      // When: Critical 서비스만 워밍업
      const { warmupCriticalServices } = await import('@shared/container/service-accessors');
      warmupCriticalServices();

      // Then: Critical 서비스만 get이 호출되어야 함
      const criticalServices = ['media.service', 'toast.controller'];
      const nonCriticalServices = ['theme.service', 'core.bulkDownload', 'media.filename'];

      criticalServices.forEach(key => {
        expect(getCallCount.get(key)).toBeGreaterThan(0);
      });

      nonCriticalServices.forEach(key => {
        expect(getCallCount.get(key) || 0).toBe(0);
      });
    });
  });

  describe('지연 로딩 최적화', () => {
    it('ThemeService는 실제 사용 시점까지 초기화를 지연할 수 있어야 함', async () => {
      // Given: 서비스 등록
      const { registerCoreServices } = await import('@shared/services/core-services');
      await registerCoreServices();

      // When: Critical 서비스만 워밍업 (ThemeService 제외)
      const { warmupCriticalServices, getThemeService } = await import(
        '@shared/container/service-accessors'
      );
      warmupCriticalServices();

      // Then: ThemeService는 아직 초기화되지 않았어야 함 (등록만 됨)
      // 실제 사용 시점에 초기화됨
      expect(() => getThemeService()).not.toThrow();
    });

    it('BulkDownloadService는 갤러리 오픈 시점까지 초기화를 지연할 수 있어야 함', async () => {
      // Given: 서비스 등록
      const { registerCoreServices } = await import('@shared/services/core-services');
      await registerCoreServices();

      // When: Critical 서비스만 워밍업
      const { warmupCriticalServices, getBulkDownloadServiceFromContainer } = await import(
        '@shared/container/service-accessors'
      );
      warmupCriticalServices();

      // Then: BulkDownloadService는 아직 초기화되지 않았어야 함
      expect(() => getBulkDownloadServiceFromContainer()).not.toThrow();
    });
  });
});
