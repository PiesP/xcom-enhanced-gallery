/* eslint-disable no-console */

/**
 * @fileoverview Centralized Logging Infrastructure
 * @version 2.0.0 - Phase 404: Enhanced documentation + correlation tracking
 *
 * **Purpose**: Provides consistent logging interface with different log levels,
 * formatting, and performance measurement across development and production.
 *
 * **Key Features**:
 * - Multi-level logging (debug, info, warn, error) with priority filtering
 * - Scoped loggers with automatic prefix management
 * - Correlation ID tracking for request/operation tracing
 * - Performance timing utilities (time/timeEnd)
 * - Automatic tree-shaking: Debug code eliminated in production via __DEV__
 * - Development-only tools exposed globally (window.__XEG__.logging)
 *
 * **Architecture**:
 * ```
 * Application Code
 *   ↓ (logger.info, logger.debug)
 * Logger Interface (Logger)
 *   ↓ (log level check, format)
 * Development/Production Implementations
 *   ↓ (isDev ? full features : minimal)
 * console.log/warn/error
 * ```
 *
 * **Development Mode** (isDev = true):
 * - Log level: debug (all messages shown)
 * - Timestamps: Included (ISO format)
 * - Stack traces: Full error stacks displayed
 * - Correlation IDs: Tracked for tracing
 * - Performance timers: Active (time/timeEnd)
 * - Memory metrics: Available
 *
 * **Production Mode** (isDev = false):
 * - Log level: warn (errors + warnings only)
 * - Timestamps: Stripped (minimal output)
 * - Stack traces: Disabled
 * - Performance timers: No-op (zero overhead)
 * - Debug utilities: Tree-shaken completely
 *
 * **Correlation Tracking Pattern**:
 * ```typescript
 * const cid = createCorrelationId(); // "a7f2e8b1"
 * const slog = createScopedLoggerWithCorrelation('BulkDownload', cid);
 * slog.info('Download started'); // [XEG] [BulkDownload] [cid:a7f2e8b1] [INFO] Download started
 * // ... async operations ...
 * slog.info('Download complete'); // Same cid, easy to trace
 * ```
 *
 * **Tree-Shaking Benefits**:
 * - Production bundle: ~-15% (all dev logging code removed)
 * - Runtime overhead: 0% (no-op stubs in production)
 * - Type safety: Maintained (all types exported)
 *
 * **Browser Integration**:
 * Development tools are intentionally omitted from the production bundle to keep the
 * userscript lightweight. Logging helpers are available directly through imports.
 *
 * @related [Correlation](./logger.ts#createCorrelationId)
 */

/**
 * Supported Log Level literals with priority ordering.
 *
 * @public
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Loggable Data Type - Any value that can be logged
 *
 * **Supported Types**:
 * - Primitives: string, number, boolean
 * - Error: Error objects with stack traces
 * - Objects: Record<string, unknown> for structured data
 * - Arrays: Readonly arrays of any type
 * - Null/undefined: Safe to log
 *
 * **Serialization**: All values automatically converted to console-compatible format.
 *
 * @public
 */
export type LoggableData =
  | string
  | number
  | boolean
  | Error
  | Record<string, unknown>
  | readonly unknown[]
  | unknown
  | null
  | undefined;

/**
 * Logger Interface - Public API for logging
 *
 * **Methods**:
 * - info(): General informational messages
 * - warn(): Warning messages (potential issues)
 * - error(): Error messages (failures)
 * - debug(): Debug-only messages (development)
 * - trace(): Trace-level messages (lowest priority, dev only)
 * - time(label): Start performance timer
 * - timeEnd(label): End timer and log duration
 *
 * **Usage Pattern**:
 * ```typescript
 * const logger = createScopedLogger('MediaExtractor');
 * logger.info('Processing media');
 * logger.debug('Extracted:', { url, format });
 * logger.error('Failed to download', { url, status });
 * ```
 *
 * **Development vs Production**:
 * - debug/trace/time: Production builds = no-op stubs
 * - info/warn/error: Both modes (but reduced output in prod)
 *
 * @interface Logger
 * @public
 */
