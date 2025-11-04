/**
 * @fileoverview Bootstrap Type Definitions
 * @description Phase 343: 에러 처리 표준화를 위한 타입 정의
 * @module bootstrap/types
 */

/**
 * 부트스트랩 에러 처리 전략
 *
 * Phase 343: Error Handling Standardization
 * - Critical 시스템: throwOnError = true (앱 시작 불가)
 * - Non-Critical 시스템: throwOnError = false (경고 후 계속)
 */
export interface BootstrapErrorStrategy {
  /**
   * 에러 발생 시 예외를 throw할지 여부
   * - true: Critical 시스템 (environment, critical-systems)
   * - false: Non-Critical 시스템 (features, dev-tools)
   */
  throwOnError: boolean;

  /**
   * 로깅 레벨
   * - 'error': Critical 시스템 실패
   * - 'warn': Non-Critical 시스템 실패
   */
  logLevel: 'error' | 'warn';

  /**
   * 에러 컨텍스트 (디버깅용)
   */
  context: string;
}

/**
 * 부트스트랩 시스템 타입
 */
export type BootstrapSystemType = 'critical' | 'non-critical';

/**
 * Critical 시스템 기본 전략
 */
export const CRITICAL_ERROR_STRATEGY: BootstrapErrorStrategy = {
  throwOnError: true,
  logLevel: 'error',
  context: 'critical',
};

/**
 * Non-Critical 시스템 기본 전략
 */
export const NON_CRITICAL_ERROR_STRATEGY: BootstrapErrorStrategy = {
  throwOnError: false,
  logLevel: 'warn',
  context: 'non-critical',
};

/**
 * 시스템 타입에 따른 에러 전략 반환
 *
 * @param systemType - 부트스트랩 시스템 타입
 * @param customContext - 커스텀 컨텍스트 (선택)
 * @returns 에러 처리 전략
 */
export function getErrorStrategy(
  systemType: BootstrapSystemType,
  customContext?: string
): BootstrapErrorStrategy {
  const baseStrategy =
    systemType === 'critical' ? CRITICAL_ERROR_STRATEGY : NON_CRITICAL_ERROR_STRATEGY;

  return customContext ? { ...baseStrategy, context: customContext } : baseStrategy;
}

/**
 * 에러 처리 헬퍼 함수
 *
 * 전략에 따라 에러를 로깅하고 선택적으로 재throw합니다.
 *
 * @param error - 발생한 에러
 * @param strategy - 에러 처리 전략
 * @param logger - 로거 인스턴스
 *
 * @example
 * ```typescript
 * try {
 *   await initializeSomething();
 * } catch (error) {
 *   handleBootstrapError(error, CRITICAL_ERROR_STRATEGY, logger);
 * }
 * ```
 */
export function handleBootstrapError(
  error: unknown,
  strategy: BootstrapErrorStrategy,
  logger: {
    error: (msg: string, ...args: unknown[]) => void;
    warn: (msg: string, ...args: unknown[]) => void;
  }
): never | void {
  const errorMsg = error instanceof Error ? error.message : String(error);
  const logMessage = `[${strategy.context}] 초기화 실패: ${errorMsg}`;

  if (strategy.logLevel === 'error') {
    logger.error(logMessage, error);
  } else {
    logger.warn(logMessage, error);
  }

  if (strategy.throwOnError) {
    throw error;
  }
}
