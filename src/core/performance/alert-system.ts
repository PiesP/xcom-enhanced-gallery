/**
 * 성능 알림 시스템
 *
 * @description 성능 임계값 모니터링 및 알림 발생을 담당
 * @author TDD-AI-Assistant
 * @version 1.0.0
 */

import type { PerformanceMetrics, AlertThreshold, PerformanceAlert, MetricType } from './types';

/**
 * 성능 알림을 관리하는 클래스
 */
export class AlertSystem {
  private thresholds: AlertThreshold[] = [];
  private alertHistory: PerformanceAlert[] = [];
  private readonly activeAlerts: Map<string, PerformanceAlert> = new Map();

  /**
   * 임계값 설정
   */
  setThresholds(thresholds: AlertThreshold[]): void {
    this.thresholds = [...thresholds];
  }

  /**
   * 설정된 임계값 반환
   */
  getThresholds(): AlertThreshold[] {
    return [...this.thresholds];
  }

  /**
   * 임계값 추가
   */
  addThreshold(threshold: AlertThreshold): void {
    this.thresholds.push(threshold);
  }

  /**
   * 임계값 제거
   */
  removeThreshold(metric: MetricType): void {
    this.thresholds = this.thresholds.filter(t => t.metric !== metric);
  }

  /**
   * 메트릭 검사 및 알림 생성
   */
  checkMetrics(metrics: PerformanceMetrics): PerformanceAlert[] {
    const newAlerts: PerformanceAlert[] = [];

    for (const threshold of this.thresholds) {
      const currentValue = this.extractMetricValue(metrics, threshold.metric);
      if (currentValue > threshold.value) {
        const alert = this.createAlert(threshold, currentValue);
        newAlerts.push(alert);

        // 활성 알림에 추가 (중복 방지)
        const alertKey = `${threshold.metric}-${threshold.severity}`;
        this.activeAlerts.set(alertKey, alert);

        // 히스토리에 추가
        this.alertHistory.push(alert);
      }
    }

    // 오래된 히스토리 정리
    this.cleanupHistory();

    return newAlerts;
  }

  /**
   * 활성 알림 목록 반환
   */
  getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * 알림 히스토리 반환
   */
  getAlertHistory(): PerformanceAlert[] {
    return [...this.alertHistory];
  }

  /**
   * 특정 알림 해제
   */
  dismissAlert(alertId: string): boolean {
    for (const [key, alert] of this.activeAlerts) {
      if (alert.id === alertId) {
        this.activeAlerts.delete(key);
        return true;
      }
    }
    return false;
  }

  /**
   * 모든 활성 알림 해제
   */
  dismissAllAlerts(): void {
    this.activeAlerts.clear();
  }

  /**
   * 히스토리 초기화
   */
  clearHistory(): void {
    this.alertHistory = [];
  }

  // Private methods

  private extractMetricValue(metrics: PerformanceMetrics, metricType: MetricType): number {
    switch (metricType) {
      case 'memoryUsage':
        return metrics.memory.heapUsed / (1024 * 1024); // MB 단위로 변환
      case 'renderTime':
        return metrics.performance.paintTime;
      case 'userExperience':
        return metrics.userExperience.lcp;
      case 'networkLatency':
        // 네트워크 지연시간 (기본값)
        return 0;
      default:
        return 0;
    }
  }

  private createAlert(threshold: AlertThreshold, currentValue: number): PerformanceAlert {
    const alertId = this.generateAlertId();
    const message = this.generateAlertMessage(threshold, currentValue);

    return {
      id: alertId,
      timestamp: Date.now(),
      metric: threshold.metric,
      currentValue,
      threshold: threshold.value,
      severity: threshold.severity,
      message,
    };
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateAlertMessage(threshold: AlertThreshold, currentValue: number): string {
    const formattedValue = this.formatValue(currentValue, threshold.unit);
    const formattedThreshold = this.formatValue(threshold.value, threshold.unit);

    switch (threshold.metric) {
      case 'memoryUsage':
        return `메모리 사용량이 ${formattedValue}로 임계값 ${formattedThreshold}를 초과했습니다.`;
      case 'renderTime':
        return `렌더링 시간이 ${formattedValue}로 임계값 ${formattedThreshold}를 초과했습니다.`;
      case 'userExperience':
        return `사용자 경험 지표(LCP)가 ${formattedValue}로 임계값 ${formattedThreshold}를 초과했습니다.`;
      case 'networkLatency':
        return `네트워크 지연시간이 ${formattedValue}로 임계값 ${formattedThreshold}를 초과했습니다.`;
      default:
        return `${threshold.metric} 메트릭이 임계값을 초과했습니다.`;
    }
  }

  private formatValue(value: number, unit: string): string {
    const roundedValue = Math.round(value * 100) / 100;
    return `${roundedValue}${unit}`;
  }

  private cleanupHistory(): void {
    // 최대 100개의 알림만 보관
    const maxHistorySize = 100;
    if (this.alertHistory.length > maxHistorySize) {
      this.alertHistory = this.alertHistory.slice(-maxHistorySize);
    }

    // 24시간 이상 된 알림 제거
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000;
    this.alertHistory = this.alertHistory.filter(alert => alert.timestamp > cutoffTime);
  }
}
