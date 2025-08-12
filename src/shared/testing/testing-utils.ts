/**
 * @fileoverview 테스팅 공통 유틸리티
 * @description Mock 시스템과 Dead Code Removal에서 공통으로 사용되는 유틸리티
 * @version 1.0.0 - REFACTOR 단계 구현
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, extname } from 'path';
import { logger } from '@shared/logging';
import { MEMORY_SIZE_CONSTANTS, TIME_CONSTANTS } from '../../constants';

// ========================================
// 타입 정의
// ========================================

/**
 * 파일 정보 인터페이스
 */
export interface IFileInfo {
  path: string;
  relativePath: string;
  name: string;
  extension: string;
  size: number;
  lastModified: Date;
  isDirectory: boolean;
}

/**
 * 파일 검색 옵션
 */
export interface IFileSearchOptions {
  extensions?: string[];
  recursive?: boolean;
  excludePatterns?: string[];
  includePatterns?: string[];
  maxDepth?: number;
}

/**
 * 성능 메트릭 인터페이스
 */
export interface IPerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsed?: number;
  operationsCount?: number;
}

// ========================================
// 파일 시스템 유틸리티
// ========================================

/**
 * 파일 시스템 유틸리티 클래스
 */
export class FileSystemUtils {
  /**
   * 파일 정보를 안전하게 가져오기
   */
  public static safeGetFileInfo(filePath: string, basePath?: string): IFileInfo | null {
    try {
      if (!existsSync(filePath)) {
        return null;
      }

      const stats = statSync(filePath);
      const relativePath = basePath ? relative(basePath, filePath) : filePath;

      return {
        path: filePath,
        relativePath,
        name: filePath.split(/[/\\]/).pop() || '',
        extension: extname(filePath),
        size: stats.size,
        lastModified: stats.mtime,
        isDirectory: stats.isDirectory(),
      };
    } catch (error) {
      logger.warn('Failed to get file info', { filePath, error });
      return null;
    }
  }

  /**
   * 디렉토리에서 파일 검색 (옵션 포함)
   */
  public static searchFiles(rootPath: string, options: IFileSearchOptions = {}): IFileInfo[] {
    const {
      extensions = [],
      recursive = true,
      excludePatterns = [],
      includePatterns = [],
      maxDepth = Infinity,
    } = options;

    const results: IFileInfo[] = [];

    try {
      this.searchFilesRecursive(
        rootPath,
        rootPath,
        results,
        { extensions, recursive, excludePatterns, includePatterns, maxDepth },
        0
      );
    } catch (error) {
      logger.error('File search failed', { rootPath, options, error });
    }

    return results;
  }

  /**
   * 재귀적 파일 검색 구현
   */
  private static searchFilesRecursive(
    currentPath: string,
    basePath: string,
    results: IFileInfo[],
    options: Required<IFileSearchOptions>,
    currentDepth: number
  ): void {
    if (currentDepth > options.maxDepth || !existsSync(currentPath)) {
      return;
    }

    try {
      const entries = readdirSync(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(currentPath, entry.name);
        const relativePath = relative(basePath, fullPath);

        // 제외 패턴 확인
        if (this.matchesPatterns(relativePath, options.excludePatterns)) {
          continue;
        }

        // 포함 패턴 확인 (설정된 경우)
        if (
          options.includePatterns.length > 0 &&
          !this.matchesPatterns(relativePath, options.includePatterns)
        ) {
          continue;
        }

        if (entry.isDirectory()) {
          if (options.recursive) {
            this.searchFilesRecursive(fullPath, basePath, results, options, currentDepth + 1);
          }
        } else {
          // 확장자 필터링
          if (options.extensions.length === 0 || options.extensions.includes(extname(entry.name))) {
            const fileInfo = this.safeGetFileInfo(fullPath, basePath);
            if (fileInfo) {
              results.push(fileInfo);
            }
          }
        }
      }
    } catch (error) {
      logger.warn('Failed to read directory', { currentPath, error });
    }
  }

