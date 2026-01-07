/**
 * @fileoverview Model-View-Update (MVU) state transition logic
 *
 * ## Purpose
 * Implements the Update function in the MVU architecture pattern. Takes current model state and
 * runtime event, produces new model state and side-effect commands. This is the core state
 * management logic for the command-runtime effect system.
 *
 * ## Key Responsibilities
 * - **State Transitions**: Pure function transforming (Model, Event) → (Model, Commands)
 * - **Request Tracking**: Manage in-flight request lifecycle (start, complete, fail)
 * - **Side Effects**: Emit commands for I/O operations (HTTP, storage, DOM, logging)
 * - **Request Correlation**: Generate and track requestIds for async operations
 * - **Error Handling**: Handle failure events and emit appropriate error commands
 *
 * ## MVU Architecture
 * Model-View-Update pattern separates concerns:
 * 1. **Model** (state): Immutable data structure representing application state
 * 2. **View** (UI): Pure function rendering model to UI (not in this file)
 * 3. **Update** (logic): Pure function applying events to model, emitting commands
 *
 * Flow:
 * ```
 * Event → update(model, event) → {newModel, commands}
 *                                         ↓
 *                                    Runtime executes commands
 *                                         ↓
 *                                    Emits new events
 *                                         ↓
 *                                    Loop continues...
 * ```
 *
 * ## State Transition Pattern
 * All state transitions follow immutable update pattern:
 * ```typescript
 * // ✅ Correct: Immutable update
 * const newModel: RuntimeModel = {
 *   ...oldModel,
 *   requestSeq: oldModel.requestSeq + 1,
 *   inFlight: {
 *     ...oldModel.inFlight,
 *     [requestId]: { purpose: 'httpRequest', startedAt: now },
 *   },
 * };
 *
 * // ❌ Wrong: Mutable update
 * oldModel.requestSeq++;
 * oldModel.inFlight[requestId] = { ... };
 * ```
 *
 * ## Request Lifecycle Management
 * Async operations follow request-response lifecycle:
 * 1. **Initiation**: Event triggers request, update adds to inFlight map
 * 2. **Tracking**: RequestId stored in inFlight with metadata (purpose, timestamp)
 * 3. **Completion**: Success/failure event removes from inFlight, updates cache
 * 4. **Timeout**: Stale requests detected by comparing startedAt with current time
 *
 * Example lifecycle:
 * ```typescript
 * // Step 1: HttpRequested event
 * update(model, { type: 'HttpRequested', url, method, responseType, now })
 *   → model.inFlight['http:123'] = { purpose: 'httpRequest', startedAt: now }
 *   → emit HTTP_REQUEST command
 *
 * // Step 2: HttpCompleted event
 * update(model, { type: 'HttpCompleted', requestId: 'http:123', status, body, now })
 *   → remove model.inFlight['http:123']
 *   → add model.cache['http:123'] = { url, status, body, completedAt: now }
 *   → emit LOG command
 * ```
 *
 * ## Command Emission
 * Update function emits commands as side effects:
 * - **HTTP_REQUEST**: Network requests
 * - **STORE_GET / STORE_SET**: Persistent storage operations
 * - **TAKE_DOM_FACTS**: DOM inspection
 * - **NAVIGATE**: URL navigation
 * - **SCHEDULE_TICK**: Periodic tasks
 * - **LOG**: Logging and debugging
 *
 * Commands are pure data structures, runtime adapters execute them.
 *
 * ## Event Handling Strategy
 * Each event type has dedicated handler in switch statement:
 * - **Success events**: Update cache, clear in-flight, emit success log
 * - **Failure events**: Clear in-flight, emit error log with context
 * - **Initiation events**: Add in-flight, emit corresponding command
 * - **Lifecycle events**: Initialize services, start timers
 *
 * ## Design Principles
 * 1. **Purity**: No side effects, deterministic output for given input
 * 2. **Immutability**: All updates create new model instances
 * 3. **Separation**: Logic separated from I/O (commands handle I/O)
 * 4. **Testability**: Pure functions easy to test (no mocks needed)
 * 5. **Predictability**: State transitions explicitly defined
 *
 * ## Testing Strategy
 * Pure functions enable straightforward testing:
 * ```typescript
 * describe('update', () => {
 *   it('should handle HttpCompleted', () => {
 *     const model = createInitialModel();
 *     const event: RuntimeEvent = {
 *       type: 'HttpCompleted',
 *       requestId: 'http:123',
 *       url: 'https://api.example.com/data',
 *       status: 200,
 *       body: { data: 'test' },
 *       now: Date.now(),
 *     };
 *
 *     const result = update(model, event);
 *
 *     expect(result.model.inFlight['http:123']).toBeUndefined();
 *     expect(result.model.cache['http:123']).toBeDefined();
 *     expect(result.cmds).toHaveLength(1);
 *     expect(result.cmds[0].type).toBe('LOG');
 *   });
 * });
 * ```
 *
 * @module core/update
 * @see {@link update} for main state transition function
 * @see {@link UpdateResult} for function return type
 * @see {@link module:core/model} for model state structure
 * @see {@link module:core/events} for event types
 * @see {@link module:core/cmd} for command types
 */

