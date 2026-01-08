/**
 * Scheduler adapter for Edge layer. Tick-based job scheduler that delegates timer
 * operations to the global timer manager. Implements one-shot setTimeout rescheduling
 * for continuous periodic execution with graceful error handling.
 *
 * @module edge/adapters/scheduler
 */

import { globalTimerManager } from '@shared/utils/time/timer-management';

/**
 * Internal job descriptor for periodic execution
 *
 * Tracks state and timer ID for individual scheduled jobs.
 *
 * @internal
 */
interface TickJob {
  /** Milliseconds between executions */
  intervalMs: number;
  /** Pending setTimeout ID, or null if no timeout scheduled */
  timerId: number | null;
  /** Set to true after cancel() is called (blocks rescheduling) */
  stopped: boolean;
  /** Callback function executed on each interval tick */
  onTick: () => void;
}

/**
 * Public interface for periodic interval-based job scheduler
 *
 * Provides schedule, cancel, and cancelAll methods for managing recurring jobs.
 * Each scheduler instance has an independent job namespace.
 */
export interface TickScheduler {
  /** Schedule or replace a periodic job */
  schedule(id: string, intervalMs: number, onTick: () => void): void;

  /** Cancel a specific periodic job */
  cancel(id: string): void;

  /** Cancel all periodic jobs */
  cancelAll(): void;
}

/**
 * Create a new tick scheduler instance
 */
export function createTickScheduler(): TickScheduler {
  const jobs = new Map<string, TickJob>();

  const scheduleNext = (id: string): void => {
    const job = jobs.get(id);
    if (!job || job.stopped) return;

    job.timerId = globalTimerManager.setTimeout(() => {
      const current = jobs.get(id);
      if (!current || current.stopped) return;

      try {
        current.onTick();
      } finally {
        scheduleNext(id);
      }
    }, job.intervalMs);
  };

  const cancel = (id: string): void => {
    const job = jobs.get(id);
    if (!job) return;

    job.stopped = true;
    if (job.timerId !== null) {
      globalTimerManager.clearTimeout(job.timerId);
      job.timerId = null;
    }

    jobs.delete(id);
  };

  return {
    schedule(id, intervalMs, onTick) {
      cancel(id);
      const job: TickJob = { intervalMs, onTick, timerId: null, stopped: false };
      jobs.set(id, job);
      scheduleNext(id);
    },
    cancel,
    cancelAll() {
      Array.from(jobs.keys()).forEach((id) => cancel(id));
    },
  };
}
