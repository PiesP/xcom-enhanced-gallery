/**
 * @fileoverview Core Diagnostics Service
 * @version 1.0.0 - Core 레이어로 이동
 * @moved-from shared/utils/diagnostics/Monitor.ts
 */

import { logger } from '@core/logging/logger';

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

export class DiagnosticsService {
  private static instance: DiagnosticsService | null = null;
  private readonly checks = new Map<string, HealthCheck>();

  private constructor() {
    logger.debug('[DiagnosticsService] 인스턴스 생성');
  }

  static getInstance(): DiagnosticsService {
    DiagnosticsService.instance ??= new DiagnosticsService();
    return DiagnosticsService.instance;
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
      logger.debug(`[DiagnosticsService] Check added: ${name} - ${status}`);
    } catch (error) {
      this.checks.set(name, {
        name,
        status: 'unhealthy',
        message: `Error: ${error}`,
        timestamp: Date.now(),
      });
      logger.error(`[DiagnosticsService] Check failed: ${name}`, error);
    }
  }

  /**
   * 건강 상태 체크 제거
   */
  removeCheck(name: string): boolean {
    const removed = this.checks.delete(name);
    if (removed) {
      logger.debug(`[DiagnosticsService] Check removed: ${name}`);
    }
    return removed;
  }

  /**
   * 특정 체크 실행
   */
  runCheck(name: string): HealthCheck | null {
    const check = this.checks.get(name);
    if (!check) {
      logger.warn(`[DiagnosticsService] Check not found: ${name}`);
      return null;
    }

    // 체크 재실행은 별도 메서드로 분리
    return check;
  }

  /**
   * 모든 체크 실행
   */
  runAllChecks(): MonitorReport {
    const timestamp = Date.now();
    const checks = Array.from(this.checks.values());
    const healthyChecks = checks.filter(check => check.status === 'healthy').length;
    const unhealthyChecks = checks.filter(check => check.status === 'unhealthy').length;

    return {
      timestamp,
      totalChecks: checks.length,
      healthyChecks,
      unhealthyChecks,
      checks,
    };
  }

  /**
   * 전체 시스템 상태 확인
   */
  getOverallStatus(): 'healthy' | 'unhealthy' | 'unknown' {
    if (this.checks.size === 0) return 'unknown';

    const unhealthyCount = Array.from(this.checks.values()).filter(
      check => check.status === 'unhealthy'
    ).length;

    return unhealthyCount === 0 ? 'healthy' : 'unhealthy';
  }

  /**
   * 리포트 생성
   */
  generateReport(): string {
    const report = this.runAllChecks();
    const status = this.getOverallStatus();

    let output = `=== Diagnostics Report ===\n`;
    output += `Timestamp: ${new Date(report.timestamp).toISOString()}\n`;
    output += `Overall Status: ${status.toUpperCase()}\n`;
    output += `Total Checks: ${report.totalChecks}\n`;
    output += `Healthy: ${report.healthyChecks}, Unhealthy: ${report.unhealthyChecks}\n\n`;

    report.checks.forEach(check => {
      output += `- ${check.name}: ${check.status.toUpperCase()}`;
      if (check.message) {
        output += ` (${check.message})`;
      }
      output += '\n';
    });

    return output;
  }

  /**
   * 모든 체크 제거
   */
  clearAllChecks(): void {
    const count = this.checks.size;
    this.checks.clear();
    logger.debug(`[DiagnosticsService] All checks cleared: ${count} checks`);
  }
}

/**
 * 편의 함수들
 */
export function addHealthCheck(name: string, checkFn: () => boolean, description?: string): void {
  DiagnosticsService.getInstance().addCheck(name, checkFn, description);
}

export function removeHealthCheck(name: string): boolean {
  return DiagnosticsService.getInstance().removeCheck(name);
}

export function runAllHealthChecks(): MonitorReport {
  return DiagnosticsService.getInstance().runAllChecks();
}

export function getSystemStatus(): 'healthy' | 'unhealthy' | 'unknown' {
  return DiagnosticsService.getInstance().getOverallStatus();
}
