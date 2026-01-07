/**
 * @fileoverview Runtime command type definitions for effect system
 *
 * ## Purpose
 * Defines discriminated union types for all runtime commands used in the application's effect system.
 * These commands represent side effects that are dispatched from pure business logic and executed
 * by the runtime layer (adapters, services, browser APIs).
 *
 * ## Key Responsibilities
 * - **Type Safety**: Provide compile-time type checking for all command variants
 * - **Discriminated Unions**: Enable exhaustive pattern matching via `type` discriminator
 * - **Effect Isolation**: Separate pure logic from side effects (I/O, storage, navigation)
 * - **Request Tracking**: Support async command responses via `requestId` correlation
 *
 * ## Command Categories
 * 1. **DOM Operations**: TAKE_DOM_FACTS - Extract DOM information
 * 2. **Storage Operations**: STORE_GET, STORE_SET - Persistent storage access
 * 3. **Network Operations**: HTTP_REQUEST - HTTP requests with typed responses
 * 4. **Navigation**: NAVIGATE - URL navigation and window management
 * 5. **Logging**: LOG - Structured logging with levels and context
 * 6. **Scheduling**: SCHEDULE_TICK, CANCEL_TICK - Interval-based operations
 *
 * ## Design Pattern
 * Commands follow the Command Pattern:
 * - Immutable readonly properties
 * - Type discriminator for pattern matching
 * - Request ID for async correlation (where applicable)
 * - No implementation logic (pure data structures)
 *
 * ## Usage Pattern
 * Commands are dispatched from business logic and handled by runtime adapters:
 *
 * ```typescript
 * // Business logic creates commands
 * const cmd: RuntimeCommand = {
 *   type: 'HTTP_REQUEST',
 *   requestId: 'req-123',
 *   url: 'https://api.example.com/data',
 *   method: 'GET',
 *   responseType: 'json',
 * };
 *
 * // Runtime adapter executes commands
 * function handleCommand(cmd: RuntimeCommand): void {
 *   switch (cmd.type) {
 *     case 'HTTP_REQUEST':
 *       return executeHttpRequest(cmd);
 *     case 'STORE_GET':
 *       return executeStorageGet(cmd);
 *     // ... other cases
 *   }
 * }
 * ```
 *
 * @module core/cmd
 * @see {@link RuntimeCommand} for the main command union type
 * @see {@link module:core/update} for command execution runtime
 */

import type { DomFactsKind } from '@core/dom-facts';

/**
 * Log severity levels for LOG command
 *
 * @remarks
 * Matches standard logging levels with increasing severity:
 * - `debug`: Detailed diagnostic information for development
 * - `info`: General informational messages
 * - `warn`: Warning messages for potentially harmful situations
 * - `error`: Error messages for failures and exceptions
 *
 * @example
 * ```typescript
 * const logCmd: RuntimeCommand = {
 *   type: 'LOG',
 *   level: 'info',
 *   message: 'User action completed',
 *   context: { userId: '123', action: 'download' },
 * };
 * ```
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * HTTP request methods for HTTP_REQUEST command
 *
 * @remarks
 * Supports standard RESTful HTTP verbs. Used to specify request method
 * when dispatching HTTP_REQUEST commands.
 *
 * @example
 * ```typescript
 * const getRequest: RuntimeCommand = {
 *   type: 'HTTP_REQUEST',
 *   requestId: 'req-001',
 *   url: 'https://api.twitter.com/graphql',
 *   method: 'GET',
 *   responseType: 'json',
 * };
 * ```
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * HTTP response content type for HTTP_REQUEST command
 *
 * @remarks
 * Determines how the response body is parsed:
 * - `json`: Parse response as JSON (returns object/array)
 * - `text`: Return response as plain text string
 *
 * @example
 * ```typescript
 * // JSON response
 * const jsonRequest: RuntimeCommand = {
 *   type: 'HTTP_REQUEST',
 *   requestId: 'req-002',
 *   url: '/api/settings',
 *   method: 'GET',
 *   responseType: 'json', // Response parsed as JSON
 * };
 *
 * // Text response
 * const textRequest: RuntimeCommand = {
 *   type: 'HTTP_REQUEST',
 *   requestId: 'req-003',
 *   url: '/api/raw-data',
 *   method: 'GET',
 *   responseType: 'text', // Response returned as string
 * };
 * ```
 */
export type HttpResponseType = 'json' | 'text';

