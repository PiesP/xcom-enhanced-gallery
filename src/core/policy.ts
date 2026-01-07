/**
 * @fileoverview Runtime policy constants and error handling utilities
 *
 * ## Purpose
 * Defines application-level policy constants and error formatting utilities for the effect system.
 * Policy constants establish runtime behavior boundaries, resource limits, and operational rules
 * that govern command execution and state management.
 *
 * ## Key Responsibilities
 * - **Storage Keys**: Define persistent storage keys for runtime state
 * - **Timing Policies**: Establish default intervals and timeouts
 * - **Error Formatting**: Standardize error message formatting
 * - **Runtime Constraints**: Define operational limits and thresholds
 *
 * ## Policy Categories
 * 1. **Storage Policies**: Keys for persistent state (localStorage/GM_setValue)
 * 2. **Timing Policies**: Default intervals, timeouts, debounce/throttle durations
 * 3. **Error Handling**: Error message normalization and formatting
 *
 * ## Design Principles
 * 1. **Centralization**: All policies defined in single location
 * 2. **Immutability**: Constants use `const` and `as const` assertions
 * 3. **Readability**: Human-readable values with underscores for large numbers
 * 4. **Versioning**: Storage keys include version for schema migration support
 * 5. **Documentation**: Each policy explains its purpose and impact
 *
 * ## Storage Key Versioning
 * Storage keys include version suffixes (e.g., `:v1`) to enable schema migration:
 * - Breaking changes increment version: `xeg:key:v1` → `xeg:key:v2`
 * - Old versions can be migrated or deprecated gracefully
 * - Prevents data corruption from schema incompatibilities
 *
 * ## Usage Pattern
 * ```typescript
 * // Import policies
 * import {
 *   COMMAND_RUNTIME_STORAGE_KEY,
 *   COMMAND_RUNTIME_DEFAULT_TICK_MS,
 *   formatErrorMessage,
 * } from '@core/policy';
 *
 * // Use storage key for persistence
 * await storage.set(COMMAND_RUNTIME_STORAGE_KEY, runtimeState);
 *
 * // Use default tick interval
 * const tickInterval = options.tickMs ?? COMMAND_RUNTIME_DEFAULT_TICK_MS;
 *
 * // Format error for logging
 * try {
 *   dangerousOperation();
 * } catch (error) {
 *   console.error(formatErrorMessage(error));
 * }
 * ```
 *
 * @module core/policy
 * @see {@link COMMAND_RUNTIME_STORAGE_KEY} for runtime state storage key
 * @see {@link COMMAND_RUNTIME_DEFAULT_TICK_MS} for default tick interval
 * @see {@link formatErrorMessage} for error formatting utility
 */

import { normalizeErrorMessage } from '@shared/error/normalize';