  /**
   * 패턴 매칭 유틸리티
   */
  private static matchesPatterns(path: string, patterns: string[]): boolean {
    return patterns.some(pattern => {
      // 간단한 glob 패턴 지원
      const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
      return new RegExp(regexPattern, 'i').test(path);
    });
  }

  /**
   * 파일 내용을 안전하게 읽기
   */
  public static safeReadFile(filePath: string): string | null {
    try {
      if (!existsSync(filePath)) {
        return null;
      }
      return readFileSync(filePath, 'utf-8');
    } catch (error) {
      logger.warn('Failed to read file', { filePath, error });
      return null;
    }
  }

  /**
   * 파일의 라인 수 계산
   */
  public static countLines(filePath: string): number {
    const content = this.safeReadFile(filePath);
    return content ? content.split('\n').length : 0;
  }

  /**
   * 여러 파일의 총 라인 수 계산
   */
  public static countTotalLines(filePaths: string[]): number {
    return filePaths.reduce((total, path) => total + this.countLines(path), 0);
  }
}

// ========================================
// 성능 모니터링 유틸리티
// ========================================

/**
 * 성능 모니터링 클래스
 */
export class PerformanceMonitor {
  private readonly metrics: Map<string, IPerformanceMetrics> = new Map();
  private readonly timers: Map<string, number> = new Map();

  /**
   * 타이머 시작 (더 간단한 인터페이스)
   */
  public startTimer(operationId: string): { end: () => void } {
    const startTime = performance.now();
    this.timers.set(operationId, startTime);

    this.metrics.set(operationId, {
      startTime,
      operationsCount: 0,
    });

    return {
      end: () => this.endTimer(operationId),
    };
  }

  /**
   * 타이머 종료
   */
  public endTimer(operationId: string): IPerformanceMetrics | null {
    const startTime = this.timers.get(operationId);
    if (!startTime) {
      logger.warn('Timer not found', { operationId });
      return null;
    }

    const endTime = performance.now();
    const updatedMetric: IPerformanceMetrics = {
      startTime,
      endTime,
      duration: endTime - startTime,
      operationsCount: this.metrics.get(operationId)?.operationsCount || 0,
      memoryUsed: this.getCurrentMemoryUsage(),
    };

    this.metrics.set(operationId, updatedMetric);
    this.timers.delete(operationId);
    return updatedMetric;
  }

  /**
   * 성능 측정 시작
   */
  public startMeasurement(operationId: string): void {
    this.metrics.set(operationId, {
      startTime: performance.now(),
      operationsCount: 0,
    });
  }

  /**
   * 성능 측정 종료
   */
  public endMeasurement(operationId: string): IPerformanceMetrics | null {
    const metric = this.metrics.get(operationId);
    if (!metric) {
      logger.warn('Performance measurement not found', { operationId });
      return null;
    }

    const endTime = performance.now();
    const updatedMetric: IPerformanceMetrics = {
      ...metric,
      endTime,
      duration: endTime - metric.startTime,
      memoryUsed: this.getCurrentMemoryUsage(),
    };

    this.metrics.set(operationId, updatedMetric);
    return updatedMetric;
  }

  /**
   * 작업 수 증가
   */
  public incrementOperations(operationId: string): void {
    const metric = this.metrics.get(operationId);
    if (metric) {
      metric.operationsCount = (metric.operationsCount || 0) + 1;
    }
  }

  /**
   * 성능 메트릭 조회
   */
  public getMetrics(operationId: string): IPerformanceMetrics | null {
    return this.metrics.get(operationId) || null;
  }

  /**
   * 모든 메트릭 조회
   */
  public getAllMetrics(): Record<string, IPerformanceMetrics> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * 메트릭 초기화
   */
  public reset(operationId?: string): void {
    if (operationId) {
      this.metrics.delete(operationId);
    } else {
      this.metrics.clear();
    }
  }

