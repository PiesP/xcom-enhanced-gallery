/**
 * @fileoverview Runtime model state definitions for effect system
 *
 * ## Purpose
 * Defines the immutable state structure for the application's runtime model. The model serves as the
 * central state container for the effect system, tracking in-flight requests, cached data, DOM facts,
 * scheduled tasks, and request correlation metadata.
 *
 * ## Key Responsibilities
 * - **State Structure**: Define complete runtime state schema
 * - **Immutability**: All fields are readonly (functional update pattern)
 * - **Request Tracking**: Track in-flight async operations for correlation
 * - **Caching**: Generic cache storage for performance optimization
 * - **Scheduling**: Timer/interval task management state
 * - **DOM Facts**: Latest extracted DOM state snapshot
 *
 * ## Architecture Context
 * The RuntimeModel follows the Model-View-Update (MVU) architecture pattern:
 * 1. **Model**: Current application state (this file)
 * 2. **View**: UI representation (components)
 * 3. **Update**: State transitions via pure functions (src/core/update.ts)
 *
 * All state changes produce a new model instance (immutable updates):
 * ```typescript
 * // State transition example
 * function update(model: RuntimeModel, event: RuntimeEvent): RuntimeModel {
 *   switch (event.type) {
 *     case 'HttpRequested':
 *       return {
 *         ...model,
 *         requestSeq: model.requestSeq + 1,
 *         inFlight: {
 *           ...model.inFlight,
 *           [event.requestId]: {
 *             purpose: 'httpRequest',
 *             startedAt: event.now,
 *           },
 *         },
 *       };
 *     case 'HttpCompleted':
 *       const { [event.requestId]: _, ...remainingInFlight } = model.inFlight;
 *       return {
 *         ...model,
 *         inFlight: remainingInFlight,
 *         cache: {
 *           ...model.cache,
 *           [event.url]: event.body,
 *         },
 *       };
 *     default:
 *       return model;
 *   }
 * }
 * ```
 *
 * ## In-Flight Request Tracking
 * The `inFlight` map tracks async operations that haven't completed yet:
 * - **Key**: requestId (from command)
 * - **Value**: InFlightRequest metadata (purpose, timestamp)
 * - **Lifecycle**: Added when command dispatched, removed when event received
 *
 * This enables:
 * - Request-response correlation without global mutable state
 * - Timeout detection (compare startedAt with current time)
 * - Duplicate request prevention
 * - Request cancellation capability
 *
 * ## Cache Strategy
 * The `cache` field is a generic key-value store for:
 * - HTTP response caching (by URL)
 * - Computed value memoization
 * - User settings (until persisted)
 * - Temporary state that survives re-renders
 *
 * Cache keys are application-defined strings. Values are `unknown` type requiring
 * runtime validation or type assertions when retrieved.
 *
 * ## Scheduling State
 * The `schedule` field tracks active interval tasks:
 * - **tickId**: Identifier of the active interval (matches SCHEDULE_TICK command)
 * - **tickEveryMs**: Interval duration in milliseconds
 * - Only one interval active at a time (tickId present = active)
 *
 * ## Design Principles
 * 1. **Immutability**: All fields readonly, updates create new instances
 * 2. **Minimal State**: Only essential runtime state (no derived data)
 * 3. **Type Safety**: Strict typing with no `any` types
 * 4. **Serializability**: All values JSON-serializable (for debugging/persistence)
 * 5. **Normalization**: Flat structure, avoid deep nesting
 *
 * ## State Initialization
 * The initial model is created by `createInitialModel()` with minimal required fields:
 * - `requestSeq`: Starts at 0
 * - `inFlight`: Empty map
 * - `cache`: Empty map
 * - `schedule`: Empty object (no active interval)
 * - Optional fields (`url`, `lastFacts`) are undefined
 *
 * @module core/model
 * @see {@link RuntimeModel} for the main model interface
 * @see {@link InFlightRequest} for in-flight request metadata
 * @see {@link createInitialModel} for initial state factory
 * @see {@link module:core/update} for state update logic
 * @see {@link module:core/events} for events that trigger updates
 */

import type { DomFacts } from '@core/dom-facts';