/**
 * Storage key for persisting command runtime state
 *
 * @remarks
 * Persistent storage key for saving and restoring runtime state across page loads.
 * The state includes scheduled tasks, in-flight requests, and cached data that should
 * survive page navigation or browser restarts.
 *
 * ## Key Format
 * - **Prefix**: `xeg:` - Application namespace (X.com Enhanced Gallery)
 * - **Domain**: `command-runtime` - Identifies runtime state domain
 * - **Version**: `v1` - Schema version for migration support
 *
 * ## Stored Data
 * The runtime state typically includes:
 * - Scheduled task configurations (tickId, interval)
 * - Pending request metadata (for recovery)
 * - User preferences (theme, language, settings)
 * - Cached API responses (for offline capability)
 *
 * ## Version Migration
 * When schema changes require breaking updates:
 * 1. Create new key with incremented version: `xeg:command-runtime:v2`
 * 2. Implement migration logic to transfer data from v1 to v2
 * 3. Deprecate old key after successful migration
 * 4. Clean up old storage after grace period
 *
 * ## Storage Backend
 * Stored using:
 * - **Userscript**: GM_setValue (persistent across sessions)
 * - **Browser**: localStorage (domain-scoped persistence)
 *
 * ## Security Considerations
 * - Do not store sensitive data (tokens, passwords)
 * - Validate data on load (schema validation)
 * - Handle corrupted data gracefully (reset to defaults)
 *
 * @example
 * ```typescript
 * // Save runtime state
 * import { COMMAND_RUNTIME_STORAGE_KEY } from '@core/policy';
 * import { getPersistentStorage } from '@shared/services/persistent-storage';
 *
 * const storage = getPersistentStorage();
 * const runtimeState = {
 *   schedule: {
 *     tickId: 'poller',
 *     tickEveryMs: 30000,
 *   },
 *   cache: {
 *     'https://api.x.com/data': responseData,
 *   },
 * };
 *
 * await storage.set(COMMAND_RUNTIME_STORAGE_KEY, runtimeState);
 *
 * // Load runtime state
 * const savedState = await storage.get<RuntimeState>(COMMAND_RUNTIME_STORAGE_KEY);
 * if (savedState) {
 *   // Validate and restore state
 *   if (isValidRuntimeState(savedState)) {
 *     restoreRuntimeState(savedState);
 *   } else {
 *     console.warn('Invalid saved state, using defaults');
 *   }
 * }
 *
 * // Migration example
 * async function migrateRuntimeState(): Promise<void> {
 *   const oldState = await storage.get('xeg:command-runtime:v1');
 *   if (oldState) {
 *     const newState = transformToV2(oldState);
 *     await storage.set('xeg:command-runtime:v2', newState);
 *     await storage.remove('xeg:command-runtime:v1');
 *   }
 * }
 * ```
 *
 * @see {@link module:shared/services/persistent-storage} for storage interface
 * @constant
 */
export const COMMAND_RUNTIME_STORAGE_KEY = 'xeg:command-runtime:v1';

/**
 * Default tick interval in milliseconds for scheduled tasks
 *
 * @remarks
 * Default duration between tick events when no explicit interval is specified.
 * Used for periodic polling, state refresh, cleanup tasks, and background operations.
 *
 * ## Value
 * - **30,000 ms** (30 seconds) - Balances responsiveness with performance
 * - Uses underscore separator for readability: `30_000`
 *
 * ## Use Cases
 * 1. **Polling**: Check for new content, API updates, DOM changes
 * 2. **Cleanup**: Remove stale cache entries, expired requests
 * 3. **Sync**: Synchronize state with external systems
 * 4. **Health Checks**: Verify service availability, connection status
 *
 * ## Performance Considerations
 * - **CPU Impact**: 30-second interval minimizes CPU usage
 * - **Battery Impact**: Longer intervals conserve battery on laptops
 * - **Responsiveness**: Short enough for timely updates (30s acceptable for most use cases)
 * - **Network**: Reduces API request frequency, respects rate limits
 *
 * ## Customization
 * Components can override this default when scheduling tasks:
 * ```typescript
 * // Use default interval
 * dispatch({
 *   type: 'SCHEDULE_TICK',
 *   id: 'poller',
 *   everyMs: COMMAND_RUNTIME_DEFAULT_TICK_MS,
 * });
 *
 * // Override with custom interval
 * dispatch({
 *   type: 'SCHEDULE_TICK',
 *   id: 'fast-poller',
 *   everyMs: 5000, // 5 seconds
 * });
 * ```
 *
 * ## Timing Guarantees
 * - **Minimum**: Browser/runtime enforces minimum ~4ms interval
 * - **Accuracy**: setTimeout/setInterval not perfectly accurate (±few ms jitter)
 * - **Background**: Browsers may throttle intervals in background tabs
 *
 * @example
 * ```typescript
 * // Schedule periodic task with default interval
 * import { COMMAND_RUNTIME_DEFAULT_TICK_MS } from '@core/policy';
 * import type { RuntimeCommand } from '@core/cmd';
 *
 * function startPolling(dispatch: (cmd: RuntimeCommand) => void): void {
 *   const scheduleCmd: RuntimeCommand = {
 *     type: 'SCHEDULE_TICK',
 *     id: 'content-poller',
 *     everyMs: COMMAND_RUNTIME_DEFAULT_TICK_MS,
 *   };
 *   dispatch(scheduleCmd);
 * }
 *
 * // Handle tick events
 * function handleTick(event: RuntimeEvent): void {
 *   if (event.type === 'Tick' && event.tickId === 'content-poller') {
 *     // Perform periodic task
 *     checkForNewContent();
 *   }
 * }
 *
 * // Configurable interval with fallback to default
 * function scheduleWithInterval(
 *   dispatch: (cmd: RuntimeCommand) => void,
 *   customInterval?: number
 * ): void {
 *   const interval = customInterval ?? COMMAND_RUNTIME_DEFAULT_TICK_MS;
 *
 *   dispatch({
 *     type: 'SCHEDULE_TICK',
 *     id: 'task',
 *     everyMs: interval,
 *   });
 * }
 * ```
 *
 * @see {@link module:core/cmd} for SCHEDULE_TICK command
 * @see {@link module:core/events} for Tick event
 * @constant
 */
