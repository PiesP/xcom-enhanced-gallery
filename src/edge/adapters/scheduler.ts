import { globalTimerManager } from '@shared/utils/time/timer-management';

interface TickJob {
  intervalMs: number;
  timerId: number | null;
  stopped: boolean;
  onTick: () => void;
}

export interface TickScheduler {
  schedule(id: string, intervalMs: number, onTick: () => void): void;
  cancel(id: string): void;
  cancelAll(): void;
}

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
