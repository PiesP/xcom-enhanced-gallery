/**
 * @fileoverview Global Error Handler
 * @version 2.1.0 - Phase 196: 전역 에러 처리 전용
 *
 * Window error 및 unhandledrejection 이벤트를 처리하는 전역 핸들러.
 *
 * @note 애플리케이션 로직의 에러 처리는 @shared/utils/error-handling.ts 사용.
 * 이 모듈은 브라우저 글로벌 에러만 처리합니다.
 */

import { logger } from '@shared/logging';

/**
 * 전역 에러 핸들러 (싱글톤)
 * Window 레벨의 uncaught error 및 unhandled promise rejection 처리
 */
export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler | null = null;
  private isInitialized = false;
  private boundErrorListener: ((event: ErrorEvent) => void) | null = null;
  private boundRejectionListener: ((event: PromiseRejectionEvent) => void) | null = null;

  public static getInstance(): GlobalErrorHandler {
    if (!this.instance) {
      this.instance = new GlobalErrorHandler();
    }
    return this.instance;
  }

  private constructor() {}

  /**
   * 전역 에러 핸들러 초기화
   * Window 이벤트 리스너 등록
   */
  public initialize(): void {
    if (this.isInitialized) {
      logger.debug('[GlobalErrorHandler] Already initialized');
      return;
    }

    // Bound listeners 생성 (removeEventListener에서 동일 참조 필요)
    if (!this.boundErrorListener) {
      this.boundErrorListener = this.handleUncaughtError.bind(this);
    }
    if (!this.boundRejectionListener) {
      this.boundRejectionListener = this.handleUnhandledRejection.bind(this);
    }

    // Window 이벤트 리스너 등록
    window.addEventListener('error', this.boundErrorListener);
    window.addEventListener('unhandledrejection', this.boundRejectionListener);

    this.isInitialized = true;
    logger.debug('[GlobalErrorHandler] Global error handlers registered');
  }

  /**
   * 전역 에러 핸들러 정리
   * Window 이벤트 리스너 제거
   */
  public destroy(): void {
    if (!this.isInitialized) {
      return;
    }

    // 리스너 제거
    if (this.boundErrorListener) {
      window.removeEventListener('error', this.boundErrorListener);
    }
    if (this.boundRejectionListener) {
      window.removeEventListener('unhandledrejection', this.boundRejectionListener);
    }

    this.isInitialized = false;
    this.boundErrorListener = null;
    this.boundRejectionListener = null;
    logger.debug('[GlobalErrorHandler] Global error handlers unregistered');
  }

  /**
   * Uncaught 에러 처리
   * @private
   */
  private handleUncaughtError(event: ErrorEvent): void {
    const message = event.message || 'Unknown error occurred';
    const context = {
      location: `${event.filename}:${event.lineno}:${event.colno}`,
      type: 'uncaught-error',
    };

    logger.error(`[UncaughtError] ${message}`, context);

    // 기본 동작 방지 (개발 모드에서만)
    if (import.meta.env.DEV) {
      event.preventDefault();
    }
  }

  /**
   * Unhandled Promise Rejection 처리
   * @private
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    const reason = event.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
          ? reason
          : `Unhandled rejection: ${String(reason)}`;

    logger.error(`[UnhandledRejection] ${message}`, {
      type: 'unhandled-rejection',
      reason: typeof reason === 'object' ? reason : String(reason),
    });

    // 기본 동작 방지 (개발 모드에서만)
    if (import.meta.env.DEV) {
      event.preventDefault();
    }
  }
}

/**
 * 전역 에러 핸들러 인스턴스
 */
export const globalErrorHandler = GlobalErrorHandler.getInstance();

// ---------------------------------------------
// Utility wrappers for safe execution (testing)
// ---------------------------------------------
// 일부 테스트 스위트(result-pattern-consolidation 등)는 에러 핸들러 모듈에서
// 안전 실행 유틸리티 제공을 기대합니다. 구현 중복을 피하기 위해 core-types의
// Result 유틸을 위임 래퍼로 제공합니다.

import {
  safeAsync as coreSafeAsync,
  safe as coreSafe,
  isSuccess,
} from '@shared/types/result.types';

/**
 * 비동기 안전 실행 래퍼
 * 성공 시 결과값을 반환하고, 실패 시 defaultValue(제공된 경우)를 반환합니다.
 * @param fn 실행할 비동기 함수
 * @param context 로깅/디버깅 컨텍스트 식별자(옵션)
 * @param defaultValue 실패 시 반환할 기본값(옵션)
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  context?: string,
  defaultValue?: T
): Promise<T | undefined> {
  try {
    const result = await coreSafeAsync(fn);
    if (isSuccess(result)) return result.data;
    // 실패 시 기본값 반환(있다면)
    if (typeof defaultValue !== 'undefined') return defaultValue;
    return undefined;
  } catch (e) {
    // 예외 발생 시에도 동일 정책 적용
    logger.error('[error-handler.safeAsync] execution failed', { context, error: e });
    if (typeof defaultValue !== 'undefined') return defaultValue;
    return undefined;
  }
}

/**
 * 동기 안전 실행 래퍼
 * 성공 시 결과값을 반환하고, 실패 시 defaultValue(제공된 경우)를 반환합니다.
 * @param fn 실행할 동기 함수
 * @param context 로깅/디버깅 컨텍스트 식별자(옵션)
 * @param defaultValue 실패 시 반환할 기본값(옵션)
 */
export function safeSync<T>(fn: () => T, context?: string, defaultValue?: T): T | undefined {
  try {
    const result = coreSafe(fn);
    if (isSuccess(result)) return result.data as T;
    if (typeof defaultValue !== 'undefined') return defaultValue;
    return undefined;
  } catch (e) {
    logger.error('[error-handler.safeSync] execution failed', { context, error: e });
    if (typeof defaultValue !== 'undefined') return defaultValue;
    return undefined;
  }
}
