/**
 * @fileoverview Minimal log-level helpers for production builds.
 * @description Keeps API compatibility with the dev implementation while staying lightweight.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogLevelConfig {
  readonly level: LogLevel;
  readonly verbose: boolean;
  readonly quiet: boolean;
}

export type LogLevelChangeListener = (newLevel: LogLevel, oldLevel: LogLevel) => void;

export const DEFAULT_LOG_LEVEL: LogLevel = 'error';

export const LOG_LEVEL_PRIORITY: Readonly<Record<LogLevel, number>> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

const VALID_LOG_LEVELS: readonly LogLevel[] = ['debug', 'info', 'warn', 'error'] as const;

let currentLevel: LogLevel = DEFAULT_LOG_LEVEL;

export function isValidLogLevel(level: string): level is LogLevel {
  return VALID_LOG_LEVELS.includes(level as LogLevel);
}

export function getLogLevel(): LogLevel {
  return currentLevel;
}

export function getLogLevelConfig(): LogLevelConfig {
  return {
    level: currentLevel,
    verbose: currentLevel === 'debug',
    quiet: currentLevel === 'error',
  };
}

export function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLevel];
}

export function isDebugEnabled(): boolean {
  return currentLevel === 'debug';
}

export function isVerboseEnabled(): boolean {
  return currentLevel === 'debug';
}

export function setLogLevel(level: LogLevel): void {
  if (!isValidLogLevel(level)) {
    throw new Error(`Invalid log level: ${level}. Valid levels: ${VALID_LOG_LEVELS.join(', ')}`);
  }
  currentLevel = level;
}

export function setVerbose(): void {
  currentLevel = 'debug';
}

export function setQuiet(): void {
  currentLevel = 'error';
}

export function resetLogLevel(): void {
  currentLevel = DEFAULT_LOG_LEVEL;
}

export function onLogLevelChange(_listener: LogLevelChangeListener): () => void {
  return () => {};
}

export const LogLevels = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
} as const;
