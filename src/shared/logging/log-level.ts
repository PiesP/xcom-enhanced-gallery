/**
 * @fileoverview Log Level Configuration
 * @description Runtime log level configuration with environment variable support.
 *
 * Supports multiple configuration sources (in priority order):
 * 1. Runtime configuration via setLogLevel()
 * 2. Environment variable LOG_LEVEL (development only)
 * 3. Build-time __DEV__ flag
 *
 * @example
 * ```typescript
 * // Configure log level at runtime
 * import { setLogLevel } from '@shared/logging/log-level';
 * setLogLevel('warn'); // Only show warnings and errors
 *
 * // Or via environment variable (dev mode only)
 * // LOG_LEVEL=debug npm run dev
 * ```
 */

import type { LogLevel } from './logger';

// ============================================================================
// Types
// ============================================================================

/**
 * Log level configuration options
 */
export interface LogLevelConfig {
  /** Current log level */
  readonly level: LogLevel;
  /** Whether verbose mode is enabled (shows all logs) */
  readonly verbose: boolean;
  /** Whether quiet mode is enabled (only errors) */
  readonly quiet: boolean;
}

/**
 * Log level change listener callback
 */
export type LogLevelChangeListener = (newLevel: LogLevel, oldLevel: LogLevel) => void;

// ============================================================================
// Constants
// ============================================================================

// `__DEV__` is defined at build/test time (Vite + Vitest).
const isDev: boolean = __DEV__;

/**
 * Default log level based on environment
 */
export const DEFAULT_LOG_LEVEL: LogLevel = isDev ? 'debug' : 'error';

/**
 * Log level priority for comparison
 */
export const LOG_LEVEL_PRIORITY: Readonly<Record<LogLevel, number>> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

/**
 * Valid log level strings for validation
 */
const VALID_LOG_LEVELS: readonly LogLevel[] = ['debug', 'info', 'warn', 'error'] as const;

// ============================================================================
// State
// ============================================================================

let currentLevel: LogLevel = DEFAULT_LOG_LEVEL;
let listeners: LogLevelChangeListener[] = [];

// Initialize from environment only in development.
if (isDev) {
  const envLevel = (import.meta.env?.VITE_LOG_LEVEL as string | undefined)?.toLowerCase();
  if (envLevel && isValidLogLevel(envLevel)) {
    currentLevel = envLevel;
  }
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Check if a string is a valid log level
 */
export function isValidLogLevel(level: string): level is LogLevel {
  return VALID_LOG_LEVELS.includes(level as LogLevel);
}

// ============================================================================
// Getters
// ============================================================================

/**
 * Get the current log level
 */
export function getLogLevel(): LogLevel {
  return currentLevel;
}

/**
 * Get full log level configuration
 */
export function getLogLevelConfig(): LogLevelConfig {
  return {
    level: currentLevel,
    verbose: currentLevel === 'debug',
    quiet: currentLevel === 'error',
  };
}

/**
 * Check if a log level should be displayed
 *
 * @param level - The level to check
 * @returns true if the level should be logged
 */
export function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLevel];
}

/**
 * Check if debug logging is enabled
 */
export function isDebugEnabled(): boolean {
  return isDev && currentLevel === 'debug';
}

/**
 * Check if verbose logging is enabled (debug level)
 */
export function isVerboseEnabled(): boolean {
  return isDev && currentLevel === 'debug';
}

// ============================================================================
// Setters
// ============================================================================

/**
 * Set the current log level
 *
 * @param level - The new log level
 * @throws Error if level is invalid
 *
 * @example
 * ```typescript
 * setLogLevel('warn'); // Only show warnings and errors
 * setLogLevel('debug'); // Show all logs
 * ```
 */
export function setLogLevel(level: LogLevel): void {
  if (!isValidLogLevel(level)) {
    throw new Error(`Invalid log level: ${level}. Valid levels: ${VALID_LOG_LEVELS.join(', ')}`);
  }

  const oldLevel = currentLevel;
  if (oldLevel === level) {
    return;
  }

  currentLevel = level;
  notifyListeners(level, oldLevel);
}

/**
 * Set log level to verbose mode (debug)
 */
export function setVerbose(): void {
  setLogLevel('debug');
}

/**
 * Set log level to quiet mode (error only)
 */
export function setQuiet(): void {
  setLogLevel('error');
}

/**
 * Reset log level to default based on environment
 */
export function resetLogLevel(): void {
  const envLevel = isDev
    ? (import.meta.env?.VITE_LOG_LEVEL as string | undefined)?.toLowerCase()
    : undefined;
  setLogLevel(envLevel && isValidLogLevel(envLevel) ? envLevel : DEFAULT_LOG_LEVEL);
}

// ============================================================================
// Event Handling
// ============================================================================

/**
 * Subscribe to log level changes
 *
 * @param listener - Callback to invoke on level change
 * @returns Unsubscribe function
 */
export function onLogLevelChange(listener: LogLevelChangeListener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

/**
 * Notify all listeners of a level change
 */
function notifyListeners(newLevel: LogLevel, oldLevel: LogLevel): void {
  for (const listener of listeners) {
    try {
      listener(newLevel, oldLevel);
    } catch {
      // Swallow listener errors to prevent cascading failures
    }
  }
}

// ============================================================================
// Convenience Exports
// ============================================================================

/**
 * Log level constants for easy access
 */
export const LogLevels = {
  DEBUG: 'debug' as const,
  INFO: 'info' as const,
  WARN: 'warn' as const,
  ERROR: 'error' as const,
} as const;
