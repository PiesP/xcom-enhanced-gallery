/**
 * 성능 모니터링 메인 애플리케이션 통합
 *
 * @description 성능 모니터링을 메인 앱에 통합하는 중앙 인터페이스
 * @author TDD-AI-Assistant
 * @version 1.0.0
 */

import { PerformanceMonitor } from './PerformanceMonitor';
import { MetricsCollector } from './MetricsCollector';
import { AlertSystem } from './AlertSystem';
import type {
  MonitoringConfig,
  DashboardData,
  PerformanceAlert,
  PerformanceMetrics,
  AlertThreshold,
  MetricType,
} from './types';

/**
 * 성능 모니터링 통합 인터페이스
 */
export interface PerformanceIntegrationInterface {
  initialize(config?: MonitoringConfig): Promise<void>;
  getDashboardData(): Promise<DashboardData>;
  startMonitoring(): void;
  stopMonitoring(): void;
  onAlert(callback: (alert: PerformanceAlert) => void): void;
  getHealthStatus(): 'healthy' | 'warning' | 'critical';
}

/**
 * 성능 모니터링과 메인 애플리케이션의 통합을 관리하는 클래스
 * 성능 모니터링 시스템을 메인 앱과 연결하고 실시간 데이터를 제공합니다.
 */
export class PerformanceIntegration implements PerformanceIntegrationInterface {
  private readonly performanceMonitor: PerformanceMonitor;
  private readonly metricsCollector: MetricsCollector;
  private readonly alertSystem: AlertSystem;
  private isInitialized = false;
  private isMonitoring = false;
  private dashboardUpdateInterval: number | null = null;
  private config: MonitoringConfig = {
    collectionInterval: 5000,
    historyRetention: 300000,
    enableAlerts: true,
    enableSuggestions: true,
    enableDetailedLogging: false,
  };
  private readonly alertCallbacks: Array<(alert: PerformanceAlert) => void> = [];

  // 메모리 누수 방지를 위한 WeakMap 기반 참조 관리
  private readonly eventListeners = new Map<string, AbortController>();
  private readonly timers = new Set<number>();
  private readonly rafIds = new Set<number>();

  constructor() {
    this.performanceMonitor = new PerformanceMonitor();
    this.metricsCollector = new MetricsCollector();
    this.alertSystem = new AlertSystem();
  }

