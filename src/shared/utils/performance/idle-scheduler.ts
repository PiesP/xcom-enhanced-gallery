import { logger } from '@shared/logging/logger';
import { globalTimerManager } from '@shared/utils/time/timer-management';

type IdleHandle = {
  readonly cancel: () => void;
};

type RequestIdleCallback = (
  callback: IdleRequestCallback,
  opts?: { readonly timeout?: number }
) => number;

type CancelIdleCallback = (handle: number) => void;

type IdleRequestCallback = () => void;

interface IdleAPIs {
  readonly ric: RequestIdleCallback | null;
  readonly cic: CancelIdleCallback | null;
}

const getIdleAPIs = (): IdleAPIs => {
  const source = typeof globalThis !== 'undefined' ? globalThis : undefined;

  if (!source || typeof source !== 'object') {
    return { ric: null, cic: null };
  }

  return {
    ric:
      ('requestIdleCallback' in source
        ? ((source as { requestIdleCallback?: unknown }).requestIdleCallback as
            | RequestIdleCallback
            | undefined)
        : undefined) || null,
    cic:
      ('cancelIdleCallback' in source
        ? ((source as { cancelIdleCallback?: unknown }).cancelIdleCallback as
            | CancelIdleCallback
            | undefined)
        : undefined) || null,
  };
};

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
