/**
 * @fileoverview Core Services Consolidation
 * @version 1.0.0 - Phase 1 Step 3
 *
 * 작은 서비스 파일들의 통합
 * - Logger Interface & ConsoleLogger
 * - ServiceDiagnostics
 * - ServiceRegistry (통합됨)
 *
 * Phase 1 Step 3: 파일 통합을 통한 복잡도 감소
 */

// ================================
// Logger Interface & Implementation
// ================================

import { SERVICE_KEYS } from '@/constants';
import { logger } from '@shared/logging/logger';
import type { ServiceTypeMapping } from '@shared/types/core/core-types';
import { registerCoreServices } from './service-initialization';

// Type-safe service keys
export type ServiceKey = keyof ServiceTypeMapping;

/**
 * 로거 인터페이스
 */
export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

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
export class ServiceDiagnostics {
  /**
   * ServiceManager 상태 진단
   */
  static async diagnoseServiceManager(): Promise<void> {
    try {
      logger.info('🔍 ServiceManager 진단 시작');

      // 동적 import로 순환 의존성 방지
      await registerCoreServices();
      const { ServiceManager } = await import('./ServiceManager');

      const serviceManager = ServiceManager.getInstance();

      // 1. 서비스 등록
      logger.info('📋 서비스 등록 중...');
      await registerCoreServices();

      // 2. 등록 상태 확인
      const diagnostics = serviceManager.getDiagnostics();
      logger.info('📊 진단 결과:', {
        registeredCount: diagnostics.registeredServices,
        initializedCount: diagnostics.activeInstances,
        services: diagnostics.services,
        instances: diagnostics.instances,
      });

      // 3. 등록된 서비스 목록
      logger.debug('🗂️ 등록된 서비스:', diagnostics.services);

      // 4. 필수 서비스 초기화 테스트
      logger.info('🧪 필수 서비스 초기화 테스트 중...');
      const autoTheme = await serviceManager.tryGet(SERVICE_KEYS.AUTO_THEME);

      logger.info('✅ 서비스 초기화 결과:', {
        autoTheme: autoTheme ? '성공' : '실패',
      });

      // 5. 메모리 사용량 (간소화된 ResourceManager 사용)
      try {
        const { ResourceManager } = await import('../utils/memory/ResourceManager');
        const resourceManager = new ResourceManager();
        const resourceCount = resourceManager.getResourceCount();
        if (resourceCount > 0) {
          logger.info('💾 리소스 사용량:', { activeResources: resourceCount });
        }
      } catch (error) {
        logger.warn('리소스 사용량 조회 실패:', error);
      }

      logger.info('✅ ServiceManager 진단 완료');
    } catch (error) {
      logger.error('❌ ServiceManager 진단 실패:', error);
      throw error;
    }
  }

  /**
   * 브라우저 콘솔에서 실행할 수 있는 진단 명령 등록
   */
  static registerGlobalDiagnostic(): void {
    if (import.meta.env.DEV) {
      (globalThis as Record<string, unknown>).__XEG_DIAGNOSE__ = this.diagnoseServiceManager;
    }
  }
}

// 개발 환경에서 전역 진단 함수 등록
ServiceDiagnostics.registerGlobalDiagnostic();

// ================================
// Service Registry (통합됨)
// ================================

// ================================
// Service Registry (재export)
// ================================

/**
 * ServiceRegistry 기능을 재export합니다
 * ServiceRegistry가 ServiceManager에 통합되었고, 초기화는 별도 파일로 분리
 */
export { registerCoreServices } from './service-initialization';
export { getService } from './ServiceManager';

// 하위 호환성을 위한 별칭
export type ILogger = Logger;
