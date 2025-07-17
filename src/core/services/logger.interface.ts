/**
 * @fileoverview Logger Interface
 * @version 1.0.0
 *
 * Core 레이어에서 사용할 로거 인터페이스
 * Infrastructure 레이어에 대한 의존성을 제거하기 위해 추상화
 */

/**
 * 로거 인터페이스
 */
export interface ILogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/**
 * 기본 콘솔 로거 구현 (개발 환경용)
 */
export class ConsoleLogger implements ILogger {
  debug(message: string, ...args: unknown[]): void {
    if (typeof console !== 'undefined' && console.info) {
      console.info(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (typeof console !== 'undefined' && console.info) {
      console.info(message, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(message, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (typeof console !== 'undefined' && console.error) {
      console.error(message, ...args);
    }
  }
}

/**
 * 기본 로거 인스턴스
 */
export const defaultLogger: ILogger = new ConsoleLogger();
