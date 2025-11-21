/**
 * @fileoverview Idle Scheduler Utility
 * @description Schedules work during idle time when requestIdleCallback is available.
 * Provides fallback (setTimeout) for safe operation in Node/jsdom environments.
 */

export interface IdleScheduleOptions {
  readonly timeoutMs?: number; // Ensure execution within specified time
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
 * Schedule a task during idle time. Falls back to setTimeout(0) if requestIdleCallback is not supported.
 */
import { globalTimerManager } from '@shared/utils/timer-management';

export function scheduleIdle(task: () => void, opts: IdleScheduleOptions = {}): IdleHandle {
  const { ric, cic } = getIdleAPIs();
  const timeout = opts.timeoutMs ?? 200;

  if (ric) {
    const id = ric(
      () => {
        try {
          task();
        } catch {
          // noop — error handling at consumer level
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

  // Fallback: schedule immediately to queue
  // Use globalTimerManager to ensure timers are tracked and cleaned up in tests
  const t = globalTimerManager.setTimeout(() => {
    try {
      task();
    } catch {
      // noop
    }
  }, 0);

  return {
    cancel: () => globalTimerManager.clearTimeout(t),
  };
}
