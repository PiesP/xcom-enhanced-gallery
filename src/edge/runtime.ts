import type { RuntimeCommand } from '@core/cmd';
import type { RuntimeEvent } from '@core/events';
import { createInitialModel, type RuntimeModel } from '@core/model';
import { formatErrorMessage } from '@core/policy';
import { update } from '@core/update';
import { httpRequest } from '@edge/adapters/http';
import { log } from '@edge/adapters/logger';
import { navigate } from '@edge/adapters/navigation';
import { createTickScheduler, type TickScheduler } from '@edge/adapters/scheduler';
import { storeGet, storeSet } from '@edge/adapters/storage';
import { takeDomFacts } from '@edge/dom-facts';
import { globalTimerManager } from '@shared/utils/time/timer-management';

export interface CommandRuntimeHandle {
  dispatch(event: RuntimeEvent): void;
  stop(): void;
  getModel(): RuntimeModel;
}

interface CommandRuntimeDeps {
  now?: () => number;
  getUrl?: () => string;
  timeouts?: {
    /** Maximum time to wait for STORE_GET before failing the request (ms). */
    storeGetMs?: number;
    /** Maximum time to wait for STORE_SET before failing the request (ms). */
    storeSetMs?: number;
    /** Maximum time to wait for HTTP_REQUEST before failing the request (ms). */
    httpRequestMs?: number;
    /** Maximum time to wait for NAVIGATE before failing the request (ms). */
    navigateMs?: number;
  };
  adapters?: {
    log?: typeof log;
    takeDomFacts?: typeof takeDomFacts;
    storeGet?: typeof storeGet;
    storeSet?: typeof storeSet;
    httpRequest?: typeof httpRequest;
    navigate?: typeof navigate;
    scheduler?: TickScheduler;
  };
}

