// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Centralized logging infrastructure (production: warn + error, dev: all levels)
 */

type LoggableData = unknown;

export interface Logger {
  info: (...args: LoggableData[]) => void;
  warn: (...args: LoggableData[]) => void;
  error: (...args: LoggableData[]) => void;
  debug: (...args: LoggableData[]) => void;
  trace?: (...args: LoggableData[]) => void;
}

export interface LoggerConfig {
  readonly prefix: string;
}

const BASE_PREFIX = '[XEG]';
const noop = (): void => {};

const createErrorOnlyLogger = (prefix: string): Logger => ({
  info: noop,
  debug: noop,
  trace: noop,
  warn: (...args: LoggableData[]): void => {
    console.warn(prefix, ...args);
  },
  error: (...args: LoggableData[]): void => {
    console.error(prefix, ...args);
  },
});

const createVerboseLogger = (prefix: string): Logger => ({
  info: (...args: LoggableData[]): void => {
    console.info(prefix, ...args);
  },
  warn: (...args: LoggableData[]): void => {
    console.warn(prefix, ...args);
  },
  error: (...args: LoggableData[]): void => {
    console.error(prefix, ...args);
  },
  debug: (...args: LoggableData[]): void => {
    console.debug(prefix, ...args);
  },
  trace: (...args: LoggableData[]): void => {
    console.trace(prefix, ...args);
  },
});

const isDevMode = __DEV__;

function buildLogger(prefix: string): Logger {
  return isDevMode ? createVerboseLogger(prefix) : createErrorOnlyLogger(prefix);
}

function createLogger(): Logger;
function createLogger(moduleName: string): Logger;
function createLogger(config: Partial<LoggerConfig>): Logger;
function createLogger(arg: string | Partial<LoggerConfig> = {}): Logger {
  const cfg = typeof arg === 'string' ? { prefix: `[${arg}]` } : arg;
  const prefix = cfg.prefix ?? BASE_PREFIX;
  return buildLogger(prefix);
}

export const logger: Logger = createLogger();
