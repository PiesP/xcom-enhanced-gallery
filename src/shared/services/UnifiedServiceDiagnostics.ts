/**
 * @fileoverview 통합 서비스 진단 관리자 (TDD GREEN 단계)
 * @description CoreService, ServiceDiagnostics, BrowserService의 진단 기능을 통합한 단일 인터페이스
 */

import { logger } from '@shared/logging/logger';
import { CoreService } from './ServiceManager';
import { BrowserService } from '@shared/browser/BrowserService';

/**
 * 서비스 상태 진단 정보
 */
interface ServiceStatusInfo {
  activeInstances: number;
  health: 'healthy' | 'degraded' | 'critical';
  registeredServices?: number;
  services?: string[];
  instances?: Record<string, boolean>;
  [key: string]: unknown;
}

/**
 * 리소스 사용량 정보
 */
interface ResourceUsageInfo {
  total: number;
  byType?: {
    memory?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * 서비스 진단 관리자
 * 모든 진단 기능을 중앙 집중화
 */
export class ServiceDiagnostics {
  private static instance: ServiceDiagnostics | null = null;
  private readonly coreService: CoreService;
  private readonly browserService: BrowserService;

  constructor() {
    this.coreService = CoreService.getInstance();
    this.browserService = new BrowserService();

    logger.debug('ServiceDiagnostics 초기화 완료');
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): ServiceDiagnostics {
    if (!ServiceDiagnostics.instance) {
      ServiceDiagnostics.instance = new ServiceDiagnostics();
    }
    return ServiceDiagnostics.instance;
  }

  // ================================
  // CoreService 진단 기능 위임
  // ================================

  /**
   * 서비스 상태 정보 조회
   */
  public getServiceStatus(): ServiceStatusInfo {
    const diagnostics = this.coreService.getDiagnostics();
    return {
      activeInstances: diagnostics.activeInstances,
      health: diagnostics.activeInstances > 0 ? 'healthy' : 'degraded',
      registeredServices: diagnostics.registeredServices,
      services: diagnostics.services,
      instances: diagnostics.instances,
    };
  }

  /**
   * 등록된 서비스 목록 조회
   */
  public getRegisteredServices(): string[] {
    return this.coreService.getRegisteredServices();
  }

  /**
   * 활성 인스턴스 수 조회
   */
  public getActiveInstances(): number {
    return this.getServiceStatus().activeInstances;
  }

  /**
   * ServiceManager 진단 실행
   */
  public async diagnoseServiceManager(): Promise<void> {
    return this.coreService.diagnoseServiceManager();
  }

  // ================================
  // BrowserService 진단 기능 위임
  // ================================

  /**
   * 브라우저 진단 정보 조회
   */
  public getBrowserInfo() {
    return this.browserService.getDiagnostics();
  }

  /**
   * 페이지 가시성 상태 조회
   */
  public getPageVisibility(): boolean {
    return this.browserService.isPageVisible();
  }

  /**
   * DOM 준비 상태 조회
   */
  public getDOMReadyState(): boolean {
    return this.browserService.isDOMReady();
  }

  /**
   * 주입된 스타일 수 조회
   */
  public getInjectedStylesCount(): number {
    return this.getBrowserInfo().injectedStylesCount;
  }

  // ================================
  // ResourceManager 진단 기능
  // ================================

  /**
   * 리소스 사용량 조회
   */
  public getResourceUsage() {
    try {
      // 동적 import로 순환 의존성 방지
      const getResourceDiagnostics =
        require('@shared/utils/resource-manager').getResourceDiagnostics;
      return getResourceDiagnostics();
    } catch (error) {
      logger.warn('리소스 진단 정보 조회 실패:', error);
      return {
        total: 0,
        byType: {},
        byContext: {},
      };
    }
  }

  /**
   * 타입별 리소스 수 조회
   */
  public getResourcesByType(type: string): number {
    const usage = this.getResourceUsage();
    return usage.byType[type] || 0;
  }

  /**
   * 컨텍스트별 리소스 수 조회
   */
  public getResourcesByContext(context: string): number {
    const usage = this.getResourceUsage();
    return usage.byContext[context] || 0;
  }

  // ================================
  // 통합 진단 기능
  // ================================

  /**
   * 시스템 종합 진단 정보 조회
   */
  public getSystemDiagnostics() {
    const serviceStatus = this.getServiceStatus();
    const browserInfo = this.getBrowserInfo();
    const resourceUsage = this.getResourceUsage();

    return {
      services: serviceStatus,
      browser: browserInfo,
      resources: resourceUsage,
      memoryOptimization: {
        activeServices: serviceStatus.activeInstances,
        totalResources: resourceUsage.total,
        injectedStyles: browserInfo.injectedStylesCount,
      },
      performanceMetrics: {
        isPageVisible: browserInfo.isPageVisible,
        isDOMReady: browserInfo.isDOMReady,
        resourceEfficiency:
          resourceUsage.total > 0 ? serviceStatus.activeInstances / resourceUsage.total : 1,
      },
      recommendations: this.generateRecommendations(serviceStatus, resourceUsage),
    };
  }

  /**
   * 종합 진단 보고서 생성
   */
  public async generateDiagnosticReport() {
    const systemDiagnostics = this.getSystemDiagnostics();

    return {
      timestamp: new Date().toISOString(),
      services: systemDiagnostics.services,
      browser: systemDiagnostics.browser,
      resources: systemDiagnostics.resources,
      summary: {
        totalServices: systemDiagnostics.services.registeredServices,
        activeInstances: systemDiagnostics.services.activeInstances,
        totalResources: systemDiagnostics.resources.total,
        memoryUsage: systemDiagnostics.memoryOptimization,
        performance: systemDiagnostics.performanceMetrics,
        recommendations: systemDiagnostics.recommendations,
      },
    };
  }

  /**
   * 전역 진단 함수 등록
   */
  public registerGlobalDiagnostic(): void {
    if (import.meta.env.DEV) {
      (globalThis as Record<string, unknown>).__XEG_DIAGNOSE__ =
        this.diagnoseServiceManager.bind(this);
      (globalThis as Record<string, unknown>).__XEG_SYSTEM_REPORT__ =
        this.generateDiagnosticReport.bind(this);
      logger.debug('전역 진단 함수 등록 완료');
    }
  }

  // ================================
  // 정적 메서드 (백워드 호환성)
  // ================================

  /**
   * ServiceDiagnostics 호환성을 위한 정적 메서드
   */
  public static async diagnoseServiceManager(): Promise<void> {
    const instance = ServiceDiagnostics.getInstance();
    return instance.diagnoseServiceManager();
  }

  // ================================
  // 내부 헬퍼 메서드
  // ================================

  /**
   * 성능 최적화 권장사항 생성
   */
  private generateRecommendations(
    serviceStatus: ServiceStatusInfo,
    resourceUsage: ResourceUsageInfo
  ): string[] {
    const recommendations: string[] = [];

    // 서비스 상태 기반 권장사항
    if (
      typeof serviceStatus.registeredServices === 'number' &&
      serviceStatus.registeredServices > serviceStatus.activeInstances * 2
    ) {
      recommendations.push(
        '등록된 서비스가 활성 인스턴스보다 많습니다. 불필요한 서비스를 정리하세요.'
      );
    }

    // 리소스 사용량 기반 권장사항
    if (resourceUsage.byType?.memory && resourceUsage.byType.memory > 10) {
      recommendations.push('메모리 사용량이 높습니다. 리소스 정리를 고려하세요.');
    }

    if (resourceUsage.total > 50) {
      recommendations.push('전체 리소스 사용량이 높습니다. 성능 최적화가 필요합니다.');
    }

    return recommendations;
  }

  /**
   * 정리 작업
   */
  public cleanup(): void {
    // 필요시 정리 작업 수행
    logger.debug('ServiceDiagnostics 정리 완료');
  }
}

// ================================
// 백워드 호환성을 위한 별칭
// ================================

/**
 * UnifiedServiceDiagnostics 별칭 (테스트 호환성 유지)
 */
export const UnifiedServiceDiagnostics = ServiceDiagnostics;
