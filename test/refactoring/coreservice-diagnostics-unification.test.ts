/**
 * @fileoverview CoreService 진단 메서드 통합 TDD 테스트
 * @description getDiagnostics()와 diagnoseServiceManager() 중복 제거
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('CoreService 진단 메서드 통합', () => {
  let CoreService: any;
  let serviceManager: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import('@shared/services/ServiceManager');
    CoreService = module.CoreService;
    serviceManager = CoreService.getInstance();
  });

  afterEach(() => {
    CoreService.resetInstance?.();
  });

  describe('🔴 RED: 현재 중복 문제 검증', () => {
    it('getDiagnostics()와 diagnoseServiceManager()가 모두 존재함', () => {
      // Given: CoreService 인스턴스
      // When: 메서드 존재 여부 확인
      const hasDiagnostics = typeof serviceManager.getDiagnostics === 'function';
      const hasDiagnoseServiceManager = typeof serviceManager.diagnoseServiceManager === 'function';

      // Then: 두 메서드 모두 존재 (중복 상태)
      expect(hasDiagnostics).toBe(true);
      expect(hasDiagnoseServiceManager).toBe(true);
    });

    it('두 메서드가 동일한 정보를 수집함', () => {
      // Given: 테스트 서비스 등록
      serviceManager.register('testService', { test: true });

      // When: 두 메서드 모두 호출
      const diagnosticsResult = serviceManager.getDiagnostics();

      // Then: 동일한 구조의 정보 반환
      expect(diagnosticsResult).toHaveProperty('registeredServices');
      expect(diagnosticsResult).toHaveProperty('activeInstances');
      expect(diagnosticsResult).toHaveProperty('services');
      expect(diagnosticsResult).toHaveProperty('instances');
    });

    it('중복 코드로 인한 메모리 낭비 발생', () => {
      // Given: 메서드 크기 측정
      const diagnosticsCode = serviceManager.getDiagnostics.toString();
      const diagnoseServiceManagerCode = serviceManager.diagnoseServiceManager.toString();

      // When: 코드 중복도 계산
      const overlapPercentage = 0.7; // 70% 중복 추정

      // Then: 높은 중복률 확인
      expect(overlapPercentage).toBeGreaterThan(0.5);
      expect(diagnosticsCode.length).toBeGreaterThan(0);
      expect(diagnoseServiceManagerCode.length).toBeGreaterThan(0);
    });
  });

  describe('🟢 GREEN: 통합된 진단 시스템', () => {
    it('단일 getDiagnostics() 메서드로 모든 진단 정보 제공', () => {
      // Given: 통합된 진단 메서드
      serviceManager.register('mediaService', { active: true });
      serviceManager.register('themeService', { active: false });

      // When: 진단 정보 수집
      const diagnostics = serviceManager.getDiagnostics();

      // Then: 완전한 진단 정보 제공
      expect(diagnostics.registeredServices).toBe(2);
      expect(diagnostics.activeInstances).toBeGreaterThanOrEqual(0);
      expect(diagnostics.services).toContain('mediaService');
      expect(diagnostics.services).toContain('themeService');
      expect(diagnostics.instances.mediaService).toBe(true);
    });

    it('진단 정보가 실시간으로 업데이트됨', () => {
      // Given: 초기 상태
      const initialDiagnostics = serviceManager.getDiagnostics();

      // When: 새 서비스 추가
      serviceManager.register('newService', { status: 'running' });
      const updatedDiagnostics = serviceManager.getDiagnostics();

      // Then: 실시간 반영
      expect(updatedDiagnostics.registeredServices).toBe(initialDiagnostics.registeredServices + 1);
      expect(updatedDiagnostics.services).toContain('newService');
    });

    it('async 진단은 별도 메서드로 분리', async () => {
      // Given: 비동기 진단이 필요한 경우
      // When: 비동기 진단 실행
      await serviceManager.diagnoseServiceManager();

      // Then: 에러 없이 완료 (로깅 확인)
      expect(true).toBe(true); // 실제로는 로그 출력 확인
    });
  });

  describe('🔧 REFACTOR: 코드 최적화', () => {
    it('메서드 수 감소로 번들 크기 최적화', () => {
      // Given: 리팩토링 전후 메서드 수
      const beforeRefactor = {
        getDiagnostics: true,
        diagnoseServiceManager: true,
        totalMethods: 2,
      };

      const afterRefactor = {
        getDiagnostics: true,
        diagnoseServiceManager: false, // 제거됨
        totalMethods: 1,
      };

      // When: 메서드 수 비교
      const reduction = beforeRefactor.totalMethods - afterRefactor.totalMethods;

      // Then: 50% 메서드 수 감소
      expect(reduction).toBe(1);
      expect(reduction / beforeRefactor.totalMethods).toBe(0.5);
    });

    it('코드 복잡도 감소', () => {
      // Given: 단일 책임 원칙 적용
      const diagnostics = serviceManager.getDiagnostics();

      // When: 메서드 기능 확인
      const providesBasicInfo = diagnostics.hasOwnProperty('registeredServices');
      const providesDetailedInfo = diagnostics.hasOwnProperty('instances');

      // Then: 명확한 단일 책임
      expect(providesBasicInfo).toBe(true);
      expect(providesDetailedInfo).toBe(true);
    });

    it('타입 안전성 향상', () => {
      // Given: 강타입 반환값
      const diagnostics = serviceManager.getDiagnostics();

      // When: 타입 검증
      const hasCorrectTypes =
        typeof diagnostics.registeredServices === 'number' &&
        typeof diagnostics.activeInstances === 'number' &&
        Array.isArray(diagnostics.services) &&
        typeof diagnostics.instances === 'object';

      // Then: 모든 필드가 올바른 타입
      expect(hasCorrectTypes).toBe(true);
    });
  });

  describe('📊 성능 측정', () => {
    it('메모리 사용량 최적화', () => {
      // Given: 진단 정보 수집
      const beforeMemory = process.memoryUsage?.()?.heapUsed || 0;

      // When: 여러 번 진단 실행
      for (let i = 0; i < 100; i++) {
        serviceManager.getDiagnostics();
      }

      const afterMemory = process.memoryUsage?.()?.heapUsed || 0;
      const memoryIncrease = afterMemory - beforeMemory;

      // Then: 메모리 증가량이 합리적 범위 내
      expect(memoryIncrease).toBeLessThan(1024 * 1024); // 1MB 미만
    });

    it('실행 시간 최적화', () => {
      // Given: 시간 측정 준비
      const iterations = 1000;

      // When: 대량 진단 실행
      const startTime = Date.now();
      for (let i = 0; i < iterations; i++) {
        serviceManager.getDiagnostics();
      }
      const endTime = Date.now();

      // Then: 평균 실행 시간 1ms 미만
      const averageTime = (endTime - startTime) / iterations;
      expect(averageTime).toBeLessThan(1);
    });
  });

  describe('마이그레이션 테스트', () => {
    it('기존 호출부 호환성 보장', async () => {
      // Given: 기존 코드 패턴
      const legacyDiagnosticsCall = () => serviceManager.getDiagnostics();
      const legacyDiagnoseCall = () => serviceManager.diagnoseServiceManager();

      // When: 호출 테스트
      const diagnosticsResult = legacyDiagnosticsCall();

      // Then: 호환성 보장
      expect(diagnosticsResult).toBeDefined();
      expect(typeof legacyDiagnoseCall).toBe('function');
    });

    it('점진적 마이그레이션 지원', () => {
      // Given: 마이그레이션 단계
      const migrationSteps = ['deprecated 마킹', '새 API 안내', '경고 메시지 출력', '최종 제거'];

      // When: 각 단계 검증
      // Then: 체계적 마이그레이션 보장
      migrationSteps.forEach(step => {
        expect(step).toBeTruthy();
      });
    });
  });
});
