/**
 * @fileoverview Monitor - Diagnostics and Monitoring Utility
 * @version 1.0.0 - Clean Architecture Implementation
 * @author X.com Enhanced Gallery Team
 * @since 4.0.0
 *
 * @description
 * 시스템 초기화 상태를 모니터링하고 진단하는 유틸리티
 * Clean Architecture 원칙에 따라 Infrastructure layer 의존성 관리
 *
 * 주요 기능:
 * - Vendor 초기화 상태 추적
 * - Core 서비스 상태 모니터링
 * - Feature 레이어 상태 진단
 * - 초기화 순서 검증
 * - 건강 상태 보고서 생성
 */

import {
  getVendorInitializationReport,
  isVendorInitialized,
  isVendorsInitialized,
} from '@infrastructure/external/vendors';
import { logger } from '@infrastructure/logging/logger';

// ================================
// 타입 정의
// ================================

export interface InitializationStatus {
  layer: string;
  component: string;
  initialized: boolean;
  timestamp: number;
  error?: string;
}

export interface InitializationReport {
  timestamp: number;
  overallStatus: 'healthy' | 'warning' | 'error';
  vendorsStatus: {
    initialized: boolean;
    vendors: Record<string, boolean>;
    missingVendors: string[];
  };
  coreStatus: {
    signalsInitialized: boolean;
    servicesInitialized: boolean;
  };
  featuresStatus: {
    galleryServiceInitialized: boolean;
    coordinatorInitialized: boolean;
  };
  appStatus: {
    bootstrapperInitialized: boolean;
    applicationRunning: boolean;
  };
  initializationOrder: InitializationStatus[];
  recommendations: string[];
}

export interface HealthCheckResult {
  passed: boolean;
  severity: 'info' | 'warning' | 'error';
  message: string;
  component: string;
  timestamp: number;
}

// ================================
// InitializationMonitor 클래스
// ================================

class InitializationMonitor {
  private static instance: InitializationMonitor | null = null;
  private readonly initializationLog: InitializationStatus[] = [];
  private readonly healthChecks = new Map<string, HealthCheckResult>();

  private constructor() {
    logger.debug('InitializationMonitor: 인스턴스 생성');
  }

  public static getInstance(): InitializationMonitor {
    InitializationMonitor.instance ??= new InitializationMonitor();
    return InitializationMonitor.instance;
  }

  /**
   * 초기화 상태 기록
   */
  public recordInitialization(
    layer: string,
    component: string,
    initialized: boolean,
    error?: string
  ): void {
    const status: InitializationStatus = {
      layer,
      component,
      initialized,
      timestamp: Date.now(),
      ...(error && { error }),
    };

    this.initializationLog.push(status);

    if (initialized) {
      logger.debug(`초기화 완료: ${layer}.${component}`);
    } else {
      logger.error(`초기화 실패: ${layer}.${component}`, { error });
    }
  }

  /**
   * 건강 상태 검사 실행
   */
  public runHealthCheck(
    component: string,
    checkFunction: () => boolean,
    expectedMessage: string
  ): HealthCheckResult {
    try {
      const passed = checkFunction();
      const result: HealthCheckResult = {
        passed,
        severity: passed ? 'info' : 'warning',
        message: passed ? `${expectedMessage} - 정상` : `${expectedMessage} - 실패`,
        component,
        timestamp: Date.now(),
      };

      this.healthChecks.set(component, result);
      return result;
    } catch (error) {
      const result: HealthCheckResult = {
        passed: false,
        severity: 'error',
        message: `${expectedMessage} - 오류: ${error instanceof Error ? error.message : String(error)}`,
        component,
        timestamp: Date.now(),
      };

      this.healthChecks.set(component, result);
      return result;
    }
  }