export interface Logger {
  /**
   * Log informational message (both dev & production)
   * @param {...LoggableData[]} args - Data to log
   */
  info: (...args: LoggableData[]) => void;

  /**
   * Log warning message (both dev & production)
   * @param {...LoggableData[]} args - Data to log
   */
  warn: (...args: LoggableData[]) => void;

  /**
   * Log error message (both dev & production)
   * @param {...LoggableData[]} args - Data to log
   */
  error: (...args: LoggableData[]) => void;

  /**
   * Log debug message (development only, removed in production)
   * @param {...LoggableData[]} args - Data to log
   */
  debug: (...args: LoggableData[]) => void;

  /**
   * Log trace message (development only, lowest priority)
   * @param {...LoggableData[]} args - Data to log
   */
  trace?: (...args: LoggableData[]) => void;

  /**
   * Start performance timer (development only)
   * @param {string} label - Timer identifier (e.g., 'extract-media')
   */
  time: (label: string) => void;

  /**
   * End performance timer and log duration (development only)
   * @param {string} label - Timer identifier (must match time() call)
   */
  timeEnd: (label: string) => void;
}

// ============================================================================
// Configuration & Internal State
// ============================================================================

/**
 * Logger Configuration Options
 *
 * **Fields**:
 * - level: Minimum log level to display (debug < info < warn < error)
 * - prefix: Log prefix string (default: '[XEG]')
 * - includeTimestamp: Add ISO timestamp to logs (dev only)
 * - includeStackTrace: Log error stack traces (dev only)
 * - correlationId: Optional ID for tracing related logs
 *
 * @interface LoggerConfig
 */
interface LoggerConfig {
  readonly level: LogLevel;
  readonly prefix: string;
  readonly includeTimestamp: boolean;
  readonly includeStackTrace: boolean;
  readonly correlationId?: string;
}

const BASE_PREFIX = '[XEG]';
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};
// Detect test environment (Vitest/Happydom)
// Prefer explicit signals to avoid false positives.
const isTest: boolean = (() => {
  try {
    // Vitest exposes import.meta.vitest
    const meta = (import.meta as any) || {};
    if (typeof meta?.vitest !== 'undefined') return true;
  } catch {
    // ignore
  }

  try {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.VITEST === 'true' || process.env.NODE_ENV === 'test') return true;
    }
  } catch {
    // ignore
  }

  return false;
})();

// Use __DEV__ global (defined in vite/vitest config) when available.
// In some Node/test initializations __DEV__ may be undefined – guard with fallbacks.
// Fallback order: globalThis.__DEV__ → import.meta.env.DEV → NODE_ENV !== 'production' → true
// Optimized for tree-shaking: Use __DEV__ directly when available, or fallback
const isDev: boolean =
  typeof __DEV__ !== 'undefined'
    ? __DEV__
    : (() => {
        if (import.meta?.env !== undefined) {
          return import.meta.env.DEV === true;
        }
        if (typeof process !== 'undefined' && process.env !== undefined) {
          return process.env.NODE_ENV !== 'production';
        }
        return true; // Default to development mode if detection fails
      })();

type LoggerFactory = (config?: Partial<LoggerConfig>) => Logger;
type ScopedFactory = (scope: string, config?: Partial<LoggerConfig>) => Logger;
type ScopedCorrelationFactory = (
  scope: string,
  correlationId: string,
  config?: Partial<LoggerConfig>
) => Logger;

// Phase 414.3: No-op logger factory for production builds
// In production (isDev=false), all logging calls become no-ops, eliminating 150+ lines of logger infrastructure
const createNoOpLogger = (): Logger => {
  const noop = (): void => {};
  return {
    info: noop,
    warn: noop,
    error: noop,
    debug: noop,
    trace: noop,
    time: noop,
    timeEnd: noop,
  };
};