export const COMMAND_RUNTIME_DEFAULT_TICK_MS = 30_000;

/**
 * Format error message with normalization and standardization
 *
 * @remarks
 * Wrapper around error normalization utility to ensure consistent error message formatting
 * across the application. Converts various error types (Error objects, strings, unknown values)
 * into standardized string messages suitable for logging and user display.
 *
 * ## Error Type Handling
 * The function handles multiple error representations:
 * - **Error objects**: Extracts `.message` property
 * - **Strings**: Used directly as message
 * - **Objects with message**: Extracts message field
 * - **Other types**: Converts to string representation
 * - **null/undefined**: Returns default error message
 *
 * ## Normalization Features
 * - Removes stack traces (security/privacy)
 * - Truncates excessively long messages
 * - Sanitizes sensitive information (tokens, passwords)
 * - Ensures printable characters only
 * - Provides fallback for edge cases
 *
 * ## Use Cases
 * 1. **Logging**: Format errors for console/file logs
 * 2. **User Display**: Show user-friendly error messages
 * 3. **Analytics**: Track error types and frequencies
 * 4. **Debugging**: Consistent error reporting format
 *
 * ## Security Considerations
 * - Do not expose internal error details to users
 * - Sanitize file paths, URLs, user data from messages
 * - Avoid logging sensitive information
 * - Consider different error messages for dev vs production
 *
 * @param error - Error value to format (any type accepted)
 * @returns Normalized error message string
 *
 * @example
 * ```typescript
 * // Format various error types
 * import { formatErrorMessage } from '@core/policy';
 *
 * // Error object
 * try {
 *   dangerousOperation();
 * } catch (error) {
 *   console.error(formatErrorMessage(error));
 *   // Output: "Operation failed: invalid parameter"
 * }
 *
 * // String error
 * const error = 'Network request failed';
 * console.error(formatErrorMessage(error));
 * // Output: "Network request failed"
 *
 * // Unknown error
 * function handleUnknownError(error: unknown): void {
 *   const message = formatErrorMessage(error);
 *   showNotification(message, { type: 'error' });
 * }
 *
 * // Async error handling
 * async function fetchData(): Promise<void> {
 *   try {
 *     const response = await fetch('/api/data');
 *     if (!response.ok) {
 *       throw new Error(`HTTP ${response.status}`);
 *     }
 *   } catch (error) {
 *     console.error('Fetch failed:', formatErrorMessage(error));
 *   }
 * }
 *
 * // Event error handling
 * function handleEventError(event: RuntimeEvent): void {
 *   if (event.type === 'HttpFailed') {
 *     const formattedError = formatErrorMessage(event.error);
 *     logError('HTTP request failed', {
 *       url: event.url,
 *       error: formattedError,
 *       timestamp: event.now,
 *     });
 *   }
 * }
 * ```
 *
 * @see {@link module:shared/error/normalize} for normalization implementation
 */
export function formatErrorMessage(error: unknown): string {
  return normalizeErrorMessage(error);
}

// ============================================================================
// Type Helpers
// ============================================================================

