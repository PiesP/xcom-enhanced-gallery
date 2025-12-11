/// <reference lib="deno.ns" />
/**
 * Lightweight logger wrapper for build scripts (Deno environment)
 * Offers a minimal log level control and friendly methods mirroring console.
 * This keeps build scripts consistent with the main project logging pattern.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getEnvLogLevel(): LogLevel | undefined {
  try {
    // Deno: use globalThis.Deno.env.get
    // Node: use process.env.LOG_LEVEL
    const denoLike = globalThis as unknown as {
      Deno?: { env?: { get?: (k: string) => string | undefined } };
    };
    if (denoLike?.Deno?.env?.get) {
      return denoLike.Deno.env.get('LOG_LEVEL') as LogLevel | undefined;
    }
    if (typeof process !== 'undefined' && process.env?.LOG_LEVEL) {
      return process.env.LOG_LEVEL as LogLevel | undefined;
    }
  } catch {
    // ignore
  }
  return undefined;
}

let currentLevel: LogLevel = getEnvLogLevel() ?? 'info';

export function setLogLevel(level: LogLevel): void {
  if (LEVEL_PRIORITY[level] === undefined) return;
  currentLevel = level;
}

export function getLogLevel(): LogLevel {
  return currentLevel;
}

function shouldLog(level: LogLevel) {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[currentLevel];
}

export function info(...args: readonly unknown[]) {
  if (shouldLog('info')) console.log(...args);
}

export function warn(...args: readonly unknown[]) {
  if (shouldLog('warn')) console.warn(...args);
}

export function error(...args: readonly unknown[]) {
  if (shouldLog('error')) console.error(...args);
}

export function debug(...args: readonly unknown[]) {
  if (shouldLog('debug')) console.debug(...args);
}
