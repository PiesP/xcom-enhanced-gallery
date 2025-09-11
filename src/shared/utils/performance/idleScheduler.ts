/**
 * @fileoverview Idle Scheduler Utility
 * @description requestIdleCallback이 가능할 때 작업을 유휴 시간에 예약합니다.
 * Node/jsdom 환경에서도 안전하게 동작하도록 폴백(setTimeout) 제공합니다.
 */

export interface IdleScheduleOptions {
  readonly timeoutMs?: number; // 일정 시간 내 실행 보장
}

export type IdleHandle = { cancel: () => void };

type IdleDeadline = { didTimeout: boolean; timeRemaining: () => number };

type RequestIdleCallback = (
  callback: (deadline: IdleDeadline) => void,
  opts?: { timeout?: number }
) => number;

type CancelIdleCallback = (handle: number) => void;

function getIdleAPIs(): {
  ric: RequestIdleCallback | null;
  cic: CancelIdleCallback | null;
} {
  const g: unknown =
    typeof globalThis !== 'undefined'
      ? globalThis
      : typeof window !== 'undefined'
        ? window
        : undefined;
  const ric =
    g && typeof g === 'object' && 'requestIdleCallback' in g
      ? ((g as { requestIdleCallback?: unknown }).requestIdleCallback as
          | RequestIdleCallback
          | undefined) || null
      : null;
  const cic =
    g && typeof g === 'object' && 'cancelIdleCallback' in g
      ? ((g as { cancelIdleCallback?: unknown }).cancelIdleCallback as
          | CancelIdleCallback
          | undefined) || null
      : null;
  return { ric, cic };
}

/**
 * 작업을 유휴 시간에 예약합니다. 환경에서 requestIdleCallback을 지원하지 않으면 setTimeout(0)에 폴백합니다.
 */
export function scheduleIdle(task: () => void, opts: IdleScheduleOptions = {}): IdleHandle {
  const { ric, cic } = getIdleAPIs();
  const timeout = opts.timeoutMs ?? 200;

  if (ric) {
    const id = ric(
      () => {
        try {
          task();
        } catch {
          // noop — 소비자 레벨에서 에러 처리
        }
      },
      { timeout }
    );
    return {
      cancel: () => {
        cic?.(id);
      },
    };
  }

  // 폴백: 즉시 큐에 예약
  const t = setTimeout(() => {
    try {
      task();
    } catch {
      // noop
    }
  }, 0);

  return {
    cancel: () => clearTimeout(t),
  };
}