  /**
   * Vendor 레이어 건강 상태 검사
   */
  public checkVendorHealth(): HealthCheckResult[] {
    const results: HealthCheckResult[] = [];

    // 전체 vendor 초기화 상태
    results.push(
      this.runHealthCheck(
        'vendors.overall',
        () => isVendorsInitialized(),
        'Vendor 전체 초기화 상태'
      )
    );

    // 개별 vendor 상태
    const vendors = ['fflate', 'preact', 'hooks', 'signals', 'motion'] as const;
    vendors.forEach(vendor => {
      results.push(
        this.runHealthCheck(
          `vendors.${vendor}`,
          () => isVendorInitialized(vendor),
          `${vendor} 초기화 상태`
        )
      );
    });

    return results;
  }

  /**
   * Core 레이어 건강 상태 검사
   */
  public checkCoreHealth(): HealthCheckResult[] {
    const results: HealthCheckResult[] = [];

    // Signals 초기화 상태 (간접 확인)
    results.push(
      this.runHealthCheck(
        'core.signals',
        () => isVendorInitialized('signals'),
        'Core Signals 초기화 상태'
      )
    );

    return results;
  }

  /**
   * 종합 초기화 보고서 생성
   */
  public generateInitializationReport(): InitializationReport {
    const vendorsReport = getVendorInitializationReport();
    const vendorHealthChecks = this.checkVendorHealth();
    const coreHealthChecks = this.checkCoreHealth();

    const vendorsStatus = {
      initialized: vendorsReport.initializationRate === 100,
      vendors: Object.fromEntries(
        Object.entries(vendorsReport.statuses).map(([key, status]) => [
          key,
          (status as { initialized: boolean }).initialized,
        ])
      ),
      missingVendors: Object.keys(vendorsReport.statuses).filter(
        key =>
          !(vendorsReport.statuses as Record<string, { initialized: boolean }>)[key]?.initialized
      ),
    };

    // 전체 상태 판단
    const hasErrors = [...vendorHealthChecks, ...coreHealthChecks].some(
      check => check.severity === 'error'
    );
    const hasWarnings = [...vendorHealthChecks, ...coreHealthChecks].some(
      check => check.severity === 'warning'
    );

    let overallStatus: 'healthy' | 'warning' | 'error';
    if (hasErrors) {
      overallStatus = 'error';
    } else if (hasWarnings) {
      overallStatus = 'warning';
    } else {
      overallStatus = 'healthy';
    }

    // 권장사항 생성
    const recommendations: string[] = [];
    if (!vendorsStatus.initialized) {
      recommendations.push('모든 vendor를 초기화하기 위해 initializeVendors()를 호출하세요.');
    }
    if (vendorsStatus.missingVendors.length > 0) {
      recommendations.push('일부 vendor가 초기화되지 않았습니다. 로그를 확인하세요.');
    }

    const report: InitializationReport = {
      timestamp: Date.now(),
      overallStatus,
      vendorsStatus,
      coreStatus: {
        signalsInitialized: isVendorInitialized('signals'),
        servicesInitialized: true, // 기본값, 향후 확장 가능
      },
      featuresStatus: {
        galleryServiceInitialized: false, // 향후 확장
        coordinatorInitialized: false, // 향후 확장
      },
      appStatus: {
        bootstrapperInitialized: false, // 향후 확장
        applicationRunning: false, // 향후 확장
      },
      initializationOrder: [...this.initializationLog],
      recommendations,
    };

    return report;
  }

  /**
   * 초기화 순서 검증
   */
  public validateInitializationOrder(): {
    valid: boolean;
    violations: string[];
    expectedOrder: string[];
  } {
    const expectedOrder = [
      'Infrastructure.Vendors',
      'Core.Signals',
      'Core.Services',
      'Features.GalleryService',
      'Features.Coordinator',
      'App.Bootstrapper',
    ];

    const violations: string[] = [];
    const actualOrder = this.initializationLog
      .filter(status => status.initialized)
      .map(status => `${status.layer}.${status.component}`);

    // 기본적인 순서 검증 (vendor가 먼저 초기화되어야 함)
    const vendorIndex = actualOrder.findIndex(item => item.startsWith('Infrastructure.Vendors'));
    const signalsIndex = actualOrder.findIndex(item => item.startsWith('Core.Signals'));

    if (vendorIndex !== -1 && signalsIndex !== -1 && vendorIndex > signalsIndex) {
      violations.push('Vendors는 Signals보다 먼저 초기화되어야 합니다.');
    }

    return {
      valid: violations.length === 0,
      violations,
      expectedOrder,
    };
  }