import { APP_SETTINGS_STORAGE_KEY } from '@constants/storage';
import type { RuntimeCommand } from '@core/cmd';
import type { RuntimeEvent } from '@core/events';
import type { RuntimeModel } from '@core/model';
import { COMMAND_RUNTIME_DEFAULT_TICK_MS, COMMAND_RUNTIME_STORAGE_KEY } from '@core/policy';

/**
 * Result of update function containing new model and commands to execute
 *
 * @remarks
 * Update function return type following MVU pattern. Contains both the new immutable model
 * state and an array of commands to execute as side effects. Runtime consumes these commands
 * and executes them, emitting new events that feed back into update function.
 *
 * ## Fields
 *
 * ### model
 * New immutable model state after applying the event. This becomes the current model for
 * the next update cycle. Always a new instance (object spread creates new reference).
 *
 * ### cmds
 * Array of commands to execute as side effects. Commands are pure data structures describing
 * operations to perform:
 * - HTTP requests (network I/O)
 * - Storage operations (persistence)
 * - DOM inspection (page state)
 * - Navigation (URL changes)
 * - Logging (debugging/monitoring)
 * - Timers (scheduled tasks)
 *
 * Commands are executed by runtime adapters outside the update function, preserving purity.
 *
 * ## Immutability Contract
 * Both fields must be immutable:
 * - `model`: New instance created via spread syntax
 * - `cmds`: Readonly array, no mutations allowed
 *
 * Runtime must not modify returned values. To add commands, create new array.
 *
 * @example
 * ```typescript
 * // Simple update with no commands
 * const result: UpdateResult = {
 *   model: { ...oldModel, url: newUrl },
 *   cmds: [],
 * };
 *
 * // Update with single command
 * const result: UpdateResult = {
 *   model: updatedModel,
 *   cmds: [{ type: 'LOG', level: 'info', message: 'State updated' }],
 * };
 *
 * // Update with multiple commands
 * const result: UpdateResult = {
 *   model: newModel,
 *   cmds: [
 *     { type: 'STORE_SET', requestId: 'set:1', key: 'state', value: state },
 *     { type: 'LOG', level: 'debug', message: 'Saved state' },
 *   ],
 * };
 *
 * // Consume result in runtime
 * function processUpdate(result: UpdateResult): void {
 *   // Update current model reference
 *   currentModel = result.model;
 *
 *   // Execute all commands
 *   for (const cmd of result.cmds) {
 *     executeCommand(cmd);
 *   }
 * }
 * ```
 *
 * @see {@link update} for function that produces UpdateResult
 * @see {@link RuntimeModel} for model structure
 * @see {@link RuntimeCommand} for command types
 */
interface UpdateResult {
  /** New model state after applying event */
  readonly model: RuntimeModel;
  /** Commands to execute as side effects */
  readonly cmds: readonly RuntimeCommand[];
}

