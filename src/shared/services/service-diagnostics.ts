/**
 * @fileoverview Service diagnostics (extracted to break circular deps)
 *
 * Note: This module avoids static imports from ServiceManager or service-initialization
 * to keep the dependency graph acyclic. It uses dynamic imports inside methods.
 */

import { logger } from '@shared/logging/logger';

export class ServiceDiagnostics {
  /**
   * Diagnose the current ServiceManager state and attempt minimal bootstrapping.
   */
  static async diagnoseServiceManager(): Promise<void> {
    try {
      logger.info('🔍 ServiceManager 진단 시작');

      // Dynamic imports to avoid static cycles
      const [{ registerCoreServices }, { CoreService }, { SERVICE_KEYS }] = await Promise.all([
        import('./service-initialization'),
        import('./ServiceManager'),
        import('@/constants'),
      ]);

      const serviceManager = CoreService.getInstance();

      // 1) Ensure services are registered (idempotent)
      logger.info('📋 서비스 등록 중...');
      await registerCoreServices();

      // 2) Gather diagnostics
      const diagnostics = serviceManager.getDiagnostics();
      logger.info('📊 진단 결과:', {
        registeredCount: diagnostics.registeredServices,
        initializedCount: diagnostics.activeInstances,
        services: diagnostics.services,
        instances: diagnostics.instances,
      });

      // 3) Try essential service presence
      logger.info('🧪 필수 서비스 초기화 테스트 중...');
      const autoTheme = await serviceManager.tryGet(SERVICE_KEYS.THEME);
      logger.info('✅ 서비스 초기화 결과:', {
        autoTheme: autoTheme ? '성공' : '실패',
      });

      // 4) Optional memory inspection (best-effort)
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
   * Register a global diagnostic function for quick manual checks in dev.
   */
  static registerGlobalDiagnostic(): void {
    if (import.meta.env.DEV) {
      (globalThis as Record<string, unknown>).__XEG_DIAGNOSE__ = this.diagnoseServiceManager;
    }
  }
}

// Note: 글로벌 등록은 import 시점 부작용을 피하기 위해 엔트리(main.ts)의 DEV 분기에서만 수행합니다.
