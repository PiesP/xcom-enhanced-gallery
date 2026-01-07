/**
 * @fileoverview Runtime event type definitions for effect system responses
 *
 * ## Purpose
 * Defines discriminated union types for all runtime events emitted by the application's effect system.
 * Events represent the outcomes of command execution (success or failure) and other runtime occurrences
 * that need to be communicated back to the application logic layer.
 *
 * ## Key Responsibilities
 * - **Type Safety**: Provide compile-time type checking for all event variants
 * - **Discriminated Unions**: Enable exhaustive pattern matching via `type` discriminator
 * - **Async Response Correlation**: Support command-response correlation via `requestId` field
 * - **Timestamp Tracking**: Include `now` timestamp for all events (debugging, analytics)
 * - **Error Propagation**: Distinguish success and failure variants for each async operation
 *
 * ## Event Categories
 * 1. **Lifecycle Events**: Booted - Application bootstrap completion
 * 2. **Timer Events**: Tick - Scheduled interval ticks
 * 3. **DOM Events**: DomFactsReady, DomFactsFailed - DOM fact extraction results
 * 4. **HTTP Events**: HttpRequested, HttpCompleted, HttpFailed - HTTP request lifecycle
 * 5. **Navigation Events**: NavigateRequested, NavigateCompleted, NavigateFailed - Navigation lifecycle
 * 6. **Storage Events**: StorageLoaded, StorageSetCompleted, StorageSetFailed, StorageFailed - Storage operations
 *
 * ## Architecture Context
 * Events are the counterpart to commands in the effect system:
 * 1. Business logic dispatches commands (e.g., HTTP_REQUEST)
 * 2. Runtime adapter executes command and emits events
 * 3. Event handlers in business logic respond to success/failure
 *
 * ## Command-Event Correlation
 * Most events include a `requestId` field that matches the `requestId` from the originating command.
 * This enables async response correlation without global state:
 *
 * ```typescript
 * // Command dispatch with requestId
 * const cmd: RuntimeCommand = {
 *   type: 'HTTP_REQUEST',
 *   requestId: 'req-123',
 *   url: 'https://api.example.com/data',
 *   method: 'GET',
 *   responseType: 'json',
 * };
 *
 * // Event handling with requestId correlation
 * function handleEvent(event: RuntimeEvent): void {
 *   if (event.type === 'HttpCompleted' && event.requestId === 'req-123') {
 *     console.log('Request completed:', event.body);
 *   }
 * }
 * ```
 *
 * ## Timestamp Field
 * All events include a `now` field (Unix timestamp in milliseconds) for:
 * - Event sequence ordering
 * - Performance measurement (command dispatch → event emission duration)
 * - Debugging and logging context
 * - Analytics and telemetry
 *
 * ## Success/Failure Variants
 * Async operations have paired success/failure event variants:
 * - `HttpCompleted` / `HttpFailed`
 * - `NavigateCompleted` / `NavigateFailed`
 * - `StorageLoaded` / `StorageFailed`
 * - `StorageSetCompleted` / `StorageSetFailed`
 * - `DomFactsReady` / `DomFactsFailed`
 *
 * This pattern enables explicit error handling without exceptions:
 * ```typescript
 * switch (event.type) {
 *   case 'HttpCompleted':
 *     // Handle success
 *     break;
 *   case 'HttpFailed':
 *     // Handle failure
 *     console.error(event.error);
 *     break;
 * }
 * ```
 *
 * ## Usage Pattern
 * ```typescript
 * // Event handler with exhaustive pattern matching
 * function handleRuntimeEvent(event: RuntimeEvent): void {
 *   switch (event.type) {
 *     case 'Booted':
 *       console.log('App booted at:', event.url, event.now);
 *       break;
 *     case 'Tick':
 *       console.log('Tick:', event.tickId, event.now);
 *       break;
 *     case 'HttpCompleted':
 *       console.log('HTTP success:', event.status, event.body);
 *       break;
 *     case 'HttpFailed':
 *       console.error('HTTP error:', event.error);
 *       break;
 *     case 'DomFactsReady':
 *       console.log('DOM facts:', event.facts);
 *       break;
 *     case 'DomFactsFailed':
 *       console.error('DOM facts error:', event.error);
 *       break;
 *     // ... other cases
 *     default:
 *       const _exhaustive: never = event;
 *       throw new Error(`Unhandled event: ${_exhaustive}`);
 *   }
 * }
 * ```
 *
 * @module core/events
 * @see {@link RuntimeEvent} for the main event union type
 * @see {@link module:core/cmd} for related command types
 * @see {@link module:core/update} for event emission runtime
 */