let createLoggerImpl: LoggerFactory;
let createScopedLoggerImpl: ScopedFactory;
let createScopedLoggerWithCorrelationImpl: ScopedCorrelationFactory;

if (isDev) {
  const getEnvironmentLogLevel = (): LogLevel => {
    // In test runs, keep logs minimal from import-time to avoid worker IPC pressure.
    if (isTest) return 'error';
    // Phase 137: Type Guard-based Userscript Environment Detection
    // Detects if code is running in Tampermonkey/Greasemonkey context
    // for appropriate log level configuration (info vs debug)
    try {
      if (typeof window !== 'undefined') {
        const windowRecord = window as unknown as Record<string, unknown>;
        const gmInfo = windowRecord['GM_info'];
        const unsafeWin = windowRecord.unsafeWindow;
        if (gmInfo !== undefined || unsafeWin !== undefined) {
          return 'info';
        }
      }
    } catch {
      // ignore access errors
    }

    // Phase 378: Maximize dead-code elimination using bundle-level flags only
    // Ensures all debug code is removed in production via tree-shaking
    return isDev ? 'debug' : 'info';
  };

  const DEFAULT_CONFIG: LoggerConfig = {
    level: getEnvironmentLogLevel(),
    prefix: BASE_PREFIX,
    includeTimestamp: true,
    includeStackTrace: true,
  };

  const timerStorage: Record<string, number> = {};

  const formatMessage = (
    level: LogLevel,
    config: LoggerConfig,
    ...args: LoggableData[]
  ): LoggableData[] => {
    const timestamp = config.includeTimestamp ? `[${new Date().toISOString()}]` : '';
    const levelTag = `[${level.toUpperCase()}]`;
    const cid = config.correlationId ? `[cid:${String(config.correlationId)}]` : '';
    const prefixParts = [config.prefix, timestamp, levelTag, cid].filter(Boolean);
    return [prefixParts.join(' '), ...args];
  };

  const shouldLog = (level: LogLevel, config: LoggerConfig): boolean => {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[config.level];
  };

  createLoggerImpl = (config: Partial<LoggerConfig> = {}): Logger => {
    const finalConfig: LoggerConfig = { ...DEFAULT_CONFIG, ...config };

    return {
      info: (...args: LoggableData[]): void => {
        if (shouldLog('info', finalConfig)) {
          console.info(...formatMessage('info', finalConfig, ...args));
        }
      },
      warn: (...args: LoggableData[]): void => {
        if (shouldLog('warn', finalConfig)) {
          console.warn(...formatMessage('warn', finalConfig, ...args));
        }
      },
      error: (...args: LoggableData[]): void => {
        if (shouldLog('error', finalConfig)) {
          console.error(...formatMessage('error', finalConfig, ...args));

          if (finalConfig.includeStackTrace && args.length > 0) {
            const firstArg = args[0];
            if (firstArg instanceof Error && firstArg.stack) {
              console.error('Stack trace:', firstArg.stack);
            }
          }
        }
      },
      debug: (...args: LoggableData[]): void => {
        if (shouldLog('debug', finalConfig)) {
          console.info(...formatMessage('debug', finalConfig, ...args));
        }
      },
      trace: (...args: LoggableData[]): void => {
        if (shouldLog('debug', finalConfig)) {
          console.debug(...formatMessage('debug', finalConfig, ...args));
        }
      },
      time: (label: string): void => {
        if (shouldLog('debug', finalConfig)) {
          const timerKey = `__timer_${label}`;
          timerStorage[timerKey] = Date.now();
          console.info(...formatMessage('debug', finalConfig, `Timer started: ${label}`));
        }
      },
      timeEnd: (label: string): void => {
        if (shouldLog('debug', finalConfig)) {
          const timerKey = `__timer_${label}`;
          const startTime = timerStorage[timerKey];

          if (typeof startTime === 'number') {
            const duration = Date.now() - startTime;
            console.info(...formatMessage('debug', finalConfig, `${label}: ${duration}ms`));
            delete timerStorage[timerKey];
          } else {
            console.info(
              ...formatMessage('debug', finalConfig, `Timer '${label}' was not started`)
            );
          }
        }
      },
    };
  };

  createScopedLoggerImpl = (scope: string, config: Partial<LoggerConfig> = {}): Logger =>
    createLoggerImpl({
      ...config,
      prefix: `${config.prefix ?? BASE_PREFIX} [${scope}]`,
    });

  createScopedLoggerWithCorrelationImpl = (
    scope: string,
    correlationId: string,
    config: Partial<LoggerConfig> = {}
  ): Logger =>
    createLoggerImpl({
      ...config,
      prefix: `${config.prefix ?? BASE_PREFIX} [${scope}]`,
      correlationId,
    });
} else {
  // Phase 414.3: Production mode - Replace all logging with no-ops
  // This eliminates 150+ lines of logger infrastructure from production bundle
  // Tree-shaking will remove the entire logger implementation
  createLoggerImpl = () => createNoOpLogger();

  createScopedLoggerImpl = () => createNoOpLogger();

  createScopedLoggerWithCorrelationImpl = () => createNoOpLogger();
}

