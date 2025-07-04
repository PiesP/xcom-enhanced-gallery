/**
 * @fileoverview Monitor - Simplified Diagnostics and Monitoring Utility
 * @version 2.0.0 - Clean Architecture Implementation
 * @author X.com Gallery Team
 * @since 4.0.0
 *
 * @description
 * 간소화된 시스템 상태 모니터링 유틸리티
 * InitializationMonitor를 대체하는 더 간단하고 직관적인 구현
 */

import { logger } from '../../../infrastructure/logging/logger';

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  message?: string | undefined;
  timestamp: number;
}

export interface MonitorReport {
  timestamp: number;
  totalChecks: number;
  healthyChecks: number;
  unhealthyChecks: number;
  checks: HealthCheck[];
}

export class Monitor {
  private static instance: Monitor | null = null;
  private readonly checks = new Map<string, HealthCheck>();

  private constructor() {
    logger.debug('Monitor: 인스턴스 생성');
  }

  static getInstance(): Monitor {
    Monitor.instance ??= new Monitor();
    return Monitor.instance;
  }

  /**
   * 건강 상태 체크 추가
   */
  addCheck(name: string, checkFn: () => boolean, description?: string): void {
    try {
      const status = checkFn() ? 'healthy' : 'unhealthy';
      this.checks.set(name, {
        name,
        status,
        message: description,
        timestamp: Date.now(),
      });
    } catch (error) {
      this.checks.set(name, {
        name,
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      });
    }
  }

  /**
   * 전체 건강 상태 리포트 생성
   */
  getReport(): MonitorReport {
    const checks = Array.from(this.checks.values());
    return {
      timestamp: Date.now(),
      totalChecks: checks.length,
      healthyChecks: checks.filter(c => c.status === 'healthy').length,
      unhealthyChecks: checks.filter(c => c.status === 'unhealthy').length,
      checks,
    };
  }

  /**
   * 모든 체크 리셋
   */
  reset(): void {
    this.checks.clear();
  }
}

// 간소화된 전역 함수들
const monitor = Monitor.getInstance();

export const addHealthCheck = (name: string, checkFn: () => boolean, description?: string): void =>
  monitor.addCheck(name, checkFn, description);

export const getHealthReport = (): MonitorReport => monitor.getReport();

export const resetMonitor = (): void => monitor.reset();