/**
 * Navigation mode for NAVIGATE command
 *
 * @remarks
 * Controls how navigation is performed:
 * - `assign`: Replace current location (window.location.assign)
 * - `open`: Open in new window/tab (window.open)
 *
 * @example
 * ```typescript
 * // Navigate in current window
 * const assignNav: RuntimeCommand = {
 *   type: 'NAVIGATE',
 *   requestId: 'nav-001',
 *   url: 'https://twitter.com/status/123',
 *   mode: 'assign',
 * };
 *
 * // Open in new tab
 * const openNav: RuntimeCommand = {
 *   type: 'NAVIGATE',
 *   requestId: 'nav-002',
 *   url: 'https://example.com',
 *   mode: 'open',
 *   target: '_blank',
 * };
 * ```
 */
export type NavigateMode = 'assign' | 'open';

/**
 * Discriminated union of all runtime commands
 *
 * @remarks
 * Each command variant has a unique `type` field for pattern matching.
 * Commands with async responses include a `requestId` for correlation.
 *
 * ## Command Variants
 *
 * ### TAKE_DOM_FACTS
 * Extract DOM information (tweet containers, media elements, etc.)
 * - **requestId**: Correlation ID for async response
 * - **kind**: Type of DOM facts to extract (from DomFactsKind enum)
 *
 * ### STORE_GET
 * Read value from persistent storage (GM_getValue)
 * - **requestId**: Correlation ID for async response
 * - **key**: Storage key to read
 *
 * ### STORE_SET
 * Write value to persistent storage (GM_setValue)
 * - **requestId**: Correlation ID for async response
 * - **key**: Storage key to write
 * - **value**: Data to store (any JSON-serializable value)
 *
 * ### HTTP_REQUEST
 * Perform HTTP request (fetch API or GM_xmlhttpRequest)
 * - **requestId**: Correlation ID for async response
 * - **url**: Target URL (absolute or relative)
 * - **method**: HTTP method (GET, POST, etc.)
 * - **headers**: Optional request headers
 * - **body**: Optional request body (for POST/PUT)
 * - **responseType**: Expected response format (json or text)
 *
 * ### NAVIGATE
 * Navigate to URL (location.assign or window.open)
 * - **requestId**: Correlation ID for async response
 * - **url**: Target URL
 * - **mode**: Navigation mode (assign or open)
 * - **target**: Optional window target (_self or _blank)
 *
 * ### LOG
 * Log message with structured context
 * - **level**: Log severity (debug, info, warn, error)
 * - **message**: Log message text
 * - **context**: Optional structured metadata
 *
 * ### SCHEDULE_TICK
 * Schedule recurring interval callback
 * - **id**: Unique identifier for cancellation
 * - **intervalMs**: Interval duration in milliseconds
 *
 * ### CANCEL_TICK
 * Cancel scheduled interval
 * - **id**: Identifier of interval to cancel
 *
 * @example
 * ```typescript
 * // Exhaustive pattern matching
 * function handleCommand(cmd: RuntimeCommand): void {
 *   switch (cmd.type) {
 *     case 'TAKE_DOM_FACTS':
 *       console.log('Extracting DOM facts:', cmd.kind);
 *       break;
 *     case 'STORE_GET':
 *       console.log('Reading storage key:', cmd.key);
 *       break;
 *     case 'STORE_SET':
 *       console.log('Writing storage:', cmd.key, cmd.value);
 *       break;
 *     case 'HTTP_REQUEST':
 *       console.log('HTTP request:', cmd.method, cmd.url);
 *       break;
 *     case 'NAVIGATE':
 *       console.log('Navigating to:', cmd.url);
 *       break;
 *     case 'LOG':
 *       console.log(`[${cmd.level.toUpperCase()}]`, cmd.message);
 *       break;
 *     case 'SCHEDULE_TICK':
 *       console.log('Scheduling tick:', cmd.id, cmd.intervalMs);
 *       break;
 *     case 'CANCEL_TICK':
 *       console.log('Canceling tick:', cmd.id);
 *       break;
 *     default:
 *       // TypeScript ensures exhaustiveness
 *       const _exhaustive: never = cmd;
 *       throw new Error(`Unhandled command: ${_exhaustive}`);
 *   }
 * }
 * ```
 */
export type RuntimeCommand =
  | {
      readonly type: 'TAKE_DOM_FACTS';
      readonly requestId: string;
      readonly kind: DomFactsKind;
    }
  | {
      readonly type: 'STORE_GET';
      readonly requestId: string;
      readonly key: string;
    }
  | {
      readonly type: 'STORE_SET';
      readonly requestId: string;
      readonly key: string;
      readonly value: unknown;
    }
  | {
      readonly type: 'HTTP_REQUEST';
      readonly requestId: string;
      readonly url: string;
      readonly method: HttpMethod;
      readonly headers?: Readonly<Record<string, string>>;
      readonly body?: string;
      readonly responseType: HttpResponseType;
    }
  | {
      readonly type: 'NAVIGATE';
      readonly requestId: string;
      readonly url: string;
      readonly mode: NavigateMode;
      readonly target?: '_self' | '_blank';
    }
  | {
      readonly type: 'LOG';
      readonly level: LogLevel;
      readonly message: string;
      readonly context?: Readonly<Record<string, unknown>>;
    }
  | {
      readonly type: 'SCHEDULE_TICK';
      readonly id: string;
      readonly intervalMs: number;
    }
  | { readonly type: 'CANCEL_TICK'; readonly id: string };

