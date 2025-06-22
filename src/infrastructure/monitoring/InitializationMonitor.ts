/**
 * Initialization Monitor - Infrastructure Layer
 *
 * Clean Architecture 완전 적용: 초기화 순서 및 상태 모니터링
 * 레이어별 초기화 검증 및 진단 정보 제공
 *
 * @version 1.0.0 - Clean Architecture 완전 적용
 * @description 애플리케이션 초기화 과정 모니터링 및 검증
 */

import {
  getVendorInitializationReport,
  getVendorStatuses,
  isVendorsInitialized,
} from '../external/vendors';
import { logger } from '../logging/logger';

// ================================
// 타입 정의
// ================================

// interface VendorStatus - 현재 사용되지 않음 (getVendorStatuses가 다른 형태로 반환)

export interface LayerInitializationStatus {
  layerName: string;
  isInitialized: boolean;
  initializationTime: number | null;
  dependencies: string[];
  errors: Error[];
  warnings: string[];
}

export interface ApplicationInitializationReport {
  overallStatus: 'success' | 'partial' | 'failed';
  totalInitializationTime: number;
  layers: LayerInitializationStatus[];
  criticalErrors: Error[];
  recommendations: string[];
  vendorReport: ReturnType<typeof getVendorInitializationReport>;
}

export interface InitializationHealthCheck {
  isHealthy: boolean;
  issues: string[];
  recommendations: string[];
  performance: {
    initializationTime: number;
    isWithinAcceptableRange: boolean;
    acceptableThreshold: number;
  };
}

// ================================
// 초기화 모니터
// ================================

class InitializationMonitor {
  private static instance: InitializationMonitor | null = null;
  private readonly layerStatuses = new Map<string, LayerInitializationStatus>();
  private overallStartTime: number | null = null;
  private overallEndTime: number | null = null;

  public static getInstance(): InitializationMonitor {
    InitializationMonitor.instance ??= new InitializationMonitor();
    return InitializationMonitor.instance;
  }

  /**
   * 전체 초기화 시작 기록
   */
  public startInitialization(): void {
    this.overallStartTime = Date.now();
    this.layerStatuses.clear();
    logger.info('애플리케이션 초기화 모니터링 시작');
  }

  /**
   * 전체 초기화 완료 기록
   */
  public completeInitialization(): void {
    this.overallEndTime = Date.now();
    logger.info('애플리케이션 초기화 모니터링 완료');
  }

  /**
   * 레이어별 초기화 상태 기록
   */
  public recordLayerInitialization(status: LayerInitializationStatus): void {
    this.layerStatuses.set(status.layerName, status);

    if (status.isInitialized) {
      logger.debug(`레이어 ${status.layerName} 초기화 완료 (${status.initializationTime}ms)`);
    } else {
      logger.warn(`레이어 ${status.layerName} 초기화 실패`, { errors: status.errors });
    }
  }

  /**
   * Infrastructure Layer 상태 검증
   */
  public checkInfrastructureLayer(): LayerInitializationStatus {
    const startTime = Date.now();
    const errors: Error[] = [];
    const warnings: string[] = [];

    // Vendor 초기화 검증
    if (!isVendorsInitialized()) {
      errors.push(new Error('Vendor 라이브러리가 초기화되지 않았습니다'));
    }

    const vendorReport = getVendorInitializationReport();
    if (vendorReport.initializationRate < 100) {
      warnings.push('일부 vendor가 초기화되지 않았습니다');
    }

    const status: LayerInitializationStatus = {
      layerName: 'Infrastructure',
      isInitialized: errors.length === 0,
      initializationTime: Date.now() - startTime,
      dependencies: [],
      errors,
      warnings,
    };

    this.recordLayerInitialization(status);
    return status;
  }

  /**
   * Core Layer 상태 검증
   */
  public checkCoreLayer(): LayerInitializationStatus {
    const startTime = Date.now();
    const errors: Error[] = [];
    const warnings: string[] = [];

    // Infrastructure Layer 의존성 확인
    const infrastructureStatus = this.layerStatuses.get('Infrastructure');
    if (!infrastructureStatus?.isInitialized) {
      errors.push(new Error('Infrastructure Layer가 초기화되지 않았습니다'));
    }

    // Signals 초기화 확인
    if (!isVendorsInitialized()) {
      errors.push(new Error('Preact Signals가 사용 가능하지 않습니다'));
    }

    const status: LayerInitializationStatus = {
      layerName: 'Core',
      isInitialized: errors.length === 0,
      initializationTime: Date.now() - startTime,
      dependencies: ['Infrastructure'],
      errors,
      warnings,
    };

    this.recordLayerInitialization(status);
    return status;
  }

