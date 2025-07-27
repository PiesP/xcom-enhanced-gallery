/**
 * @fileoverview 통합 메모리 추적 유틸리티
 * @version 1.0.0
 *
 * 모든 메모리 관련 기능을 통합 관리하는 단일 진입점
 * Clean Architecture 원칙에 따라 Infrastructure 레이어에 위치
 */

import { logger } from '@shared/logging/logger';

/**
 * 메모리 정보 타입 정의
 */
export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

/**
 * 메모리 사용량 임계값
 */
export const MEMORY_THRESHOLDS = {
  WARNING_MB: 50,
  CRITICAL_MB: 100,
  GC_TRIGGER_MB: 80,
} as const;

/**
 * 메모리 추적기 클래스
 *
 * 모든 메모리 관련 작업을 중앙화하여 중복을 제거하고 일관성을 보장합니다.
 */
export class MemoryTracker {
  private static instance: MemoryTracker | null = null;

  private constructor() {}

  public static getInstance(): MemoryTracker {
    MemoryTracker.instance ??= new MemoryTracker();
    return MemoryTracker.instance;
  }

  /**
   * 메모리 정보 조회 (통합 구현)
   *
   * @returns 메모리 정보 또는 null (브라우저에서 지원하지 않는 경우)
   */
  public getMemoryInfo(): MemoryInfo | null {
    try {
      const performanceWithMemory = performance as unknown as Performance & {
        memory?: MemoryInfo;
      };

      return performanceWithMemory.memory || null;
    } catch (error) {
      logger.debug('[MemoryTracker] Memory API not available:', error);
      return null;
    }
  }

  /**
   * 메모리 사용량 (MB 단위)
   *
   * @returns 사용량 (MB) 또는 null
   */
  public getMemoryUsageMB(): number | null {
    const memInfo = this.getMemoryInfo();
    return memInfo ? Math.round(memInfo.usedJSHeapSize / (1024 * 1024)) : null;
  }

  /**
   * 메모리 사용량 상태 확인
   *
   * @returns 메모리 상태 ('normal' | 'warning' | 'critical')
   */
  public getMemoryStatus(): 'normal' | 'warning' | 'critical' | 'unknown' {
    const usageMB = this.getMemoryUsageMB();

    if (usageMB === null) {
      return 'unknown';
    }

    if (usageMB >= MEMORY_THRESHOLDS.CRITICAL_MB) {
      return 'critical';
    }

    if (usageMB >= MEMORY_THRESHOLDS.WARNING_MB) {
      return 'warning';
    }

    return 'normal';
  }

  /**
   * 가비지 컬렉션 트리거 (가능한 경우)
   *
   * @returns 가비지 컬렉션 실행 여부
   */
  public triggerGarbageCollection(): boolean {
    try {
      if ('gc' in globalThis && typeof globalThis.gc === 'function') {
        globalThis.gc();
        logger.debug('[MemoryTracker] Garbage collection triggered manually');
        return true;
      }
    } catch (error) {
      logger.warn('[MemoryTracker] Garbage collection trigger failed:', error);
    }
    return false;
  }

  /**
   * 메모리 추적 활성화 (Phase 4 추가)
   *
   * @param target 추적 대상 식별자
   * @param size 할당된 메모리 크기 (바이트)
   */
  public trackMemory(target: string, size: number): void {
    const currentUsage = this.getMemoryUsageMB() || 0;
    logger.debug(
      `[MemoryTracker] Tracking memory for ${target}: ${size} bytes, current usage: ${currentUsage} MB`
    );

    // 메모리 사용량 임계값 체크
    this.checkAndCleanup();
  }

  /**
   * 메모리 상태 모니터링 및 자동 정리
   *
   * @param force 강제 정리 여부
   */
  public checkAndCleanup(force = false): void {
    const status = this.getMemoryStatus();
    const usageMB = this.getMemoryUsageMB();

    if (status === 'unknown') {
      return;
    }

    if (force || status === 'critical') {
      logger.warn('[MemoryTracker] Critical memory usage detected:', {
        usageMB,
        status,
      });
      this.triggerGarbageCollection();
    } else if (status === 'warning') {
      logger.debug('[MemoryTracker] Warning memory usage:', {
        usageMB,
        status,
      });
      // 경고 수준에서는 임계값 이상일 때만 GC 트리거
      if (usageMB && usageMB >= MEMORY_THRESHOLDS.GC_TRIGGER_MB) {
        this.triggerGarbageCollection();
      }
    }
  }

  /**
   * 메모리 정리 함수 (Phase 4 추가)
   */
  public cleanup(): void {
    this.checkAndCleanup(true);
  }

  /**
   * 메모리 정보 로깅 (디버깅용)
   */
  public logMemoryInfo(): void {
    const memInfo = this.getMemoryInfo();
    const usageMB = this.getMemoryUsageMB();
    const status = this.getMemoryStatus();

    if (!memInfo) {
      logger.debug('[MemoryTracker] Memory info not available');
      return;
    }

    logger.debug('[MemoryTracker] Memory status:', {
      usedMB: usageMB,
      totalMB: Math.round(memInfo.totalJSHeapSize / (1024 * 1024)),
      limitMB: Math.round(memInfo.jsHeapSizeLimit / (1024 * 1024)),
      status,
      thresholds: MEMORY_THRESHOLDS,
    });
  }

  /**
   * 인스턴스 재설정 (테스트용)
   */
  public static resetInstance(): void {
    MemoryTracker.instance = null;
  }
}

/**
 * 편의 함수: 싱글톤 인스턴스 접근
 */
export const memoryTracker = MemoryTracker.getInstance();

/**
 * 편의 함수: 메모리 정보 조회
 */
export function getMemoryInfo(): MemoryInfo | null {
  return memoryTracker.getMemoryInfo();
}

/**
 * 편의 함수: 메모리 사용량 (MB)
 */
export function getMemoryUsageMB(): number | null {
  return memoryTracker.getMemoryUsageMB();
}

/**
 * 편의 함수: 메모리 상태 확인
 */
export function getMemoryStatus(): 'normal' | 'warning' | 'critical' | 'unknown' {
  return memoryTracker.getMemoryStatus();
}

/**
 * 편의 함수: 가비지 컬렉션 트리거
 */
export function triggerGarbageCollection(): boolean {
  return memoryTracker.triggerGarbageCollection();
}

/**
 * 편의 함수: 메모리 체크 및 정리
 */
export function checkMemoryAndCleanup(force = false): void {
  return memoryTracker.checkAndCleanup(force);
}