import type { HttpMethod, HttpResponseType, NavigateMode } from '@core/cmd';
import type { DomFacts, DomFactsKind } from '@core/dom-facts';

/**
 * Discriminated union of all runtime events
 *
 * @remarks
 * Each event variant has a unique `type` field for pattern matching and a `now` timestamp
 * for ordering and debugging. Most events include `requestId` for command-response correlation.
 *
 * ## Event Variants
 *
 * ### Booted
 * Emitted once during application bootstrap when initialization completes successfully.
 * - **type**: `'Booted'`
 * - **url**: Current page URL at boot time
 * - **now**: Timestamp when bootstrap completed
 *
 * Use case: Initialize feature modules, start background tasks, record analytics.
 *
 * ### Tick
 * Emitted periodically by scheduled intervals (from SCHEDULE_TICK command).
 * - **type**: `'Tick'`
 * - **tickId**: Identifier of the interval (matches SCHEDULE_TICK.id)
 * - **now**: Timestamp when tick fired
 *
 * Use case: Periodic polling, cleanup tasks, refresh operations.
 *
 * ### HttpRequested
 * Emitted immediately when HTTP request is dispatched (before response received).
 * - **type**: `'HttpRequested'`
 * - **url**: Target URL
 * - **method**: HTTP method (GET, POST, etc.)
 * - **responseType**: Expected response format (json or text)
 * - **headers**: Optional request headers
 * - **body**: Optional request body
 * - **now**: Timestamp when request dispatched
 *
 * Use case: Update UI loading state, show progress indicator, log request start.
 *
 * ### HttpCompleted
 * Emitted when HTTP request succeeds with response.
 * - **type**: `'HttpCompleted'`
 * - **requestId**: Correlation ID (matches HTTP_REQUEST command)
 * - **url**: Request URL
 * - **status**: HTTP status code (200, 404, etc.)
 * - **body**: Response body (parsed JSON or text string)
 * - **now**: Timestamp when response received
 *
 * Use case: Process response data, update state, hide loading indicator.
 *
 * ### HttpFailed
 * Emitted when HTTP request fails (network error, timeout, parse error).
 * - **type**: `'HttpFailed'`
 * - **requestId**: Correlation ID (matches HTTP_REQUEST command)
 * - **url**: Request URL
 * - **error**: Error message describing failure
 * - **now**: Timestamp when failure occurred
 *
 * Use case: Show error message, retry logic, fallback behavior.
 *
 * ### NavigateRequested
 * Emitted immediately when navigation is requested (before navigation occurs).
 * - **type**: `'NavigateRequested'`
 * - **url**: Target URL
 * - **mode**: Navigation mode (assign or open)
 * - **target**: Optional window target (_self or _blank)
 * - **now**: Timestamp when navigation requested
 *
 * Use case: Track navigation intent, analytics, cleanup before navigation.
 *
 * ### NavigateCompleted
 * Emitted when navigation completes successfully.
 * - **type**: `'NavigateCompleted'`
 * - **requestId**: Correlation ID (matches NAVIGATE command)
 * - **url**: Target URL
 * - **now**: Timestamp when navigation completed
 *
 * Use case: Confirm navigation success, analytics.
 *
 * ### NavigateFailed
 * Emitted when navigation fails (blocked by browser, invalid URL, etc.).
 * - **type**: `'NavigateFailed'`
 * - **requestId**: Correlation ID (matches NAVIGATE command)
 * - **url**: Target URL
 * - **error**: Error message describing failure
 * - **now**: Timestamp when failure occurred
 *
 * Use case: Show error message, fallback behavior.
 *
 * ### DomFactsReady
 * Emitted when DOM facts extraction succeeds.
 * - **type**: `'DomFactsReady'`
 * - **requestId**: Correlation ID (matches TAKE_DOM_FACTS command)
 * - **facts**: Extracted DOM facts object
 * - **now**: Timestamp when extraction completed
 *
 * Use case: Process DOM facts, initialize gallery, update UI based on page state.
 *
 * ### DomFactsFailed
 * Emitted when DOM facts extraction fails.
 * - **type**: `'DomFactsFailed'`
 * - **requestId**: Correlation ID (matches TAKE_DOM_FACTS command)
 * - **kind**: Type of facts that failed to extract
 * - **error**: Error message describing failure
 * - **now**: Timestamp when failure occurred
 *
 * Use case: Show error message, fallback behavior, retry logic.
 *
 * ### StorageLoaded
 * Emitted when storage read (STORE_GET) succeeds.
 * - **type**: `'StorageLoaded'`
 * - **requestId**: Correlation ID (matches STORE_GET command)
 * - **key**: Storage key that was read
 * - **value**: Retrieved value (null if key doesn't exist)
 * - **now**: Timestamp when read completed
 *
 * Use case: Restore saved state, initialize from persisted data.
 *
 * ### StorageFailed
 * Emitted when storage read (STORE_GET) fails.
 * - **type**: `'StorageFailed'`
 * - **requestId**: Correlation ID (matches STORE_GET command)
 * - **key**: Storage key that failed to read
 * - **error**: Error message describing failure
 * - **now**: Timestamp when failure occurred
 *
 * Use case: Use default values, show error message, retry logic.
 *
 * ### StorageSetCompleted
 * Emitted when storage write (STORE_SET) succeeds.
 * - **type**: `'StorageSetCompleted'`
 * - **requestId**: Correlation ID (matches STORE_SET command)
 * - **key**: Storage key that was written
 * - **now**: Timestamp when write completed
 *
 * Use case: Confirm save success, update UI, analytics.
 *
 * ### StorageSetFailed
 * Emitted when storage write (STORE_SET) fails.
 * - **type**: `'StorageSetFailed'`
 * - **requestId**: Correlation ID (matches STORE_SET command)
 * - **key**: Storage key that failed to write
 * - **error**: Error message describing failure
 * - **now**: Timestamp when failure occurred
 *
 * Use case: Show error message, retry logic, fallback storage.
 *
 * @example
 * ```typescript
 * // Exhaustive event handling
 * function handleEvent(event: RuntimeEvent): void {
 *   switch (event.type) {
 *     case 'Booted':
 *       console.log('Booted at:', event.url);
 *       break;
 *     case 'Tick':
 *       console.log('Tick:', event.tickId);
 *       break;
 *     case 'HttpRequested':
 *       showLoading();
 *       break;
 *     case 'HttpCompleted':
 *       hideLoading();
 *       processResponse(event.body);
 *       break;
 *     case 'HttpFailed':
 *       hideLoading();
 *       showError(event.error);
 *       break;
 *     case 'NavigateRequested':
 *       trackNavigation(event.url);
 *       break;
 *     case 'NavigateCompleted':
 *       console.log('Navigation succeeded');
 *       break;
 *     case 'NavigateFailed':
 *       showError(event.error);
 *       break;
 *     case 'DomFactsReady':
 *       initializeGallery(event.facts);
 *       break;
 *     case 'DomFactsFailed':
 *       console.error('DOM facts failed:', event.error);
 *       break;
 *     case 'StorageLoaded':
 *       restoreState(event.value);
 *       break;
 *     case 'StorageFailed':
 *       useDefaults();
 *       break;
 *     case 'StorageSetCompleted':
 *       showSaveSuccess();
 *       break;
 *     case 'StorageSetFailed':
 *       showSaveError(event.error);
 *       break;
 *     default:
 *       const _exhaustive: never = event;
 *       throw new Error(`Unhandled event: ${_exhaustive}`);
 *   }
 * }
 *
 * // Request-response correlation
 * const pendingRequests = new Map<string, (event: RuntimeEvent) => void>();
 *
 * function sendHttpRequest(url: string): Promise<unknown> {
 *   return new Promise((resolve, reject) => {
 *     const requestId = `http-${Date.now()}`;
 *
 *     pendingRequests.set(requestId, (event) => {
 *       if (event.type === 'HttpCompleted') {
 *         resolve(event.body);
 *       } else if (event.type === 'HttpFailed') {
 *         reject(new Error(event.error));
 *       }
 *     });
 *
 *     dispatchCommand({
 *       type: 'HTTP_REQUEST',
 *       requestId,
 *       url,
 *       method: 'GET',
 *       responseType: 'json',
 *     });
 *   });
 * }
 *
 * function handleResponseEvent(event: RuntimeEvent): void {
 *   if ('requestId' in event) {
 *     const handler = pendingRequests.get(event.requestId);
 *     if (handler) {
 *       handler(event);
 *       pendingRequests.delete(event.requestId);
 *     }
 *   }
 * }
 * ```
 *
 * @see {@link RuntimeCommand} for related command types
 */
