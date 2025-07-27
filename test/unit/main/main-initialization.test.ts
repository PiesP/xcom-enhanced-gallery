/**
 * @fileoverview Main.ts 초기화 테스트
 * @description Critical Path 초기화 오류 수정 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ServiceManager } from '@shared/services/ServiceManager';

describe('Main.ts 초기화 오류 수정', () => {
  beforeEach(() => {
    // 환경 격리
    ServiceManager.resetInstance();
  });

  afterEach(() => {
    // 정리
    ServiceManager.resetInstance();
  });

  describe('ServiceManager import 문제 해결', () => {
    it('ServiceManager.getInstance()가 정상적으로 작동해야 함', () => {
      // 행위 중심 테스트: getInstance 동작 검증
      expect(() => {
        const instance = ServiceManager.getInstance();
        expect(instance).toBeDefined();
        expect(typeof instance.register).toBe('function');
        expect(typeof instance.get).toBe('function');
      }).not.toThrow();
    });

    it('main.ts에서 사용하는 패턴이 정상 작동해야 함', () => {
      // 실제 main.ts에서 사용하는 패턴 시뮬레이션
      expect(() => {
        const serviceManager = ServiceManager.getInstance();

        // 테스트 서비스 등록
        const mockService = {
          name: 'test-service',
          initialize: vi.fn(),
          cleanup: vi.fn(),
        };

        serviceManager.register('test.service', mockService);

        // Critical Services 조회 패턴 테스트
        const retrievedService = serviceManager.get('test.service');
        expect(retrievedService).toBe(mockService);
      }).not.toThrow();
    });

    it('utils에서 ServiceManager export가 정상 작동해야 함', async () => {
      // utils/index.ts의 export 검증
      const { ServiceManager: UtilsServiceManager } = await import('@/utils');

      expect(UtilsServiceManager).toBeDefined();
      expect(UtilsServiceManager.getInstance).toBeDefined();

      const instance = UtilsServiceManager.getInstance();
      expect(instance).toBeInstanceOf(ServiceManager);
    });
  });

  describe('Critical Path 초기화 시나리오', () => {
    it('initializeCriticalSystems 패턴이 안전하게 작동해야 함', () => {
      // main.ts의 initializeCriticalSystems에서 사용하는 패턴
      expect(() => {
        const serviceManager = ServiceManager.getInstance();

        // Critical Services 시뮬레이션
        const criticalServices = [
          'core.videoControl',
          'core.mediaExtraction',
          'ui.toastController',
        ];

        // 각 서비스 등록
        criticalServices.forEach(serviceKey => {
          const mockService = {
            name: serviceKey,
            initialize: vi.fn(),
            isInitialized: true,
          };
          serviceManager.register(serviceKey, mockService);
        });

        // Critical Services 조회 테스트 (main.ts 패턴)
        for (const serviceKey of criticalServices) {
          const service = serviceManager.get(serviceKey);
          expect(service).toBeDefined();
          expect(service.name).toBe(serviceKey);
        }
      }).not.toThrow();
    });

    it('에러 상황에서도 안전하게 처리되어야 함', () => {
      // 존재하지 않는 서비스 접근 시 적절한 에러 처리
      const serviceManager = ServiceManager.getInstance();

      expect(() => {
        serviceManager.get('non-existent-service');
      }).toThrow('서비스를 찾을 수 없습니다: non-existent-service');

      // tryGet은 안전하게 null 반환
      const result = serviceManager.tryGet('non-existent-service');
      expect(result).toBeNull();
    });
  });
});