export function startCommandRuntime(deps: CommandRuntimeDeps = {}): CommandRuntimeHandle {
  const now = deps.now ?? (() => Date.now());
  const getUrl = deps.getUrl ?? (() => (typeof window !== 'undefined' ? window.location.href : ''));

  const storeGetTimeoutMs = deps.timeouts?.storeGetMs ?? 10_000;
  const storeSetTimeoutMs = deps.timeouts?.storeSetMs ?? 10_000;
  const httpRequestTimeoutMs = deps.timeouts?.httpRequestMs ?? 15_000;
  const navigateTimeoutMs = deps.timeouts?.navigateMs ?? 5_000;

  const runtimeLog = deps.adapters?.log ?? log;
  const runtimeTakeDomFacts = deps.adapters?.takeDomFacts ?? takeDomFacts;
  const runtimeStoreGet = deps.adapters?.storeGet ?? storeGet;
  const runtimeStoreSet = deps.adapters?.storeSet ?? storeSet;
  const runtimeHttpRequest = deps.adapters?.httpRequest ?? httpRequest;
  const runtimeNavigate = deps.adapters?.navigate ?? navigate;
  const scheduler = deps.adapters?.scheduler ?? createTickScheduler();

  let model: RuntimeModel = createInitialModel();
  const queue: RuntimeEvent[] = [];
  let processing = false;
  let drainScheduled = false;
  let stopped = false;

  type TimeoutTimerId = ReturnType<typeof globalTimerManager.setTimeout>;
  const timeoutTimers = new Set<TimeoutTimerId>();

  const startTimeout = (timeoutMs: number, onTimeout: () => void): TimeoutTimerId | null => {
    if (!(timeoutMs > 0)) {
      return null;
    }

    let timerId: TimeoutTimerId;
    timerId = globalTimerManager.setTimeout(() => {
      timeoutTimers.delete(timerId);
      onTimeout();
    }, timeoutMs);
    timeoutTimers.add(timerId);
    return timerId;
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

  const runWithTimeout = <T>(
    timeoutMs: number,
    run: () => Promise<T> | T,
    onTimeout: () => void,
    onSuccess: (value: T) => void,
    onError: (error: unknown) => void
  ): void => {
    let settled = false;
    const timerId = startTimeout(timeoutMs, () => {
      if (settled) {
        return;
      }
      settled = true;
      onTimeout();
    });

    const finalize = (): void => {
      if (timerId !== null) {
        globalTimerManager.clearTimeout(timerId);
        timeoutTimers.delete(timerId);
      }
    };

    let promise: Promise<T>;
    try {
      // Invoke the adapter synchronously (matching the pre-refactor behavior)
      // while still normalizing return values to a Promise.
      promise = Promise.resolve(run());
    } catch (error) {
      if (!settled) {
        settled = true;
        finalize();
        onError(error);
      }
      return;
    }

    promise.then(
      (value) => {
        if (settled) {
          return;
        }
        settled = true;
        finalize();
        onSuccess(value);
      },
      (error) => {
        if (settled) {
          return;
        }
        settled = true;
        finalize();
        onError(error);
      }
    );
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

  const interpret = (cmd: RuntimeCommand): void => {
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
        runWithTimeout(
          storeGetTimeoutMs,
          () => runtimeStoreGet(cmd.key),
          () => {
            dispatch({
              type: 'StorageFailed',
              requestId: cmd.requestId,
              key: cmd.key,
              error: 'Timeout',
              now: now(),
            });
          },
          (value) => {
            dispatch({
              type: 'StorageLoaded',
              requestId: cmd.requestId,
              key: cmd.key,
              value,
              now: now(),
            });
          },
          (error) => {
            dispatch({
              type: 'StorageFailed',
              requestId: cmd.requestId,
              key: cmd.key,
              error: formatErrorMessage(error),
              now: now(),
            });
          }
        );
        return;
      }

      case 'STORE_SET': {
        runWithTimeout(
          storeSetTimeoutMs,
          () => runtimeStoreSet(cmd.key, cmd.value),
          () => {
            dispatch({
              type: 'StorageSetFailed',
              requestId: cmd.requestId,
              key: cmd.key,
              error: 'Timeout',
              now: now(),
            });
          },
          () => {
            dispatch({
              type: 'StorageSetCompleted',
              requestId: cmd.requestId,
              key: cmd.key,
              now: now(),
            });
          },
          (error) => {
            dispatch({
              type: 'StorageSetFailed',
              requestId: cmd.requestId,
              key: cmd.key,
              error: formatErrorMessage(error),
              now: now(),
            });
          }
        );
        return;
      }

      case 'HTTP_REQUEST': {
        runWithTimeout(
          httpRequestTimeoutMs,
          () =>
            runtimeHttpRequest({
              url: cmd.url,
              method: cmd.method,
              responseType: cmd.responseType,
              ...(cmd.headers !== undefined ? { headers: cmd.headers } : {}),
              ...(cmd.body !== undefined ? { body: cmd.body } : {}),
            }),
          () => {
            dispatch({
              type: 'HttpFailed',
              requestId: cmd.requestId,
              url: cmd.url,
              error: 'Timeout',
              now: now(),
            });
          },
          (result) => {
            dispatch({
              type: 'HttpCompleted',
              requestId: cmd.requestId,
              url: cmd.url,
              status: result.status,
              body: result.body,
              now: now(),
            });
          },
          (error) => {
            dispatch({
              type: 'HttpFailed',
              requestId: cmd.requestId,
              url: cmd.url,
              error: formatErrorMessage(error),
              now: now(),
            });
          }
        );

        return;
      }

      case 'NAVIGATE': {
        runWithTimeout(
          navigateTimeoutMs,
          () =>
            runtimeNavigate({
              url: cmd.url,
              mode: cmd.mode,
              ...(cmd.target !== undefined ? { target: cmd.target } : {}),
            }),
          () => {
            dispatch({
              type: 'NavigateFailed',
              requestId: cmd.requestId,
              url: cmd.url,
              error: 'Timeout',
              now: now(),
            });
          },
          () => {
            dispatch({
              type: 'NavigateCompleted',
              requestId: cmd.requestId,
              url: cmd.url,
              now: now(),
            });
          },
          (error) => {
            dispatch({
              type: 'NavigateFailed',
              requestId: cmd.requestId,
              url: cmd.url,
              error: formatErrorMessage(error),
              now: now(),
            });
          }
        );

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
          try {
            interpret(cmd);
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
