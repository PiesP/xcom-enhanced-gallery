import { logger } from '@shared/logging/logger';
import { globalTimerManager } from '@shared/utils/time/timer-management';

/**
 * Handle to cancel a scheduled idle task.
 */
type IdleHandle = {
  readonly cancel: () => void;
};

/**
 * Idle callback function type.
 */
type IdleRequestCallback = () => void;

/**
 * Safely detects and returns available idle APIs.
 * @internal
 */
function getIdleAPIs(): {
  readonly ric: ((cb: IdleRequestCallback, opts?: { readonly timeout?: number }) => number) | null;
  readonly cic: ((handle: number) => void) | null;
} {
  const source = typeof globalThis !== 'undefined' ? globalThis : undefined;

  if (!source || typeof source !== 'object') {
    return { ric: null, cic: null };
  }

  return {
    ric:
      ('requestIdleCallback' in source
        ? ((source as unknown as Record<string, unknown>).requestIdleCallback as
            | ((cb: IdleRequestCallback, opts?: { readonly timeout?: number }) => number)
            | undefined)
        : undefined) ?? null,
    cic:
      ('cancelIdleCallback' in source
        ? ((source as unknown as Record<string, unknown>).cancelIdleCallback as
            | ((handle: number) => void)
            | undefined)
        : undefined) ?? null,
  };
}

let didLogIdleTaskErrorInDev = false;

/**
 * Schedules a task to run during browser idle time, with fallback to setTimeout.
 * Errors in tasks are caught and logged (in DEV only) without crashing the scheduler.
 *
 * @param task - The callback to execute when idle
 * @returns A handle to cancel the scheduled task
 */
export function scheduleIdle(task: IdleRequestCallback): IdleHandle {
  const { ric, cic } = getIdleAPIs();

  // Prefer requestIdleCallback if available
  if (ric) {
    const id = ric(() => {
      try {
        task();
      } catch (error) {
        logIdleTaskError(error);
      }
    });

    return {
      cancel: () => {
        cic?.(id);
      },
    };
  }

  // Fallback to setTimeout for browsers without requestIdleCallback
  const timerId = globalTimerManager.setTimeout(() => {
    try {
      task();
    } catch (error) {
      logIdleTaskError(error);
    }
  }, 0);

  return {
    cancel: () => {
      globalTimerManager.clearTimeout(timerId);
    },
  };
}

/**
 * Logs idle task errors in development, only once per session.
 * @param error - The error to log
 */
const logIdleTaskError = (error: unknown): void => {
  if (!__DEV__ || didLogIdleTaskErrorInDev) return;
  didLogIdleTaskErrorInDev = true;
  logger.warn('[scheduleIdle] Idle task error', error);
};
