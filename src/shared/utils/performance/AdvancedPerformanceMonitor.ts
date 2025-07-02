/**
 * 향상된 성능 모니터링 시스템
 * 실시간 성능 메트릭 수집 및 분석
 */

import { logger } from '../../../infrastructure/logging/logger';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
  context: Record<string, unknown>;
}

interface PerformanceBudget {
  metric: string;
  threshold: number;
  warning: number;
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export class AdvancedPerformanceMonitor {
  private static readonly metrics = new Map<string, PerformanceMetric[]>();
  private static readonly budgets: PerformanceBudget[] = [
    { metric: 'bundle-size', threshold: 500 * 1024, warning: 400 * 1024 },
    { metric: 'gallery-render', threshold: 100, warning: 50 },
    { metric: 'media-extraction', threshold: 200, warning: 100 },
    { metric: 'memory-usage', threshold: 50 * 1024 * 1024, warning: 30 * 1024 * 1024 },
  ];

  public static startMeasurement(name: string, context: Record<string, unknown> = {}): string {
    const measurementId = `${name}-${Date.now()}-${Math.random()}`;
    performance.mark(`${measurementId}-start`);

    // 메모리 사용량도 함께 기록
    const memoryInfo = this.getMemoryInfo();
    this.addMetric(`${name}-memory-start`, memoryInfo.usedJSHeapSize, 'bytes', context);

    return measurementId;
  }

  public static endMeasurement(
    measurementId: string,
    context: Record<string, unknown> = {}
  ): number {
    const endMark = `${measurementId}-end`;
    const startMark = `${measurementId}-start`;

    performance.mark(endMark);
    performance.measure(measurementId, startMark, endMark);

    const measure = performance.getEntriesByName(measurementId)[0];
    if (!measure) {
      logger.warn(`Performance measurement not found: ${measurementId}`);
      return 0;
    }

    const duration = measure.duration;

    // 메트릭 저장
    const parts = measurementId.split('-');
    const name = parts[0] ?? 'unknown';
    this.addMetric(name, duration, 'ms', context);

    // 메모리 사용량 종료 시점 기록
    const memoryInfo = this.getMemoryInfo();
    this.addMetric(`${name}-memory-end`, memoryInfo.usedJSHeapSize, 'bytes', context);

    // 성능 예산 검사
    this.checkPerformanceBudget(name, duration);

    // 정리
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measurementId);

    return duration;
  }

  public static addMetric(
    name: string,
    value: number,
    unit: PerformanceMetric['unit'],
    context: Record<string, unknown> = {}
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      context,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const existingMetrics = this.metrics.get(name);
    if (existingMetrics) {
      existingMetrics.push(metric);
    }
  }

  private static checkPerformanceBudget(metricName: string, value: number): void {
    const budget = this.budgets.find(b => metricName.includes(b.metric));
    if (!budget) return;

    if (value > budget.threshold) {
      logger.error(
        `🚨 성능 예산 초과: ${metricName} (${value.toFixed(2)}ms > ${budget.threshold}ms)`
      );
    } else if (value > budget.warning) {
      logger.warn(`⚠️ 성능 예산 경고: ${metricName} (${value.toFixed(2)}ms > ${budget.warning}ms)`);
    }
  }

  public static getMemoryInfo(): MemoryInfo {
    // 통합 메모리 매니저 사용 시도
    try {
      // 동적 import는 비동기이므로 직접 접근 방식 유지
      // 추후 통합 메모리 매니저가 안정화되면 리팩토링 예정
      const performanceWithMemory = performance as unknown as Performance & {
        memory?: MemoryInfo;
      };

      return (
        performanceWithMemory.memory ?? {
          usedJSHeapSize: 0,
          totalJSHeapSize: 0,
          jsHeapSizeLimit: 0,
        }
      );
    } catch {
      // Fallback
      return {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
      };
    }
  }

