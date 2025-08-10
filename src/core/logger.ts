/**
 * @fileoverview Core 전용 로거 인터페이스 + DI 훅
 * @description Core 레이어가 Shared 레이어에 직접 의존하지 않도록 분리
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ILogger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, error?: unknown) => void;
  setLevel?: (level: LogLevel) => void;
}

// 내부 위임 인스턴스 (주입 대상)
let injectedLogger: ILogger | null = null;
let currentLevel: LogLevel = 'info';

export function setCoreLogger(impl: ILogger): void {
  injectedLogger = impl;
  if (impl.setLevel) impl.setLevel(currentLevel);
}

function shouldLog(level: LogLevel): boolean {
  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  return levels.indexOf(level) >= levels.indexOf(currentLevel);
}

export const coreLogger: ILogger = {
  setLevel(level: LogLevel) {
    currentLevel = level;
    injectedLogger?.setLevel?.(level);
  },
  debug(message: string, ...args: unknown[]) {
    if (!shouldLog('debug')) return;
    injectedLogger?.debug?.(`[DEBUG] ${message}`, ...args);
  },
  info(message: string, ...args: unknown[]) {
    if (!shouldLog('info')) return;
    injectedLogger?.info?.(`[INFO] ${message}`, ...args);
  },
  warn(message: string, ...args: unknown[]) {
    if (!shouldLog('warn')) return;
    injectedLogger?.warn?.(`[WARN] ${message}`, ...args);
  },
  error(message: string, error?: unknown) {
    if (!shouldLog('error')) return;
    injectedLogger?.error?.(`[ERROR] ${message}`, error);
  },
};
