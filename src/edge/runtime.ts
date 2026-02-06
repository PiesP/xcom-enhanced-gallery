/**
 * @fileoverview Command Runtime Executor - Core event loop for application state.
 * Implements event-driven state machine with adapter orchestration for HTTP, storage,
 * navigation, and logging. Handles timeouts and errors gracefully via microtask queue.
 * @module edge/runtime
 */

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

/**
 * Public interface to the command runtime for event dispatch and lifecycle management.
 * Provides dispatch (queue event), stop (shutdown), and getModel (inspect state).
 * @property dispatch - Queue a RuntimeEvent for processing in next microtask batch.
 * @property stop - Shutdown runtime, cancel timers and pending operations.
 * @property getModel - Synchronous accessor returning current immutable RuntimeModel.
 */
export interface CommandRuntimeHandle {
  dispatch(event: RuntimeEvent): void;
  stop(): void;
  getModel(): RuntimeModel;
}

/**
 * Dependency injection configuration for startCommandRuntime().
 * Allows customization of runtime environment, adapters, and timeouts for testing.
 * All properties optional; production defaults used if not provided.
 * @property now - Clock function returning milliseconds (default: Date.now).
 * @property getUrl - URL retrieval function (default: window.location.href or '').
 * @property timeouts - Operation timeout thresholds in ms (default: 10s store, 15s HTTP, 5s nav).
 * @property adapters - Replacement adapter implementations for testing and customization.
 */
interface CommandRuntimeDeps {
  now?: () => number;
  getUrl?: () => string;
  timeouts?: {
    /** Max time to wait for STORE_GET before failing (ms). */
    storeGetMs?: number;
    /** Max time to wait for STORE_SET before failing (ms). */
    storeSetMs?: number;
    /** Max time to wait for HTTP_REQUEST before failing (ms). */
    httpRequestMs?: number;
    /** Max time to wait for NAVIGATE before failing (ms). */
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

/**
 * Initializes and starts the command runtime event loop.
 * Creates closure-scoped event processor: receives events via dispatch(), processes through
 * state machine (update), executes commands via adapters, handles timeouts and errors.
 * Returns immutable handle for event dispatch, model inspection, and lifecycle management.
 * @param deps - Optional DI configuration for adapters, timeouts, and clocks.
 * @returns CommandRuntimeHandle with dispatch(), stop(), and getModel() methods.
 * @throws Never - All errors caught and converted to events or logged.
 */
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

  /**
   * Schedules a timeout callback with automatic tracking and cleanup.
   * Returns null if timeoutMs is less than or equal to 0 (skips timeout for config-driven tests).
   * Callback auto-unregisters from timeoutTimers set on firing.
   * @param timeoutMs - Timeout duration in ms. Returns null if less than or equal to 0.
   * @param onTimeout - Callback invoked if timeout fires.
   * @returns Timer ID for cleanup, or null if timeout disabled.
   */
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

  /**
   * Safely invokes the runtime logger, catching and suppressing any errors.
   * Logger must never crash the runtime; any errors silently ignored.
   * @param level - Log level ('error', 'warn', 'info', 'debug').
   * @param message - Human-readable message (e.g., '[command-runtime] error occurred').
   * @param context - Optional contextual data (command type, error, etc.).
   */
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

  /**
   * Schedules a function to execute in the next microtask phase.
  /**
   * Schedules a function to execute in the next microtask phase.
   * Uses queueMicrotask() if available; falls back to Promise.then().
   * Ensures proper task ordering and prevents stack overflow from nested processing.
   * @param fn - Function to schedule for microtask execution.
   */
  const scheduleMicrotask = (fn: () => void): void => {
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(fn);
    } else {
      void Promise.resolve().then(fn);
    }
  };

  /**
   * Schedules a queue drain if not already scheduled and runtime not stopped.
   * Prevents duplicate scheduling; multiple dispatch() calls batch in same microtask.
   * @remarks Uses drainScheduled flag to guard against redundant scheduling.
   */
  const requestDrain = (): void => {
    if (stopped || drainScheduled) return;
    drainScheduled = true;
    scheduleMicrotask(() => {
      drainScheduled = false;
      void processQueue();
    });
  };

  /**
   * Executes an async operation with timeout protection and settled-once guarantee.
   * Ensures only one of onTimeout, onSuccess, onError is called (never duplicates).
   * Cleans up timeout timer on settlement.
   * @typeParam T - Return type of the async operation.
   * @param timeoutMs - Timeout duration in ms.
   * @param run - Async operation to execute (returns Promise<T> or T).
   * @param onTimeout - Called if timeout fires.
   * @param onSuccess - Called with value if operation succeeds.
   * @param onError - Called with error if operation fails or timeout fires.
   */
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

  /**
   * Queues a RuntimeEvent for processing in the next microtask.
   * Returns immediately; event processed asynchronously. Ignored if runtime stopped.
   * @param event - RuntimeEvent to queue for processing.
   */
  const dispatch = (event: RuntimeEvent): void => {
    if (stopped) return;
    queue.push(event);
    if (processing) {
      requestDrain();
    } else {
      void processQueue();
    }
  };

  /**
  /**
   * Interprets and executes a RuntimeCommand by dispatching to the appropriate adapter.
   * Validates command type and calls corresponding adapter(s) with timeout protection.
   * Dispatches result or error events; errors logged but never crash interpret().
   * @param cmd - RuntimeCommand with discriminated type property.
   */
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

  /**
   * Processes all queued events in a single batch via the state machine.
   * Drains entire queue FIFO, updating model and executing commands. Errors logged,
   * events dropped on crash, queue continues. Finally block re-drains if queue refilled.
   * @returns Promise<void> - Always resolves (never rejects).
   */
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
    /**
     * Shuts down the runtime and cleans up all resources.
     *
     * Called on userscript unload or when runtime should stop accepting events.
     * Performs complete cleanup:
     *
     * 1. **Set stopped flag**: Prevents dispatch() from queuing new events
     * 2. **Clear timeout timers**: Cancel all pending timeout timers (HTTP, storage, etc.)
     * 3. **Cancel scheduler jobs**: Stop all periodic tick jobs
     * 4. **Drain queue**: Clear any pending events (not processed)
     *
     * **Post-Stop State**
     * - Any call to dispatch() after stop() is silently ignored
     * - getModel() still works (returns final model state)
     * - No timers or jobs will fire
     *
     * **Timing**
     * Called from userscript global cleanup or feature disable:
     * ```typescript
     * GM_addValueChangeListener('script.enabled', (_, __, newVal) => {
     *   if (!newVal) {
     *     runtime.stop();  // disable
     *   }
     * });
     * ```
     *
     * @remarks
     * Safe to call multiple times (idempotent). Idempotence achieved by:
     * - stopped flag prevents re-processing
     * - timeoutTimers.clear() safe on empty set
     * - scheduler.cancelAll() safe if already cancelled
     *
     * @example
     * ```typescript
     * const runtime = startCommandRuntime();
     *
     * // Use runtime...
     * runtime.dispatch({ type: 'UserAction', ... });
     *
     * // Cleanup
     * window.addEventListener('beforeunload', () => {
     *   runtime.stop();
     * });
     * ```
     */
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