/**
 * Type for in-flight request purpose discriminator
 *
 * @remarks
 * Categorizes the type of async operation being tracked. Determines which event types
 * should clear the in-flight entry and how to handle timeouts/failures.
 *
 * ## Values
 * - `'domFacts'`: DOM fact extraction request (TAKE_DOM_FACTS command)
 * - `'storageGet'`: Storage read request (STORE_GET command)
 * - `'storageSet'`: Storage write request (STORE_SET command)
 * - `'httpRequest'`: HTTP network request (HTTP_REQUEST command)
 * - `'navigate'`: Navigation request (NAVIGATE command)
 *
 * ## Usage
 * Used when adding entries to `model.inFlight` to track async operations:
 * ```typescript
 * const model: RuntimeModel = {
 *   ...oldModel,
 *   inFlight: {
 *     ...oldModel.inFlight,
 *     [requestId]: {
 *       purpose: 'httpRequest', // InFlightPurpose
 *       startedAt: Date.now(),
 *     },
 *   },
 * };
 * ```
 *
 * ## Event Correlation
 * Purpose determines which events clear the in-flight entry:
 * - `'domFacts'` → DomFactsReady or DomFactsFailed
 * - `'storageGet'` → StorageLoaded or StorageFailed
 * - `'storageSet'` → StorageSetCompleted or StorageSetFailed
 * - `'httpRequest'` → HttpCompleted or HttpFailed
 * - `'navigate'` → NavigateCompleted or NavigateFailed
 *
 * @example
 * ```typescript
 * // Track HTTP request
 * const purpose: InFlightPurpose = 'httpRequest';
 * const inFlight: Record<string, InFlightRequest> = {
 *   'http:123': { purpose, startedAt: Date.now() },
 * };
 *
 * // Filter by purpose
 * function getRequestsByPurpose(
 *   model: RuntimeModel,
 *   purpose: InFlightPurpose
 * ): string[] {
 *   return Object.entries(model.inFlight)
 *     .filter(([_, req]) => req.purpose === purpose)
 *     .map(([requestId, _]) => requestId);
 * }
 * ```
 *
 * @see {@link trackInFlight} for adding in-flight requests
 * @see {@link clearInFlight} for removing completed requests
 */
type InFlightPurpose = 'domFacts' | 'storageGet' | 'storageSet' | 'httpRequest' | 'navigate';

/**
 * Generate new requestId and increment request sequence number
 *
 * @remarks
 * Helper function for creating unique request identifiers. Combines a prefix (describing
 * the request type) with the current sequence number, then increments the sequence for
 * the next request.
 *
 * ## Request ID Format
 * Format: `${prefix}:${sequenceNumber}`
 * - **prefix**: Request type identifier (e.g., 'http', 'domFacts', 'storeGet')
 * - **sequenceNumber**: Monotonically increasing counter from model.requestSeq
 *
 * Examples:
 * - `http:0`, `http:1`, `http:2` (HTTP requests)
 * - `domFacts:0`, `domFacts:1` (DOM fact extractions)
 * - `storeGet:0`, `storeSet:1` (Storage operations)
 *
 * ## Sequence Number Guarantees
 * - **Uniqueness**: Never repeats (monotonic increase)
 * - **Ordering**: Lower number = earlier request
 * - **Persistence**: Sequence continues across page loads (if persisted)
 *
 * ## Return Value
 * Returns tuple `[newModel, requestId]`:
 * 1. **newModel**: Updated model with incremented requestSeq
 * 2. **requestId**: Generated unique identifier for this request
 *
 * @param model - Current model state
 * @param prefix - Request type prefix for ID
 * @returns Tuple of [updated model, generated requestId]
 *
 * @example
 * ```typescript
 * // Generate HTTP request ID
 * const [m1, httpId] = withRequestId(model, 'http');
 * console.log(httpId); // 'http:0'
 * console.log(m1.requestSeq); // 1 (incremented)
 *
 * // Chain multiple IDs
 * const [m1, id1] = withRequestId(model, 'domFacts');   // 'domFacts:0'
 * const [m2, id2] = withRequestId(m1, 'storeGet');      // 'storeGet:1'
 * const [m3, id3] = withRequestId(m2, 'http');          // 'http:2'
 *
 * // Use in update logic
 * function handleHttpRequest(model: RuntimeModel): UpdateResult {
 *   const [newModel, requestId] = withRequestId(model, 'http');
 *
 *   return {
 *     model: trackInFlight(newModel, requestId, 'httpRequest', Date.now()),
 *     cmds: [{ type: 'HTTP_REQUEST', requestId, url: '...', ... }],
 *   };
 * }
 * ```
 *
 * @see {@link RuntimeModel.requestSeq} for sequence number field
 * @see {@link enqueueTracked} for higher-level request tracking
 */
function withRequestId(model: RuntimeModel, prefix: string): readonly [RuntimeModel, string] {
  const id = `${prefix}:${model.requestSeq}`;
  return [{ ...model, requestSeq: model.requestSeq + 1 }, id] as const;
}

