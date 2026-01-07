/**
 * @fileoverview Command Runtime Executor - Core Event Loop and Adapter Orchestration
 *
 * This module implements the command runtime that interprets and executes browser commands
 * in a single-threaded, event-driven architecture. It acts as the central hub that:
 *
 * **Purpose & Architecture**
 * - Maintains a RuntimeModel representing the application state
 * - Processes incoming events through a state machine (update function)
 * - Executes generated commands through browser API adapters (HTTP, storage, navigation, logging)
 * - Provides timeout and error recovery for asynchronous adapter operations
 * - Implements microtask-based queue draining for proper execution order
 *
 * **Design Pattern - Event-Driven Architecture**
 * ```
 * External Event → Queue → Drain (microtask) → Update Model
 *   ↓
 * Generate Commands → Interpret → Execute via Adapters
 *   ↓
 * Adapter Result → Dispatch Event → Re-queue
 * ```
 *
 * **Adapter Orchestration**
 * The runtime delegates to browser API adapters for:
 * - HTTP requests (GM_xmlhttpRequest or fetch)
 * - Storage operations (IndexedDB or GM storage)
 * - Navigation (window.open or location.assign)
 * - Logging (console or userscript logging)
 * - DOM queries (querySelectorAll with fallbacks)
 * - Timer scheduling (recursive setTimeout)
 *
 * **Key Design Principles**
 * 1. **No Runtime Crashes** - All adapter calls wrapped in try-catch; errors become events
 * 2. **Timeout Protection** - Every async adapter has configurable timeout (5s-15s default)
 * 3. **Queue Fairness** - Microtask scheduling ensures responsive event processing
 * 4. **Dependency Injection** - All adapters injectable for testing (DI pattern)
 * 5. **Closure-Scoped State** - Immutable handle returned; state private to closure
 *
 * **Error Handling Strategy**
 * - Synchronous errors: caught immediately, error events dispatched
 * - Async errors: timeouts trigger timeout events, rejections trigger error events
 * - Adapter crashes: logged and suppressed; runtime continues processing
 * - Update/interpret crashes: logged; event/command dropped, queue continues
 *
 * **Timing Guarantees**
 * - Events processed in order (FIFO queue)
 * - Commands for an event executed in order
 * - Microtask ensures no events can starve or cause stack overflow
 * - Timeout prevents stuck adapters from halting the runtime
 *
 * **Performance Characteristics**
 * - Event dispatch: O(1) - push to queue
 * - Queue drain: O(n) where n = events processed in batch
 * - Model update: O(1) - immutable state replacement
 * - Command interpret: O(1) - switch statement dispatch
 *
 * @remarks
 * The runtime is designed to survive adapter failures gracefully. If an adapter
 * times out, crashes, or rejects, the runtime continues processing the queue
 * without hanging. This is critical for userscript reliability on X.com.
 *
 * @example
 * Creating and running the runtime:
 * ```typescript
 * const runtime = startCommandRuntime({
 *   timeouts: {
 *     httpRequestMs: 20_000,
 *     storeGetMs: 5_000,
 *   },
 * });
 *
 * // Dispatch events from external sources
 * runtime.dispatch({ type: 'UserAction', action: 'toggleGallery' });
 *
 * // Inspect model state
 * const model = runtime.getModel();
 * console.log(model.galleryEnabled);
 *
 * // Cleanup
 * runtime.stop();
 * ```
 *
 * @example
 * Testing with injected adapters:
 * ```typescript
 * const mockLog = vi.fn();
 * const mockHttpRequest = vi.fn().mockResolvedValue({ status: 200, body: '{}' });
 *
 * const runtime = startCommandRuntime({
 *   adapters: {
 *     log: mockLog,
 *     httpRequest: mockHttpRequest,
 *   },
 * });
 *
 * runtime.dispatch({ type: 'FetchSettings' });
 * // After microtask:
 * expect(mockHttpRequest).toHaveBeenCalledWith({ url: '...' });
 * ```
 *
 * @see {@link CommandRuntimeHandle} - Return type with dispatch/stop/getModel
 * @see {@link CommandRuntimeDeps} - Configuration and dependency injection
 * @see {@link update} from '@core/update' - State machine that generates commands
 * @see {@link RuntimeCommand} from '@core/cmd' - Commands executed by adapters
 * @see {@link RuntimeEvent} from '@core/events' - Events dispatched by adapters
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
 * Handle returned by startCommandRuntime() for external event dispatch and lifecycle management.
 *
 * This is the public interface to the runtime closure. It provides three operations:
 * - **dispatch**: Queue an event for processing in the next microtask
 * - **stop**: Shutdown the runtime, cancel all timers and pending operations
 * - **getModel**: Inspect the current immutable application state
 *
 * @property dispatch - Queue a RuntimeEvent for processing. Returns immediately;
 *   event is processed in next microtask batch. Safe to call before runtime initialization.
 * @property stop - Shutdown the runtime. Cancels all pending timeouts, clears scheduler,
 *   drains queue. Prevents further event dispatch. Called automatically on userscript unload.
 * @property getModel - Synchronous accessor for RuntimeModel. Returns current model state
 *   reflecting all processed events and their command side effects.
 *
 * @example
 * ```typescript
 * const handle = startCommandRuntime();
 * handle.dispatch({ type: 'UserAction', action: 'toggleGallery' });
 * const currentState = handle.getModel();
 * handle.stop();  // cleanup
 * ```
 */
