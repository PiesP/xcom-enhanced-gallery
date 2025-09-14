/**
 * @fileoverview Core Services Consolidation
 * @version 1.0.0 - Phase 1 Step 3
 *
 * 작은 서비스 파일들의 통합
 * - Logger Interface & ConsoleLogger
 * - ServiceDiagnostics
 * - ServiceRegistry (통합됨)
 * - CoreService (구 ServiceManager) export 추가
 *
 * Phase 1 Step 3: 파일 통합을 통한 복잡도 감소
 */

// ================================
// Core Service Export
// ================================

// CoreService (구 ServiceManager) - 명명 규칙 통일
export { CoreService } from './ServiceManager';
export { serviceManager } from './ServiceManager';
export { getService } from './ServiceManager';

// ================================
// Logger Interface & Implementation
// ================================

import { logger } from '@shared/logging/logger';

// ServiceTypeMapping 제거됨 - Phase 4 Step 4: 과도한 추상화 제거
// 직접적인 서비스 키 타입 사용
export type ServiceKey = string;

/**
 * 로거 인터페이스
 */
export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

// 호환성을 위한 ILogger 별칭
export interface ILogger extends Logger {}

/**
 * 기존 ILogger 인터페이스를 logger로 리다이렉트하는 어댑터
 */
export class ConsoleLogger implements Logger {
  debug(message: string, ...args: unknown[]): void {
    logger.debug(message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    logger.info(message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    logger.warn(message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    logger.error(message, ...args);
  }
}

/**
 * 기본 로거 인스턴스
 */
export const defaultLogger = new ConsoleLogger();

// ================================
// Service Diagnostics
// ================================

/**
 * ServiceManager 진단 도구
 *
 * ServiceManager의 상태와 서비스 등록 상황을 확인하는 도구
 */
// Diagnostics are extracted to a separate module to avoid cycles
export { ServiceDiagnostics } from './service-diagnostics';

// ================================
// Service Registry는 별도 파일로 분리됨
// service-registry.ts 참조
// ================================

// CoreService 클래스 제거됨 - Phase 4 간소화

// ================================
// Service Registry (재export)
// ================================

/**
 * ServiceRegistry 기능을 재export합니다
 * ServiceRegistry가 ServiceManager에 통합되었고, 초기화는 별도 파일로 분리
 */
export { registerCoreServices } from './service-initialization';
