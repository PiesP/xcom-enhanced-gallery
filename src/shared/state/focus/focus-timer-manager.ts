/**
 * Phase 150.2 Step 3: Timer 관리 추상화
 *
 * 목표: autoFocusTimerId, recomputeTimerId 등 다양한 타이머 상태 → FocusTimerManager로 통합
 * 타이머 로직 단순화 및 재사용성 향상
 */

import { getSolid } from '../../external/vendors';
import { globalTimerManager } from '../../utils/timer-management';
import { logger } from '@shared/logging';

/**
 * 타이머 역할 구분
 */
export type FocusTimerRole = 'auto-focus' | 'recompute' | 'flush-batch' | 'auto-focus-debounce';

/**
 * 타이머 콜백 타입
 */
export type FocusTimerCallback = () => void;

/**
 * 타이머 메타데이터
 */
interface TimerRecord {
  role: FocusTimerRole;
  timerId: number;
  startTime: number;
  delay: number;
  callback: FocusTimerCallback;
}

/**
 * FocusTimerManager: 포커스 추적 관련 타이머를 중앙에서 관리
 *
 * 기존 상태:
 * - autoFocusTimerId: number | null
 * - recomputeTimerId?: number | null
 * - flushBatchTimerId?: number | null
 *
 * 통합 후:
 * - timers: Map<FocusTimerRole, TimerRecord>
 */
export class FocusTimerManager {
  /** 역할별 타이머 레코드 관리 */
  private readonly timers: Map<FocusTimerRole, TimerRecord> = new Map();

  /** Solid.js createEffect 클린업 함수들 */
  private disposers: Array<() => void> = [];

  /**
   * 타이머 설정 또는 기존 타이머 업데이트
   * @param role 타이머 역할
   * @param callback 콜백 함수
   * @param delay 지연 시간 (ms)
   * @returns 설정된 타이머 ID
   */
  setTimer(role: FocusTimerRole, callback: FocusTimerCallback, delay: number): number {
    // 기존 타이머 정리
    this.clearTimer(role);

    // 새 타이머 설정
    const timerId = globalTimerManager.setTimeout(() => {
      try {
        callback();
      } catch (error) {
        logger.warn('FocusTimerManager: timer callback error', { role, error });
      } finally {
        // 타이머 레코드 제거
        this.timers.delete(role);
      }
    }, delay);

    const record: TimerRecord = {
      role,
      timerId,
      startTime: performance.now?.() ?? Date.now(),
      delay,
      callback,
    };

    this.timers.set(role, record);

    logger.debug('FocusTimerManager: timer set', { role, delay, timerId });

    return timerId;
  }

  /**
   * 특정 역할의 타이머 클리어
   * @param role 타이머 역할
   */
  clearTimer(role: FocusTimerRole): void {
    const record = this.timers.get(role);
    if (!record) {
      return;
    }

    globalTimerManager.clearTimeout(record.timerId);
    this.timers.delete(role);

    logger.debug('FocusTimerManager: timer cleared', { role, timerId: record.timerId });
  }

  /**
   * 모든 타이머 클리어
   */
  clearAll(): void {
    this.timers.forEach(record => {
      globalTimerManager.clearTimeout(record.timerId);
    });
    this.timers.clear();

    logger.debug('FocusTimerManager: all timers cleared');
  }

  /**
   * 특정 역할의 타이머 존재 여부 확인
   */
  hasTimer(role: FocusTimerRole): boolean {
    return this.timers.has(role);
  }

  /**
   * 특정 역할의 타이머 정보 조회
   */
  getTimer(role: FocusTimerRole): TimerRecord | undefined {
    return this.timers.get(role);
  }

  /**
   * 모든 활성 타이머 조회
   */
  getAllTimers(): TimerRecord[] {
    return Array.from(this.timers.values());
  }

  /**
   * 특정 역할의 타이머 경과 시간 계산
   */
  getElapsedTime(role: FocusTimerRole): number {
    const record = this.timers.get(role);
    if (!record) {
      return 0;
    }

    return (performance.now?.() ?? Date.now()) - record.startTime;
  }

  /**
   * 특정 역할의 타이머 남은 시간 계산
   */
  getRemainingTime(role: FocusTimerRole): number {
    const record = this.timers.get(role);
    if (!record) {
      return 0;
    }

    const elapsed = (performance.now?.() ?? Date.now()) - record.startTime;
    return Math.max(0, record.delay - elapsed);
  }

  /**
   * Solid.js cleanup 함수 등록 (자동 정리 용도)
   */
  registerDisposer(disposer: () => void): void {
    this.disposers.push(disposer);
  }

  /**
   * 모든 리소스 정리 및 타이머 클리어
   */
  dispose(): void {
    this.clearAll();
    this.disposers.forEach(disposer => {
      try {
        disposer();
      } catch (error) {
        logger.warn('FocusTimerManager: disposer error', { error });
      }
    });
    this.disposers = [];

    logger.debug('FocusTimerManager: disposed');
  }

  /**
   * 활성 타이머 개수
   */
  get size(): number {
    return this.timers.size;
  }

  /**
   * 디버그 정보 조회
   */
  getDebugInfo(): {
    activeTimers: number;
    timers: Array<{ role: FocusTimerRole; elapsed: number; remaining: number }>;
  } {
    return {
      activeTimers: this.timers.size,
      timers: Array.from(this.timers.values()).map(record => ({
        role: record.role,
        elapsed: this.getElapsedTime(record.role),
        remaining: this.getRemainingTime(record.role),
      })),
    };
  }
}

/**
 * FocusTimerManager 싱글톤 팩토리
 */
export function createFocusTimerManager(): FocusTimerManager {
  return new FocusTimerManager();
}

/**
 * Solid.js 통합용 Hook: FocusTimerManager 자동 정리
 */
export function useFocusTimerManager(): FocusTimerManager {
  const { createEffect, onCleanup } = getSolid();
  const manager = createFocusTimerManager();

  // Solid.js cleanup 함수에서 타이머 자동 정리
  createEffect(() => {
    onCleanup(() => {
      manager.dispose();
    });
  });

  return manager;
}