/**
 * Add in-flight request entry to model
 *
 * @remarks
 * Marks an async operation as in-flight by adding entry to `model.inFlight` map.
 * Tracked requests can be correlated with completion events, checked for timeouts,
 * and prevented from duplicate submission.
 *
 * ## In-Flight Map Structure
 * ```typescript
 * {
 *   'http:123': { purpose: 'httpRequest', startedAt: 1704672000000 },
 *   'domFacts:456': { purpose: 'domFacts', startedAt: 1704672001000 },
 * }
 * ```
 *
 * ## Tracking Metadata
 * Each entry stores:
 * - **purpose**: Type of operation (for event correlation)
 * - **startedAt**: Unix timestamp when request initiated (for timeout detection)
 *
 * ## Lifecycle
 * 1. Request initiated → `trackInFlight` adds entry
 * 2. Request pending → Entry remains in map
 * 3. Response received → `clearInFlight` removes entry
 * 4. Timeout detected → Entry can be removed based on age
 *
 * @param model - Current model state
 * @param requestId - Unique request identifier
 * @param purpose - Type of async operation
 * @param now - Current timestamp (Unix milliseconds)
 * @returns Updated model with new in-flight entry
 *
 * @example
 * ```typescript
 * // Track HTTP request
 * const model1 = trackInFlight(
 *   model,
 *   'http:123',
 *   'httpRequest',
 *   Date.now()
 * );
 *
 * // Track storage operation
 * const model2 = trackInFlight(
 *   model1,
 *   'storeGet:456',
 *   'storageGet',
 *   Date.now()
 * );
 *
 * // Check if request is in-flight
 * function isInFlight(model: RuntimeModel, requestId: string): boolean {
 *   return requestId in model.inFlight;
 * }
 *
 * // Detect timeouts (requests older than 30 seconds)
 * function detectTimeouts(model: RuntimeModel, timeoutMs: number): string[] {
 *   const now = Date.now();
 *   return Object.entries(model.inFlight)
 *     .filter(([_, req]) => now - req.startedAt > timeoutMs)
 *     .map(([requestId, _]) => requestId);
 * }
 * ```
 *
 * @see {@link clearInFlight} for removing completed requests
 * @see {@link enqueueTracked} for combined tracking and command emission
 * @see {@link RuntimeModel.inFlight} for in-flight map structure
 */
function trackInFlight(
  model: RuntimeModel,
  requestId: string,
  purpose: InFlightPurpose,
  now: number
): RuntimeModel {
  return {
    ...model,
    inFlight: {
      ...model.inFlight,
      [requestId]: { purpose, startedAt: now },
    },
  };
}

/**
 * Remove completed request from in-flight tracking
 *
 * @remarks
 * Clears an async operation from `model.inFlight` map when it completes (success or failure).
 * Uses object destructuring to remove entry immutably without mutating original map.
 *
 * ## Removal Pattern
 * ```typescript
 * // Original in-flight map
 * { 'http:123': {...}, 'domFacts:456': {...} }
 *
 * // After clearInFlight(model, 'http:123')
 * { 'domFacts:456': {...} }
 * ```
 *
 * ## When to Clear
 * Call when receiving completion events:
 * - **Success events**: HttpCompleted, DomFactsReady, StorageLoaded, etc.
 * - **Failure events**: HttpFailed, DomFactsFailed, StorageFailed, etc.
 * - **Timeout events**: Remove stale requests after threshold exceeded
 *
 * ## Immutability
 * Creates new in-flight map without modifying original:
 * ```typescript
 * // ✅ Correct: Immutable removal via destructuring
 * const { [requestId]: _removed, ...rest } = model.inFlight;
 * return { ...model, inFlight: rest };
 *
 * // ❌ Wrong: Mutable removal
 * delete model.inFlight[requestId];
 * return model;
 * ```
 *
 * ## Missing RequestId Handling
 * If requestId doesn't exist in map, destructuring safely returns original map without error.
 *
 * @param model - Current model state
 * @param requestId - Request identifier to remove
 * @returns Updated model with request removed from in-flight map
 *
 * @example
 * ```typescript
 * // Clear single request
 * const newModel = clearInFlight(model, 'http:123');
 *
 * // Clear multiple requests (batch)
 * function clearMultiple(
 *   model: RuntimeModel,
 *   requestIds: string[]
 * ): RuntimeModel {
 *   return requestIds.reduce(
 *     (m, id) => clearInFlight(m, id),
 *     model
 *   );
 * }
 *
 * // Clear all requests by purpose
 * function clearByPurpose(
 *   model: RuntimeModel,
 *   purpose: InFlightPurpose
 * ): RuntimeModel {
 *   const idsToRemove = Object.entries(model.inFlight)
 *     .filter(([_, req]) => req.purpose === purpose)
 *     .map(([id, _]) => id);
 *
 *   return clearMultiple(model, idsToRemove);
 * }
 *
 * // Usage in event handlers
 * case 'HttpCompleted': {
 *   const newModel = clearInFlight(model, event.requestId);
 *   return { model: newModel, cmds: [...] };
 * }
 * ```
 *
 * @see {@link trackInFlight} for adding in-flight requests
 * @see {@link RuntimeModel.inFlight} for in-flight map structure
 */
