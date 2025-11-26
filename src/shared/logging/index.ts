/**
 * Logging Infrastructure Barrel Export Module
 *
 * Central export point for all logging utilities.
 * Provides production-safe logging with automatic tree-shaking of debug code.
 */

export type { LoggableData, Logger, LogLevel } from './logger';
// Logger
export { createLogger, createScopedLogger, logError, logger } from './logger';
