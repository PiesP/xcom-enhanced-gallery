/**
 * 성능 모니터링 시스템 팩토리
 *
 * @description 성능 모니터링 컴포넌트들을 통합 관리하는 팩토리 클래스
 * @author TDD-AI-Assistant
 * @version 1.0.0
 */

import { PerformanceMonitor } from './performance-monitor';
import { MetricsCollector } from './metrics-collector';
import { AlertSystem } from './alert-system';
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