/**
 * In-flight request metadata for async operation tracking
 *
 * @remarks
 * Tracks metadata for async operations (HTTP, storage, DOM facts, navigation) that have been
 * dispatched but haven't completed yet. Used for request-response correlation, timeout detection,
 * and duplicate request prevention.
 *
 * ## Fields
 *
 * ### purpose
 * Categorizes the type of async operation being tracked. Determines which event types
 * should clear this in-flight entry:
 * - `'domFacts'`: DOM fact extraction (cleared by DomFactsReady or DomFactsFailed)
 * - `'storageGet'`: Storage read (cleared by StorageLoaded or StorageFailed)
 * - `'storageSet'`: Storage write (cleared by StorageSetCompleted or StorageSetFailed)
 * - `'httpRequest'`: HTTP request (cleared by HttpCompleted or HttpFailed)
 * - `'navigate'`: Navigation (cleared by NavigateCompleted or NavigateFailed)
 *
 * ### startedAt
 * Unix timestamp (milliseconds) when the request was dispatched. Used for:
 * - Timeout detection: `Date.now() - startedAt > TIMEOUT_MS`
 * - Performance measurement: duration from request to response
 * - Request ordering: earlier timestamp = earlier request
 * - Debug logging: time requests spent in-flight
 *
 * ## Lifecycle
 * 1. **Creation**: Added to `RuntimeModel.inFlight` when command dispatched
 * 2. **Tracking**: Remains in map while operation pending
 * 3. **Removal**: Deleted when corresponding success/failure event received
 * 4. **Timeout**: May be removed if `startedAt` exceeds timeout threshold
 *
 * @example
 * ```typescript
 * // Add in-flight request when dispatching HTTP command
 * const requestId = `http-${model.requestSeq}`;
 * const newModel: RuntimeModel = {
 *   ...model,
 *   requestSeq: model.requestSeq + 1,
 *   inFlight: {
 *     ...model.inFlight,
 *     [requestId]: {
 *       purpose: 'httpRequest',
 *       startedAt: Date.now(),
 *     },
 *   },
 * };
 *
 * // Remove in-flight request when receiving response
 * function handleHttpCompleted(model: RuntimeModel, requestId: string): RuntimeModel {
 *   const { [requestId]: _, ...remainingInFlight } = model.inFlight;
 *   return {
 *     ...model,
 *     inFlight: remainingInFlight,
 *   };
 * }
 *
 * // Check for timeout
 * function detectTimeouts(model: RuntimeModel, timeoutMs: number): string[] {
 *   const now = Date.now();
 *   return Object.entries(model.inFlight)
 *     .filter(([_, req]) => now - req.startedAt > timeoutMs)
 *     .map(([requestId, _]) => requestId);
 * }
 * ```
 *
 * @see {@link RuntimeModel.inFlight} for the in-flight request map
 */
interface InFlightRequest {
  /** Type of async operation being tracked */
  readonly purpose: 'domFacts' | 'storageGet' | 'storageSet' | 'httpRequest' | 'navigate';
  /** Unix timestamp (ms) when request was dispatched */
  readonly startedAt: number;
}

