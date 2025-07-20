/**
 * X.com Enhanced Gallery - 통합된 메인 진입점
 *
 * Clean Architecture App Layer를 통한 간소화된 애플리케이션 부트스트래핑
 *
 * @version 3.1.0 - Simplified Architecture
 */

import { measurePerformance } from '@shared/utils/performance/index';
import { Application } from './app/Application';
import { logger } from '@core/logging/logger';
import type { AppConfig } from './shared/types/app';

// 전역 스타일 - 별도 모듈
import './styles/globals';

/**
 * 애플리케이션 설정 생성
 */
function createAppConfig(): AppConfig {
  return {
    version: import.meta.env.VITE_VERSION ?? '3.1.0',
    isDevelopment: import.meta.env.DEV,
    debug: import.meta.env.DEV,
    autoStart: true,
    performanceMonitoring: import.meta.env.DEV,
  };
}

/**
 * 개발 환경 디버깅 도구 초기화
 */
async function initializeDevTools(): Promise<void> {
  if (!import.meta.env.DEV) return;

  try {
    // 갤러리 디버깅 유틸리티
    const { galleryDebugUtils } = await import('@shared/utils/debug/gallery-debug');
    (globalThis as Record<string, unknown>).__XEG_DEBUG__ = galleryDebugUtils;

    // 서비스 진단 도구
    const { ServiceDiagnostics } = await import('@core/services/core-services');
    await ServiceDiagnostics.diagnoseServiceManager();

    logger.info('🛠️ 개발 도구 활성화됨');
  } catch (error) {
    logger.warn('개발 도구 로드 실패:', error);
  }
}

/**
 * 애플리케이션 메인 진입점
 */
async function startApplication(): Promise<void> {
  try {
    logger.info('🚀 X.com Enhanced Gallery 시작 중...');

    // 성능 측정 시작
    const startTime = performance.now();
    await measurePerformance('app-initialization', async () => {
      // 개발 도구 초기화 (개발 환경만)
      await initializeDevTools();

      // 애플리케이션 설정 생성
      const config = createAppConfig();

      // 통합 애플리케이션 시작
      const application = Application.create(config);
      await application.start();

      // 개발 환경에서 전역 접근 제공
      if (import.meta.env.DEV) {
        (globalThis as Record<string, unknown>).__XEG_APP__ = application;
      }

      return application;
    });
    const duration = performance.now() - startTime;

    logger.info('✅ 애플리케이션 초기화 완료', {
      startupTime: `${duration.toFixed(2)}ms`,
    });
  } catch (error) {
    logger.error('❌ 애플리케이션 초기화 실패:', error);

    // 에러 복구 시도
    setTimeout(() => {
      logger.info('🔄 애플리케이션 재시작 시도...');
      startApplication().catch(retryError => {
        logger.error('❌ 재시작 실패:', retryError);
      });
    }, 5000);
  }
}

// DOM 준비 시 애플리케이션 시작
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApplication);
} else {
  startApplication();
}

// 모듈 기본 export (외부에서 수동 시작 가능)
export default {
  start: startApplication,
  createConfig: createAppConfig,
  Application, // 직접 접근 가능
};

// 개발 환경에서 전역 접근 허용
if (import.meta.env.DEV) {
  (globalThis as Record<string, unknown>).__XEG_MAIN__ = {
    start: startApplication,
    createConfig: createAppConfig,
    Application,
  };
}
