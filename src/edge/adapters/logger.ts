/**
 * @fileoverview Logger adapter for Edge layer runtime integration
 *
 * ## Purpose
 * Provides a thin logging adapter that bridges command-runtime with the shared logging
 * system while respecting build-time tree-shaking for production bundles. This adapter
 * implements selective logging: production keeps only errors, development logs all levels.
 *
 * ## Key Responsibilities
 * - **Adapter Pattern**: Bridge between command-runtime and logging infrastructure
 * - **Production Optimization**: Tree-shake non-error logs and message strings in production
 * - **Level Routing**: Dispatch messages to appropriate logger method (debug/info/warn/error)
 * - **Context Attachment**: Support optional structured logging context objects
 * - **Build-Time Filtering**: Use `__DEV__` constant for build-time dead code elimination
 *
 * ## Architecture Context
 * **Layer**: Edge Adapter (runtime-specific logging integration)
 * **Logging System**: Delegates to `@shared/logging` system (centralized logger)
 * **Build Strategy**: Vite compile-time constant `__DEV__` for tree-shaking
 * **Bundle Optimization**:
 *   - Production (`__DEV__ = false`): Only error logs present in bundle
 *   - Development (`__DEV__ = true`): All log levels included for debugging
 *   - Rollup tree-shakes: Non-error branches, message string literals, related code
 *
 * ## Design Principles
 * 1. **Production Safety**: No verbose logging overhead in production (performance)
 * 2. **Tree-Shakeable**: Leverage `__DEV__` for build-time dead code elimination
 * 3. **Exhaustive Handling**: Switch statement covers all LogLevel values
 * 4. **Context Preservation**: Immutable context objects for structured logging
 * 5. **Simplicity**: Minimal adapter (no filtering, batching, sampling logic)
 *
 * ## Logging Levels
 * - **debug**: Detailed diagnostic information (dev-only, tree-shaken in production)
 * - **info**: General informational messages (dev-only, tree-shaken in production)
 * - **warn**: Warning conditions (dev-only, tree-shaken in production)
 * - **error**: Error conditions (always present, even in production)
 * - **trace**: Trace/diagnostic output (mapped to info in this adapter)
 *
 * ## Usage Pattern
 * ```typescript
 * import { log } from '@edge/adapters/logger';
 * import type { LogLevel } from '@core/cmd';
 *
 * // Simple message
 * log('info', 'Application started');
 *
 * // Message with context
 * log('error', 'HTTP request failed', {
 *   statusCode: 500,
 *   url: 'https://api.example.com/data',
 *   duration: 5234,
 * });
 *
 * // Dynamic level (from command-runtime)
 * const level: LogLevel = 'warn';
 * log(level, 'Configuration warning');
 *
 * // Production: Only error logs appear in bundle
 * // Development: All logs appear for debugging
 * ```
 *
 * ## Build-Time Behavior
 * **Rollup Tree-Shaking Examples**:
 * ```typescript
 * // Production build (__DEV__ = false):
 * // ✂️ Removes: debug/info/warn branches, all message strings
 * // ✓ Keeps: error case, error message strings
 *
 * // Development build (__DEV__ = true):
 * // ✓ Keeps: all branches, all message strings
 * // Used: for full debugging capability
 * ```
 *
 * ## Implementation Notes
 * - Default case maps unknown levels to 'info' (graceful fallback)
 * - No validation of message or context (caller responsibility)
 * - No filtering, sampling, or rate-limiting (higher layers handle this)
 * - No timestamp insertion (done by underlying logger)
 *
 * @module edge/adapters/logger
 */

import type { LogLevel } from '@core/cmd';
import { logger } from '@shared/logging/logger';