/**
 * Runtime model state for effect system
 *
 * @remarks
 * Immutable state container for the application runtime. All fields are readonly to enforce
 * functional update pattern. State changes produce new model instances via spread syntax.
 *
 * ## Fields
 *
 * ### url
 * Current page URL (from `window.location.href` or navigation target).
 * - **Type**: `string | undefined`
 * - **Optional**: Yes (undefined until first Booted event)
 * - **Usage**: URL-based routing, navigation tracking, analytics
 * - **Update**: Set on Booted event, updated on NavigateCompleted
 *
 * ### requestSeq
 * Monotonically increasing sequence number for request ID generation.
 * - **Type**: `number`
 * - **Initial**: 0
 * - **Usage**: Generate unique requestIds: `${purpose}-${requestSeq}`
 * - **Update**: Incremented every time a command with correlation is dispatched
 * - **Guarantees**: Never decreases, never duplicates
 *
 * ### inFlight
 * Map of active async operations awaiting responses.
 * - **Type**: `Record<string, InFlightRequest>`
 * - **Key**: requestId (from command)
 * - **Value**: Request metadata (purpose, timestamp)
 * - **Initial**: Empty object `{}`
 * - **Usage**: Request correlation, timeout detection, duplicate prevention
 * - **Update**: Add on command dispatch, remove on event received
 *
 * ### cache
 * Generic key-value cache for performance optimization.
 * - **Type**: `Record<string, unknown>`
 * - **Key**: Application-defined cache key (e.g., URL, settings key)
 * - **Value**: Cached data (requires type assertion on retrieval)
 * - **Initial**: Empty object `{}`
 * - **Usage**: HTTP response cache, computed value memoization, temporary state
 * - **Invalidation**: Application-defined eviction strategy
 *
 * ### lastFacts
 * Most recently extracted DOM facts snapshot.
 * - **Type**: `DomFacts | undefined`
 * - **Optional**: Yes (undefined until first DomFactsReady event)
 * - **Usage**: Compare current vs previous DOM state, detect changes
 * - **Update**: Set on DomFactsReady event
 * - **Comparison**: Use to determine if gallery should show/hide
 *
 * ### schedule
 * Active interval task state.
 * - **Type**: Object with `tickId` and `tickEveryMs` fields
 * - **tickId**: Identifier of active interval (undefined = no active interval)
 * - **tickEveryMs**: Interval duration in milliseconds (undefined = no active interval)
 * - **Initial**: Empty object `{}`
 * - **Usage**: Track scheduled tasks, prevent duplicate intervals
 * - **Lifecycle**: Set on SCHEDULE_TICK command, cleared on CANCEL_TICK command
 *
 * ## State Transitions
 * All state changes follow functional update pattern:
 * ```typescript
 * // ✅ GOOD: Immutable update
 * const newModel: RuntimeModel = {
 *   ...oldModel,
 *   requestSeq: oldModel.requestSeq + 1,
 *   cache: {
 *     ...oldModel.cache,
 *     [key]: value,
 *   },
 * };
 *
 * // ❌ BAD: Mutable update
 * oldModel.requestSeq++;
 * oldModel.cache[key] = value;
 * ```
 *
 * ## Serialization
 * All fields are JSON-serializable for debugging and persistence:
 * ```typescript
 * // Serialize for debugging
 * console.log(JSON.stringify(model, null, 2));
 *
 * // Persist to storage (excluding in-flight which is transient)
 * const persistable = {
 *   url: model.url,
 *   cache: model.cache,
 *   lastFacts: model.lastFacts,
 * };
 * ```
 *
 * ## Normalization
 * State is kept flat to avoid deep nesting:
 * - ✅ `model.cache[key]` (flat lookup)
 * - ❌ `model.features.gallery.cache[key]` (deep nesting)
 *
 * @example
 * ```typescript
 * // Initialize model
 * let model = createInitialModel();
 *
 * // Handle Booted event
 * model = {
 *   ...model,
 *   url: 'https://x.com/user/status/123',
 * };
 *
 * // Dispatch HTTP request
 * const requestId = `http-${model.requestSeq}`;
 * model = {
 *   ...model,
 *   requestSeq: model.requestSeq + 1,
 *   inFlight: {
 *     ...model.inFlight,
 *     [requestId]: {
 *       purpose: 'httpRequest',
 *       startedAt: Date.now(),
 *     },
 *   },
 * };
 *
 * // Handle HTTP response
 * const { [requestId]: _, ...remainingInFlight } = model.inFlight;
 * model = {
 *   ...model,
 *   inFlight: remainingInFlight,
 *   cache: {
 *     ...model.cache,
 *     [url]: responseBody,
 *   },
 * };
 *
 * // Schedule interval
 * model = {
 *   ...model,
 *   schedule: {
 *     tickId: 'poller',
 *     tickEveryMs: 5000,
 *   },
 * };
 *
 * // Cancel interval
 * model = {
 *   ...model,
 *   schedule: {},
 * };
 *
 * // Update DOM facts
 * model = {
 *   ...model,
 *   lastFacts: {
 *     kind: 'XComGallery',
 *     url: model.url ?? '',
 *     hasXegOverlay: true,
 *     hasXComMediaViewer: false,
 *     mediaElementsCount: 5,
 *   },
 * };
 * ```
 *
 * @see {@link InFlightRequest} for in-flight request metadata
 * @see {@link createInitialModel} for initial state factory
 * @see {@link DomFacts} from core/dom-facts for DOM state structure
 */
