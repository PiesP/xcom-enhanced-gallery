/**
 * @fileoverview 통합 메모리 관리 유틸리티
 * @version 1.0.0
 *
 * 모든 메모리 관련 기능을 통합 관리하는 단일 진입점
 * Clean Architecture 원칙에 따라 Infrastructure 레이어에 위치
 */

import { logger } from '@infrastructure/logging/logger';

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
 * 통합 메모리 매니저 클래스
 *
 * 모든 메모리 관련 작업을 중앙화하여 중복을 제거하고 일관성을 보장합니다.
 */
export class UnifiedMemoryManager {
  private static instance: UnifiedMemoryManager | null = null;

  private constructor() {}

  public static getInstance(): UnifiedMemoryManager {
    UnifiedMemoryManager.instance ??= new UnifiedMemoryManager();
    return UnifiedMemoryManager.instance;
  }

  /**
   * 메모리 정보 조회 (통합 구현)
   *
   * @returns 메모리 정보 또는 null (브라우저에서 지원하지 않는 경우)
   */
  public getMemoryInfo(): MemoryInfo | null {
    try {
      // Chrome/Chromium 기반 브라우저에서만 지원
      const performanceWithMemory = performance as unknown as {
        memory?: MemoryInfo;
      };

      return performanceWithMemory.memory ?? null;
    } catch (error) {
      logger.warn('[UnifiedMemoryManager] Memory info access failed:', error);
      return null;
    }
  }

  /**
   * 메모리 사용량 (MB 단위)
   *
   * @returns 메모리 사용량 (MB) 또는 null
   */
  public getMemoryUsageMB(): number | null {
    const memInfo = this.getMemoryInfo();
    if (!memInfo?.usedJSHeapSize) {
      return null;
    }
    return Math.round(memInfo.usedJSHeapSize / (1024 * 1024));
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
        logger.debug('[UnifiedMemoryManager] Garbage collection triggered manually');
        return true;
      }
    } catch (error) {
      logger.warn('[UnifiedMemoryManager] Garbage collection trigger failed:', error);
    }
    return false;
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
      logger.warn('[UnifiedMemoryManager] Critical memory usage detected:', {
        usageMB,
        status,
      });
      this.triggerGarbageCollection();
    } else if (status === 'warning') {
      logger.debug('[UnifiedMemoryManager] Warning memory usage:', {
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
   * 메모리 정보 로깅 (디버깅용)
   */
  public logMemoryInfo(): void {
    const memInfo = this.getMemoryInfo();
    const usageMB = this.getMemoryUsageMB();
    const status = this.getMemoryStatus();

    if (!memInfo) {
      logger.debug('[UnifiedMemoryManager] Memory info not available');
      return;
    }

    logger.debug('[UnifiedMemoryManager] Memory status:', {
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
    UnifiedMemoryManager.instance = null;
  }
}

/**
 * 편의 함수: 싱글톤 인스턴스 접근
 */
export const memoryManager = UnifiedMemoryManager.getInstance();

/**
 * 편의 함수: 메모리 정보 조회
 */
export function getMemoryInfo(): MemoryInfo | null {
  return memoryManager.getMemoryInfo();
}

/**
 * 편의 함수: 메모리 사용량 (MB)
 */
export function getMemoryUsageMB(): number | null {
  return memoryManager.getMemoryUsageMB();
}

/**
 * 편의 함수: 메모리 상태 확인
 */
export function getMemoryStatus(): 'normal' | 'warning' | 'critical' | 'unknown' {
  return memoryManager.getMemoryStatus();
}

/**
 * 편의 함수: 가비지 컬렉션 트리거
 */
export function triggerGarbageCollection(): boolean {
  return memoryManager.triggerGarbageCollection();
}

/**
 * 편의 함수: 메모리 체크 및 정리
 */
export function checkMemoryAndCleanup(force = false): void {
  return memoryManager.checkAndCleanup(force);
}
