/**
 * @fileoverview Main.ts 초기화 테스트
 * @description Critical Path 초기화 오류 수정 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CoreService } from '../../../src/shared/services/service-manager';

describe('Main.ts 초기화 오류 수정', () => {
  beforeEach(() => {
    // 환경 격리
    CoreService.resetInstance();
  });

  afterEach(() => {
    // 정리
    CoreService.resetInstance();
  });

  describe('CoreService import 문제 해결', () => {
    it('CoreService.getInstance()가 정상적으로 작동해야 함', () => {
      // 행위 중심 테스트: getInstance 동작 검증
      expect(() => {
        const instance = CoreService.getInstance();
        expect(instance).toBeDefined();
        expect(typeof instance.register).toBe('function');
        expect(typeof instance.get).toBe('function');
      }).not.toThrow();
    });

    it('main.ts에서 사용하는 패턴이 정상 작동해야 함', () => {
      // 실제 main.ts에서 사용하는 패턴 시뮬레이션
      expect(() => {
        const coreService = CoreService.getInstance();

        // 테스트 서비스 등록
        const mockService = {
          name: 'test-service',
          initialize: vi.fn(),
          cleanup: vi.fn(),
        };

        coreService.register('test.service', mockService);

        // Critical Services 조회 패턴 테스트
        const retrievedService = coreService.get('test.service');
        expect(retrievedService).toBe(mockService);
      }).not.toThrow();
    });

    it('utils에서 CoreService export가 정상 작동해야 함', async () => {
      // utils/index.ts의 export 검증
      const { CoreService: UtilsCoreService } = await import('../../../src/utils');

      expect(UtilsCoreService).toBeDefined();
      expect(UtilsCoreService.getInstance).toBeDefined();

      const instance = UtilsCoreService.getInstance();
      expect(instance).toBeInstanceOf(CoreService);
    });
  });

  describe('Critical Path 초기화 시나리오', () => {
    it('initializeCriticalSystems 패턴이 안전하게 작동해야 함', () => {
      // main.ts의 initializeCriticalSystems에서 사용하는 패턴
      expect(() => {
        const coreService = CoreService.getInstance();

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
          coreService.register(serviceKey, mockService);
        });

        // Critical Services 조회 테스트 (main.ts 패턴)
        for (const serviceKey of criticalServices) {
          const service = coreService.get(serviceKey);
          expect(service).toBeDefined();
          expect(service.name).toBe(serviceKey);
        }
      }).not.toThrow();
    });

    it('에러 상황에서도 안전하게 처리되어야 함', () => {
      // 존재하지 않는 서비스 접근 시 적절한 에러 처리
      const coreService = CoreService.getInstance();

      expect(() => {
        coreService.get('non-existent-service');
      }).toThrow('서비스를 찾을 수 없습니다: non-existent-service');

      // tryGet은 안전하게 null 반환
      const result = coreService.tryGet('non-existent-service');
      expect(result).toBeNull();
    });
  });
});
