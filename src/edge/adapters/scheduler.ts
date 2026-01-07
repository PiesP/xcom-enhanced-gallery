/**
 * @fileoverview Scheduler adapter for Edge layer timer management
 *
 * Provides a tick-based job scheduler that delegates timer operations to the global
 * timer manager. Implements one-shot setTimeout rescheduling for continuous periodic
 * execution with graceful error handling and centralized lifecycle management.
 *
 * @remarks
 * **Key Responsibilities**:
 * - Job management: register, track, and cancel interval-based jobs
 * - Timer delegation: delegate setTimeout/clearTimeout to globalTimerManager
 * - Automatic rescheduling: reschedule after each execution callback
 * - Error resilience: errors in callbacks don't affect future rescheduling
 * - Resource cleanup: stop jobs and clear pending timers
 * - Centralized control: cancel all jobs at once
 *
 * **Architecture Pattern**:
 * Each scheduler instance maintains a closure-scoped Map of jobs. Jobs use recursive
 * setTimeout (not setInterval) with rescheduling in a finally block to ensure
 * periodic execution continues even if callbacks throw errors.
 *
 * **Job Lifecycle**:
 * 1. schedule() creates job, sets stopped=false, schedules first timeout
 * 2. Timeout fires, callback executes in try block
 * 3. finally block calls scheduleNext() unconditionally
 * 4. cancel() marks stopped=true, clears timerId, deletes from map
 * 5. Next timer fire checks stopped flag and exits if true
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
  /**
   * Schedule or replace a periodic job
   *
   * If a job with the given ID already exists, it is canceled first before
   * the new job is scheduled. This enables job replacement with different
   * intervals or callbacks.
   *
   * @param id - Unique job identifier
   * @param intervalMs - Milliseconds between executions
   * @param onTick - Callback function executed on each tick
   */
  schedule(id: string, intervalMs: number, onTick: () => void): void;

  /**
   * Cancel a specific periodic job
   *
   * Stops the job, clears pending timer, removes from tracking.
   * Canceling a non-existent job is safe (no-op).
   *
   * @param id - Job identifier to cancel
   */
  cancel(id: string): void;

  /**
   * Cancel all periodic jobs
   *
   * Stops all tracked jobs and clears the job map. Equivalent to calling
   * cancel() for each scheduled job.
   */
  cancelAll(): void;
}

/**
 * Create a new tick scheduler instance
 *
 * Instantiates a scheduler with isolated job management. Multiple scheduler
 * instances can coexist with independent job namespaces.
 *
 * @returns TickScheduler interface for managing periodic jobs
 *
 * @remarks
 * **Implementation Details**:
 * - Uses Map for O(1) job lookup by ID
 * - Delegates all timer operations to globalTimerManager
 * - Each scheduler has closure-scoped job storage
 * - Jobs are identified by string keys
 *
 * **Rescheduling Strategy**:
 * - Uses one-shot setTimeout instead of setInterval
 * - Callback wrapped in try/finally to ensure rescheduling
 * - If callback throws, error propagates but rescheduling continues
 * - Stopped flag checked on each timer fire
 *
 * **Error Behavior**:
 * - Errors in callbacks propagate to caller
 * - Rescheduling guaranteed via finally clause
 * - Caller can wrap callback in try/catch for error suppression
 *
 * **Performance**:
 * - schedule: O(1) - Map insertion + timer setup
 * - cancel: O(1) - Map deletion + timer clear
 * - cancelAll: O(n) - iterate jobs, O(1) per job
 *
 * @see {@link TickScheduler} for interface documentation
 * @see {@link globalTimerManager} for timer delegation
 */
export function createTickScheduler(): TickScheduler {
  const jobs = new Map<string, TickJob>();

  /**
   * Schedule next tick for a job
   *
   * Sets up the next setTimeout and reschedule. Checks if job
   * exists and isn't stopped before scheduling.
   *
   * @param id - Job identifier
   * @internal
   */
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

  /**
   * Internal cancel implementation
   *
   * Marks job as stopped, clears pending timer, and removes from map.
   *
   * @param id - Job identifier
   * @internal
   */
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
