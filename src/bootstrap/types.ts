/**
 * @fileoverview Bootstrap Error Reporting Utilities
 *
 * ## Purpose
 * Provides centralized error handling and reporting infrastructure for the bootstrap phase.
 * Implements severity-aware logging strategies with conditional throwing behavior based on
 * error criticality, ensuring robust initialization while maintaining observability.
 *
 * ## Key Responsibilities
 * - **Error Normalization**: Converts unknown error types to consistent string messages
 * - **Severity-Based Logging**: Routes errors to appropriate log levels (error vs warn)
 * - **Critical Error Handling**: Rethrows critical errors to halt bootstrap execution
 * - **Production Optimization**: Promotes recoverable errors to error level in production builds
 *
 * ## Implementation Strategy
 * This module uses a minimal API surface with type-safe options for error reporting.
 * The severity system distinguishes between:
 * - **Critical errors**: Fatal issues that prevent application startup (e.g., missing APIs, service failures)
 * - **Recoverable errors**: Non-fatal issues that allow degraded operation (e.g., optional feature failures)
 *
 * ## Production Behavior
 * In production builds (`__DEV__ === false`), recoverable errors are logged at `error` level
 * instead of `warn` level because production builds strip `logger.warn()` calls for bundle size
 * optimization. This ensures all bootstrap signals remain visible in production logs.
 *
 * ## Bootstrap Context
 * Used throughout bootstrap phases to provide consistent error handling for initialization
 * failures. Each bootstrap module (critical-systems, environment, events, gallery-init) uses
 * this utility to report failures with appropriate context and severity.
 *
 * @module bootstrap/types
 */

import { normalizeErrorMessage } from '@shared/error/normalize';
import type { Logger } from '@shared/logging/logger';

/**
 * Severity level for bootstrap errors, determining logging strategy and throwing behavior.
 *
 * - `critical`: Fatal errors that prevent application startup; logged at error level and rethrown
 * - `recoverable`: Non-fatal errors allowing degraded operation; logged at warn (dev) or error (prod)
 */
type BootstrapErrorSeverity = 'critical' | 'recoverable';

/**
 * Subset of Logger interface required for bootstrap error reporting.
 *
 * Restricts to error and warn methods to keep bootstrap dependencies minimal
 * and avoid coupling to full Logger API surface.
 */
type BootstrapErrorLogger = Pick<Logger, 'error' | 'warn'>;

/**
 * Configuration options for bootstrap error reporting.
 *
 * @property context - Descriptive label for the error source (e.g., 'ThemeService', 'GalleryInit')
 * @property logger - Logger instance for error output (must support error and warn methods)
 * @property severity - Error severity level (default: 'recoverable')
 */
type BootstrapErrorOptions = Readonly<{
  context: string;
  logger: BootstrapErrorLogger;
  severity?: BootstrapErrorSeverity;
}>;

/**
 * Normalize unknown error types to consistent string messages for bootstrap context.
 *
 * Converts various error representations (Error objects, strings, unknown types) into
 * human-readable messages with fallback for completely unknown error types.
 *
 * ## Implementation Details
 * - Uses shared `normalizeErrorMessage()` for consistent error extraction
 * - Provides fallback message when normalization yields empty string
 * - Ensures all bootstrap error messages are non-empty and informative
 *
 * @param error - Unknown error value from try-catch or rejection
 * @returns Human-readable error message string, never empty
 *
 * @internal
 * @remarks
 * This function is internal to the module and called by {@link reportBootstrapError}.
 * Direct usage outside this module is unnecessary as {@link reportBootstrapError}
 * handles normalization automatically.
 */
function normalizeBootstrapErrorMessage(error: unknown): string {
  const message = normalizeErrorMessage(error);
  return message.length > 0 ? message : 'Unknown bootstrap error';
}

/**
 * Report bootstrap errors with severity-aware logging and conditional throwing.
 *
 * Central error reporting utility for bootstrap phase initialization failures. Routes errors
 * to appropriate log levels based on severity and environment, optionally rethrowing critical
 * errors to halt bootstrap execution.
 *
 * ## Behavior by Severity
 *
 * ### Critical Errors (`severity: 'critical'`)
 * 1. Log at `error` level with full context and stack trace
 * 2. Rethrow error to propagate to caller (halts bootstrap)
 * 3. Use for fatal failures: missing APIs, core service failures, unrecoverable state
 *
 * ### Recoverable Errors (`severity: 'recoverable'` or default)
 * 1. Development: Log at `warn` level for visibility without alarming
 * 2. Production: Log at `error` level (warn calls stripped for bundle size)
 * 3. Do not throw; allow bootstrap to continue with degraded functionality
 * 4. Use for optional features: settings persistence, theme sync, non-critical services
 *
 * ## Message Format
 * All errors logged with consistent format: `[context] initialization failed: <message>`
 * - `context`: Source label from options (e.g., 'ThemeService', 'SettingsInit')
 * - `message`: Normalized error message with details
 *
 * ## Production Optimization
 * Production builds strip `logger.warn()` calls for bundle size reduction. To maintain
 * observability, recoverable errors are promoted to `error` level in production, ensuring
 * all bootstrap signals appear in production logs despite being non-fatal.
 *
 * @param error - Error to report (any type from try-catch or Promise rejection)
 * @param options - Configuration specifying context, logger, and severity
 * @returns void for recoverable errors; never returns for critical errors (always throws)
 *
 * @throws {Error} When severity is 'critical', rethrows original Error or wraps in new Error
 *
 * @example
 * ```typescript
 * // Critical error example (throws)
 * try {
 *   await criticalService.initialize();
 * } catch (error) {
 *   reportBootstrapError(error, {
 *     context: 'CriticalService',
 *     logger,
 *     severity: 'critical', // Will throw after logging
 *   });
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Recoverable error example (does not throw)
 * try {
 *   await optionalFeature.initialize();
 * } catch (error) {
 *   reportBootstrapError(error, {
 *     context: 'OptionalFeature',
 *     logger,
 *     severity: 'recoverable', // Logs but continues execution
 *   });
 *   // Execution continues with degraded functionality
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Default severity (recoverable) example
 * try {
 *   await settingsService.initialize();
 * } catch (error) {
 *   reportBootstrapError(error, {
 *     context: 'SettingsService',
 *     logger, // severity defaults to 'recoverable'
 *   });
 * }
 * ```
 *
 * @remarks
 * This function uses discriminated return type (`never | void`) to enable TypeScript
 * control flow analysis. When `severity` is known to be 'critical' at compile time,
 * TypeScript understands the function never returns normally.
 *
 * @see {@link BootstrapErrorOptions} for configuration options
 * @see {@link BootstrapErrorSeverity} for severity level details
 */
export function reportBootstrapError(error: unknown, options: BootstrapErrorOptions): never | void {
  const severity = options.severity ?? 'recoverable';
  const isCritical = severity === 'critical';
  const message = `[${options.context}] initialization failed: ${normalizeBootstrapErrorMessage(error)}`;

  // Bundle-size note: production builds strip logger.warn calls.
  // Keep recoverable bootstrap signals visible by promoting them to error in prod.
  if (isCritical) {
    options.logger.error(message, error);
  } else if (__DEV__) {
    options.logger.warn(message, error);
  } else {
    options.logger.error(message, error);
  }

  if (isCritical) {
    throw error instanceof Error ? error : new Error(message);
  }
}
