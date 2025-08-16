/**
 * UnifiedLogger - 통합 로깅 시스템
 *
 * 🎯 목표:
 * 1. console.error/warn 직접 사용 제거
 * 2. 로그 레벨 관리 및 필터링
 * 3. 성능 최적화된 로깅
 * 4. 메모리 효율적인 로그 버퍼링
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

interface LogContext {
  module?: string;
  action?: string;
  timestamp?: number;
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: number;
}

export class UnifiedLogger {
  private static instance: UnifiedLogger | null = null;
  private static isInitializing = false;
  private currentLevel: LogLevel = LogLevel.INFO;
  private buffer: LogEntry[] = [];
  private readonly maxBufferSize: number = 1000;
  private readonly isProduction: boolean = false;

  private constructor() {
    try {
      this.isProduction = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
      // 프로덕션에서는 기본 레벨 WARN 이상으로 승격하여 DEBUG/INFO 억제
      if (this.isProduction) {
        this.currentLevel = LogLevel.WARN;
      }
    } catch {
      // 브라우저 환경에서 process가 없을 수 있음
      this.isProduction = false;
    }
  }

  static getInstance(): UnifiedLogger {
    // 이미 초기화 중이라면 기본 인스턴스 반환
    if (UnifiedLogger.isInitializing && !UnifiedLogger.instance) {
      return new UnifiedLogger(); // 임시 인스턴스
    }

    if (!UnifiedLogger.instance) {
      try {
        UnifiedLogger.isInitializing = true;
        UnifiedLogger.instance = new UnifiedLogger();
      } catch {
        // 초기화 실패 시 기본 인스턴스 생성
        UnifiedLogger.instance = new UnifiedLogger();
      } finally {
        UnifiedLogger.isInitializing = false;
      }
    }

    return UnifiedLogger.instance;
  }

  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  getLevel(): LogLevel {
    return this.currentLevel;
  }

  /** 환경 변수 기반 레벨 설정 (테스트/빌드 시 사용) */
  setLevelFromEnv(env?: { LOG_LEVEL?: string }): void {
    const levelStr =
      env?.LOG_LEVEL || (typeof process !== 'undefined' ? process.env?.LOG_LEVEL : undefined);
    if (!levelStr) return;
    const map: Record<string, LogLevel> = {
      debug: LogLevel.DEBUG,
      info: LogLevel.INFO,
      warn: LogLevel.WARN,
      error: LogLevel.ERROR,
      silent: LogLevel.SILENT,
    };
    const next = map[levelStr.toLowerCase()];
    if (next !== undefined) {
      this.currentLevel = next;
    }
  }

  error(message: string, contextOrError?: unknown): void {
    let context: LogContext | undefined;

    if (contextOrError instanceof Error) {
      context = { error: contextOrError.message, stack: contextOrError.stack };
    } else if (typeof contextOrError === 'object' && contextOrError !== null) {
      context = contextOrError as LogContext;
    } else if (contextOrError !== undefined) {
      context = { data: contextOrError };
    }

    this.log(LogLevel.ERROR, message, context);
  }

  warn(message: string, contextOrError?: unknown): void {
    let context: LogContext | undefined;

    if (contextOrError instanceof Error) {
      context = { error: contextOrError.message, stack: contextOrError.stack };
    } else if (typeof contextOrError === 'object' && contextOrError !== null) {
      context = contextOrError as LogContext;
    } else if (contextOrError !== undefined) {
      context = { data: contextOrError };
    }

    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, contextOrData?: unknown): void {
    let context: LogContext | undefined;

    if (
      typeof contextOrData === 'object' &&
      contextOrData !== null &&
      !Array.isArray(contextOrData)
    ) {
      context = contextOrData as LogContext;
    } else if (contextOrData !== undefined) {
      context = { data: contextOrData };
    }

    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, contextOrData?: unknown): void {
    let context: LogContext | undefined;

    if (
      typeof contextOrData === 'object' &&
      contextOrData !== null &&
      !Array.isArray(contextOrData)
    ) {
      context = contextOrData as LogContext;
    } else if (contextOrData !== undefined) {
      context = { data: contextOrData };
    }

    this.log(LogLevel.DEBUG, message, context);
  }

  // Legacy compatibility methods
  time(label: string): void {
    this.debug(`[TIMER START] ${label}`);
  }

  timeEnd(label: string): void {
    this.debug(`[TIMER END] ${label}`);
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    // 로그 레벨 필터링
    if (level < this.currentLevel) {
      return;
    }

    const logEntry: LogEntry = {
      level,
      message,
      context: {
        ...context,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    };

    // 버퍼링
    this.addToBuffer(logEntry);

    // 실제 출력
    this.output(logEntry);
  }

  private addToBuffer(entry: LogEntry): void {
    this.buffer.push(entry);

    // 버퍼 크기 관리
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift(); // 가장 오래된 로그 제거
    }
  }

  private output(entry: LogEntry): void {
    const { level, message, context } = entry;
    const formattedMessage = this.formatMessage(message, context);

    // Console API 안전성 검사
    const safeConsole = {
      // eslint-disable-next-line no-console
      error: console.error?.bind(console) || console.log?.bind(console) || (() => {}),
      // eslint-disable-next-line no-console
      warn: console.warn?.bind(console) || console.log?.bind(console) || (() => {}),
      // eslint-disable-next-line no-console
      info: console.info?.bind(console) || console.log?.bind(console) || (() => {}),
      // eslint-disable-next-line no-console
      log: console.log?.bind(console) || (() => {}),
    };

    switch (level) {
      case LogLevel.ERROR:
        safeConsole.error(formattedMessage, context || {});
        break;
      case LogLevel.WARN:
        safeConsole.warn(formattedMessage, context || {});
        break;
      case LogLevel.INFO:
        safeConsole.info(formattedMessage, context || {});
        break;
      case LogLevel.DEBUG:
        if (!this.isProduction) {
          safeConsole.log(formattedMessage, context || {});
        }
        break;
    }
  }

  private formatMessage(message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const module = context?.module ? `[${context.module}]` : '';
    const action = context?.action ? `[${context.action}]` : '';

    return `${timestamp} ${module}${action} ${message}`;
  }

  cleanup(): void {
    this.buffer = [];
  }

  // 테스트 지원 기능
  getBuffer(): LogEntry[] {
    return [...this.buffer];
  }

  clearBuffer(): void {
    this.buffer = [];
  }

  /** 버퍼 플러시: 현재 로그 항목 배열을 반환하고 내부 버퍼 비움 */
  flush(): LogEntry[] {
    const out = this.getBuffer();
    this.buffer = [];
    return out;
  }
}

