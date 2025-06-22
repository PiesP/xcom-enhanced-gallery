/**
 * @fileoverview Memory Coordinator - 전체 메모리 관리 조정자
 * @version 1.0.0
 */

import { logger } from '@infrastructure/logging/logger';
import { ControllerManager } from './ControllerManager';
import { EventManager } from './EventManager';
import { TimerManager } from './TimerManager';
import { URLManager } from './URLManager';

/**
 * 메모리 관리 설정
 */
export interface MemoryManagerConfig {
  /** 가비지 컬렉션 힌트 활성화 */
  enableGCHints: boolean;
  /** 메모리 모니터링 간격 (ms) */
  monitoringInterval: number;
  /** 메모리 경고 임계값 (MB) */
  warningThreshold: number;
}

/**
 * 메모리 사용량 정보
 */
export interface MemoryUsage {
  used: number;
  total: number;
  percentage: number;
}

/**
 * 메모리 관리 조정자
 * 모든 메모리 관련 매니저들을 통합 관리합니다.
 */
export class MemoryCoordinator {
  private static instance: MemoryCoordinator | null = null;

  private readonly config: MemoryManagerConfig;
  private monitoringInterval: number | null = null;
  private lastCheck = 0;

  // 하위 매니저들
  public readonly timers: TimerManager;
  public readonly urls: URLManager;
  public readonly events: EventManager;
  public readonly controllers: ControllerManager;

  private static readonly DEFAULT_CONFIG: MemoryManagerConfig = {
    enableGCHints: true,
    monitoringInterval: 30000, // 30초
    warningThreshold: 100, // 100MB
  };

  private constructor(config: Partial<MemoryManagerConfig> = {}) {
    this.config = { ...MemoryCoordinator.DEFAULT_CONFIG, ...config };

    // 하위 매니저들 초기화
    this.timers = new TimerManager();
    this.urls = new URLManager();
    this.events = new EventManager();
    this.controllers = new ControllerManager();

    logger.debug('[MemoryCoordinator] Initialized');
  }

  /**
   * 싱글톤 인스턴스 가져오기
   */
  public static getInstance(config?: Partial<MemoryManagerConfig>): MemoryCoordinator {
    MemoryCoordinator.instance ??= new MemoryCoordinator(config);
    return MemoryCoordinator.instance;
  }

  /**
   * 인스턴스 초기화 (테스트용)
   */
  public static resetInstance(): void {
    if (MemoryCoordinator.instance) {
      MemoryCoordinator.instance.cleanup();
      MemoryCoordinator.instance = null;
    }
  }

  /**
   * 메모리 모니터링 시작
   */
  public startMonitoring(): void {
    if (!this.config.enableGCHints || this.monitoringInterval) {
      return;
    }

    this.monitoringInterval = this.timers.setInterval(() => {
      this.checkMemoryUsage();
    }, this.config.monitoringInterval);

    logger.debug('[MemoryCoordinator] Monitoring started');
  }

  /**
   * 메모리 모니터링 중지
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      this.timers.clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.debug('[MemoryCoordinator] Monitoring stopped');
    }
  }

  /**
   * 현재 메모리 사용량 조회
   */
  public getMemoryUsage(): MemoryUsage | null {
    const memory = (performance as unknown as Record<string, unknown>).memory as
      | { usedJSHeapSize?: number; totalJSHeapSize?: number }
      | undefined;

    if (!memory) {
      return null;
    }

    const used = memory.usedJSHeapSize ?? 0;
    const total = memory.totalJSHeapSize ?? 0;
    const percentage = total > 0 ? (used / total) * 100 : 0;

    return {
      used: Math.round(used / 1024 / 1024), // MB
      total: Math.round(total / 1024 / 1024), // MB
      percentage: Math.round(percentage),
    };
  }

  /**
   * 가비지 컬렉션 실행 (가능한 경우)
   */
  public triggerGC(): boolean {
    if ('gc' in globalThis && typeof globalThis.gc === 'function') {
      globalThis.gc();
      logger.debug('[MemoryCoordinator] Garbage collection triggered');
      return true;
    }
    return false;
  }

  /**
   * 메모리 정리 힌트 실행
   */
  public optimizeMemory(): void {
    // 하위 매니저들 정리
    this.urls.cleanup();
    this.controllers.cleanup();

    // 가비지 컬렉션 시도
    this.triggerGC();

    // 브라우저 캐시 정리 힌트
    if ('performance' in globalThis && 'mark' in performance) {
      performance.mark('memory-optimization');
    }

    logger.debug('[MemoryCoordinator] Memory optimization completed');
  }

  /**
   * 전체 상태 조회
   */
  public getStatus() {
    const memoryUsage = this.getMemoryUsage();

    return {
      memory: memoryUsage,
      resources: {
        timers: this.timers.getActiveCount(),
        urls: this.urls.getActiveCount(),
        events: this.events.getActiveCount(),
        controllers: this.controllers.getActiveCount(),
      },
      config: this.config,
      monitoring: this.monitoringInterval !== null,
    };
  }

  /**
   * 설정 업데이트
   */
  public updateConfig(newConfig: Partial<MemoryManagerConfig>): void {
    Object.assign(this.config, newConfig);

    // 모니터링 재시작
    if (this.monitoringInterval) {
      this.stopMonitoring();
      this.startMonitoring();
    }

    logger.debug('[MemoryCoordinator] Configuration updated');
  }

  /**
   * 전체 정리
   */
  public cleanup(): void {
    this.stopMonitoring();

    // 모든 하위 매니저들 정리
    this.timers.cleanup();
    this.urls.cleanup();
    this.events.cleanup();
    this.controllers.abortAll();

    logger.debug('[MemoryCoordinator] Full cleanup completed');
  }

  /**
   * 메모리 사용량 확인 (private)
   */
  private checkMemoryUsage(): void {
    const now = Date.now();
    if (now - this.lastCheck < this.config.monitoringInterval) {
      return;
    }

    const usage = this.getMemoryUsage();
    if (!usage) {
      return;
    }

    this.lastCheck = now;

    if (usage.used > this.config.warningThreshold) {
      logger.warn(`[MemoryCoordinator] High memory usage: ${usage.used}MB (${usage.percentage}%)`);

      if (this.config.enableGCHints) {
        this.optimizeMemory();
      }
    }

    logger.debug(`[MemoryCoordinator] Memory usage: ${usage.used}MB (${usage.percentage}%)`);
  }
}