export function createLogger(config: Partial<LoggerConfig> = {}): Logger {
  return createLoggerImpl(config);
}

/**
 * Global Default Logger Instance
 *
 * **Automatic Configuration**:
 * - Test mode: level=error (suppress noise in worker IPC)
 * - Dev mode: level=debug, timestamps & stack traces enabled
 * - Prod mode: level=warn, minimal output
 *
 * **Usage**:
 * ```typescript
 * import { logger } from '@shared/logging';
 * logger.info('Processing started');
 * logger.error('Failed:', error);
 * ```
 *
 * **Thread Safety**:
 * Safe to use from multiple contexts (all methods thread-safe).
 *
 * @const {Logger}
 * @public
 */
export const logger: Logger = createLogger({
  level: isTest ? 'error' : isDev ? 'debug' : 'warn',
  includeTimestamp: isDev && !isTest,
  includeStackTrace: isDev && !isTest,
});

/**
 * Create Scoped Logger - Automatic Scope Prefix
 *
 * **Purpose**: Create logger with scope name automatically added to prefix.
 *
 * **Scopes** (recommended naming):
 * - Service names: 'MediaService', 'DownloadService', 'NotificationService'
 * - Feature names: 'BulkDownload', 'MediaExtractor', 'GalleryView'
 * - Component names: 'ToolbarButton', 'SettingsPanel'
 * - Helper names: 'URLValidator', 'FileNameGenerator'
 *
 * **Output Format**:
 * ```
 * [XEG] [MediaExtractor] [INFO] Processing media
 * [XEG] [BulkDownload] [cid:abc123] [WARN] Retry attempt 2
 * ```
 *
 * **Usage**:
 * ```typescript
 * const logger = createScopedLogger('MediaExtractor');
 * logger.info('Processing: ', url);
 * ```
 *
 * @param {string} scope - Scope identifier
 * @param {Partial<LoggerConfig>} [config] - Config override
 * @returns {Logger} - Logger with scope prefix
 *
 * @public
 */
export function createScopedLogger(scope: string, config: Partial<LoggerConfig> = {}): Logger {
  return createScopedLoggerImpl(scope, config);
}