// ============================================================================
// Type Helpers
// ============================================================================

/**
 * Type helper: Extract command type discriminator union
 *
 * @remarks
 * Provides a union of all command type strings for type-safe command type checking.
 *
 * @example
 * ```typescript
 * type CommandType = RuntimeCommandType;
 * // 'TAKE_DOM_FACTS' | 'STORE_GET' | 'STORE_SET' | 'HTTP_REQUEST' | ...
 *
 * function isValidCommandType(type: string): type is RuntimeCommandType {
 *   const validTypes: readonly RuntimeCommandType[] = [
 *     'TAKE_DOM_FACTS', 'STORE_GET', 'STORE_SET', 'HTTP_REQUEST',
 *     'NAVIGATE', 'LOG', 'SCHEDULE_TICK', 'CANCEL_TICK',
 *   ];
 *   return validTypes.includes(type as RuntimeCommandType);
 * }
 * ```
 */
export type RuntimeCommandType = RuntimeCommand['type'];

/**
 * Type helper: Extract specific command variant by type discriminator
 *
 * @remarks
 * Allows type-safe extraction of a specific command variant from the RuntimeCommand union.
 *
 * @example
 * ```typescript
 * type HttpRequestCmd = ExtractCommand<'HTTP_REQUEST'>;
 * // { readonly type: 'HTTP_REQUEST'; readonly requestId: string; ... }
 *
 * type LogCmd = ExtractCommand<'LOG'>;
 * // { readonly type: 'LOG'; readonly level: LogLevel; ... }
 *
 * function createHttpRequest(
 *   requestId: string,
 *   url: string,
 *   method: HttpMethod = 'GET'
 * ): ExtractCommand<'HTTP_REQUEST'> {
 *   return {
 *     type: 'HTTP_REQUEST',
 *     requestId,
 *     url,
 *     method,
 *     responseType: 'json',
 *   };
 * }
 * ```
 */
export type ExtractCommand<T extends RuntimeCommandType> = Extract<RuntimeCommand, { type: T }>;

/**
 * Type helper: Extract commands that include requestId field
 *
 * @remarks
 * Filters RuntimeCommand union to only include command variants with async responses
 * (those that have a requestId field). Useful for implementing request correlation logic.
 *
 * @example
 * ```typescript
 * type AsyncCmd = AsyncRuntimeCommand;
 * // TAKE_DOM_FACTS | STORE_GET | STORE_SET | HTTP_REQUEST | NAVIGATE
 *
 * function hasRequestId(cmd: RuntimeCommand): cmd is AsyncRuntimeCommand {
 *   return 'requestId' in cmd;
 * }
 *
 * function correlateResponse(
 *   cmd: AsyncRuntimeCommand,
 *   response: unknown
 * ): void {
 *   console.log(`Response for ${cmd.requestId}:`, response);
 * }
 * ```
 */
export type AsyncRuntimeCommand = Extract<RuntimeCommand, { requestId: string }>;

/**
 * Type helper: Extract commands without requestId field (fire-and-forget)
 *
 * @remarks
 * Filters RuntimeCommand union to only include command variants without async responses.
 * These commands are fire-and-forget (no correlation needed).
 *
 * @example
 * ```typescript
 * type SyncCmd = SyncRuntimeCommand;
 * // LOG | SCHEDULE_TICK | CANCEL_TICK
 *
 * function isSyncCommand(cmd: RuntimeCommand): cmd is SyncRuntimeCommand {
 *   return !('requestId' in cmd);
 * }
 *
 * function executeSync(cmd: SyncRuntimeCommand): void {
 *   // Execute immediately, no response expected
 *   switch (cmd.type) {
 *     case 'LOG':
 *       logger.log(cmd);
 *       break;
 *     case 'SCHEDULE_TICK':
 *       scheduler.schedule(cmd);
 *       break;
 *     case 'CANCEL_TICK':
 *       scheduler.cancel(cmd);
 *       break;
 *   }
 * }
 * ```
 */
export type SyncRuntimeCommand = Exclude<RuntimeCommand, { requestId: string }>;
