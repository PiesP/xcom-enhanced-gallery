/**
 * @fileoverview 핵심 서비스 export - TDD GREEN Phase
 * @description ServiceDiagnostics를 CoreService로 통합 완료
 * @version 2.0.0 - TDD 기반 중복 제거 완료
 */

// 중앙집중식 로깅
import { logger, type Logger } from '@shared/logging';

// defaultLogger alias for backward compatibility
export const defaultLogger = logger;
export type ILogger = Logger;

/**
 * 개발 및 디버깅을 위한 콘솔 로거
 * 운영 환경에서는 자동으로 비활성화됨
 */
export class ConsoleLogger {
  private static enabled: boolean = import.meta.env.DEV;

  static enable(): void {
    this.enabled = true;
  }

  static disable(): void {
    this.enabled = false;
  }

  static log(message: string, ...args: unknown[]): void {
    if (this.enabled) {
      logger.info(message, ...args);
    }
  }

  static warn(message: string, ...args: unknown[]): void {
    if (this.enabled) {
      logger.warn(message, ...args);
    }
  }

  static error(message: string, ...args: unknown[]): void {
    if (this.enabled) {
      logger.error(message, ...args);
    }
  }

  static debug(message: string, ...args: unknown[]): void {
    if (this.enabled) {
      logger.debug(message, ...args);
    }
  }

  static trace(message: string, ...args: unknown[]): void {
    if (this.enabled) {
      logger.debug(`[TRACE] ${message}`, ...args);
    }
  }
}

// ================================
// 간단한 유틸리티 함수들
// ================================

/**
 * 환경별 설정값 조회
 */
export function getEnvConfig(key: string, defaultValue: string = ''): string {
  return import.meta.env[key] || defaultValue;
}

/**
 * 유저스크립트 환경 확인
 */
export function isUserScript(): boolean {
  return (
    typeof (globalThis as unknown as { GM?: unknown }).GM !== 'undefined' &&
    typeof (globalThis as unknown as { GM?: { info?: unknown } }).GM?.info !== 'undefined'
  );
}

/**
 * 개발 환경 확인
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV || import.meta.env.MODE === 'development';
}

/**
 * 프로덕션 환경 확인
 */
export function isProduction(): boolean {
  return import.meta.env.PROD || import.meta.env.MODE === 'production';
}

// ================================
// 하위 호환성을 위한 ServiceDiagnostics
// ================================

/**
 * @deprecated ServiceDiagnostics는 CoreService로 통합되었습니다.
 * CoreService.diagnoseServiceManager()를 사용하세요.
 */
export class ServiceDiagnostics {
  /**
   * @deprecated CoreService.diagnoseServiceManager() 사용 권장
   */
  static async diagnoseServiceManager(): Promise<void> {
    const { CoreService } = await import('./service-manager');
    return CoreService.diagnoseServiceManager();
  }

  /**
   * @deprecated CoreService에서 자동으로 처리됩니다.
   */
  static async registerGlobalDiagnostic(): Promise<void> {
    // CoreService에서 자동으로 처리됨
    if (import.meta.env.DEV) {
      const { CoreService } = await import('./service-manager');
      (globalThis as Record<string, unknown>).__XEG_DIAGNOSE__ =
        CoreService.getInstance().diagnoseServiceManager;
    }
  }
}

// 개발 환경에서 전역 진단 함수 등록 (CoreService로 위임)
// ServiceDiagnostics.registerGlobalDiagnostic(); // NOTE: 필요 시 main.ts에서 호출

// ================================
// 핵심 서비스 re-export
// ================================

// 주 서비스 매니저
export { CoreService, serviceManager, getService } from './service-manager';

// 서비스 초기화 로직
export { registerCoreServices } from './service-initialization';

// 간소화된 토스트 서비스
export { toasts as toast } from './toast-integration';

// ================================
// 타입 정의
// ================================

export interface CoreServiceInterface {
  register<T>(key: string, instance: T): void;
  get<T>(key: string): T;
  tryGet<T>(key: string): T | null;
  has(key: string): boolean;
  getDiagnostics(): {
    registeredServices: number;
    activeInstances: number;
    services: string[];
    instances: unknown[];
  };
}