  /**
   * Features Layer 상태 검증
   */
  public checkFeaturesLayer(): LayerInitializationStatus {
    const startTime = Date.now();
    const errors: Error[] = [];
    const warnings: string[] = [];

    // Core Layer 의존성 확인
    const coreStatus = this.layerStatuses.get('Core');
    if (!coreStatus?.isInitialized) {
      errors.push(new Error('Core Layer가 초기화되지 않았습니다'));
    }

    const status: LayerInitializationStatus = {
      layerName: 'Features',
      isInitialized: errors.length === 0,
      initializationTime: Date.now() - startTime,
      dependencies: ['Core', 'Infrastructure'],
      errors,
      warnings,
    };

    this.recordLayerInitialization(status);
    return status;
  }

  /**
   * App Layer 상태 검증
   */
  public checkAppLayer(): LayerInitializationStatus {
    const startTime = Date.now();
    const errors: Error[] = [];
    const warnings: string[] = [];

    // 모든 하위 레이어 의존성 확인
    const requiredLayers = ['Infrastructure', 'Core', 'Features'];
    for (const layerName of requiredLayers) {
      const layerStatus = this.layerStatuses.get(layerName);
      if (!layerStatus?.isInitialized) {
        errors.push(new Error(`${layerName} Layer가 초기화되지 않았습니다`));
      }
    }

    const status: LayerInitializationStatus = {
      layerName: 'App',
      isInitialized: errors.length === 0,
      initializationTime: Date.now() - startTime,
      dependencies: requiredLayers,
      errors,
      warnings,
    };

    this.recordLayerInitialization(status);
    return status;
  }

  /**
   * 전체 초기화 보고서 생성
   */
  public generateReport(): ApplicationInitializationReport {
    const layers = Array.from(this.layerStatuses.values());
    const criticalErrors: Error[] = [];
    const recommendations: string[] = [];

    // 전체 상태 판단
    const failedLayers = layers.filter(layer => !layer.isInitialized);
    const overallStatus =
      failedLayers.length === 0
        ? 'success'
        : failedLayers.length < layers.length
          ? 'partial'
          : 'failed';

    // 크리티컬 에러 수집
    layers.forEach(layer => {
      criticalErrors.push(...layer.errors);
    });

    // 권장사항 생성
    if (failedLayers.length > 0) {
      recommendations.push(
        `실패한 레이어를 순서대로 재초기화하세요: ${failedLayers.map(l => l.layerName).join(' → ')}`
      );
    }

    if (!isVendorsInitialized()) {
      recommendations.push('initializeVendors()를 먼저 호출하여 외부 라이브러리를 초기화하세요');
    }

    const totalTime =
      this.overallStartTime && this.overallEndTime
        ? this.overallEndTime - this.overallStartTime
        : 0;

    if (totalTime > 5000) {
      recommendations.push('초기화 시간이 5초를 초과했습니다. 성능 최적화를 고려하세요');
    }

    return {
      overallStatus,
      totalInitializationTime: totalTime,
      layers,
      criticalErrors,
      recommendations,
      vendorReport: getVendorInitializationReport(),
    };
  }

  /**
   * 헬스체크 수행
   */
  public performHealthCheck(): InitializationHealthCheck {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Vendor 상태 확인
    if (!isVendorsInitialized()) {
      issues.push('Vendor 라이브러리가 초기화되지 않았습니다');
      recommendations.push('initializeVendors()를 호출하세요');
    }

    // 초기화 순서 확인
    const requiredOrder: readonly string[] = ['Infrastructure', 'Core', 'Features', 'App'];
    for (let i = 0; i < requiredOrder.length; i++) {
      const layerName: string = requiredOrder[i] as string;
      const layerStatus = this.layerStatuses.get(layerName);
      if (!layerStatus?.isInitialized) {
        issues.push(`${layerName} Layer가 초기화되지 않았습니다`);
        recommendations.push(`${requiredOrder.slice(0, i + 1).join(' → ')} 순서로 초기화하세요`);
        break;
      }
    }

    // 성능 확인
    const totalTime =
      this.overallStartTime && this.overallEndTime
        ? this.overallEndTime - this.overallStartTime
        : 0;
    const acceptableThreshold = 3000; // 3초
    const isWithinAcceptableRange = totalTime <= acceptableThreshold;

    if (!isWithinAcceptableRange) {
      issues.push(
        `초기화 시간이 허용 범위를 초과했습니다 (${totalTime}ms > ${acceptableThreshold}ms)`
      );
      recommendations.push('초기화 성능 최적화를 고려하세요');
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      recommendations,
      performance: {
        initializationTime: totalTime,
        isWithinAcceptableRange,
        acceptableThreshold,
      },
    };
  }

