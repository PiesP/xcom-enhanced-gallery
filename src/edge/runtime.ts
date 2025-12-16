import type { RuntimeCommand } from '@core/cmd';
import type { RuntimeEvent } from '@core/events';
import { createInitialModel, type RuntimeModel } from '@core/model';
import { formatErrorMessage } from '@core/policy';
import { update } from '@core/update';
import { log } from '@edge/adapters/logger';
import { createTickScheduler, type TickScheduler } from '@edge/adapters/scheduler';
import { storeGet, storeSet } from '@edge/adapters/storage';
import { takeDomFacts } from '@edge/dom-facts';
import { globalTimerManager } from '@shared/utils/time/timer-management';

export interface CommandRuntimeHandle {
  dispatch(event: RuntimeEvent): void;
  stop(): void;
  getModel(): RuntimeModel;
}

export interface CommandRuntimeDeps {
  now?: () => number;
  getUrl?: () => string;
  timeouts?: {
    /** Maximum time to wait for STORE_GET before failing the request (ms). */
    storeGetMs?: number;
    /** Maximum time to wait for STORE_SET before failing the request (ms). */
    storeSetMs?: number;
  };
  adapters?: {
    log?: typeof log;
    takeDomFacts?: typeof takeDomFacts;
    storeGet?: typeof storeGet;
    storeSet?: typeof storeSet;
    scheduler?: TickScheduler;
  };
}