function clearInFlight(model: RuntimeModel, requestId: string): RuntimeModel {
  const { [requestId]: _removed, ...rest } = model.inFlight;
  return { ...model, inFlight: rest };
}

/**
 * Generate requestId, track in-flight, emit command (combined helper)
 *
 * @remarks
 * High-level helper combining three operations:
 * 1. Generate unique requestId via {@link withRequestId}
 * 2. Track request as in-flight via {@link trackInFlight}
 * 3. Build and append command to commands array
 *
 * Simplifies common pattern in update function where initiating async operations
 * requires all three steps.
 *
 * ## Input Configuration
 * `input` object specifies:
 * - **prefix**: Request type for ID generation ('http', 'domFacts', etc.)
 * - **purpose**: Operation type for in-flight tracking
 * - **now**: Timestamp for request start time
 * - **build**: Factory function creating command with generated requestId
 *
 * ## Side Effects
 * - **Model update**: Returns new model with incremented seq and tracked request
 * - **Commands array**: Mutates `cmds` array by pushing new command (intentional optimization)
 *
 * Note: While this function mutates `cmds` array, it's safe because array is created
 * in update function scope and not shared. This avoids excessive array copying.
 *
 * @param model - Current model state
 * @param cmds - Mutable commands array to append to
 * @param input - Configuration for request tracking and command building
 * @returns Updated model with request tracked
 *
 * @example
 * ```typescript
 * // Initiate HTTP request
 * const cmds: RuntimeCommand[] = [];
 * const newModel = enqueueTracked(model, cmds, {
 *   prefix: 'http',
 *   purpose: 'httpRequest',
 *   now: Date.now(),
 *   build: (requestId) => ({
 *     type: 'HTTP_REQUEST',
 *     requestId,
 *     url: 'https://api.example.com/data',
 *     method: 'GET',
 *     responseType: 'json',
 *   }),
 * });
 * // Result: newModel has 'http:N' in inFlight, cmds has HTTP_REQUEST command
 *
 * // Chain multiple requests
 * let m = model;
 * const cmds: RuntimeCommand[] = [];
 *
 * m = enqueueTracked(m, cmds, {
 *   prefix: 'domFacts',
 *   purpose: 'domFacts',
 *   now: Date.now(),
 *   build: (id) => ({ type: 'TAKE_DOM_FACTS', requestId: id, kind: 'XComGallery' }),
 * });
 *
 * m = enqueueTracked(m, cmds, {
 *   prefix: 'storeGet',
 *   purpose: 'storageGet',
 *   now: Date.now(),
 *   build: (id) => ({ type: 'STORE_GET', requestId: id, key: 'settings' }),
 * });
 *
 * // Result: m has 2 in-flight entries, cmds has 2 commands
 *
 * // Custom command builder
 * const m2 = enqueueTracked(model, cmds, {
 *   prefix: 'navigate',
 *   purpose: 'navigate',
 *   now: Date.now(),
 *   build: (requestId) => ({
 *     type: 'NAVIGATE',
 *     requestId,
 *     url: 'https://x.com/user/status/123',
 *     mode: 'assign',
 *   }),
 * });
 * ```
 *
 * @see {@link withRequestId} for ID generation
 * @see {@link trackInFlight} for in-flight tracking
 * @see {@link update} for usage in event handlers
 */
function enqueueTracked(
  model: RuntimeModel,
  cmds: RuntimeCommand[],
  input: {
    readonly prefix: string;
    readonly purpose: InFlightPurpose;
    readonly now: number;
    readonly build: (requestId: string) => RuntimeCommand;
  }
): RuntimeModel {
  const [m1, requestId] = withRequestId(model, input.prefix);
  const nextModel = trackInFlight(m1, requestId, input.purpose, input.now);
  cmds.push(input.build(requestId));
  return nextModel;
}