  /**
   * 진단 정보 출력
   */
  public printDiagnostics(): void {
    const report = this.generateReport();
    const healthCheck = this.performHealthCheck();

    logger.info('=== 초기화 진단 보고서 ===');
    logger.info(`전체 상태: ${report.overallStatus}`);
    logger.info(`총 초기화 시간: ${report.totalInitializationTime}ms`);
    logger.info(`헬스체크: ${healthCheck.isHealthy ? '정상' : '문제 발견'}`);

    if (report.layers.length > 0) {
      logger.info('레이어별 상태:');
      report.layers.forEach(layer => {
        logger.info(
          `  ${layer.layerName}: ${layer.isInitialized ? '성공' : '실패'} (${layer.initializationTime}ms)`
        );
        if (layer.errors.length > 0) {
          layer.errors.forEach(error => logger.error(`    오류: ${error.message}`));
        }
      });
    }

    if (healthCheck.issues.length > 0) {
      logger.warn('발견된 문제:');
      healthCheck.issues.forEach(issue => logger.warn(`  - ${issue}`));
    }

    if (healthCheck.recommendations.length > 0) {
      logger.info('권장사항:');
      healthCheck.recommendations.forEach(rec => logger.info(`  - ${rec}`));
    }

    // Vendor 상세 정보
    logger.info('Vendor 상태:');
    const vendorStatuses = getVendorStatuses();
    Object.entries(vendorStatuses).forEach(([name, initialized]) => {
      logger.info(`  ${name}: ${initialized ? '성공' : '실패'}`);
    });
  }

  /**
   * 상태 리셋 (테스트용)
   */
  public reset(): void {
    this.layerStatuses.clear();
    this.overallStartTime = null;
    this.overallEndTime = null;
  }
}

// ================================
// 공개 API
// ================================

export const initializationMonitor = InitializationMonitor.getInstance();

/**
 * 편의 함수들
 */
export function startInitializationMonitoring(): void {
  initializationMonitor.startInitialization();
}

export function completeInitializationMonitoring(): void {
  initializationMonitor.completeInitialization();
}

export function checkLayerHealth(layerName: string): LayerInitializationStatus {
  switch (layerName.toLowerCase()) {
    case 'infrastructure':
      return initializationMonitor.checkInfrastructureLayer();
    case 'core':
      return initializationMonitor.checkCoreLayer();
    case 'features':
      return initializationMonitor.checkFeaturesLayer();
    case 'app':
      return initializationMonitor.checkAppLayer();
    default:
      throw new Error(`알 수 없는 레이어: ${layerName}`);
  }
}

export function generateInitializationReport(): ApplicationInitializationReport {
  return initializationMonitor.generateReport();
}

export function performApplicationHealthCheck(): InitializationHealthCheck {
  return initializationMonitor.performHealthCheck();
}

export function printInitializationDiagnostics(): void {
  initializationMonitor.printDiagnostics();
}

/**
 * 전체 애플리케이션 초기화 순서 검증
 */
export function validateInitializationOrder(): {
  isValid: boolean;
  errors: string[];
  recommendations: string[];
} {
  const errors: string[] = [];
  const recommendations: string[] = [];

  // 1. Infrastructure 검증
  if (!isVendorsInitialized()) {
    errors.push('Infrastructure Layer: Vendor 라이브러리가 초기화되지 않았습니다');
    recommendations.push('initializeVendors()를 먼저 호출하세요');
  }

  // 2. 의존성 체인 검증
  const healthCheck = initializationMonitor.performHealthCheck();
  errors.push(...healthCheck.issues);
  recommendations.push(...healthCheck.recommendations);

  return {
    isValid: errors.length === 0,
    errors,
    recommendations,
  };
}