export function startCommandRuntime(deps: CommandRuntimeDeps = {}): CommandRuntimeHandle {
  const now = deps.now ?? (() => Date.now());
  const getUrl = deps.getUrl ?? (() => (typeof window !== 'undefined' ? window.location.href : ''));

  const storeGetTimeoutMs = deps.timeouts?.storeGetMs ?? 10_000;
  const storeSetTimeoutMs = deps.timeouts?.storeSetMs ?? 10_000;

  const runtimeLog = deps.adapters?.log ?? log;
  const runtimeTakeDomFacts = deps.adapters?.takeDomFacts ?? takeDomFacts;
  const runtimeStoreGet = deps.adapters?.storeGet ?? storeGet;
  const runtimeStoreSet = deps.adapters?.storeSet ?? storeSet;
  const scheduler = deps.adapters?.scheduler ?? createTickScheduler();

  let model: RuntimeModel = createInitialModel();
  const queue: RuntimeEvent[] = [];
  let processing = false;
  let drainScheduled = false;
  let stopped = false;

  const timeoutTimers = new Set<number>();

  const raceWithTimeout = async <T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<{ readonly timedOut: true } | { readonly timedOut: false; readonly value: T }> => {
    if (!(timeoutMs > 0)) {
      return { timedOut: false, value: await promise };
    }

    return await new Promise((resolve, reject) => {
      let settled = false;

      const timerId = globalTimerManager.setTimeout(() => {
        if (settled) {
          return;
        }

        settled = true;
        timeoutTimers.delete(timerId);
        resolve({ timedOut: true } as const);
      }, timeoutMs);

      timeoutTimers.add(timerId);

      promise
        .then((value) => {
          if (settled) {
            return;
          }

          settled = true;
          globalTimerManager.clearTimeout(timerId);
          timeoutTimers.delete(timerId);
          resolve({ timedOut: false, value } as const);
        })
        .catch((error) => {
          if (settled) {
            return;
          }

          settled = true;
          globalTimerManager.clearTimeout(timerId);
          timeoutTimers.delete(timerId);
          reject(error);
        });
    });
  };

  const safeRuntimeLog = (
    level: Parameters<typeof runtimeLog>[0],
    message: string,
    context?: Readonly<Record<string, unknown>>
  ): void => {
    try {
      runtimeLog(level, message, context);
    } catch {
      // Intentionally ignore: logging must never crash the runtime.
    }
  };

  const scheduleMicrotask = (fn: () => void): void => {
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(fn);
    } else {
      void Promise.resolve().then(fn);
    }
  };

  const requestDrain = (): void => {
    if (stopped || drainScheduled) return;
    drainScheduled = true;
    scheduleMicrotask(() => {
      drainScheduled = false;
      void processQueue();
    });
  };

  const dispatch = (event: RuntimeEvent): void => {
    if (stopped) return;
    queue.push(event);
    if (processing) {
      requestDrain();
    } else {
      void processQueue();
    }
  };

  const interpret = async (cmd: RuntimeCommand): Promise<void> => {
    switch (cmd.type) {
      case 'LOG':
        safeRuntimeLog(cmd.level, cmd.message, cmd.context);
        return;

      case 'TAKE_DOM_FACTS': {
        try {
          const facts = runtimeTakeDomFacts(cmd.kind);
          dispatch({ type: 'DomFactsReady', requestId: cmd.requestId, facts, now: now() });
        } catch (error) {
          dispatch({
            type: 'DomFactsFailed',
            requestId: cmd.requestId,
            kind: cmd.kind,
            error: formatErrorMessage(error),
            now: now(),
          });
        }
        return;
      }

      case 'STORE_GET': {
        try {
          const result = await raceWithTimeout(runtimeStoreGet(cmd.key), storeGetTimeoutMs);
          if (result.timedOut) {
            dispatch({
              type: 'StorageFailed',
              requestId: cmd.requestId,
              key: cmd.key,
              error: 'Timeout',
              now: now(),
            });
            return;
          }

          const value = result.value;
          dispatch({
            type: 'StorageLoaded',
            requestId: cmd.requestId,
            key: cmd.key,
            value,
            now: now(),
          });
        } catch (error) {
          dispatch({
            type: 'StorageFailed',
            requestId: cmd.requestId,
            key: cmd.key,
            error: formatErrorMessage(error),
            now: now(),
          });
        }
        return;
      }

      case 'STORE_SET': {
        try {
          const result = await raceWithTimeout(
            runtimeStoreSet(cmd.key, cmd.value),
            storeSetTimeoutMs
          );
          if (result.timedOut) {
            dispatch({
              type: 'StorageSetFailed',
              requestId: cmd.requestId,
              key: cmd.key,
              error: 'Timeout',
              now: now(),
            });
            return;
          }

          dispatch({
            type: 'StorageSetCompleted',
            requestId: cmd.requestId,
            key: cmd.key,
            now: now(),
          });
        } catch (error) {
          dispatch({
            type: 'StorageSetFailed',
            requestId: cmd.requestId,
            key: cmd.key,
            error: formatErrorMessage(error),
            now: now(),
          });
        }
        return;
      }

      case 'SCHEDULE_TICK': {
        try {
          scheduler.schedule(cmd.id, cmd.intervalMs, () => {
            dispatch({ type: 'Tick', tickId: cmd.id, now: now() });
          });
        } catch (error) {
          safeRuntimeLog('error', '[command-runtime] SCHEDULE_TICK failed', {
            id: cmd.id,
            intervalMs: cmd.intervalMs,
            error: formatErrorMessage(error),
          });
        }
        return;
      }

      case 'CANCEL_TICK': {
        try {
          scheduler.cancel(cmd.id);
        } catch (error) {
          safeRuntimeLog('error', '[command-runtime] CANCEL_TICK failed', {
            id: cmd.id,
            error: formatErrorMessage(error),
          });
        }
        return;
      }

      default:
        return;
    }
  };

  const processQueue = async (): Promise<void> => {
    if (processing || stopped) return;
    processing = true;

    try {
      while (queue.length > 0 && !stopped) {
        const event = queue.shift();
        if (!event) continue;

        let result: ReturnType<typeof update>;
        try {
          result = update(model, event);
          model = result.model;
        } catch (error) {
          safeRuntimeLog('error', '[command-runtime] update() threw', {
            eventType: (event as { type?: unknown }).type,
            error: formatErrorMessage(error),
          });
          // Drop the event and continue; do not crash the runtime.
          continue;
        }

        for (const cmd of result.cmds) {
          // Keep command execution sequential to preserve deterministic behavior.
          // If we later need concurrency, it should be expressed explicitly in Cmd/Event.
          try {
            await interpret(cmd);
          } catch (error) {
            safeRuntimeLog('error', '[command-runtime] interpret() threw', {
              cmdType: (cmd as { type?: unknown }).type,
              error: formatErrorMessage(error),
            });
            // Continue to next command/event.
          }
        }
      }
    } finally {
      processing = false;

      // Guarantee forward progress even if events were enqueued while we were processing.
      // (JS is single-threaded, but external callers can enqueue events at any time between drains.)
      if (queue.length > 0 && !stopped) {
        requestDrain();
      }
    }
  };

  dispatch({ type: 'Booted', url: getUrl(), now: now() });

  return {
    dispatch,
    stop() {
      stopped = true;

      // Cancel any pending timeout timers created by raceWithTimeout.
      timeoutTimers.forEach((id) => {
        globalTimerManager.clearTimeout(id);
      });
      timeoutTimers.clear();

      scheduler.cancelAll();
      queue.length = 0;
    },
    getModel() {
      return model;
    },
  };
}