/**
 * Main state transition function applying events to model
 *
 * @remarks
 * Core of the MVU architecture. Pure function that takes current model and incoming event,
 * produces new model state and commands to execute. Handles all runtime events with
 * exhaustive pattern matching.
 *
 * ## Function Signature
 * ```typescript
 * (currentModel: RuntimeModel, event: RuntimeEvent) → { model: RuntimeModel, cmds: Command[] }
 * ```
 *
 * ## Event Categories
 *
 * ### Lifecycle Events
 * - **Booted**: Application initialization, loads settings and DOM facts, starts ticker
 *
 * ### Request Initiation Events
 * - **HttpRequested**: Initiates HTTP request, tracks in-flight
 * - **NavigateRequested**: Initiates navigation, tracks in-flight
 *
 * ### Periodic Events
 * - **Tick**: Scheduled interval, triggers DOM fact refresh
 *
 * ### Success Events
 * - **HttpCompleted**: HTTP success, caches response, clears in-flight
 * - **NavigateCompleted**: Navigation success, updates cache, clears in-flight
 * - **DomFactsReady**: DOM extraction success, saves facts, persists to storage
 * - **StorageLoaded**: Storage read success, caches value, clears in-flight
 * - **StorageSetCompleted**: Storage write success, clears in-flight
 *
 * ### Failure Events
 * - **HttpFailed**: HTTP failure, logs error, clears in-flight
 * - **NavigateFailed**: Navigation failure, logs error, clears in-flight
 * - **DomFactsFailed**: DOM extraction failure, logs error, clears in-flight
 * - **StorageFailed**: Storage read failure, logs error, clears in-flight
 * - **StorageSetFailed**: Storage write failure, logs error, clears in-flight
 *
 * ## State Update Patterns
 *
 * ### Pattern: Clear In-Flight + Cache Result
 * ```typescript
 * case 'HttpCompleted': {
 *   const newModel = {
 *     ...clearInFlight(model, event.requestId),
 *     cache: {
 *       ...model.cache,
 *       [event.requestId]: { url: event.url, status: event.status, body: event.body },
 *     },
 *   };
 *   return { model: newModel, cmds: [logCommand] };
 * }
 * ```
 *
 * ### Pattern: Clear In-Flight + Log Error
 * ```typescript
 * case 'HttpFailed': {
 *   const newModel = clearInFlight(model, event.requestId);
 *   return {
 *     model: newModel,
 *     cmds: [{ type: 'LOG', level: 'warn', message: '...', context: {...} }],
 *   };
 * }
 * ```
 *
 * ### Pattern: Track + Emit Command
 * ```typescript
 * case 'HttpRequested': {
 *   const cmds: RuntimeCommand[] = [];
 *   const newModel = enqueueTracked(model, cmds, {
 *     prefix: 'http',
 *     purpose: 'httpRequest',
 *     now: event.now,
 *     build: (requestId) => ({ type: 'HTTP_REQUEST', requestId, ... }),
 *   });
 *   return { model: newModel, cmds };
 * }
 * ```
 *
 * ## Purity Guarantees
 * - No I/O operations (networking, storage, DOM access)
 * - No global state mutations
 * - Deterministic: same inputs → same outputs
 * - No Date.now() calls (uses event.now timestamp)
 * - Testable without mocks
 *
 * ## Command Execution
 * Commands returned are executed by runtime outside this function:
 * ```typescript
 * const result = update(model, event);
 * currentModel = result.model;
 * for (const cmd of result.cmds) {
 *   executeCommand(cmd); // Runtime adapter handles I/O
 * }
 * ```
 *
 * @param model - Current immutable model state
 * @param event - Runtime event to process
 * @returns UpdateResult with new model and commands to execute
 *
 * @example
 * ```typescript
 * // Bootstrap application
 * const bootEvent: RuntimeEvent = {
 *   type: 'Booted',
 *   url: 'https://x.com/user/status/123',
 *   now: Date.now(),
 * };
 *
 * const result = update(initialModel, bootEvent);
 * // result.model has URL set, multiple in-flight requests
 * // result.cmds includes LOG, STORE_GET (x2), TAKE_DOM_FACTS, SCHEDULE_TICK
 *
 * // Handle HTTP completion
 * const httpEvent: RuntimeEvent = {
 *   type: 'HttpCompleted',
 *   requestId: 'http:123',
 *   url: 'https://api.example.com/data',
 *   status: 200,
 *   body: { data: 'test' },
 *   now: Date.now(),
 * };
 *
 * const result2 = update(result.model, httpEvent);
 * // result2.model has in-flight cleared, cache updated
 * // result2.cmds includes LOG command
 *
 * // Handle error
 * const errorEvent: RuntimeEvent = {
 *   type: 'HttpFailed',
 *   requestId: 'http:456',
 *   url: 'https://api.example.com/error',
 *   error: 'Network timeout',
 *   now: Date.now(),
 * };
 *
 * const result3 = update(result2.model, errorEvent);
 * // result3.model has in-flight cleared
 * // result3.cmds includes LOG with error context
 * ```
 *
 * @see {@link UpdateResult} for return type
 * @see {@link RuntimeModel} for model structure
 * @see {@link RuntimeEvent} for event types
 * @see {@link RuntimeCommand} for command types
 */
