import process from 'node:process';

export type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'debug';

const ICONS: Record<LogLevel, string> = {
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
  success: '✅',
  debug: '🛠️',
};

const COLORS: Record<LogLevel, string> = {
  info: '\u001b[36m',
  warn: '\u001b[33m',
  error: '\u001b[31m',
  success: '\u001b[32m',
  debug: '\u001b[35m',
};

const RESET = '\u001b[0m';
const supportsColor = Boolean(process.stdout.isTTY);

export interface Logger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
  success: (message: string) => void;
  debug: (message: string) => void;
  child: (scope: string) => Logger;
}

function formatMessage(level: LogLevel, scope: string | undefined, message: string): string {
  const timestamp = new Date().toISOString();
  const prefix = scope ? `[${scope}] ` : '';
  const base = `${ICONS[level]}  ${timestamp} ${prefix}${message}`;

  if (!supportsColor) {
    return base;
  }

  return `${COLORS[level]}${base}${RESET}`;
}

function emit(level: LogLevel, scope: string | undefined, message: string): void {
  const output = `${formatMessage(level, scope, message)}\n`;
  if (level === 'error') {
    process.stderr.write(output);
    return;
  }
  process.stdout.write(output);
}

export function createLogger(scope?: string): Logger {
  const scoped = scope;
  return {
    info: message => emit('info', scoped, message),
    warn: message => emit('warn', scoped, message),
    error: message => emit('error', scoped, message),
    success: message => emit('success', scoped, message),
    debug: message => emit('debug', scoped, message),
    child(childScope: string): Logger {
      const mergedScope = scoped ? `${scoped}:${childScope}` : childScope;
      return createLogger(mergedScope);
    },
  };
}

export const rootLogger = createLogger('scripts');