export type RuntimeEvent =
  | { readonly type: 'Booted'; readonly url: string; readonly now: number }
  | { readonly type: 'Tick'; readonly tickId: string; readonly now: number }
  | {
      readonly type: 'HttpRequested';
      readonly url: string;
      readonly method: HttpMethod;
      readonly responseType: HttpResponseType;
      readonly headers?: Readonly<Record<string, string>>;
      readonly body?: string;
      readonly now: number;
    }
  | {
      readonly type: 'NavigateRequested';
      readonly url: string;
      readonly mode: NavigateMode;
      readonly target?: '_self' | '_blank';
      readonly now: number;
    }
  | {
      readonly type: 'DomFactsReady';
      readonly requestId: string;
      readonly facts: DomFacts;
      readonly now: number;
    }
  | {
      readonly type: 'DomFactsFailed';
      readonly requestId: string;
      readonly kind: DomFactsKind;
      readonly error: string;
      readonly now: number;
    }
  | {
      readonly type: 'HttpCompleted';
      readonly requestId: string;
      readonly url: string;
      readonly status: number;
      readonly body: unknown;
      readonly now: number;
    }
  | {
      readonly type: 'HttpFailed';
      readonly requestId: string;
      readonly url: string;
      readonly error: string;
      readonly now: number;
    }
  | {
      readonly type: 'NavigateCompleted';
      readonly requestId: string;
      readonly url: string;
      readonly now: number;
    }
  | {
      readonly type: 'NavigateFailed';
      readonly requestId: string;
      readonly url: string;
      readonly error: string;
      readonly now: number;
    }
  | {
      readonly type: 'StorageLoaded';
      readonly requestId: string;
      readonly key: string;
      readonly value: unknown;
      readonly now: number;
    }
  | {
      readonly type: 'StorageSetCompleted';
      readonly requestId: string;
      readonly key: string;
      readonly now: number;
    }
  | {
      readonly type: 'StorageSetFailed';
      readonly requestId: string;
      readonly key: string;
      readonly error: string;
      readonly now: number;
    }
  | {
      readonly type: 'StorageFailed';
      readonly requestId: string;
      readonly key: string;
      readonly error: string;
      readonly now: number;
    };