  /**
   * 현재 메모리 사용량 조회 (Node.js 환경)
   */
  private getCurrentMemoryUsage(): number {
    try {
      if (typeof process !== 'undefined' && process.memoryUsage) {
        return process.memoryUsage().heapUsed;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * 성능 보고서 생성
   */
  public generateReport(): string {
    const metrics = this.getAllMetrics();
    const entries = Object.entries(metrics);

    if (entries.length === 0) {
      return 'No performance metrics available';
    }

    let report = '=== Performance Report ===\n';

    for (const [operationId, metric] of entries) {
      const duration = metric.duration?.toFixed(2) || 'N/A';
      const operations = metric.operationsCount || 0;
      const memoryMB = metric.memoryUsed
        ? (
            metric.memoryUsed /
            MEMORY_SIZE_CONSTANTS.BYTES_PER_KB /
            MEMORY_SIZE_CONSTANTS.BYTES_PER_KB
          ).toFixed(2)
        : 'N/A';

      report += `\n${operationId}:\n`;
      report += `  Duration: ${duration}ms\n`;
      report += `  Operations: ${operations}\n`;
      report += `  Memory: ${memoryMB}MB\n`;
    }

    return report;
  }
}

// ========================================
// 에러 처리 유틸리티
// ========================================

/**
 * 테스팅 관련 에러 클래스
 */
export class TestingError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'TestingError';
  }
}

/**
 * Mock 관련 에러 클래스
 */
export class MockError extends TestingError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'mock-operation', context);
    this.name = 'MockError';
  }
}

/**
 * Dead Code 관련 에러 클래스
 */
export class DeadCodeError extends TestingError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'dead-code-operation', context);
    this.name = 'DeadCodeError';
  }
}

/**
 * 에러 처리 유틸리티
 */
export class ErrorHandler {
  /**
   * 안전한 비동기 작업 실행
   */
  public static async safeExecute<T>(
    operation: () => Promise<T>,
    fallback: T,
    context?: Record<string, unknown>
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      logger.error('Safe execute failed', { context, error });
      return fallback;
    }
  }

  /**
   * 안전한 동기 작업 실행
   */
  public static safeExecuteSync<T>(
    operation: () => T,
    fallback: T,
    context?: Record<string, unknown>
  ): T {
    try {
      return operation();
    } catch (error) {
      logger.error('Safe execute sync failed', { context, error });
      return fallback;
    }
  }

  /**
   * 에러를 TestingError로 변환
   */
  public static wrapError(
    error: unknown,
    operation: string,
    context?: Record<string, unknown>
  ): TestingError {
    if (error instanceof TestingError) {
      return error;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    return new TestingError(message, operation, context);
  }
}

// ========================================
// 캐싱 유틸리티
// ========================================

/**
 * 간단한 메모이제이션 캐시
 */
export class MemoizationCache<T> {
  private readonly cache = new Map<string, { value: T; timestamp: number }>();

  constructor(private readonly ttl: number = TIME_CONSTANTS.FIVE_MINUTES) {} // 5분 기본 TTL

  /**
   * 캐시에서 값 조회
   */
  public get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * 캐시에 값 저장
   */
  public set(key: string, value: T): void {
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  /**
   * 캐시된 함수 실행
   */
  public memoized<Args extends unknown[]>(
    fn: (...args: Args) => T,
    keyGenerator?: (...args: Args) => string
  ): (...args: Args) => T {
    return (...args: Args) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      const cached = this.get(key);

      if (cached !== null) {
        return cached;
      }

      const result = fn(...args);
      this.set(key, result);
      return result;
    };
  }

  /**
   * 캐시 지우기
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * 캐시 크기 조회
   */
  public size(): number {
    return this.cache.size;
  }
}

// ========================================
// 전역 인스턴스
// ========================================

export const globalPerformanceMonitor = new PerformanceMonitor();
export const fileSystemCache = new MemoizationCache<IFileInfo[]>(TIME_CONSTANTS.TEN_MINUTES); // 10분 TTL