  /**
   * 성능 모니터링 시스템 초기화
   */
  async initialize(config?: MonitoringConfig): Promise<void> {
    try {
      if (config) {
        this.config = { ...this.config, ...config };
      }

      // 기본 설정 적용
      if (!this.config.enableAlerts) {
        return;
      }

      // AlertSystem 임계값 설정 - 기본값으로 설정
      const defaultThresholds: AlertThreshold[] = [
        { metric: 'memory' as MetricType, value: 50000000, unit: 'bytes', severity: 'warning' },
        { metric: 'performance' as MetricType, value: 200, unit: 'ms', severity: 'warning' },
        { metric: 'cls' as MetricType, value: 0.25, unit: 'score', severity: 'warning' },
        { metric: 'fid' as MetricType, value: 200, unit: 'ms', severity: 'warning' },
        { metric: 'lcp' as MetricType, value: 4000, unit: 'ms', severity: 'warning' },
      ];
      this.alertSystem.setThresholds(defaultThresholds);

      // 초기화 완료
      this.isInitialized = true;
    } catch (error) {
      console.error('성능 모니터링 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 실시간 대시보드 데이터 제공
   */
  async getDashboardData(): Promise<DashboardData> {
    if (!this.isInitialized) {
      throw new Error('성능 모니터링이 초기화되지 않았습니다.');
    }

    try {
      const dashboardData = this.performanceMonitor.getDashboardData();
      const currentAlerts = this.alertSystem.getActiveAlerts();

      return {
        ...dashboardData,
        alerts: currentAlerts,
      };
    } catch (error) {
      console.error('대시보드 데이터 조회 실패:', error);

      // Fallback 데이터 제공
      return {
        currentMetrics: this.createEmptyMetrics(),
        alerts: [],
        trends: {
          memoryTrend: 'stable',
          performanceTrend: 'stable',
          recommendations: ['모니터링 데이터를 수집하는 중입니다...'],
          analysisWindow: 0,
        },
        healthScore: 50,
      };
    }
  } /**
   * 성능 모니터링 시작 (최적화된 버전)
   */
  startMonitoring(): void {
    if (!this.isInitialized || !this.config.enableAlerts) {
      return;
    }

    if (this.isMonitoring) {
      return; // 이미 모니터링 중
    }

    try {
      // 적응형 메트릭 수집 시작
      this.startAdaptiveMetricsCollection();

      // 성능 모니터링 시작
      this.performanceMonitor.start();

      this.isMonitoring = true;
    } catch (error) {
      console.error('성능 모니터링 시작 실패:', error);
    }
  }

  /**
   * 성능 모니터링 중지 (최적화된 리소스 정리)
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    try {
      // 모든 리소스 정리
      this.cleanupResources();

      this.metricsCollector.stopCollection();
      this.performanceMonitor.stop();
      this.isMonitoring = false;
    } catch (error) {
      console.error('성능 모니터링 중지 실패:', error);
    }
  }

  /**
   * 메모리 누수 방지를 위한 리소스 정리
   */
  private cleanupResources(): void {
    // 타이머 정리
    if (this.dashboardUpdateInterval) {
      clearInterval(this.dashboardUpdateInterval);
      this.dashboardUpdateInterval = null;
    }

    // 모든 타이머 정리
    this.timers.forEach(timerId => clearTimeout(timerId));
    this.timers.clear();

    // RAF 정리
    this.rafIds.forEach(rafId => cancelAnimationFrame(rafId));
    this.rafIds.clear();

    // 이벤트 리스너 정리
    this.eventListeners.forEach(controller => controller.abort());
    this.eventListeners.clear();
  }

  /**
   * 적응형 수집 간격을 사용한 최적화된 메트릭 수집
   */
  private startAdaptiveMetricsCollection(): void {
    let collectionInterval = 1000; // 기본 1초
    const performanceScore = 100;

    const collect = () => {
      if (!this.isMonitoring) return;

      // 성능 점수에 따른 적응형 간격 조정
      if (performanceScore > 80) {
        collectionInterval = 2000; // 성능 좋음: 2초 간격
      } else if (performanceScore > 60) {
        collectionInterval = 1000; // 보통: 1초 간격
      } else {
        collectionInterval = 500; // 성능 나쁨: 0.5초 간격
      }

      // 배치처리를 위한 RAF 사용
      const rafId = requestAnimationFrame(() => {
        this.collectMetricsBatch();
        this.rafIds.delete(rafId);
      });
      this.rafIds.add(rafId);

      // 다음 수집 스케줄링
      const timerId = window.setTimeout(collect, collectionInterval);
      this.timers.add(timerId);
    };

    collect();
  }

  /**
   * 배치 처리를 통한 효율적인 메트릭 수집
   */
  private collectMetricsBatch(): void {
    if (!this.metricsCollector) return;

    try {
      // requestIdleCallback을 사용한 유휴 시간 활용
      const globalWindow = window as typeof window & {
        requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => void;
      };

      if (typeof globalWindow.requestIdleCallback === 'function') {
        globalWindow.requestIdleCallback(
          () => {
            this.metricsCollector?.collect();
          },
          { timeout: 100 }
        );
      } else {
        // fallback: 일반 수집
        this.metricsCollector.collect();
      }
    } catch (error) {
      console.warn('메트릭 수집 중 오류 발생:', error);
    }
  }

  /**
   * 알림 콜백 등록
   */
  onAlert(callback: (alert: PerformanceAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * 앱 건강 상태 확인
   */
  getHealthStatus(): 'healthy' | 'warning' | 'critical' {
    if (!this.isInitialized || !this.isMonitoring) {
      return 'warning';
    }

    try {
      const activeAlerts = this.alertSystem.getActiveAlerts();
      const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical');
      const warningAlerts = activeAlerts.filter(alert => alert.severity === 'warning');

      if (criticalAlerts.length > 0) {
        return 'critical';
      }

      if (warningAlerts.length > 0) {
        return 'warning';
      }

      return 'healthy';
    } catch (error) {
      console.error('건강 상태 확인 실패:', error);
      return 'warning';
    }
  }

  /**
   * 빈 메트릭 데이터 생성 (Fallback)
   */
  private createEmptyMetrics(): PerformanceMetrics {
    return {
      timestamp: Date.now(),
      memory: {
        heapUsed: 0,
        heapTotal: 0,
        heapLimit: 0,
      },
      performance: {
        paintTime: 0,
        layoutTime: 0,
        scriptTime: 0,
      },
      userExperience: {
        cls: 0,
        fid: 0,
        lcp: 0,
        fcp: 0,
      },
    };
  }

  /**
   * 정리 (메모리 누수 방지)
   */
  destroy(): void {
    this.stopMonitoring();
    this.alertCallbacks.length = 0;
    this.isInitialized = false;
  }
}

/**
 * 싱글톤 인스턴스
 */
let performanceIntegrationInstance: PerformanceIntegration | null = null;

/**
 * 성능 모니터링 통합 인스턴스 가져오기
 */
export function getPerformanceIntegration(): PerformanceIntegration {
  if (!performanceIntegrationInstance) {
    performanceIntegrationInstance = new PerformanceIntegration();
  }
  return performanceIntegrationInstance;
}

/**
 * 성능 모니터링 통합 인스턴스 해제
 */
export function destroyPerformanceIntegration(): void {
  if (performanceIntegrationInstance) {
    performanceIntegrationInstance.destroy();
    performanceIntegrationInstance = null;
  }
}
