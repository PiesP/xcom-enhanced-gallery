import { logger } from '@shared/logging/logger';

type IdleHandle = {
  readonly cancel: () => void;
};

type IdleRequestCallback = () => void;

/**
 * Schedules a task to run during browser idle time.
 * Errors in tasks are caught and logged (in DEV only) without crashing.
 */
export function scheduleIdle(task: IdleRequestCallback): IdleHandle {
  const id = requestIdleCallback(() => {
    try {
      task();
    } catch (error) {
      __DEV__ && logger.warn('[scheduleIdle] task error', error);
    }
  });

  return {
    cancel: () => cancelIdleCallback(id),
  };
}
