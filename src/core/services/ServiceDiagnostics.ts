/**
 * ServiceManager 진단 도구
 *
 * ServiceManager의 상태와 서비스 등록 상황을 확인하는 도구
 */

import { SERVICE_KEYS } from '../../constants';
import { registerAllServices } from './ServiceRegistry';
import { ServiceManager } from './ServiceManager';
import { logger } from '@core/logging/logger';

// Create service manager instance
const serviceManager = ServiceManager.getInstance();

/**
 * ServiceManager 상태 진단
 */
export async function diagnoseServiceManager(): Promise<void> {
  try {
    logger.info('🔍 ServiceManager 진단 시작');

    // 1. 서비스 등록
    logger.info('📋 서비스 등록 중...');
    registerAllServices();

    // 2. 등록 상태 확인
    const diagnostics = serviceManager.getDiagnostics();
    logger.info('📊 진단 결과:', {
      isReady: diagnostics.isReady,
      registeredCount: diagnostics.registeredServices.length,
      initializedCount: diagnostics.initializedServices.length,
      loadingCount: diagnostics.loadingServices.length,
    });

    // 3. 등록된 서비스 목록
    logger.debug('🗂️ 등록된 서비스:', diagnostics.registeredServices);

    // 4. 필수 서비스 초기화 테스트
    logger.info('🧪 필수 서비스 초기화 테스트 중...');
    const autoTheme = await serviceManager.tryGet(SERVICE_KEYS.AUTO_THEME);

    logger.info('✅ 서비스 초기화 결과:', {
      autoTheme: autoTheme ? '성공' : '실패',
    });

    // 5. 메모리 사용량 (infrastructure ResourceManager 사용)
    try {
      const { ResourceManager } = await import('../../infrastructure/managers');
      const resourceManager = ResourceManager.getInstance();
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
 * 브라우저 콘솔에서 실행할 수 있는 진단 명령
 */
if (import.meta.env.DEV) {
  (globalThis as Record<string, unknown>).__XEG_DIAGNOSE__ = diagnoseServiceManager;
}