export interface CommandRuntimeHandle {
  dispatch(event: RuntimeEvent): void;
  stop(): void;
  getModel(): RuntimeModel;
}

/**
 * Dependency injection configuration for startCommandRuntime().
 *
 * Allows complete customization of the runtime environment through dependency injection.
 * Used for testing, timing control, and adapter mocking.
 *
 * **Default Behavior** (if not provided)
 * - `now`: Uses `Date.now()` for timestamps
 * - `getUrl`: Uses `window.location.href` (or '' if window undefined)
 * - Timeouts: 10s for storage, 15s for HTTP, 5s for navigation
 * - Adapters: Use production implementations (HTTP, logging, storage, etc.)
 * - Scheduler: Creates new TickScheduler instance
 *
 * **Testing Scenario**
 * ```typescript
 * startCommandRuntime({
 *   now: () => mockNow,
 *   adapters: {
 *     httpRequest: vi.fn().mockResolvedValue({ status: 200, body: '{}' }),
 *     storeGet: vi.fn().mockResolvedValue({ setting: true }),
 *     log: vi.fn(),
 *   },
 *   timeouts: {
 *     httpRequestMs: 100,  // Speed up tests
 *   },
 * });
 * ```
 *
 * @property now - Clock function for generating timestamps (milliseconds).
 *   Used for all Tick, HttpCompleted, StorageLoaded events.
 *   Default: `() => Date.now()`
 *
 * @property getUrl - URL retrieval function. Called at startup and on 'TAKE_DOM_FACTS'.
 *   Defaults to `window.location.href` or '' if window is undefined.
 *
 * @property timeouts - Operation timeout thresholds (milliseconds).
 *   - `storeGetMs`: Maximum time for STORE_GET adapter (default: 10000ms)
 *   - `storeSetMs`: Maximum time for STORE_SET adapter (default: 10000ms)
 *   - `httpRequestMs`: Maximum time for HTTP_REQUEST adapter (default: 15000ms)
 *   - `navigateMs`: Maximum time for NAVIGATE adapter (default: 5000ms)
 *
 * @property adapters - Replacement adapter implementations for testing.
 *   If an adapter is not provided, the default production implementation is used.
 *   - `log`: Production logger (logging levels, environment awareness)
 *   - `takeDomFacts`: DOM snapshot collector (overlay, media viewer detection)
 *   - `storeGet`: Async storage retrieval (returns Promise<unknown>)
 *   - `storeSet`: Async storage write (returns Promise<void>)
 *   - `httpRequest`: Async HTTP client (dual-transport, error detection)
 *   - `navigate`: Navigation executor (mode-based: assign or open)
 *   - `scheduler`: TickScheduler for interval-based commands (optional, creates new if omitted)
 *
 * @example
 * Customize only what's needed:
 * ```typescript
 * startCommandRuntime({
 *   timeouts: {
 *     httpRequestMs: 20_000,  // Increase HTTP timeout
 *   },
 *   adapters: {
 *     log: customLogger,  // Use custom logger
 *   },
 *   // All other deps use defaults
 * });
 * ```
 */
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