/**
 * Type helper: Policy constant keys union type
 *
 * @remarks
 * Union type of all policy constant names exported from this module.
 * Useful for type-safe policy access and validation.
 *
 * @example
 * ```typescript
 * // Type-safe policy access
 * type PolicyKey = PolicyConstantKey;
 * // 'COMMAND_RUNTIME_STORAGE_KEY' | 'COMMAND_RUNTIME_DEFAULT_TICK_MS'
 *
 * // Policy registry
 * const policies: Record<PolicyConstantKey, unknown> = {
 *   COMMAND_RUNTIME_STORAGE_KEY: 'xeg:command-runtime:v1',
 *   COMMAND_RUNTIME_DEFAULT_TICK_MS: 30000,
 * };
 *
 * // Validate policy existence
 * function hasPolicy(key: string): key is PolicyConstantKey {
 *   return key === 'COMMAND_RUNTIME_STORAGE_KEY' ||
 *          key === 'COMMAND_RUNTIME_DEFAULT_TICK_MS';
 * }
 * ```
 */
export type PolicyConstantKey = 'COMMAND_RUNTIME_STORAGE_KEY' | 'COMMAND_RUNTIME_DEFAULT_TICK_MS';

/**
 * Type helper: Storage key pattern type
 *
 * @remarks
 * Template literal type for validating storage key format.
 * Ensures keys follow the `xeg:domain:version` pattern.
 *
 * @example
 * ```typescript
 * // Valid storage keys
 * const validKey1: StorageKeyPattern = 'xeg:command-runtime:v1';
 * const validKey2: StorageKeyPattern = 'xeg:settings:v2';
 *
 * // Type-safe storage key validation
 * function isValidStorageKey(key: string): key is StorageKeyPattern {
 *   return /^xeg:[a-z-]+:v\d+$/.test(key);
 * }
 *
 * // Generate versioned storage key
 * function createStorageKey<T extends string>(
 *   domain: T,
 *   version: number
 * ): `xeg:${T}:v${number}` {
 *   return `xeg:${domain}:v${version}`;
 * }
 *
 * const key = createStorageKey('user-prefs', 1);
 * // Type: 'xeg:user-prefs:v1'
 * ```
 */
export type StorageKeyPattern = `xeg:${string}:v${number}`;

/**
 * Type helper: Timing policy value type (milliseconds)
 *
 * @remarks
 * Branded type for timing policy values to prevent confusion with other numeric values.
 * Ensures millisecond values are explicitly typed and documented.
 *
 * @example
 * ```typescript
 * // Type-safe timing value
 * const interval: TimingPolicyMs = 30000;
 *
 * // Timing policy validation
 * function isValidInterval(value: number): value is TimingPolicyMs {
 *   return value > 0 && value <= 300_000; // max 5 minutes
 * }
 *
 * // Create timing policy
 * function createTimingPolicy(
 *   name: string,
 *   ms: TimingPolicyMs
 * ): TimingPolicy {
 *   return { name, intervalMs: ms };
 * }
 *
 * const policy = createTimingPolicy(
 *   'default-tick',
 *   COMMAND_RUNTIME_DEFAULT_TICK_MS
 * );
 * ```
 */
export type TimingPolicyMs = number & { readonly __brand: 'TimingPolicyMs' };

/**
 * Type helper: Error formatter function signature
 *
 * @remarks
 * Standard signature for error formatting functions. Accepts any error type
 * and returns normalized string message.
 *
 * @example
 * ```typescript
 * // Implement custom error formatter
 * const customFormatter: ErrorFormatter = (error) => {
 *   const baseMessage = formatErrorMessage(error);
 *   return `[APP ERROR] ${baseMessage}`;
 * };
 *
 * // Compose formatters
 * function composeFormatters(
 *   formatters: ErrorFormatter[]
 * ): ErrorFormatter {
 *   return (error) => {
 *     let message = String(error);
 *     for (const formatter of formatters) {
 *       message = formatter(message);
 *     }
 *     return message;
 *   };
 * }
 *
 * // Conditional formatting
 * function createFormatter(isDev: boolean): ErrorFormatter {
 *   return isDev
 *     ? (error) => formatErrorMessage(error) + '\n' + getStackTrace(error)
 *     : (error) => formatErrorMessage(error);
 * }
 * ```
 */
export type ErrorFormatter = (error: unknown) => string;
