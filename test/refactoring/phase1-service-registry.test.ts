/**
 * Phase 1.1: 서비스 매니저 단순화 - ServiceRegistry TDD 테스트
 *
 * 목표: ServiceManager의 핵심 기능을 단순한 ServiceRegistry로 분리
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// RED 단계: 아직 구현되지 않은 ServiceRegistry 클래스를 import
// 이 테스트는 처음에는 실패할 것입니다
import { ServiceRegistry } from '@shared/services/ServiceRegistry';

describe('ServiceRegistry - TDD Phase 1.1', () => {
  let registry: ServiceRegistry;

  beforeEach(() => {
    registry = new ServiceRegistry();
  });

  describe('기본 서비스 등록/조회', () => {
    it('서비스를 등록하고 조회할 수 있어야 한다', () => {
      // Given: 테스트용 서비스 인스턴스
      const mockService = { test: true, value: 'test-service' };

      // When: 서비스를 등록하고 조회
      registry.register('test-service', mockService);
      const retrieved = registry.get<typeof mockService>('test-service');

      // Then: 등록된 서비스와 동일한 인스턴스가 반환되어야 함
      expect(retrieved).toBe(mockService);
      expect(retrieved.test).toBe(true);
      expect(retrieved.value).toBe('test-service');
    });

    it('존재하지 않는 서비스 조회 시 에러를 발생시켜야 한다', () => {
      // When & Then: 존재하지 않는 서비스 조회 시 에러 발생
      expect(() => {
        registry.get('non-existent-service');
      }).toThrow('Service not found: non-existent-service');
    });

    it('서비스 존재 여부를 확인할 수 있어야 한다', () => {
      // Given: 테스트 서비스 등록
      const mockService = { test: true };
      registry.register('existing-service', mockService);

      // When & Then: 존재 여부 확인
      expect(registry.has('existing-service')).toBe(true);
      expect(registry.has('non-existing-service')).toBe(false);
    });
  });

  describe('타입 안전성', () => {
    interface TestService {
      getValue(): string;
      process(data: number): number;
    }

    it('타입 안전한 서비스 등록/조회가 가능해야 한다', () => {
      // Given: 타입이 정의된 서비스
      const testService: TestService = {
        getValue: () => 'test-value',
        process: (data: number) => data * 2,
      };

      // When: 타입 안전한 등록/조회
      registry.register<TestService>('typed-service', testService);
      const retrieved = registry.get<TestService>('typed-service');

      // Then: 타입 안전성 확인
      expect(retrieved.getValue()).toBe('test-value');
      expect(retrieved.process(5)).toBe(10);
    });
  });

  describe('서비스 덮어쓰기', () => {
    it('기본적으로 서비스 덮어쓰기를 허용해야 한다', () => {
      // Given: 첫 번째 서비스 등록
      const firstService = { version: 1 };
      registry.register('service', firstService);

      // When: 같은 키로 두 번째 서비스 등록
      const secondService = { version: 2 };
      registry.register('service', secondService);

      // Then: 두 번째 서비스가 조회되어야 함
      const retrieved = registry.get<typeof secondService>('service');
      expect(retrieved.version).toBe(2);
    });

    it('allowOverwrite=false일 때 덮어쓰기를 방지해야 한다', () => {
      // Given: 첫 번째 서비스 등록
      const firstService = { version: 1 };
      registry.register('service', firstService);

      // When & Then: allowOverwrite=false로 덮어쓰기 시도 시 에러 발생
      const secondService = { version: 2 };
      expect(() => {
        registry.register('service', secondService, false);
      }).toThrow('Service already exists: service');
    });
  });

  describe('서비스 목록 관리', () => {
    it('등록된 서비스 목록을 반환할 수 있어야 한다', () => {
      // Given: 여러 서비스 등록
      registry.register('service1', { id: 1 });
      registry.register('service2', { id: 2 });
      registry.register('service3', { id: 3 });

      // When: 등록된 서비스 목록 조회
      const serviceKeys = registry.getRegisteredServices();

      // Then: 모든 등록된 서비스 키가 포함되어야 함
      expect(serviceKeys).toContain('service1');
      expect(serviceKeys).toContain('service2');
      expect(serviceKeys).toContain('service3');
      expect(serviceKeys).toHaveLength(3);
    });
  });

  describe('안전한 서비스 조회', () => {
    it('tryGet은 존재하지 않는 서비스에 대해 null을 반환해야 한다', () => {
      // When & Then: 존재하지 않는 서비스 안전 조회
      const result = registry.tryGet('non-existent');
      expect(result).toBeNull();
    });

    it('tryGet은 존재하는 서비스를 정상 반환해야 한다', () => {
      // Given: 서비스 등록
      const service = { test: true };
      registry.register('existing', service);

      // When: 안전한 조회
      const result = registry.tryGet('existing');

      // Then: 서비스가 정상 반환되어야 함
      expect(result).toBe(service);
    });
  });

  describe('리소스 정리', () => {
    it('reset 메서드로 모든 서비스를 초기화할 수 있어야 한다', () => {
      // Given: 여러 서비스 등록
      registry.register('service1', { id: 1 });
      registry.register('service2', { id: 2 });

      // When: 리셋 실행
      registry.reset();

      // Then: 모든 서비스가 제거되어야 함
      expect(registry.has('service1')).toBe(false);
      expect(registry.has('service2')).toBe(false);
      expect(registry.getRegisteredServices()).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('null 또는 undefined 서비스 등록을 처리할 수 있어야 한다', () => {
      // When & Then: null 서비스 등록
      registry.register('null-service', null);
      expect(registry.get('null-service')).toBeNull();

      // When & Then: undefined 서비스 등록
      registry.register('undefined-service', undefined);
      expect(registry.get('undefined-service')).toBeUndefined();
    });

    it('빈 문자열 키를 처리할 수 있어야 한다', () => {
      // Given: 빈 문자열 키로 서비스 등록
      const service = { test: true };

      // When & Then: 빈 문자열 키 사용
      registry.register('', service);
      expect(registry.get('')).toBe(service);
      expect(registry.has('')).toBe(true);
    });
  });
});