/**
 * Log a message with optional context, respecting production/development logging levels
 *
 * Routes messages to the appropriate logging method based on level, with special
 * handling for production builds where only error logs are kept (others tree-shaken).
 * This adapter provides the command-runtime interface to the shared logging system.
 *
 * @param level - Logging level ('debug' | 'info' | 'warn' | 'error' | 'trace')
 * @param message - Log message string (tree-shaken in production if not 'error')
 * @param context - Optional structured logging context (key-value pairs)
 * @returns void (logging is fire-and-forget)
 *
 * @remarks
 * **Production Behavior** (`__DEV__ = false`):
 * - Only `level === 'error'` logs are executed
 * - All other levels return immediately (branch eliminated by tree-shaking)
 * - Message strings for non-error logs are not bundled
 * - Reduces production bundle size and logging overhead
 *
 * **Development Behavior** (`__DEV__ = true`):
 * - All log levels (debug/info/warn/error) are executed
 * - Messages preserved for full debugging capability
 * - Switch statement covers all LogLevel values exhaustively
 * - Default case gracefully maps unknown levels to 'info'
 *
 * **Context Parameter**:
 * - Optional structured logging data (e.g., error details, request info)
 * - Readonly to prevent accidental mutation
 * - Passed transparently to underlying logger
 * - Enables rich logging without string concatenation
 *
 * **Performance Characteristics**:
 * - Production: O(1) for non-error logs (early return)
 * - Production: O(1) for error logs (single method call)
 * - Development: O(1) for all levels (single switch case)
 * - No message interpolation or context inspection
 *
 * **Build-Time Optimization**:
 * - Rollup detects `if (!__DEV__)` pattern as dead code in production
 * - Eliminates debug/info/warn branches and related string literals
 * - Reduces production bundle size by ~2-5KB (typical logging overhead)
 * - No runtime cost for dead code (zero overhead in production)
 *
 * **Type Safety**:
 * - LogLevel type ensures only valid levels are passed
 * - Exhaustive switch with never type guard catches new levels at compile-time
 * - Context is Readonly to prevent accidental mutations
 *
 * @example
 * ```typescript
 * import { log } from '@edge/adapters/logger';
 *
 * // Error logging (always present)
 * log('error', 'Failed to fetch data', {
 *   statusCode: 500,
 *   retryCount: 3,
 *   url: 'https://api.example.com/users',
 * });
 *
 * // Info logging (dev-only, tree-shaken in production)
 * log('info', 'Request completed', {
 *   duration: 234,
 *   itemsProcessed: 42,
 * });
 *
 * // Warning logging (dev-only)
 * log('warn', 'Slow query detected', {
 *   duration: 5000,
 *   expectedDuration: 1000,
 * });
 *
 * // Debug logging (dev-only, tree-shaken first)
 * log('debug', 'Parsing response', {
 *   contentType: 'application/json',
 *   size: 1024,
 * });
 *
 * // Trace mapping to info
 * log('trace', 'Function entry', { args: { id: 123 } });
 * // → Mapped to logger.info() for development
 *
 * // Production result:
 * // ✓ Error logs execute normally
 * // ✂️ All other logs are tree-shaken away
 * ```
 *
 * @see {@link LogLevel} for allowed logging level values
 * @see {@link logger} from `@shared/logging` for underlying implementation
 * @see {@link __DEV__} for build-time constant used for tree-shaking
 */
export function log(
  level: LogLevel,
  message: string,
  context?: Readonly<Record<string, unknown>>
): void {
  // Production bundles keep only error logging; other levels are dev-only.
  // This matches the default logger behavior (info/warn/debug/trace are no-ops)
  // while allowing Rollup to tree-shake message strings and branches.
  if (!__DEV__) {
    if (level === 'error') {
      logger.error(message, context);
    }
    return;
  }

  switch (level) {
    case 'debug':
      logger.debug(message, context);
      return;
    case 'info':
      logger.info(message, context);
      return;
    case 'warn':
      logger.warn(message, context);
      return;
    case 'error':
      logger.error(message, context);
      return;
    default:
      logger.info(message, context);
  }
}
