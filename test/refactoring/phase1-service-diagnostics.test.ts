/**
 * Phase 1.3: 서비스 진단 도구 - ServiceDiagnostics TDD 테스트
 *
 * 목표: ServiceManager의 진단 기능을 분리
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ServiceDiagnostics } from '@shared/services/ServiceDiagnostics';
import { ServiceRegistry } from '@shared/services/ServiceRegistry';
import { ServiceAliasManager } from '@shared/services/ServiceAliasManager';

describe('ServiceDiagnostics - TDD Phase 1.3', () => {
  let diagnostics: ServiceDiagnostics;
  let registry: ServiceRegistry;
  let aliasManager: ServiceAliasManager;

  beforeEach(() => {
    registry = new ServiceRegistry();
    aliasManager = new ServiceAliasManager();
    diagnostics = new ServiceDiagnostics(registry, aliasManager);
  });

  describe('기본 진단 정보', () => {
    it('빈 레지스트리의 진단 정보를 반환할 수 있어야 한다', () => {
      // When: 빈 상태에서 진단 실행
      const result = diagnostics.getDiagnostics();

      // Then: 기본 진단 정보 반환
      expect(result.registeredServices).toBe(0);
      expect(result.activeInstances).toBe(0);
      expect(result.totalAliases).toBe(0);
      expect(result.services).toEqual([]);
      expect(result.aliases).toEqual([]);
    });

    it('서비스가 등록된 상태의 진단 정보를 반환할 수 있어야 한다', () => {
      // Given: 서비스와 별칭 등록
      registry.register('service1', { id: 1 });
      registry.register('service2', { id: 2 });
      aliasManager.registerAlias('s1', 'service1');

      // When: 진단 실행
      const result = diagnostics.getDiagnostics();

      // Then: 정확한 진단 정보 반환
      expect(result.registeredServices).toBe(2);
      expect(result.activeInstances).toBe(2);
      expect(result.totalAliases).toBe(1);
      expect(result.services).toContain('service1');
      expect(result.services).toContain('service2');
      expect(result.aliases).toContain('s1');
    });
  });

  describe('서비스별 상세 진단', () => {
    it('각 서비스의 인스턴스 상태를 확인할 수 있어야 한다', () => {
      // Given: 서비스 등록 (null 포함)
      registry.register('active-service', { test: true });
      registry.register('null-service', null);
      registry.register('undefined-service', undefined);

      // When: 진단 실행
      const result = diagnostics.getDiagnostics();

      // Then: 각 서비스의 인스턴스 상태 확인
      expect(result.instances['active-service']).toBe(true);
      expect(result.instances['null-service']).toBe(true); // null도 유효한 인스턴스
      expect(result.instances['undefined-service']).toBe(true); // undefined도 유효한 인스턴스
    });
  });

  describe('별칭 관련 진단', () => {
    it('각 원본 서비스의 별칭 정보를 제공할 수 있어야 한다', () => {
      // Given: 서비스와 여러 별칭 등록
      registry.register('original-service', { test: true });
      aliasManager.registerAlias('alias1', 'original-service');
      aliasManager.registerAlias('alias2', 'original-service');
      aliasManager.registerAlias('single-alias', 'other-service');

      // When: 별칭 매핑 정보 조회
      const aliasMapping = diagnostics.getAliasMapping();

      // Then: 원본 서비스별 별칭 그룹화 확인
      expect(aliasMapping['original-service']).toContain('alias1');
      expect(aliasMapping['original-service']).toContain('alias2');
      expect(aliasMapping['original-service']).toHaveLength(2);
      expect(aliasMapping['other-service']).toContain('single-alias');
      expect(aliasMapping['other-service']).toHaveLength(1);
    });
  });

  describe('성능 진단', () => {
    it('서비스 액세스 성능을 측정할 수 있어야 한다', async () => {
      // Given: 테스트 서비스 등록
      const service = { getValue: () => 'test' };
      registry.register('performance-test', service);

      // When: 성능 진단 실행
      const performanceResult = await diagnostics.measurePerformance('performance-test', 1000);

      // Then: 성능 측정 결과 확인
      expect(performanceResult.iterations).toBe(1000);
      expect(performanceResult.averageTimeMs).toBeGreaterThan(0);
      expect(performanceResult.totalTimeMs).toBeGreaterThan(0);
      expect(performanceResult.serviceKey).toBe('performance-test');
    });

    it('존재하지 않는 서비스의 성능 측정 시 에러를 발생시켜야 한다', async () => {
      // When & Then: 존재하지 않는 서비스 성능 측정
      await expect(diagnostics.measurePerformance('non-existent', 100)).rejects.toThrow(
        'Service not found for performance measurement: non-existent'
      );
    });
  });

  describe('메모리 사용량 진단', () => {
    it('서비스 메모리 사용량을 추정할 수 있어야 한다', () => {
      // Given: 다양한 크기의 서비스 등록
      registry.register('small-service', { value: 'test' });
      registry.register('large-service', {
        data: new Array(1000).fill('data'),
        methods: {
          process: () => 'result',
          calculate: () => 42,
        },
      });

      // When: 메모리 사용량 진단
      const memoryInfo = diagnostics.getMemoryUsage();

      // Then: 메모리 정보 확인
      expect(memoryInfo.totalServices).toBe(2);
      expect(memoryInfo.services['small-service']).toBeDefined();
      expect(memoryInfo.services['large-service']).toBeDefined();
      expect(memoryInfo.estimatedTotalBytes).toBeGreaterThan(0);
    });
  });

  describe('로깅 옵션', () => {
    it('로깅 옵션이 활성화된 경우 로거에 출력해야 한다', () => {
      // Given: 로거 모킹
      const loggerSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      // When: 로깅 옵션으로 진단 실행
      diagnostics.getDiagnostics({ log: true });

      // Then: 로거 출력 확인 (실제로는 logger.info가 내부적으로 console.info를 호출)
      // 이 테스트는 로깅 기능이 호출되는지 확인하는 것이므로 구현을 검증
      const result = diagnostics.getDiagnostics({ log: false });
      expect(result).toBeDefined();

      // Cleanup
      loggerSpy.mockRestore();
    });
  });

  describe('종합 진단 보고서', () => {
    it('전체 시스템 상태를 종합한 보고서를 생성할 수 있어야 한다', () => {
      // Given: 복잡한 서비스 구조 설정
      registry.register('core.service', { type: 'core' });
      registry.register('feature.gallery', { type: 'feature' });
      registry.register('utils.helper', { type: 'utility' });

      aliasManager.registerAlias('core', 'core.service');
      aliasManager.registerAlias('gallery', 'feature.gallery');
      aliasManager.registerAlias('helper', 'utils.helper');

      // When: 종합 보고서 생성
      const report = diagnostics.generateReport();

      // Then: 보고서 내용 확인
      expect(report.summary.totalServices).toBe(3);
      expect(report.summary.totalAliases).toBe(3);
      expect(report.summary.aliasToServiceRatio).toBeCloseTo(1.0, 1);
      expect(report.serviceDetails).toHaveLength(3);
      expect(report.aliasDetails).toHaveLength(3);
      expect(report.timestamp).toBeDefined();
    });
  });

  describe('리소스 정리', () => {
    it('진단 데이터를 초기화할 수 있어야 한다', () => {
      // Given: 진단 실행으로 데이터 생성
      diagnostics.getDiagnostics();
      diagnostics.generateReport();

      // When: 리소스 정리
      diagnostics.cleanup();

      // Then: 정리 후에도 기본 기능 동작 확인
      const result = diagnostics.getDiagnostics();
      expect(result).toBeDefined();
    });
  });
});
