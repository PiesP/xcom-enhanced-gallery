/**
 * @fileoverview ServiceDiagnostics - 서비스 진단 도구
 * @description TDD Phase 1.3 - GREEN 단계: 최소 구현
 *
 * ServiceManager의 진단 기능을 분리한 독립적인 클래스
 */

import { logger } from '@shared/logging/logger';
import type { ServiceRegistry } from './ServiceRegistry';
import type { ServiceAliasManager } from './ServiceAliasManager';

/**
 * 진단 결과 인터페이스
 */
export interface DiagnosticsResult {
  registeredServices: number;
  activeInstances: number;
  totalAliases: number;
  services: string[];
  aliases: string[];
  instances: Record<string, boolean>;
}

/**
 * 성능 측정 결과 인터페이스
 */
export interface PerformanceResult {
  serviceKey: string;
  iterations: number;
  totalTimeMs: number;
  averageTimeMs: number;
}

/**
 * 메모리 사용량 정보 인터페이스
 */
export interface MemoryUsageInfo {
  totalServices: number;
  services: Record<string, number>;
  estimatedTotalBytes: number;
}

/**
 * 종합 진단 보고서 인터페이스
 */
export interface DiagnosticsReport {
  timestamp: Date;
  summary: {
    totalServices: number;
    totalAliases: number;
    aliasToServiceRatio: number;
  };
  serviceDetails: Array<{
    key: string;
    hasInstance: boolean;
    aliases: string[];
  }>;
  aliasDetails: Array<{
    alias: string;
    originalKey: string;
  }>;
}

/**
 * 서비스 진단 도구
 *
 * 책임:
 * - 서비스 시스템 상태 진단
 * - 성능 측정
 * - 메모리 사용량 분석
 * - 종합 보고서 생성
 */
export class ServiceDiagnostics {
  constructor(
    private readonly registry: ServiceRegistry,
    private readonly aliasManager: ServiceAliasManager
  ) {
    logger.debug('[ServiceDiagnostics] 초기화됨');
  }

  /**
   * 기본 진단 정보 반환
   *
   * @param options 진단 옵션
   * @returns 진단 결과
   */
  public getDiagnostics(options?: { log?: boolean }): DiagnosticsResult {
    const services = this.registry.getRegisteredServices();
    const aliases = this.aliasManager.getAllAliases();
    const instances: Record<string, boolean> = {};

    // 각 서비스의 인스턴스 상태 확인
    for (const key of services) {
      try {
        this.registry.get(key);
        instances[key] = true;
      } catch {
        instances[key] = false;
      }
    }

    const result: DiagnosticsResult = {
      registeredServices: services.length,
      activeInstances: services.filter(key => instances[key]).length,
      totalAliases: aliases.length,
      services,
      aliases,
      instances,
    };

    // 로깅 옵션이 활성화된 경우 콘솔 출력
    if (options?.log) {
      logger.info('🔍 ServiceDiagnostics 진단 결과:', result);
    }

    return result;
  }

  /**
   * 별칭 매핑 정보 반환
   *
   * @returns 원본 서비스별 별칭 그룹화 정보
   */
  public getAliasMapping(): Record<string, string[]> {
    const services = this.registry.getRegisteredServices();
    const mapping: Record<string, string[]> = {};

    for (const service of services) {
      mapping[service] = this.aliasManager.getAliasesFor(service);
    }

    // 별칭만 있고 서비스가 없는 경우도 포함
    const aliases = this.aliasManager.getAllAliases();
    for (const alias of aliases) {
      const original = this.aliasManager.resolveAlias(alias);
      if (!mapping[original]) {
        mapping[original] = [];
      }
      if (!mapping[original].includes(alias)) {
        mapping[original].push(alias);
      }
    }

    return mapping;
  }

  /**
   * 서비스 액세스 성능 측정
   *
   * @param serviceKey 측정할 서비스 키
   * @param iterations 반복 횟수
   * @returns 성능 측정 결과
   */
  public async measurePerformance(
    serviceKey: string,
    iterations: number
  ): Promise<PerformanceResult> {
    // 서비스 존재 여부 확인
    if (!this.registry.has(serviceKey)) {
      throw new Error(`Service not found for performance measurement: ${serviceKey}`);
    }

    const startTime = performance.now();

    // 지정된 횟수만큼 서비스 접근 반복
    for (let i = 0; i < iterations; i++) {
      this.registry.get(serviceKey);
    }

    const endTime = performance.now();
    const totalTimeMs = endTime - startTime;

    return {
      serviceKey,
      iterations,
      totalTimeMs,
      averageTimeMs: totalTimeMs / iterations,
    };
  }

  /**
   * 메모리 사용량 추정
   *
   * @returns 메모리 사용량 정보
   */
  public getMemoryUsage(): MemoryUsageInfo {
    const services = this.registry.getRegisteredServices();
    const serviceMemory: Record<string, number> = {};
    let totalBytes = 0;

    for (const key of services) {
      try {
        const service = this.registry.get(key);
        // 간단한 메모리 사용량 추정 (실제로는 더 정교한 계산이 필요)
        const estimatedBytes = this.estimateObjectSize(service);
        serviceMemory[key] = estimatedBytes;
        totalBytes += estimatedBytes;
      } catch {
        serviceMemory[key] = 0;
      }
    }

    return {
      totalServices: services.length,
      services: serviceMemory,
      estimatedTotalBytes: totalBytes,
    };
  }

  /**
   * 종합 진단 보고서 생성
   *
   * @returns 종합 보고서
   */
  public generateReport(): DiagnosticsReport {
    const diagnostics = this.getDiagnostics();

    const serviceDetails = diagnostics.services.map(key => ({
      key,
      hasInstance: diagnostics.instances[key],
      aliases: this.aliasManager.getAliasesFor(key),
    }));

    const aliasDetails = diagnostics.aliases.map(alias => ({
      alias,
      originalKey: this.aliasManager.resolveAlias(alias),
    }));

    return {
      timestamp: new Date(),
      summary: {
        totalServices: diagnostics.registeredServices,
        totalAliases: diagnostics.totalAliases,
        aliasToServiceRatio: diagnostics.totalAliases / Math.max(diagnostics.registeredServices, 1),
      },
      serviceDetails,
      aliasDetails,
    };
  }

  /**
   * 리소스 정리
   */
  public cleanup(): void {
    logger.debug('[ServiceDiagnostics] 리소스 정리됨');
  }

  /**
   * 객체 크기 추정 (간단한 구현)
   */
  private estimateObjectSize(obj: unknown): number {
    if (obj === null || obj === undefined) {
      return 8; // 포인터 크기
    }

    if (typeof obj === 'string') {
      return obj.length * 2; // UTF-16 기준
    }

    if (typeof obj === 'number') {
      return 8; // 64-bit number
    }

    if (typeof obj === 'boolean') {
      return 4; // boolean
    }

    if (Array.isArray(obj)) {
      return obj.reduce((total, item) => total + this.estimateObjectSize(item), 24); // Array overhead
    }

    if (typeof obj === 'object') {
      let size = 24; // Object overhead
      for (const [key, value] of Object.entries(obj)) {
        size += this.estimateObjectSize(key) + this.estimateObjectSize(value);
      }
      return size;
    }

    return 8; // Default pointer size
  }
}
