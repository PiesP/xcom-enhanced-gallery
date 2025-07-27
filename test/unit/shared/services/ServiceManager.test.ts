/**
 * @fileoverview ServiceManager 단위 테스트
 * @description 핵심 사상 기반 테스트: 환경 격리, 로직 분리, 행위 중심 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ServiceManager } from '@shared/services/ServiceManager';

describe('ServiceManager', () => {
  let serviceManager: ServiceManager;

  beforeEach(() => {
    // 환경 격리: 각 테스트마다 깨끗한 ServiceManager 인스턴스
    ServiceManager.resetInstance();
    serviceManager = ServiceManager.getInstance();
  });

  afterEach(() => {
    // 환경 격리: 테스트 후 정리
    ServiceManager.resetInstance();
  });

  describe('싱글톤 패턴', () => {
    it('getInstance()는 항상 동일한 인스턴스를 반환해야 함', () => {
      // 행위 중심 테스트: getInstance의 싱글톤 동작 검증
      const instance1 = ServiceManager.getInstance();
      const instance2 = ServiceManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('resetInstance() 후 새로운 인스턴스가 생성되어야 함', () => {
      // 행위 중심 테스트: 리셋 후 새 인스턴스 생성 검증
      const originalInstance = ServiceManager.getInstance();
      ServiceManager.resetInstance();
      const newInstance = ServiceManager.getInstance();

      expect(newInstance).not.toBe(originalInstance);
    });
  });

  describe('서비스 등록', () => {
    it('서비스를 정상적으로 등록할 수 있어야 함', () => {
      // 로직 분리: 서비스 등록 로직만 테스트
      const testService = { name: 'test-service' };
      const serviceKey = 'test-service';

      serviceManager.register(serviceKey, testService);

      expect(serviceManager.has(serviceKey)).toBe(true);
      expect(serviceManager.get(serviceKey)).toBe(testService);
    });

    it('동일한 키로 서비스를 덮어쓸 수 있어야 함', () => {
      // 행위 중심 테스트: 덮어쓰기 동작 검증
      const service1 = { name: 'service1' };
      const service2 = { name: 'service2' };
      const serviceKey = 'test-service';

      serviceManager.register(serviceKey, service1);
      serviceManager.register(serviceKey, service2);

      expect(serviceManager.get(serviceKey)).toBe(service2);
    });
  });

  describe('서비스 조회', () => {
    it('등록된 서비스를 올바르게 조회할 수 있어야 함', () => {
      // 로직 분리: 서비스 조회 로직만 테스트
      const testService = { name: 'test-service' };
      const serviceKey = 'test-service';

      serviceManager.register(serviceKey, testService);
      const retrievedService = serviceManager.get(serviceKey);

      expect(retrievedService).toBe(testService);
    });

    it('존재하지 않는 서비스 조회 시 에러가 발생해야 함', () => {
      // 행위 중심 테스트: 에러 처리 동작 검증
      expect(() => {
        serviceManager.get('non-existent-service');
      }).toThrow('서비스를 찾을 수 없습니다: non-existent-service');
    });

    it('tryGet()은 존재하지 않는 서비스에 대해 null을 반환해야 함', () => {
      // 행위 중심 테스트: 안전한 조회 동작 검증
      const result = serviceManager.tryGet('non-existent-service');

      expect(result).toBeNull();
    });
  });

  describe('서비스 관리', () => {
    it('등록된 서비스 목록을 올바르게 반환해야 함', () => {
      // 로직 분리: 서비스 목록 관리 로직만 테스트
      const services = [
        { key: 'service1', instance: { name: 'service1' } },
        { key: 'service2', instance: { name: 'service2' } },
      ];

      services.forEach(({ key, instance }) => {
        serviceManager.register(key, instance);
      });

      const registeredServices = serviceManager.getRegisteredServices();

      expect(registeredServices).toHaveLength(2);
      expect(registeredServices).toContain('service1');
      expect(registeredServices).toContain('service2');
    });

    it('진단 정보를 올바르게 제공해야 함', () => {
      // 행위 중심 테스트: 진단 기능 동작 검증
      const testService = { name: 'test-service' };
      serviceManager.register('test-service', testService);

      const diagnostics = serviceManager.getDiagnostics();

      expect(diagnostics.registeredServices).toBe(1);
      expect(diagnostics.activeInstances).toBe(1);
      expect(diagnostics.services).toContain('test-service');
      expect(diagnostics.instances['test-service']).toBe(true);
    });
  });

  describe('정리 작업', () => {
    it('cleanup 메서드가 있는 서비스들을 정리해야 함', () => {
      // 행위 중심 테스트: cleanup 동작 검증
      const mockCleanup = vi.fn();
      const testService = { cleanup: mockCleanup };

      serviceManager.register('test-service', testService);
      serviceManager.cleanup();

      expect(mockCleanup).toHaveBeenCalled();
    });

    it('reset()은 모든 서비스를 제거해야 함', () => {
      // 로직 분리: 리셋 로직만 테스트
      const testService = { name: 'test-service' };
      serviceManager.register('test-service', testService);

      serviceManager.reset();

      expect(serviceManager.getRegisteredServices()).toHaveLength(0);
    });
  });
});
