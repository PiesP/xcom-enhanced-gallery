/**
 * Logging Infrastructure Barrel Export Module
 *
 * Central export point for all logging utilities.
 * Provides production-safe logging with automatic tree-shaking of debug code.
 *
 * Features:
 * - Runtime log level configuration
 * - Environment variable support (VITE_LOG_LEVEL)
 * - Tree-shakeable production builds
 */

// Log Level Management
export type { LogLevelChangeListener, LogLevelConfig } from './log-level';
export {
  DEFAULT_LOG_LEVEL,
  getLogLevel,
  getLogLevelConfig,
  isDebugEnabled,
  isValidLogLevel,
  isVerboseEnabled,
  LOG_LEVEL_PRIORITY,
  LogLevels,
  onLogLevelChange,
  resetLogLevel,
  setLogLevel,
  setQuiet,
  setVerbose,
  shouldLog,
} from './log-level';
export type { LoggableData, Logger, LoggerConfig, LogLevel } from './logger';
// Logger
export { createLogger, createScopedLogger, logError, logger } from './logger';