export interface RuntimeModel {
  /** Current page URL (undefined until first Booted event) */
  readonly url?: string;
  /** Monotonic sequence number for request ID generation */
  readonly requestSeq: number;
  /** Active async operations awaiting responses (keyed by requestId) */
  readonly inFlight: Readonly<Record<string, InFlightRequest>>;
  /** Generic cache for HTTP responses, settings, computed values */
  readonly cache: Readonly<Record<string, unknown>>;
  /** Most recent DOM facts snapshot (undefined until first extraction) */
  readonly lastFacts?: DomFacts;
  /** Active interval task state (empty = no active interval) */
  readonly schedule: {
    /** Active interval identifier (undefined = no active interval) */
    readonly tickId?: string;
    /** Interval duration in milliseconds (undefined = no active interval) */
    readonly tickEveryMs?: number;
  };
}

/**
 * Create initial runtime model with default values
 *
 * @remarks
 * Factory function for creating the initial runtime model state. All required fields are initialized
 * with minimal values. Optional fields are undefined until populated by events.
 *
 * ## Initial State
 * - `requestSeq`: 0 (first request will be 0, then increments)
 * - `inFlight`: Empty map (no pending requests)
 * - `cache`: Empty map (no cached data)
 * - `schedule`: Empty object (no active interval)
 * - `url`: undefined (set on first Booted event)
 * - `lastFacts`: undefined (set on first DomFactsReady event)
 *
 * ## Usage
 * Called once at application bootstrap to initialize the effect system:
 * ```typescript
 * // Bootstrap initialization
 * const initialModel = createInitialModel();
 * const runtime = createRuntime(initialModel);
 * runtime.dispatch({ type: 'TAKE_DOM_FACTS', requestId: 'boot-facts', kind: 'XComGallery' });
 * ```
 *
 * ## Testing
 * Each test should start with a fresh model:
 * ```typescript
 * describe('Update function', () => {
 *   it('should handle HttpCompleted', () => {
 *     const model = createInitialModel();
 *     const event: RuntimeEvent = { type: 'HttpCompleted', ... };
 *     const newModel = update(model, event);
 *     expect(newModel.cache[url]).toBeDefined();
 *   });
 * });
 * ```
 *
 * @returns Fresh RuntimeModel instance with default values
 *
 * @example
 * ```typescript
 * // Basic initialization
 * const model = createInitialModel();
 * console.log(model.requestSeq); // 0
 * console.log(model.inFlight);   // {}
 * console.log(model.cache);      // {}
 * console.log(model.url);        // undefined
 *
 * // Use in runtime setup
 * function bootstrapApp(): void {
 *   const model = createInitialModel();
 *   const runtime = createRuntime(model);
 *
 *   runtime.on('Booted', (event) => {
 *     console.log('App booted at:', event.url);
 *   });
 *
 *   runtime.dispatch({
 *     type: 'TAKE_DOM_FACTS',
 *     requestId: 'boot',
 *     kind: 'XComGallery',
 *   });
 * }
 * ```
 *
 * @see {@link RuntimeModel} for the model interface
 */
export function createInitialModel(): RuntimeModel {
  return {
    requestSeq: 0,
    inFlight: {},
    cache: {},
    schedule: {},
  };
}

// ============================================================================
// Type Helpers
// ============================================================================

/**
 * Type helper: Extract cache value with type assertion
 *
 * @remarks
 * Helper type for type-safe cache value retrieval. Requires runtime validation
 * or type guard to ensure retrieved value matches expected type.
 *
 * @example
 * ```typescript
 * // Type-safe cache retrieval
 * function getCachedResponse<T>(model: RuntimeModel, url: string): T | undefined {
 *   const cached = model.cache[url];
 *   // Runtime validation recommended
 *   if (cached && typeof cached === 'object') {
 *     return cached as T;
 *   }
 *   return undefined;
 * }
 *
 * // Usage
 * interface UserData { id: string; name: string; }
 * const userData = getCachedResponse<UserData>(model, '/api/user');
 * if (userData) {
 *   console.log(userData.name);
 * }
 * ```
 */
export type CachedValue<T = unknown> = T | undefined;

