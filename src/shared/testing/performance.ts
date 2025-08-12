/**
 * @fileoverview 성능 테스트 유틸리티
 * TDD Phase 5c: Testing Strategy Unification - Performance Testing
 */

import type { PerformanceTestResult } from './types';
import { TESTING_CONSTANTS } from '../constants/magic-numbers';

/**
 * 성능 테스트 실행
 */
export async function performanceTest(
  _testName: string,
  testFn: () => Promise<void> | void
): Promise<PerformanceTestResult> {
  const startTime = performance.now();
  const startMemory = getMemoryUsage();

  try {
    await testFn();
  } finally {
    // 테스트 완료 후에도 메모리와 시간을 측정
  }

  const endTime = performance.now();
  const endMemory = getMemoryUsage();

  const duration = endTime - startTime;

  return {
    duration,
    memoryUsage: {
      used: endMemory.used - startMemory.used,
      total: endMemory.total,
    },
  };
}

/**
 * 반복 성능 테스트
 */
export async function benchmarkTest(
  testName: string,
  testFn: () => Promise<void> | void,
  iterations = 100
): Promise<{
  average: number;
  min: number;
  max: number;
  total: number;
  iterations: number;
}> {
  const durations: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const result = await performanceTest(`${testName}-${i}`, testFn);
    durations.push(result.duration);
  }

  const total = durations.reduce((sum, duration) => sum + duration, 0);
  const average = total / iterations;
  const min = Math.min(...durations);
  const max = Math.max(...durations);

  return {
    average,
    min,
    max,
    total,
    iterations,
  };
}

/**
 * 메모리 사용량 측정
 */
function getMemoryUsage(): { used: number; total: number } {
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const memory = (
      performance as { memory: { usedJSHeapSize?: number; totalJSHeapSize?: number } }
    ).memory;
    return {
      used: memory.usedJSHeapSize || 0,
      total: memory.totalJSHeapSize || 0,
    };
  }

  // Node.js 환경
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const memory = process.memoryUsage();
    return {
      used: memory.heapUsed,
      total: memory.heapTotal,
    };
  }

  // 폴백
  return { used: 0, total: 0 };
}

/**
 * 처리량 테스트
 */
export async function throughputTest(
  _testName: string,
  testFn: (item: unknown) => Promise<void> | void,
  items: unknown[]
): Promise<PerformanceTestResult> {
  const startTime = performance.now();
  const startMemory = getMemoryUsage();

  let processedCount = 0;

  for (const item of items) {
    await testFn(item);
    processedCount++;
  }

  const endTime = performance.now();
  const endMemory = getMemoryUsage();

  const duration = endTime - startTime;
  const throughput = processedCount / (duration / TESTING_CONSTANTS.MILLISECONDS_PER_SECOND); // items per second

  return {
    duration,
    memoryUsage: {
      used: endMemory.used - startMemory.used,
      total: endMemory.total,
    },
    operations: processedCount,
    throughput,
  };
}

/**
 * 성능 임계값 검증
 */
export function validatePerformance(
  result: PerformanceTestResult,
  thresholds: {
    maxDuration?: number;
    maxMemory?: number;
    minThroughput?: number;
  }
): { passed: boolean; violations: string[] } {
  const violations: string[] = [];

  if (thresholds.maxDuration && result.duration > thresholds.maxDuration) {
    violations.push(`Duration ${result.duration}ms exceeds limit ${thresholds.maxDuration}ms`);
  }

  if (thresholds.maxMemory && result.memoryUsage.used > thresholds.maxMemory) {
    violations.push(
      `Memory usage ${result.memoryUsage.used} bytes exceeds limit ${thresholds.maxMemory} bytes`
    );
  }

  if (
    thresholds.minThroughput &&
    result.throughput &&
    result.throughput < thresholds.minThroughput
  ) {
    violations.push(
      `Throughput ${result.throughput} ops/s below minimum ${thresholds.minThroughput} ops/s`
    );
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}