  public static generatePerformanceReport(): string {
    const report = ['# 📊 성능 분석 리포트\n'];

    for (const [metricName, metrics] of this.metrics) {
      if (metrics.length === 0) continue;

      const values = metrics.map(m => m.value);
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const latest = metrics[metrics.length - 1];

      if (!latest) continue;

      report.push(`## ${metricName}`);
      report.push(`- **평균**: ${avg.toFixed(2)} ${latest.unit}`);
      report.push(`- **최소**: ${min.toFixed(2)} ${latest.unit}`);
      report.push(`- **최대**: ${max.toFixed(2)} ${latest.unit}`);
      report.push(`- **최근**: ${latest.value.toFixed(2)} ${latest.unit}`);
      report.push(`- **측정 횟수**: ${metrics.length}`);
      report.push('');
    }

    return report.join('\n');
  }

  public static clearMetrics(): void {
    this.metrics.clear();
  }

  // 실시간 성능 모니터링
  public static startFrameRateMonitoring(): void {
    let frames = 0;
    let lastTime = performance.now();

    function countFrames(): void {
      frames++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        AdvancedPerformanceMonitor.addMetric('frame-rate', frames, 'count');
        frames = 0;
        lastTime = currentTime;
        requestAnimationFrame(countFrames);
      } else {
        requestAnimationFrame(countFrames);
      }
    }

    requestAnimationFrame(countFrames);
  }

  public static getMetricsSummary(): Record<
    string,
    {
      count: number;
      average: number;
      min: number;
      max: number;
      latest: number;
      unit: string;
    }
  > {
    const summary: Record<
      string,
      {
        count: number;
        average: number;
        min: number;
        max: number;
        latest: number;
        unit: string;
      }
    > = {};

    for (const [metricName, metrics] of this.metrics) {
      if (metrics.length === 0) continue;

      const values = metrics.map(m => m.value);
      const lastMetric = metrics[metrics.length - 1];
      const firstMetric = metrics[0];

      if (!lastMetric || !firstMetric) continue;

      summary[metricName] = {
        count: metrics.length,
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        latest: lastMetric.value,
        unit: firstMetric.unit,
      };
    }

    return summary;
  }
}

// 성능 측정 데코레이터
export function performanceTrack(metricName?: string) {
  return function (
    target: Record<string, unknown>,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value as (...args: unknown[]) => unknown;
    const name = metricName ?? `${String(target.constructor.name)}.${propertyKey}`;

    descriptor.value = async function (this: unknown, ...args: unknown[]): Promise<unknown> {
      const measurementId = AdvancedPerformanceMonitor.startMeasurement(name, {
        className: String(target.constructor.name),
        methodName: propertyKey,
        args: args.length,
      });

      try {
        const result = await originalMethod.apply(this, args);
        AdvancedPerformanceMonitor.endMeasurement(measurementId);
        return result;
      } catch (error) {
        AdvancedPerformanceMonitor.endMeasurement(measurementId, { error: true });
        throw error;
      }
    };

    return descriptor;
  };
}

// 메인 프로파일링 함수 (개발 환경 전용)
export async function profileApplicationDev(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  logger.info('🚀 애플리케이션 성능 프로파일링 시작...');

  const memoryInfo = AdvancedPerformanceMonitor.getMemoryInfo();
  if (memoryInfo.usedJSHeapSize > 0) {
    logger.debug('💾 메모리 정보:');
    logger.debug(`  사용 중: ${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    logger.debug(`  총 힙: ${(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    logger.debug(`  힙 제한: ${(memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`);
  }

  const summary = AdvancedPerformanceMonitor.getMetricsSummary();
  logger.debug('📈 성능 메트릭 요약:');
  for (const [name, data] of Object.entries(summary)) {
    logger.debug(`  ${name}: ${data.average.toFixed(2)} ${data.unit} (평균)`);
  }

  const report = AdvancedPerformanceMonitor.generatePerformanceReport();
  if (typeof window !== 'undefined') {
    try {
      const blob = new Blob([report], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `performance-report-${new Date().toISOString().slice(0, 10)}.md`;
      link.style.display = 'none';
      document.body.appendChild(link);

      // 5초 후 자동 정리
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      }, 5000);
    } catch (error) {
      logger.warn('리포트 다운로드 준비 실패:', error);
    }
  }

  logger.info('✅ 성능 프로파일링 완료!');
}