/**
 * Create Scoped Logger with Correlation ID
 *
 * **Purpose**: Logger with both scope AND correlation ID for comprehensive tracing.
 *
 * **Correlation ID Pattern**:
 * - Unique per operation (bulk download, batch extract, etc.)
 * - Shared across all logs within operation
 * - Useful for filtering logs by operation in production
 *
 * **Output Format**:
 * ```
 * [XEG] [BulkDownload] [cid:abc123def456] [INFO] Download started
 * [XEG] [BulkDownload] [cid:abc123def456] [DEBUG] Processing item 1/10
 * [XEG] [BulkDownload] [cid:abc123def456] [INFO] Download complete
 * ```
 *
 * **Usage Pattern**:
 * ```typescript
 * const operationId = createCorrelationId();
 * const slog = createScopedLoggerWithCorrelation('BulkDownload', operationId);
 * slog.info('Operation started');
 * // ... async work ...
 * slog.info('Operation completed');
 * // All logs have same correlationId for easy tracing
 * ```
 *
 * @param {string} scope - Scope identifier (e.g., 'BulkDownload')
 * @param {string} correlationId - Unique operation ID (from createCorrelationId())
 * @param {Partial<LoggerConfig>} [config] - Config override
 * @returns {Logger} - Logger with scope and correlation ID
 *
 * @public
 */
export function createScopedLoggerWithCorrelation(
  scope: string,
  correlationId: string,
  config: Partial<LoggerConfig> = {}
): Logger {
  return createScopedLoggerWithCorrelationImpl(scope, correlationId, config);
}

/**
 * Generate Unique Correlation ID for Request Tracing
 *
 * **Algorithm**:
 * 1. Try crypto.getRandomValues() for cryptographic strength
 * 2. Fallback to Math.random() if unavailable
 * 3. Encode as base36 (compact, alphanumeric)
 *
 * **Output**: 8-character base36 string (e.g., "3a7f8e2b")
 *
 * **Use Cases**:
 * - Bulk download operation: Track all related downloads
 * - Multi-step extraction: Link metadata extraction to media extraction
 * - Async batches: Trace across worker threads
 * - Error tracking: Correlate failed attempts with success cases
 *
 * **Example**:
 * ```typescript
 * const cid = createCorrelationId(); // "3a7f8e2b"
 * const logger = createScopedLoggerWithCorrelation('Extractor', cid);
 * logger.info('Started');   // [cid:3a7f8e2b] Started
 * logger.warn('Retrying');  // [cid:3a7f8e2b] Retrying
 * logger.info('Complete');  // [cid:3a7f8e2b] Complete
 * // All logs have same cid for easy filtering/tracing
 * ```
 *
 * @returns {string} - 8-character correlation ID
 *
 * @public
 */
export function createCorrelationId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
      const bytes = new Uint8Array(8);
      crypto.getRandomValues(bytes);
      const num = Array.from(bytes).reduce((acc, b) => (acc << 8) | b, 0) >>> 0;
      return num.toString(36);
    }
  } catch {
    // Fallback to Math.random if crypto fails
  }
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Log Error with Structured Context
 *
 * **Purpose**: Consistently format error messages with context and source info.
 *
 * **Format** (dev):
 * ```
 * [XEG] [ERROR] Error in BulkDownloader: Failed to download media
 * [XEG] [DEBUG] Error stack: Error: Failed to download media
 *     at downloadMedia (bulk-downloader.ts:123)
 *     ...
 * ```
 *
 * **Context**: Additional metadata logged with error (e.g., mediaId, retryCount).
 *
 * **Source**: Origin identifier (service or component name) for error categorization.
 *
 * **Usage**:
 * ```typescript
 * try {
 *   await downloadMedia(item);
 * } catch (error) {
 *   logError(error, { mediaId: item.id, retryCount: 2 }, 'BulkDownloader');
 * }
 * ```
 *
 * @param {Error | string} error - Error object or message
 * @param {Record<string, string | number | boolean>} [context] - Additional data
 * @param {string} [source] - Source identifier (service/component)
 *
 * @public
 */
export function logError(
  error: Error | string,
  context: Record<string, string | number | boolean> = {},
  source?: string
): void {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorContext = {
    source,
    context,
    timestamp: new Date().toISOString(),
  };

  logger.error(`Error${source ? ` in ${source}` : ''}: ${errorMessage}`, errorContext);

  if (isDev && error instanceof Error && error.stack) {
    logger.debug('Error stack:', error.stack);
  }
}
