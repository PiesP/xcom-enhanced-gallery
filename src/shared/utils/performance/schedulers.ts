/**
 * @fileoverview Additional schedulers for performance-sensitive tasks
 * @description Provides requestAnimationFrame and microtask scheduling helpers.
 */

export type SchedulerHandle = { cancel: () => void };

type GlobalLike = {
  requestAnimationFrame?: (cb: FrameRequestCallback) => number;
  cancelAnimationFrame?: (h: number) => void;
  queueMicrotask?: (cb: () => void) => void;
};

/**
 * Schedule a task on the next animation frame.
 * Falls back to setTimeout(0) when requestAnimationFrame is unavailable.
 */
export function scheduleRaf(task: () => void): SchedulerHandle {
  try {
    const g: GlobalLike | undefined =
      typeof globalThis !== 'undefined'
        ? (globalThis as unknown as GlobalLike)
        : typeof window !== 'undefined'
          ? (window as unknown as GlobalLike)
          : undefined;
    const raf: ((cb: FrameRequestCallback) => number) | undefined = g?.requestAnimationFrame;
    const caf: ((h: number) => void) | undefined = g?.cancelAnimationFrame;
    if (typeof raf === 'function') {
      let done = false;
      const id = raf(() => {
        if (done) return;
        done = true;
        try {
          task();
        } catch {
          // noop
        } finally {
          clearTimeout(timer);
        }
      });
      // Fallback: in non-visual/test envs rAF may not flush promptly
      const timer = setTimeout(() => {
        if (done) return;
        done = true;
        try {
          task();
        } catch {
          // noop
        } finally {
          caf?.(id);
        }
      }, 16);
      return {
        cancel: () => {
          done = true;
          caf?.(id);
          clearTimeout(timer);
        },
      };
    }
  } catch {
    // ignore
  }

  const t = setTimeout(() => {
    try {
      task();
    } catch {
      // noop
    }
  }, 0);
  return { cancel: () => clearTimeout(t) };
}

/**
 * Schedule a task as a microtask when possible.
 * Uses queueMicrotask if available, otherwise Promise.resolve().then().
 * Falls back to setTimeout(0) when microtask queue is not available.
 */
export function scheduleMicrotask(task: () => void): SchedulerHandle {
  try {
    const g: GlobalLike | undefined = globalThis as unknown as GlobalLike;
    const qm: ((cb: () => void) => void) | undefined = g?.queueMicrotask;
    if (typeof qm === 'function') {
      qm(() => {
        try {
          task();
        } catch {
          // noop
        }
      });
      return { cancel: () => void 0 };
    }
  } catch {
    // ignore
  }

  try {
    // Promise microtask
    let cancelled = false;
    Promise.resolve()
      .then(() => {
        if (cancelled) return;
        task();
      })
      .catch(() => {
        /* noop */
      });
    return { cancel: () => (cancelled = true) };
  } catch {
    // ignore
  }

  const t = setTimeout(() => {
    try {
      task();
    } catch {
      // noop
    }
  }, 0);
  return { cancel: () => clearTimeout(t) };
}