export function update(model: RuntimeModel, event: RuntimeEvent): UpdateResult {
  switch (event.type) {
    case 'Booted': {
      const cmds: RuntimeCommand[] = [];
      let nextModel: RuntimeModel = { ...model, url: event.url };

      cmds.push({
        type: 'LOG',
        level: 'info',
        message: '[command-runtime] Booted',
        context: { url: event.url },
      });

      nextModel = enqueueTracked(nextModel, cmds, {
        prefix: 'storeGet',
        purpose: 'storageGet',
        now: event.now,
        build: (requestId) => ({
          type: 'STORE_GET',
          requestId,
          key: COMMAND_RUNTIME_STORAGE_KEY,
        }),
      });

      nextModel = enqueueTracked(nextModel, cmds, {
        prefix: 'storeGet',
        purpose: 'storageGet',
        now: event.now,
        build: (requestId) => ({
          type: 'STORE_GET',
          requestId,
          key: APP_SETTINGS_STORAGE_KEY,
        }),
      });

      nextModel = enqueueTracked(nextModel, cmds, {
        prefix: 'domFacts',
        purpose: 'domFacts',
        now: event.now,
        build: (requestId) => ({ type: 'TAKE_DOM_FACTS', requestId, kind: 'XComGallery' }),
      });

      if (!nextModel.schedule.tickId) {
        const tickId = 'command-runtime:main';
        nextModel = {
          ...nextModel,
          schedule: { tickId, tickEveryMs: COMMAND_RUNTIME_DEFAULT_TICK_MS },
        };
        cmds.push({
          type: 'SCHEDULE_TICK',
          id: tickId,
          intervalMs: COMMAND_RUNTIME_DEFAULT_TICK_MS,
        });
      }

      return { model: nextModel, cmds };
    }

    case 'HttpRequested': {
      const cmds: RuntimeCommand[] = [];

      const nextModel = enqueueTracked(model, cmds, {
        prefix: 'http',
        purpose: 'httpRequest',
        now: event.now,
        build: (requestId) => ({
          type: 'HTTP_REQUEST',
          requestId,
          url: event.url,
          method: event.method,
          responseType: event.responseType,
          ...(event.headers !== undefined ? { headers: event.headers } : {}),
          ...(event.body !== undefined ? { body: event.body } : {}),
        }),
      });

      return { model: nextModel, cmds };
    }

    case 'NavigateRequested': {
      const cmds: RuntimeCommand[] = [];

      const nextModel = enqueueTracked(model, cmds, {
        prefix: 'navigate',
        purpose: 'navigate',
        now: event.now,
        build: (requestId) => ({
          type: 'NAVIGATE',
          requestId,
          url: event.url,
          mode: event.mode,
          ...(event.target !== undefined ? { target: event.target } : {}),
        }),
      });

      return { model: nextModel, cmds };
    }

    case 'Tick': {
      const cmds: RuntimeCommand[] = [];
      let nextModel: RuntimeModel = model;

      nextModel = enqueueTracked(nextModel, cmds, {
        prefix: 'domFacts',
        purpose: 'domFacts',
        now: event.now,
        build: (requestId) => ({ type: 'TAKE_DOM_FACTS', requestId, kind: 'XComGallery' }),
      });

      return { model: nextModel, cmds };
    }

    case 'DomFactsReady': {
      const cmds: RuntimeCommand[] = [];
      let nextModel: RuntimeModel = clearInFlight(model, event.requestId);

      nextModel = { ...nextModel, lastFacts: event.facts };

      cmds.push({
        type: 'LOG',
        level: 'debug',
        message: '[command-runtime] Dom facts updated',
        context: {
          requestId: event.requestId,
          kind: event.facts.kind,
          hasXegOverlay: event.facts.hasXegOverlay,
          hasXComMediaViewer: event.facts.hasXComMediaViewer,
          mediaElementsCount: event.facts.mediaElementsCount,
        },
      });

      nextModel = enqueueTracked(nextModel, cmds, {
        prefix: 'storeSet',
        purpose: 'storageSet',
        now: event.now,
        build: (requestId) => ({
          type: 'STORE_SET',
          requestId,
          key: COMMAND_RUNTIME_STORAGE_KEY,
          value: { lastFacts: event.facts, savedAt: event.now },
        }),
      });

      return { model: nextModel, cmds };
    }

    case 'HttpCompleted': {
      const nextModel: RuntimeModel = {
        ...clearInFlight(model, event.requestId),
        cache: {
          ...model.cache,
          [event.requestId]: {
            url: event.url,
            status: event.status,
            body: event.body,
            completedAt: event.now,
          },
        },
      };

      return {
        model: nextModel,
        cmds: [
          {
            type: 'LOG',
            level: 'debug',
            message: '[command-runtime] HTTP request completed',
            context: { requestId: event.requestId, url: event.url, status: event.status },
          },
        ],
      };
    }

    case 'HttpFailed': {
      const nextModel: RuntimeModel = clearInFlight(model, event.requestId);
      return {
        model: nextModel,
        cmds: [
          {
            type: 'LOG',
            level: 'warn',
            message: '[command-runtime] HTTP request failed',
            context: {
              requestId: event.requestId,
              url: event.url,
              error: event.error,
            },
          },
        ],
      };
    }

    case 'NavigateCompleted': {
      const nextModel: RuntimeModel = {
        ...clearInFlight(model, event.requestId),
        cache: {
          ...model.cache,
          [event.requestId]: {
            url: event.url,
            completedAt: event.now,
          },
        },
      };

      return {
        model: nextModel,
        cmds: [
          {
            type: 'LOG',
            level: 'info',
            message: '[command-runtime] Navigation completed',
            context: { requestId: event.requestId, url: event.url },
          },
        ],
      };
    }

    case 'NavigateFailed': {
      const nextModel: RuntimeModel = clearInFlight(model, event.requestId);
      return {
        model: nextModel,
        cmds: [
          {
            type: 'LOG',
            level: 'warn',
            message: '[command-runtime] Navigation failed',
            context: {
              requestId: event.requestId,
              url: event.url,
              error: event.error,
            },
          },
        ],
      };
    }

    case 'DomFactsFailed': {
      const nextModel: RuntimeModel = clearInFlight(model, event.requestId);
      return {
        model: nextModel,
        cmds: [
          {
            type: 'LOG',
            level: 'warn',
            message: '[command-runtime] TAKE_DOM_FACTS failed',
            context: {
              requestId: event.requestId,
              kind: event.kind,
              error: event.error,
            },
          },
        ],
      };
    }

    case 'StorageLoaded': {
      const nextModel: RuntimeModel = {
        ...clearInFlight(model, event.requestId),
        cache: {
          ...model.cache,
          [event.key]: event.value,
        },
      };

      return {
        model: nextModel,
        cmds: [
          {
            type: 'LOG',
            level: 'debug',
            message: '[command-runtime] Storage loaded',
            context: { requestId: event.requestId, key: event.key },
          },
        ],
      };
    }

    case 'StorageFailed': {
      const nextModel: RuntimeModel = clearInFlight(model, event.requestId);
      return {
        model: nextModel,
        cmds: [
          {
            type: 'LOG',
            level: 'warn',
            message: '[command-runtime] Storage failed',
            context: { requestId: event.requestId, key: event.key, error: event.error },
          },
        ],
      };
    }

    case 'StorageSetCompleted': {
      const nextModel: RuntimeModel = clearInFlight(model, event.requestId);
      return {
        model: nextModel,
        cmds: [
          {
            type: 'LOG',
            level: 'debug',
            message: '[command-runtime] Storage set completed',
            context: { requestId: event.requestId, key: event.key },
          },
        ],
      };
    }

    case 'StorageSetFailed': {
      const nextModel: RuntimeModel = clearInFlight(model, event.requestId);
      return {
        model: nextModel,
        cmds: [
          {
            type: 'LOG',
            level: 'warn',
            message: '[command-runtime] Storage set failed',
            context: { requestId: event.requestId, key: event.key, error: event.error },
          },
        ],
      };
    }

    default: {
      return { model, cmds: [] };
    }
  }
}
