/**
 * @fileoverview 메모리 안전 타이머 관리 유틸리티
 * @version 1.0.0
 *
 * 타이머 누수를 방지하는 간단한 유틸리티입니다.
 */

/**
 * 활성 타이머들을 추적하는 Map
 */
const activeTimers = new Map<string, ReturnType<typeof setTimeout>>();
let timerIdCounter = 0;

/**
 * 관리되는 타이머 생성 (setTimeout)
 */
export function createManagedTimeout(callback: () => void, delay: number): string {
  const timerId = `timeout_${++timerIdCounter}`;

  const nativeTimerId = setTimeout(() => {
    // 타이머 완료 시 Map에서 제거
    activeTimers.delete(timerId);
    callback();
  }, delay);

  activeTimers.set(timerId, nativeTimerId);
  return timerId;
}

/**
 * 관리되는 인터벌 생성 (setInterval)
 */
export function createManagedInterval(callback: () => void, delay: number): string {
  const timerId = `interval_${++timerIdCounter}`;

  const nativeTimerId = setInterval(callback, delay);
  activeTimers.set(timerId, nativeTimerId);

  return timerId;
}

/**
 * 특정 타이머 제거
 */
export function clearManagedTimer(timerId: string): boolean {
  const nativeTimerId = activeTimers.get(timerId);

  if (nativeTimerId !== undefined) {
    if (timerId.startsWith('timeout_')) {
      clearTimeout(nativeTimerId);
    } else if (timerId.startsWith('interval_')) {
      clearInterval(nativeTimerId);
    }

    activeTimers.delete(timerId);
    return true;
  }

  return false;
}

/**
 * React/Preact ref를 사용한 타이머 관리
 * 컴포넌트가 언마운트될 때 자동으로 정리됩니다.
 */
export function createRefManagedTimeout(
  timeoutRef: { current: string | null },
  callback: () => void,
  delay: number
): void {
  // 기존 타이머가 있으면 정리
  if (timeoutRef.current) {
    clearManagedTimer(timeoutRef.current);
  }

  // 새 타이머 생성
  timeoutRef.current = createManagedTimeout(() => {
    callback();
    timeoutRef.current = null; // 자동 완료 시 참조 해제
  }, delay);
}

/**
 * 여러 타이머를 일괄 정리
 */
export function clearMultipleTimers(timerIds: (string | null)[]): void {
  for (const timerId of timerIds) {
    if (timerId) {
      clearManagedTimer(timerId);
    }
  }
}

/**
 * 모든 타이머 정리
 */
export function clearAllTimers(): number {
  const count = activeTimers.size;

  for (const [timerId, nativeTimerId] of activeTimers.entries()) {
    if (timerId.startsWith('timeout_')) {
      clearTimeout(nativeTimerId);
    } else if (timerId.startsWith('interval_')) {
      clearInterval(nativeTimerId);
    }
  }

  activeTimers.clear();
  return count;
}

/**
 * 타이머 디버그 정보
 */
export function getTimerDebugInfo(): {
  totalTimers: number;
  timerIds: string[];
} {
  return {
    totalTimers: activeTimers.size,
    timerIds: Array.from(activeTimers.keys()),
  };
}
