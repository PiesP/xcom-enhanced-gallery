/**
 * @fileoverview 타이머 관리 유틸리티
 * @description Phase C: 일관된 타이머 및 리소스 관리
 * @version 1.0.0
 */

import { createDebouncer } from './performance/performance-utils';

// 브라우저/Node(JSDOM)에서 setTimeout/setInterval이 반환하는 핸들을 포괄하는 타입
type TimerHandle = number | { [key: string]: unknown };

/**
 * 타이머 관리자
 * 모든 타이머를 추적하고 일괄 정리할 수 있는 유틸리티
 */
export class TimerManager {
  private readonly timers = new Set<number>();
  private readonly intervals = new Set<number>();
  // 네이티브 타이머 핸들 매핑 (Node/JSDOM 호환을 위해 숫자 ID를 외부로 노출)
  private readonly timeoutHandles = new Map<number, TimerHandle>();
  private readonly intervalHandles = new Map<number, TimerHandle>();
  private nextId = 1;
  // 컨텍스트 매핑 (선택적)
  private readonly timerContexts = new Map<number, string | undefined>();
  private readonly intervalContexts = new Map<number, string | undefined>();
  private readonly contextIndex = new Map<
    string,
    { timers: Set<number>; intervals: Set<number> }
  >();

  /**
   * 내부 유틸: 네이티브 timeout 핸들 해제 (환경 독립)
   */
  private clearNativeTimeout(handle: TimerHandle | undefined): void {
    if (handle == null) return;
    try {
      if (typeof handle === 'number') {
        window.clearTimeout(handle);
      } else {
        const g = globalThis as unknown as { clearTimeout?: (h: unknown) => void };
        g.clearTimeout?.(handle as unknown);
      }
    } catch {
      /* noop */
    }
  }

  /**
   * 내부 유틸: 네이티브 interval 핸들 해제 (환경 독립)
   */
  private clearNativeInterval(handle: TimerHandle | undefined): void {
    if (handle == null) return;
    try {
      if (typeof handle === 'number') {
        window.clearInterval(handle);
      } else {
        const g = globalThis as unknown as { clearInterval?: (h: unknown) => void };
        g.clearInterval?.(handle as unknown);
      }
    } catch {
      /* noop */
    }
  }

  /**
   * setTimeout을 등록하고 추적
   */
  setTimeout(callback: () => void, delay: number, context?: string): number {
    const numericId = this.nextId++;
    const nativeId = window.setTimeout(() => {
      // 실행 후 해당 타이머 제거 (내부 상태 정리)
      this.timers.delete(numericId);
      const ctx = this.timerContexts.get(numericId);
      if (ctx) {
        this.contextIndex.get(ctx)?.timers.delete(numericId);
      }
      this.timerContexts.delete(numericId);
      this.timeoutHandles.delete(numericId);
      try {
        callback();
      } catch {
        // 콜백 오류는 무시 (테스트 안정성)
        /* noop */
      }
    }, delay);

    this.timeoutHandles.set(numericId, nativeId);
    this.timers.add(numericId);
    if (context) {
      this.timerContexts.set(numericId, context);
      if (!this.contextIndex.has(context)) {
        this.contextIndex.set(context, { timers: new Set(), intervals: new Set() });
      }
      this.contextIndex.get(context)!.timers.add(numericId);
    }
    return numericId;
  }

  /**
   * setInterval을 등록하고 추적
   */
  setInterval(callback: () => void, delay: number, context?: string): number {
    const numericId = this.nextId++;
    const nativeId = window.setInterval(() => {
      try {
        callback();
      } catch {
        // 콜백 오류는 무시 (테스트 안정성)
        /* noop */
      }
    }, delay);
    this.intervalHandles.set(numericId, nativeId);
    this.intervals.add(numericId);
    if (context) {
      this.intervalContexts.set(numericId, context);
      if (!this.contextIndex.has(context)) {
        this.contextIndex.set(context, { timers: new Set(), intervals: new Set() });
      }
      this.contextIndex.get(context)!.intervals.add(numericId);
    }
    return numericId;
  }

  /**
   * 등록된 setTimeout 제거
   */
  clearTimeout(id: number): void {
    if (!this.timers.has(id)) return;
    const handle = this.timeoutHandles.get(id);
    this.clearNativeTimeout(handle);
    this.timers.delete(id);
    const ctx = this.timerContexts.get(id);
    if (ctx) {
      this.contextIndex.get(ctx)?.timers.delete(id);
    }
    this.timerContexts.delete(id);
    this.timeoutHandles.delete(id);
  }

  /**
   * 등록된 setInterval 제거
   */
  clearInterval(id: number): void {
    if (!this.intervals.has(id)) return;
    const handle = this.intervalHandles.get(id);
    this.clearNativeInterval(handle);
    this.intervals.delete(id);
    const ctx = this.intervalContexts.get(id);
    if (ctx) {
      this.contextIndex.get(ctx)?.intervals.delete(id);
    }
    this.intervalContexts.delete(id);
    this.intervalHandles.delete(id);
  }

  /**
   * 모든 타이머 정리
   */
  cleanup(): void {
    this.timers.forEach(id => {
      const handle = this.timeoutHandles.get(id);
      this.clearNativeTimeout(handle);
    });
    this.intervals.forEach(id => {
      const handle = this.intervalHandles.get(id);
      this.clearNativeInterval(handle);
    });
    this.timers.clear();
    this.intervals.clear();
    this.timeoutHandles.clear();
    this.intervalHandles.clear();
    this.timerContexts.clear();
    this.intervalContexts.clear();
    this.contextIndex.clear();
  }

  /**
   * 활성 타이머 수 조회
   */
  getActiveTimersCount(): number {
    return this.timers.size + this.intervals.size;
  }

  /**
   * 특정 컨텍스트에 속한 타이머만 정리
   */
  cleanupByContext(context: string): void {
    const entry = this.contextIndex.get(context);
    if (!entry) return;
    // 타이머 정리
    for (const id of Array.from(entry.timers)) {
      if (this.timers.has(id)) {
        const handle = this.timeoutHandles.get(id);
        this.clearNativeTimeout(handle);
        this.timers.delete(id);
        this.timeoutHandles.delete(id);
      }
      this.timerContexts.delete(id);
      entry.timers.delete(id);
    }
    // 인터벌 정리
    for (const id of Array.from(entry.intervals)) {
      if (this.intervals.has(id)) {
        const handle = this.intervalHandles.get(id);
        this.clearNativeInterval(handle);
        this.intervals.delete(id);
        this.intervalHandles.delete(id);
      }
      this.intervalContexts.delete(id);
      entry.intervals.delete(id);
    }
    // 인덱스 정리
    this.contextIndex.delete(context);
  }

  /**
   * 특정 컨텍스트의 활성 타이머 수
   */
  getActiveTimersCountByContext(context: string): number {
    const entry = this.contextIndex.get(context);
    if (!entry) return 0;
    return entry.timers.size + entry.intervals.size;
  }
}

/**
 * 전역 타이머 관리자 인스턴스
 */
export const globalTimerManager = new TimerManager();

/**
 * 안전한 performance.now() 호출
 *
 * @returns 현재 시간 또는 Date.now() fallback
 */
export function safePerformanceNow(): number {
  if (typeof performance !== 'undefined' && performance.now) {
    return performance.now();
  }
  return Date.now();
}

// Performance utilities re-export (deprecated wrappers removed)
export {
  measurePerformance,
  measureAsyncPerformance,
  createDebouncer,
  rafThrottle,
} from './performance/performance-utils';

// Aliases for backward compatibility
export const createManagedDebounce = createDebouncer;
