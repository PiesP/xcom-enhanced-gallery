import { globalTimerManager } from '@shared/utils/time/timer-management';

export type IdleHandle = { cancel: () => void };

type RequestIdleCallback = (callback: () => void, opts?: { timeout?: number }) => number;
type CancelIdleCallback = (handle: number) => void;

const getIdleAPIs = (): {
  ric: RequestIdleCallback | null;
  cic: CancelIdleCallback | null;
} => {
  const source = typeof globalThis !== 'undefined' ? globalThis : undefined;
  const ric =
    source && typeof source === 'object' && 'requestIdleCallback' in source
      ? ((source as { requestIdleCallback?: unknown }).requestIdleCallback as
          | RequestIdleCallback
          | undefined) || null
      : null;
  const cic =
    source && typeof source === 'object' && 'cancelIdleCallback' in source
      ? ((source as { cancelIdleCallback?: unknown }).cancelIdleCallback as
          | CancelIdleCallback
          | undefined) || null
      : null;
  return { ric, cic };
};

export function scheduleIdle(task: () => void): IdleHandle {
  const { ric, cic } = getIdleAPIs();

  if (ric) {
    const id = ric(() => {
      try {
        task();
      } catch {
        // noop — the caller decides how to handle failures
      }
    });
    return {
      cancel: () => {
        cic?.(id);
      },
    };
  }

  const timerId = globalTimerManager.setTimeout(() => {
    try {
      task();
    } catch {
      // noop
    }
  }, 0);

  return {
    cancel: () => {
      globalTimerManager.clearTimeout(timerId);
    },
  };
}