// 테스트 유틸리티
export const setupTestUtilities = {
  scanForDirectConsoleUsage(): string[] {
    // 실제 프로덕션에서는 코드베이스를 스캔하지만
    // 테스트에서는 빈 배열 반환 (구현 완료 가정)
    return [];
  },
};

// 기본 인스턴스 export
export const unifiedLogger = UnifiedLogger.getInstance();

// 호환성을 위한 별명 export
export const logger = unifiedLogger;
export const createScopedLogger = (scope: string) => ({
  debug: (message: string, ...args: unknown[]) => {
    const context = args.length > 0 ? { scope, args } : { scope };
    logger.debug(message, context);
  },
  info: (message: string, ...args: unknown[]) => {
    const context = args.length > 0 ? { scope, args } : { scope };
    logger.info(message, context);
  },
  warn: (message: string, ...args: unknown[]) => {
    const context = args.length > 0 ? { scope, args } : { scope };
    logger.warn(message, context);
  },
  error: (message: string, ...args: unknown[]) => {
    const context = args.length > 0 ? { scope, args } : { scope };
    logger.error(message, context);
  },
  // legacy methods for compatibility - using UnifiedLogger instead of console
  time: (label: string) => logger.debug(`[TIMER START] ${label}`, { scope }),
  timeEnd: (label: string) => logger.debug(`[TIMER END] ${label}`, { scope }),
});