  /**
   * 진단 보고서 출력
   */
  public printDiagnosticReport(): void {
    const report = this.generateInitializationReport();

    logger.info('🔍 X.com Enhanced Gallery - 초기화 진단 보고서', {
      timestamp: new Date(report.timestamp).toISOString(),
      overallStatus: report.overallStatus.toUpperCase(),
      vendorsStatus: {
        initialized: report.vendorsStatus.initialized,
        vendors: report.vendorsStatus.vendors,
        missingVendors: report.vendorsStatus.missingVendors,
      },
      coreStatus: {
        signalsInitialized: report.coreStatus.signalsInitialized,
        servicesInitialized: report.coreStatus.servicesInitialized,
      },
      recommendations: report.recommendations,
    });

    if (report.vendorsStatus.missingVendors.length > 0) {
      logger.warn('누락된 vendors 발견', { missingVendors: report.vendorsStatus.missingVendors });
    }

    const orderValidation = this.validateInitializationOrder();
    if (!orderValidation.valid) {
      logger.warn('초기화 순서 위반 감지', { violations: orderValidation.violations });
    }

    // 개발 환경에서만 상세 콘솔 출력
    if (process.env.NODE_ENV === 'development') {
      console.table(report.vendorsStatus.vendors);
      if (report.recommendations.length > 0) {
        logger.info('권장사항', { recommendations: report.recommendations });
      }
    }
  }

  /**
   * 모니터 리셋 (테스트용)
   */
  public reset(): void {
    this.initializationLog.length = 0;
    this.healthChecks.clear();
    logger.debug('InitializationMonitor: 리셋 완료');
  }
}

// ================================
// 공개 API
// ================================

const monitor = InitializationMonitor.getInstance();

/**
 * 초기화 상태 기록
 */
export const recordInitialization = (
  layer: string,
  component: string,
  initialized: boolean,
  error?: string
): void => monitor.recordInitialization(layer, component, initialized, error);

/**
 * 건강 상태 검사 실행
 */
export const runHealthCheck = (
  component: string,
  checkFunction: () => boolean,
  expectedMessage: string
): HealthCheckResult => monitor.runHealthCheck(component, checkFunction, expectedMessage);

/**
 * Vendor 건강 상태 검사
 */
export const checkVendorHealth = (): HealthCheckResult[] => monitor.checkVendorHealth();

/**
 * 종합 초기화 보고서 생성
 */
export const generateInitializationReport = (): InitializationReport =>
  monitor.generateInitializationReport();

/**
 * 초기화 순서 검증
 */
export const validateInitializationOrder = (): {
  valid: boolean;
  violations: string[];
  expectedOrder: string[];
} => monitor.validateInitializationOrder();

/**
 * 진단 보고서 출력
 */
export const printDiagnosticReport = (): void => monitor.printDiagnosticReport();

/**
 * 모니터 리셋
 */
export const resetMonitor = (): void => monitor.reset();

// 개발 환경에서 전역 접근 허용
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  interface WindowWithMonitor extends Window {
    initializationMonitor?: {
      generateReport: () => InitializationReport;
      printReport: () => void;
      checkVendors: () => HealthCheckResult[];
      reset: () => void;
    };
  }

  (window as WindowWithMonitor).initializationMonitor = {
    generateReport: generateInitializationReport,
    printReport: printDiagnosticReport,
    checkVendors: checkVendorHealth,
    reset: resetMonitor,
  };
}