// ============================================================================
// Type Helpers
// ============================================================================

/**
 * Type helper: Extract event type discriminator union
 *
 * @remarks
 * Provides a union of all event type strings for type-safe event type checking.
 *
 * @example
 * ```typescript
 * type EventType = RuntimeEventType;
 * // 'Booted' | 'Tick' | 'HttpRequested' | 'HttpCompleted' | 'HttpFailed' | ...
 *
 * function isValidEventType(type: string): type is RuntimeEventType {
 *   const validTypes: readonly RuntimeEventType[] = [
 *     'Booted', 'Tick', 'HttpRequested', 'HttpCompleted', 'HttpFailed',
 *     'NavigateRequested', 'NavigateCompleted', 'NavigateFailed',
 *     'DomFactsReady', 'DomFactsFailed',
 *     'StorageLoaded', 'StorageFailed', 'StorageSetCompleted', 'StorageSetFailed',
 *   ];
 *   return validTypes.includes(type as RuntimeEventType);
 * }
 * ```
 */
export type RuntimeEventType = RuntimeEvent['type'];

/**
 * Type helper: Extract specific event variant by type discriminator
 *
 * @remarks
 * Allows type-safe extraction of a specific event variant from the RuntimeEvent union.
 *
 * @example
 * ```typescript
 * type HttpCompletedEvent = ExtractEvent<'HttpCompleted'>;
 * // { readonly type: 'HttpCompleted'; readonly requestId: string; ... }
 *
 * type BootedEvent = ExtractEvent<'Booted'>;
 * // { readonly type: 'Booted'; readonly url: string; readonly now: number }
 *
 * function handleHttpCompleted(event: ExtractEvent<'HttpCompleted'>): void {
 *   console.log('Status:', event.status, 'Body:', event.body);
 * }
 *
 * function createBootedEvent(url: string): ExtractEvent<'Booted'> {
 *   return {
 *     type: 'Booted',
 *     url,
 *     now: Date.now(),
 *   };
 * }
 * ```
 */
export type ExtractEvent<T extends RuntimeEventType> = Extract<RuntimeEvent, { type: T }>;

