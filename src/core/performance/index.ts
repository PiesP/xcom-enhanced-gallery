/**
 * 성능 모니터링 시스템 메인 익스포트
 *
 * @description 성능 모니터링 관련 모든 클래스와 타입을 익스포트
 * @author TDD-AI-Assistant
 * @version 1.0.0
 */

// 메인 클래스들
export { PerformanceMonitor } from './PerformanceMonitor';
// export { EnhancedPerformanceMonitor } from './EnhancedPerformanceMonitor';
export { MetricsCollector } from './MetricsCollector';
export { AlertSystem } from './AlertSystem';
export {
  PerformanceIntegration,
  getPerformanceIntegration,
  destroyPerformanceIntegration,
} from './PerformanceIntegration';

// 타입 정의들
export type {
  PerformanceMetrics,
  MemoryMetrics,
  RenderMetrics,
  UserExperienceMetrics,
  AlertThreshold,
  PerformanceAlert,
  OptimizationSuggestion,
  TrendAnalysis,
  BrowserCompatibilityReport,
  DashboardData,
  MonitoringConfig,
  AlertSeverity,
  MetricType,
  OptimizationType,
} from './types';

import { PerformanceMonitor } from './PerformanceMonitor';
import { MetricsCollector } from './MetricsCollector';
import { AlertSystem } from './AlertSystem';
import type { MonitoringConfig } from './types';

/**
 * 성능 모니터링 시스템 팩토리
 */
export class PerformanceMonitoringSystem {
  private readonly monitor: PerformanceMonitor;
  private readonly collector: MetricsCollector;
  private readonly alertSystem: AlertSystem;

  constructor(config?: Partial<MonitoringConfig>) {
    this.monitor = new PerformanceMonitor(config);
    this.collector = new MetricsCollector(config);
    this.alertSystem = new AlertSystem();
  }

  /**
   * 전체 시스템 시작
   */
  start(): void {
    this.monitor.start();
    this.collector.startCollection();
  }

  /**
   * 전체 시스템 중지
   */
  stop(): void {
    this.monitor.stop();
    this.collector.stopCollection();
  }

  /**
   * 모니터 인스턴스 반환
   */
  getMonitor(): PerformanceMonitor {
    return this.monitor;
  }

  /**
   * 수집기 인스턴스 반환
   */
  getCollector(): MetricsCollector {
    return this.collector;
  }

  /**
   * 알림 시스템 인스턴스 반환
   */
  getAlertSystem(): AlertSystem {
    return this.alertSystem;
  }
}