/**
 * Type helper: Model update function signature
 *
 * @remarks
 * Standard signature for pure state update functions in MVU architecture.
 * Takes current model and returns new model (immutable update pattern).
 *
 * @example
 * ```typescript
 * // Update function implementation
 * const incrementRequestSeq: ModelUpdate = (model) => ({
 *   ...model,
 *   requestSeq: model.requestSeq + 1,
 * });
 *
 * // Conditional update
 * const updateIfChanged: ModelUpdate = (model) => {
 *   if (shouldUpdate(model)) {
 *     return { ...model, cache: newCache };
 *   }
 *   return model; // No change
 * };
 *
 * // Compose updates
 * function applyUpdates(model: RuntimeModel, updates: ModelUpdate[]): RuntimeModel {
 *   return updates.reduce((m, update) => update(m), model);
 * }
 * ```
 */
export type ModelUpdate = (model: RuntimeModel) => RuntimeModel;

/**
 * Type helper: Partial model update (subset of fields)
 *
 * @remarks
 * Allows partial model updates without specifying all fields. Useful for
 * focused updates that only change specific fields.
 *
 * @example
 * ```typescript
 * // Partial update helper
 * function applyPartialUpdate(
 *   model: RuntimeModel,
 *   update: PartialModelUpdate
 * ): RuntimeModel {
 *   return { ...model, ...update };
 * }
 *
 * // Usage - only update URL
 * const updated = applyPartialUpdate(model, {
 *   url: 'https://x.com/new-url',
 * });
 *
 * // Usage - update multiple fields
 * const updated = applyPartialUpdate(model, {
 *   requestSeq: model.requestSeq + 1,
 *   cache: { ...model.cache, [key]: value },
 * });
 * ```
 */
export type PartialModelUpdate = Partial<RuntimeModel>;

/**
 * Type helper: In-flight request purpose union type
 *
 * @remarks
 * Extracts the purpose discriminator from InFlightRequest for type-safe purpose checking.
 *
 * @example
 * ```typescript
 * // Type-safe purpose check
 * function isHttpInFlight(purpose: InFlightPurpose): boolean {
 *   return purpose === 'httpRequest';
 * }
 *
 * // Filter in-flight requests by purpose
 * function getInFlightByPurpose(
 *   model: RuntimeModel,
 *   purpose: InFlightPurpose
 * ): Record<string, InFlightRequest> {
 *   return Object.fromEntries(
 *     Object.entries(model.inFlight)
 *       .filter(([_, req]) => req.purpose === purpose)
 *   );
 * }
 *
 * // Count requests by purpose
 * function countByPurpose(model: RuntimeModel): Record<InFlightPurpose, number> {
 *   const counts: Record<InFlightPurpose, number> = {
 *     domFacts: 0,
 *     storageGet: 0,
 *     storageSet: 0,
 *     httpRequest: 0,
 *     navigate: 0,
 *   };
 *
 *   for (const req of Object.values(model.inFlight)) {
 *     counts[req.purpose]++;
 *   }
 *
 *   return counts;
 * }
 * ```
 */
export type InFlightPurpose = InFlightRequest['purpose'];

/**
 * Type helper: Model predicate function for filtering/validation
 *
 * @remarks
 * Standard signature for model validation and filtering predicates.
 *
 * @example
 * ```typescript
 * // Validation predicates
 * const hasActiveRequests: ModelPredicate = (model) => {
 *   return Object.keys(model.inFlight).length > 0;
 * };
 *
 * const hasScheduledTask: ModelPredicate = (model) => {
 *   return model.schedule.tickId !== undefined;
 * };
 *
 * const hasCache: ModelPredicate = (model) => {
 *   return Object.keys(model.cache).length > 0;
 * };
 *
 * // Filter models
 * function filterModels(
 *   models: RuntimeModel[],
 *   predicate: ModelPredicate
 * ): RuntimeModel[] {
 *   return models.filter(predicate);
 * }
 *
 * // Conditional update
 * function updateIf(
 *   model: RuntimeModel,
 *   predicate: ModelPredicate,
 *   update: ModelUpdate
 * ): RuntimeModel {
 *   return predicate(model) ? update(model) : model;
 * }
 * ```
 */
export type ModelPredicate = (model: RuntimeModel) => boolean;