/**
 * Type helper: Extract events that include requestId field (async responses)
 *
 * @remarks
 * Filters RuntimeEvent union to only include event variants with async correlation capability
 * (those that have a requestId field). Useful for implementing request-response correlation.
 *
 * @example
 * ```typescript
 * type AsyncEvent = AsyncRuntimeEvent;
 * // HttpCompleted | HttpFailed | NavigateCompleted | NavigateFailed |
 * // DomFactsReady | DomFactsFailed | StorageLoaded | StorageFailed |
 * // StorageSetCompleted | StorageSetFailed
 *
 * function hasRequestId(event: RuntimeEvent): event is AsyncRuntimeEvent {
 *   return 'requestId' in event;
 * }
 *
 * function correlateResponse(
 *   event: AsyncRuntimeEvent,
 *   pendingRequests: Map<string, Function>
 * ): void {
 *   const handler = pendingRequests.get(event.requestId);
 *   if (handler) {
 *     handler(event);
 *     pendingRequests.delete(event.requestId);
 *   }
 * }
 * ```
 */
export type AsyncRuntimeEvent = Extract<RuntimeEvent, { requestId: string }>;

/**
 * Type helper: Extract events without requestId field (fire-and-forget)
 *
 * @remarks
 * Filters RuntimeEvent union to only include event variants without async correlation.
 * These events are fire-and-forget notifications without command correlation.
 *
 * @example
 * ```typescript
 * type SyncEvent = SyncRuntimeEvent;
 * // Booted | Tick | HttpRequested | NavigateRequested
 *
 * function isSyncEvent(event: RuntimeEvent): event is SyncRuntimeEvent {
 *   return !('requestId' in event);
 * }
 *
 * function handleSyncEvent(event: SyncRuntimeEvent): void {
 *   // Handle events without request correlation
 *   switch (event.type) {
 *     case 'Booted':
 *       initializeApp(event.url);
 *       break;
 *     case 'Tick':
 *       handleTick(event.tickId);
 *       break;
 *     case 'HttpRequested':
 *       showLoadingIndicator();
 *       break;
 *     case 'NavigateRequested':
 *       trackNavigation(event.url);
 *       break;
 *   }
 * }
 * ```
 */
export type SyncRuntimeEvent = Exclude<RuntimeEvent, { requestId: string }>;

/**
 * Type helper: Extract success events (completed operations)
 *
 * @remarks
 * Filters RuntimeEvent union to only include successful operation outcomes.
 * Useful for implementing success-only handlers or analytics.
 *
 * @example
 * ```typescript
 * type SuccessEvent = SuccessRuntimeEvent;
 * // HttpCompleted | NavigateCompleted | DomFactsReady |
 * // StorageLoaded | StorageSetCompleted
 *
 * function isSuccessEvent(event: RuntimeEvent): event is SuccessRuntimeEvent {
 *   return (
 *     event.type === 'HttpCompleted' ||
 *     event.type === 'NavigateCompleted' ||
 *     event.type === 'DomFactsReady' ||
 *     event.type === 'StorageLoaded' ||
 *     event.type === 'StorageSetCompleted'
 *   );
 * }
 *
 * function trackSuccessMetrics(event: SuccessRuntimeEvent): void {
 *   analytics.track('operation_success', {
 *     type: event.type,
 *     timestamp: event.now,
 *   });
 * }
 * ```
 */
export type SuccessRuntimeEvent = Extract<
  RuntimeEvent,
  | { type: 'HttpCompleted' }
  | { type: 'NavigateCompleted' }
  | { type: 'DomFactsReady' }
  | { type: 'StorageLoaded' }
  | { type: 'StorageSetCompleted' }
>;

/**
 * Type helper: Extract failure events (failed operations)
 *
 * @remarks
 * Filters RuntimeEvent union to only include failed operation outcomes.
 * All failure events include an `error` field with the error message.
 *
 * @example
 * ```typescript
 * type FailureEvent = FailureRuntimeEvent;
 * // HttpFailed | NavigateFailed | DomFactsFailed |
 * // StorageFailed | StorageSetFailed
 *
 * function isFailureEvent(event: RuntimeEvent): event is FailureRuntimeEvent {
 *   return (
 *     event.type === 'HttpFailed' ||
 *     event.type === 'NavigateFailed' ||
 *     event.type === 'DomFactsFailed' ||
 *     event.type === 'StorageFailed' ||
 *     event.type === 'StorageSetFailed'
 *   );
 * }
 *
 * function handleFailure(event: FailureRuntimeEvent): void {
 *   console.error(`Operation failed: ${event.type}`, event.error);
 *
 *   // All failure events have error field
 *   showErrorNotification(event.error);
 *
 *   // Track error metrics
 *   analytics.track('operation_failure', {
 *     type: event.type,
 *     error: event.error,
 *     timestamp: event.now,
 *   });
 * }
 * ```
 */
export type FailureRuntimeEvent = Extract<RuntimeEvent, { error: string }>;