/**
 * Initializes and starts the command runtime event loop.
 *
 * Creates a closure-scoped event processor that:
 * 1. Accepts external RuntimeEvent objects via dispatch()
 * 2. Processes them through the state machine (update function)
 * 3. Executes generated commands through injected adapters
 * 4. Handles timeouts and errors gracefully
 * 5. Maintains an immutable RuntimeModel reflecting all changes
 *
 * **Initialization**
 * - Creates initial model state via createInitialModel()
 * - Emits 'Booted' event immediately with current URL
 * - Returns CommandRuntimeHandle for external interaction
 *
 * **Event Processing (Microtask Queue)**
 * ```
 * dispatch(event) → queue.push(event)
 *   ↓ (if not processing)
 * scheduleProcess() → queueMicrotask(processQueue)
 *   ↓ (after current task completes)
 * processQueue() → while (queue.length > 0)
 *   - event = queue.shift()
 *   - { model, cmds } = update(model, event)
 *   - For each cmd: interpret(cmd) → execute adapter
 *   - Adapter result → dispatch event → re-queue
 * ```
 *
 * **Command Execution Model**
 * Each RuntimeCommand is dispatched through interpret(), which:
 * - Validates command type with switch statement
 * - Calls appropriate adapter(s)
 * - Wraps async adapters with timeout protection
 * - Catches and logs errors without crashing
 * - Dispatches result events back into queue
 *
 * **Timeout Protection**
 * Every async adapter call (HTTP, storage, navigation) has a configurable
 * timeout. If not settled within timeout, a timeout event is dispatched.
 * This prevents stuck adapters from starving the event loop.
 *
 * **Closure-Scoped State**
 * The following state is private to the closure and accessible only through
 * the returned handle:
 * - `model`: RuntimeModel reflecting all processed events
 * - `queue`: FIFO queue of pending events
 * - `processing`: Flag preventing concurrent queue drains
 * - `timeoutTimers`: Set of active timeout timers (for cleanup)
 *
 * **Error Recovery Strategy**
 * | Error Type | Location | Handling |
 * |---|---|---|
 * | Synchronous | takeDomFacts, SCHEDULE_TICK | caught, error event dispatched |
 * | Async timeout | runWithTimeout | timeout event dispatched |
 * | Async rejection | runWithTimeout | error event dispatched |
 * | update() crash | processQueue | logged, event dropped, queue continues |
 * | interpret() crash | processQueue | logged, command dropped, queue continues |
 * | log adapter crash | safeRuntimeLog | silently ignored |
 *
 * **Performance Notes**
 * - O(1) event dispatch (push to queue)
 * - O(n) queue drain per batch (n = events processed)
 * - Microtask ensures no stack overflow from recursive dispatch
 * - Timeout timers cleaned up on stop()
 *
 * @param deps - Optional dependency injection configuration
 * @returns CommandRuntimeHandle with dispatch(), stop(), and getModel() methods
 *
 * @throws Never - All errors caught and converted to events or logged
 *
 * @example
 * **Basic Usage**
 * ```typescript
 * const handle = startCommandRuntime();
 *
 * // External code dispatches events
 * handle.dispatch({ type: 'UserAction', action: 'openGallery' });
 * handle.dispatch({ type: 'UserAction', action: 'nextImage' });
 *
 * // Adapters execute, generate more events, all process in microtask batches
 *
 * // Inspect state
 * const model = handle.getModel();
 * console.log(model.galleryVisible);
 *
 * // Cleanup on unload
 * handle.stop();
 * ```
 *
 * @example
 * **Testing with Mocks**
 * ```typescript
 * const mockHttpRequest = vi.fn()
 *   .mockResolvedValueOnce({ status: 200, body: '{"enabled":true}' })
 *   .mockRejectedValueOnce(new Error('Network error'));
 *
 * const runtime = startCommandRuntime({
 *   adapters: { httpRequest: mockHttpRequest },
 *   timeouts: { httpRequestMs: 100 },
 * });
 *
 * runtime.dispatch({ type: 'FetchSettings' });
 * // Microtask processes: generates HTTP_REQUEST → adapter called → event dispatched
 *
 * expect(mockHttpRequest).toHaveBeenCalledWith({
 *   url: 'https://x.com/api/settings',
 *   method: 'GET',
 *   responseType: 'json',
 * });
 * ```
 *
 * @example
 * **Timeout Scenario**
 * ```typescript
 * const slowAdapter = () => new Promise(() => {
 *   // Never resolves
 * });
 *
 * const runtime = startCommandRuntime({
 *   adapters: { httpRequest: slowAdapter },
 *   timeouts: { httpRequestMs: 100 },
 * });
 *
 * runtime.dispatch({ type: 'FetchUserData' });
 * // After 100ms timeout triggers HttpFailed event
 * // Runtime continues processing other events
 * ```
 *
 * @see {@link CommandRuntimeHandle} - Return type
 * @see {@link CommandRuntimeDeps} - Configuration options
 * @see {@link RuntimeCommand} from '@core/cmd' - Command types
 * @see {@link RuntimeEvent} from '@core/events' - Event types
 * @see {@link RuntimeModel} from '@core/model' - State model
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
   *
   * Returns null if timeoutMs <= 0 (skips timeout, useful for config-driven tests).
   * Callback is wrapped to auto-unregister from timeoutTimers set.
   *
   * **Timeout Management**
   * All timeouts created by runWithTimeout() are registered in timeoutTimers set.
   * On stop(), all timers are cleared by the returned handle. This prevents
   * abandoned timers from firing after runtime shutdown.
   *
   * @param timeoutMs - Timeout duration in milliseconds. Returns null if <= 0.
   * @param onTimeout - Callback invoked if timeout fires
   * @returns Timer ID (for cleanup) or null if timeout disabled
   *
   * @remarks
   * Uses globalTimerManager.setTimeout instead of native setTimeout
   * to support userscript context and allow injection of test timers.
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
   *
   * **Why Error Suppression?**
   * The logger must never crash the runtime. If the injected log adapter throws,
   * silently ignore it. The runtime continues processing events normally.
   * This is defensive because the log adapter is external and could fail.
   *
   * **Usage**
   * Used for logging command interpretation errors, update crashes, and
   * invalid operations (e.g., SCHEDULE_TICK with bad parameters).
   *
   * @param level - Log level (matches RuntimeLog signature: 'error', 'warn', 'info', 'debug')
   * @param message - Human-readable message (e.g., '[command-runtime] error occurred')
   * @param context - Optional contextual data (command type, error, etc.)
   *
   * @remarks
   * Never throws. Errors in runtimeLog() are caught and ignored.
   *
   * @example
   * ```typescript
   * safeRuntimeLog('error', '[command-runtime] interpret() threw', {
   *   cmdType: cmd.type,
   *   error: formatErrorMessage(error),
   * });
   * ```
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
   *
   * Uses native queueMicrotask() if available; falls back to Promise.then()
   * for older environments. This ensures proper task ordering and prevents
   * stack overflow from deeply nested event processing.
   *
   * **Microtask Priority**
   * Microtasks run AFTER current task but BEFORE next macrotask (setTimeout, etc).
   * This allows all synchronously enqueued events to be batched together,
   * improving efficiency and preventing starvation of event handlers.
   *
   * **Task Flow**
   * ```
   * User clicks button
   *   → dispatch(event) queues event
   *   → scheduleMicrotask(processQueue)
   * (current task ends)
   * (microtask phase)
   *   → processQueue() drains entire event queue
   *   → adapters execute, generate more events
   *   → nested dispatch() calls add to same batch
   *   → eventually processQueue completes
   * (macrotask phase)
   *   → setTimeout, I/O, etc.
   * ```
   *
   * @param fn - Function to schedule for microtask execution
   *
   * @remarks
   * Fallback to Promise.then() uses `void Promise.resolve()` to suppress
   * unhandled rejection warnings.
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
   *
   * Used internally by dispatch() and processQueue() to ensure the event queue
   * is always drained. Prevents duplicate scheduling (drainScheduled guard).
   *
   * **Guard Against Redundant Scheduling**
   * - If already scheduled (drainScheduled = true), return immediately
   * - If runtime stopped, return immediately
   * - Otherwise, set drainScheduled = true, schedule processQueue via microtask
   *
   * **When Used**
   * 1. From dispatch() when not currently processing (initial queue drain)
   * 2. From dispatch() when processing (nested events during batch)
   * 3. From processQueue() finally block if queue refilled during drain
   *
   * @remarks
   * The drainScheduled flag prevents scheduling multiple microtasks for
   * a single queue drain cycle. Multiple dispatch() calls during processing
   * all accumulate in the same batch.
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
   *
   * **Race Pattern**
   * ```
   * Promise.race([
   *   run().then(onSuccess, onError),
   *   timeout after N ms → onTimeout
   * ])
   * ```
   *
   * **Settled-Once Guarantee**
   * Only one of onTimeout, onSuccess, onError is ever called. Using a `settled`
   * flag prevents double-settlement if both timeout and promise settle.
   *
   * **Timeout Timer Cleanup**
   * When operation settles (success/error/timeout), the timeout timer is
   * cleared via globalTimerManager.clearTimeout() and removed from timeoutTimers.
   *
   * **Error Handling**
   * - Synchronous throw in run(): caught immediately, onError called
   * - Promise rejection: onError called via promise.catch()
   * - Timeout: onTimeout called after N milliseconds
   *
   * **Type Parameter**
   * T is the return type of the async operation. Adapters return:
   * - HTTP: { status: number, body: string }
   * - Storage: unknown (JSON value or void)
   * - Navigation: void
   * - DomFacts: DomFacts
   *
   * @param timeoutMs - Timeout threshold in milliseconds
   * @param run - Sync or async function returning operation result
   * @param onTimeout - Callback if operation doesn't settle within timeoutMs
   * @param onSuccess - Callback with operation result on success
   * @param onError - Callback with Error on rejection or sync throw
   *
   * @remarks
   * Normalizes return values to Promise via Promise.resolve(run()).
   * This allows both sync and async adapters to be called uniformly.
   *
   * @example
   * HTTP request with 15s timeout:
   * ```typescript
   * runWithTimeout(
   *   httpRequestTimeoutMs,
   *   () => runtimeHttpRequest({ url, method, ... }),
   *   () => dispatch({ type: 'HttpFailed', ..., error: 'Timeout' }),
   *   (result) => dispatch({ type: 'HttpCompleted', ..., status: result.status }),
   *   (error) => dispatch({ type: 'HttpFailed', ..., error: formatErrorMessage(error) })
   * );
   * ```
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
   * Public API: Queues a RuntimeEvent for processing.
   *
   * Pushes the event to the queue and schedules a drain if not already processing.
   * Returns immediately; event is processed in the next microtask.
   *
   * **Queue Management**
   * - Ignored if runtime is stopped (stopped flag prevents queuing)
   * - If processing is false: schedules a drain via requestDrain()
   * - If processing is true: just queues event (drain already scheduled)
   *
   * **Event Ordering**
   * Events are processed FIFO. All events queued during a batch are
   * processed in the same microtask drain. External events and adapter
   * result events interleave correctly due to dispatch() being called
   * from within interpret() → processQueue() context.
   *
   * **Typical Usage**
   * - External: User action, timer tick, message event
   * - Internal: Adapter result (HttpCompleted, StorageLoaded, etc.)
   *
   * @param event - RuntimeEvent to queue (type is discriminated by string literal)
   *
   * @remarks
   * This function is synchronous and never throws. Safe to call at any time,
   * even during initialization or shutdown (stopped events are no-ops).
   *
   * @example
   * ```typescript
   * handle.dispatch({ type: 'UserAction', action: 'toggleGallery' });
   * // Event queued immediately
   * // Processed in next microtask: update() → generate commands → interpret() → adapters
   * ```
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
   * Interprets and executes a RuntimeCommand by dispatching to the appropriate adapter.
   *
   * This is the command execution dispatcher. It switches on command.type and:
   * 1. Validates command structure
   * 2. Calls the appropriate adapter(s)
   * 3. Wraps async adapters with runWithTimeout
   * 4. Dispatches result/error events on completion
   *
   * **Command Types & Adapters**
   *
   * | Command | Adapter | Timeout | Result Event |
   * |---------|---------|---------|---|
   * | LOG | safeRuntimeLog | - | (side effect only) |
   * | TAKE_DOM_FACTS | runtimeTakeDomFacts | - | DomFactsReady or DomFactsFailed |
   * | STORE_GET | runtimeStoreGet | 10s | StorageLoaded or StorageFailed |
   * | STORE_SET | runtimeStoreSet | 10s | StorageSetCompleted or StorageSetFailed |
   * | HTTP_REQUEST | runtimeHttpRequest | 15s | HttpCompleted or HttpFailed |
   * | NAVIGATE | runtimeNavigate | 5s | NavigateCompleted or NavigateFailed |
   * | SCHEDULE_TICK | scheduler.schedule() | - | Tick (periodic events) |
   * | CANCEL_TICK | scheduler.cancel() | - | (side effect only) |
   *
   * **Synchronous Commands** (LOG, TAKE_DOM_FACTS, SCHEDULE_TICK, CANCEL_TICK)
   * Executed inline. Errors caught and logged. No result events (except TAKE_DOM_FACTS).
   *
   * **Asynchronous Commands** (STORE_GET, STORE_SET, HTTP_REQUEST, NAVIGATE)
   * Wrapped in runWithTimeout() to handle:
   * - Timeout after N milliseconds
   * - Promise rejection on adapter error
   * - Success path with result dispatch
   *
   * **Error Propagation**
   * - Synchronous errors: caught, logged, appropriate error event dispatched
   * - Async errors: timeout or rejection → error event dispatched
   * - No error crashes the interpret() function
   *
   * **Immutability**
   * Commands are processed once per event cycle. No command is reexecuted.
   * If a command fails, no retry happens (application state machine decides retry).
   *
   * @param cmd - RuntimeCommand with discriminated type property
   *
   * @remarks
   * Called from processQueue() for each command in result.cmds array.
   * interpret() itself cannot throw; errors are logged and converted to events.
   *
   * @example
   * Interpret STORE_GET with timeout protection:
   * ```typescript
   * // cmd = { type: 'STORE_GET', requestId: 'req123', key: 'gallery.settings' }
   * runWithTimeout(
   *   storeGetTimeoutMs,  // 10s
   *   () => runtimeStoreGet(cmd.key),
   *   () => dispatch({ type: 'StorageFailed', error: 'Timeout', ... }),
   *   (value) => dispatch({ type: 'StorageLoaded', value, ... }),
   *   (error) => dispatch({ type: 'StorageFailed', error: formatErrorMessage(error), ... })
   * );
   * ```
   *
   * @example
   * Interpret SCHEDULE_TICK (sync, error recovery):
   * ```typescript
   * // cmd = { type: 'SCHEDULE_TICK', id: 'ticker-1', intervalMs: 5000 }
   * try {
   *   scheduler.schedule(cmd.id, cmd.intervalMs, () => {
   *     dispatch({ type: 'Tick', tickId: cmd.id, now: now() });
   *   });
   * } catch (error) {
   *   safeRuntimeLog('error', '[command-runtime] SCHEDULE_TICK failed', {
   *     id: cmd.id,
   *     error: formatErrorMessage(error),
   *   });
   *   // No event dispatched; scheduler error is logged but doesn't crash
   * }
   * ```
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
   *
   * This is the main event loop. Called via microtask scheduling from dispatch().
   * Drains the entire queue FIFO, updating model and executing commands.
   *
   * **Processing Algorithm**
   * ```
   * while (queue.length > 0 && !stopped):
   *   event = queue.shift()
   *   { model, cmds } = update(model, event)
   *   for each cmd in cmds:
   *     interpret(cmd)  // may dispatch events → queue.push
   * ```
   *
   * **State Management**
   * - model: immutable state, replaced each iteration
   * - queue: FIFO event queue, events added by dispatch()
   * - processing: flag prevents concurrent drains (required for proper ordering)
   * - stopped: if true, processing stops, queue abandoned
   *
   * **Error Recovery**
   * Two error boundaries protect queue processing:
   *
   * 1. **update() error** (state machine crash)
   *    - Logged with event type and error
   *    - Event dropped (not retried)
   *    - Queue continues processing
   *
   * 2. **interpret() error** (command execution crash)
   *    - Logged with command type and error
   *    - Command dropped (no result event dispatched)
   *    - Next command processed
   *
   * This prevents a single bad event or command from halting the entire runtime.
   *
   * **Fairness & Starvation Prevention**
   * - Microtask scheduling ensures events don't starve DOM updates
   * - Queue draining in single pass ensures O(n) amortized dispatch time
   * - Timeout protection on adapters prevents indefinite waits
   *
   * **Finally Block: Queue Re-drain**
   * If queue filled during processing (e.g., from adapter callbacks), request
   * another drain after processing = false. This ensures queued events aren't
   * lost if they arrive between drain cycles.
   *
   * @returns Promise<void> - Always resolves (never rejects)
   *
   * @remarks
   * - Async function allows microtask scheduling to work correctly
   * - Must set processing = true before any awaits to prevent concurrent drains
   * - Must restore processing = false in finally to allow future drains
   *
   * @example
   * **Single batch processing**
   * ```
   * Initial state:
   *   queue = [event1, event2, event3]
   *   processing = false
   *
   * dispatch(event1) called:
   *   queue.push(event1)
   *   processing = false → requestDrain() → scheduleMicrotask(processQueue)
   *
   * (microtask arrives)
   *
   * processQueue() called:
   *   processing = true
   *   - event1 → update → [cmd1, cmd2] → interpret each
   *     - interpret(cmd1) → adapter → dispatch(eventA) → queue.push(eventA)
   *     - interpret(cmd2) → adapter → (no event)
   *   - event2 → update → [cmd3] → interpret
   *     - interpret(cmd3) → adapter → dispatch(eventB) → queue.push(eventB)
   *   - event3 → update → [] → (no commands)
   *   - eventA → update → [...] → interpret each
   *   - eventB → update → [...] → interpret each
   *   (continue until queue empty)
   *   processing = false
   *
   * All events and generated events processed in single microtask batch.
   * ```
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
