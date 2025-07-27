/**
 * X.com Enhanced Gallery - 메인 진입점
 *
 * 단순화된 구조 - 유저스크립트에 최적화
 *
 * @version 4.0.0 - Simplified Architecture
 */

import { measurePerformance } from '@/utils';
import { logger } from '@/utils';
import type { AppConfig } from '@/types';
import { ServiceManager } from '@/utils';
import { SERVICE_KEYS } from './constants';
import { GalleryApp } from '@/components';

// 전역 스타일
import './styles/globals';

// 즉시 vendor 초기화 - 모든 모듈 로딩 전에 수행
(async () => {
  try {
    const { initializeVendors } = await import('@/external');
    await initializeVendors();
    logger.debug('✅ Vendor 라이브러리 조기 초기화 완료');
  } catch (error) {
    logger.error('❌ Vendor 조기 초기화 실패:', error);
  }
})();

// 애플리케이션 상태 관리
let isStarted = false;
let galleryApp: GalleryApp | null = null;
let serviceManager: ServiceManager | null = null;
let cleanupHandlers: (() => Promise<void> | void)[] = [];

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
 * 기본 인프라 초기화
 */
async function initializeInfrastructure(): Promise<void> {
  try {
    // Vendor 라이브러리 초기화
    const { initializeVendors } = await import('@shared/external/vendors');
    await initializeVendors();
    logger.debug('✅ Vendor 라이브러리 초기화 완료');
  } catch (error) {
    logger.error('❌ 인프라 초기화 실패:', error);
    throw error;
  }
}

/**
 * Critical Path - 필수 시스템 초기화
 */
async function initializeCriticalSystems(): Promise<void> {
  try {
    logger.info('Critical Path 초기화 시작');

    serviceManager = ServiceManager.getInstance();

    // Core 서비스 등록
    const { registerCoreServices } = await import('@shared/services');
    await registerCoreServices();

    // Features 서비스 등록 (의존성 규칙 준수)
    await registerFeatureServices();

    // Critical Services만 즉시 초기화
    const criticalServices = [
      SERVICE_KEYS.VIDEO_CONTROL,
      SERVICE_KEYS.MEDIA_EXTRACTION,
      SERVICE_KEYS.TOAST_CONTROLLER,
    ];

    for (const serviceKey of criticalServices) {
      try {
        await serviceManager.get(serviceKey);
        logger.debug(`✅ Critical 서비스 초기화: ${serviceKey}`);
      } catch (error) {
        logger.error(`❌ Critical 서비스 초기화 실패: ${serviceKey}`, error);
        throw error;
      }
    }

    // Toast 컨테이너 초기화
    await initializeToastContainer();

    logger.info(`✅ Critical Path 초기화 완료: ${criticalServices.length}개 서비스`);
  } catch (error) {
    logger.error('❌ Critical Path 초기화 실패:', error);
    throw error;
  }
}

/**
 * 갤러리 앱 시작
 */
async function startGalleryApp(): Promise<void> {
  try {
    galleryApp = new GalleryApp();
    await galleryApp.initialize();

    // 전역 접근 등록 (정리용)
    if (import.meta.env.DEV) {
      (globalThis as Record<string, unknown>).__XEG_GALLERY_APP__ = galleryApp;
    }

    logger.debug('✅ 갤러리 앱 시작 완료');
  } catch (error) {
    logger.error('❌ 갤러리 앱 시작 실패:', error);
    throw error;
  }
}

/**
 * Non-Critical 시스템 백그라운드 초기화
 */
function initializeNonCriticalSystems(): void {
  setTimeout(async () => {
    try {
      logger.info('Non-Critical 시스템 백그라운드 초기화 시작');

      const nonCriticalServices = [
        'theme.auto',
        'core.bulkDownload',
        'media.filename',
        'gallery.download',
      ];

      if (!serviceManager) return;

      for (const serviceKey of nonCriticalServices) {
        try {
          await serviceManager.get(serviceKey);
          logger.debug(`✅ Non-Critical 서비스 초기화: ${serviceKey}`);
        } catch (error) {
          logger.warn(`⚠️ Non-Critical 서비스 초기화 실패 (무시): ${serviceKey}`, error);
        }
      }

      logger.info('✅ Non-Critical 시스템 백그라운드 초기화 완료');
    } catch (error) {
      logger.warn('Non-Critical 시스템 초기화 중 오류 (앱 동작에는 영향 없음):', error);
    }
  });
}

/**
 * Toast 컨테이너 초기화
 */
async function initializeToastContainer(): Promise<void> {
  try {
    const { ToastContainer } = await import('@shared/components/ui');
    const { getPreact } = await import('@shared/external/vendors');
    const { h, render } = getPreact();

    let toastContainer = document.getElementById('xeg-toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'xeg-toast-container';
      document.body.appendChild(toastContainer);
    }

    render(h(ToastContainer, {}), toastContainer);
    logger.debug('Toast 컨테이너 초기화 완료');
  } catch (error) {
    logger.warn('Toast 컨테이너 초기화 실패:', error);
  }
}

/**
 * 전역 이벤트 핸들러 설정
 */
function setupGlobalEventHandlers(): void {
  const beforeUnloadHandler = (): void => {
    cleanup().catch(error => logger.error('페이지 언로드 정리 중 오류:', error));
  };

  window.addEventListener('beforeunload', beforeUnloadHandler);
  window.addEventListener('pagehide', beforeUnloadHandler);

  cleanupHandlers.push(() => {
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    window.removeEventListener('pagehide', beforeUnloadHandler);
  });
}

/**
 * 애플리케이션 정리
 */
async function cleanup(): Promise<void> {
  try {
    logger.info('🧹 애플리케이션 정리 시작');

    if (galleryApp) {
      await galleryApp.cleanup();
      galleryApp = null;
      delete (globalThis as Record<string, unknown>).__XEG_GALLERY_APP__;
    }

    if (serviceManager) {
      serviceManager.cleanup();
      serviceManager = null;
    }

    await Promise.all(
      cleanupHandlers.map(handler =>
        Promise.resolve(handler()).catch((error: unknown) =>
          logger.warn('정리 핸들러 실행 중 오류:', error)
        )
      )
    );
    cleanupHandlers = [];

    isStarted = false;
    logger.info('✅ 애플리케이션 정리 완료');
  } catch (error) {
    logger.error('❌ 애플리케이션 정리 중 오류:', error);
    throw error;
  }
}

/**
 * 개발 환경 디버깅 도구 초기화
 */
async function initializeDevTools(): Promise<void> {
  if (!import.meta.env.DEV) return;

  try {
    // 갤러리 디버깅 유틸리티
    const { galleryDebugUtils } = await import('@shared/utils');
    (globalThis as Record<string, unknown>).__XEG_DEBUG__ = galleryDebugUtils;

    // 서비스 진단 도구
    const { ServiceDiagnostics } = await import('@shared/services/core-services');
    await ServiceDiagnostics.diagnoseServiceManager();

    logger.info('🛠️ 개발 도구 활성화됨');
  } catch (error) {
    logger.warn('개발 도구 로드 실패:', error);
  }
}

/**
 * Features 레이어 서비스들을 등록합니다
 * 의존성 규칙을 준수하기 위해 main.ts에서 등록
 */
async function registerFeatureServices(): Promise<void> {
  try {
    // Gallery Services - Features 레이어
    const { GalleryRenderer } = await import('@features/gallery/GalleryRenderer');
    serviceManager!.register(SERVICE_KEYS.GALLERY_RENDERER, new GalleryRenderer());

    // Settings Manager - Features 레이어
    const { SettingsService } = await import('@features/settings/services/SettingsService');
    serviceManager!.register(SERVICE_KEYS.SETTINGS_MANAGER, new SettingsService());

    // Twitter Token Extractor - Features 레이어
    const { TwitterTokenExtractor } = await import(
      '@features/settings/services/TwitterTokenExtractor'
    );
    serviceManager!.register(SERVICE_KEYS.TWITTER_TOKEN_EXTRACTOR, new TwitterTokenExtractor());

    logger.debug('✅ Features 서비스 등록 완료');
  } catch (error) {
    // Features 레이어 서비스 로딩 실패는 치명적이지 않음
    logger.warn('⚠️ 일부 feature 서비스 로딩 실패:', error);
  }
}

/**
 * 애플리케이션 메인 진입점
 */
async function startApplication(): Promise<void> {
  if (isStarted) {
    logger.debug('Application: Already started');
    return;
  }

  try {
    logger.info('🚀 X.com Enhanced Gallery 시작 중...');
    const startTime = performance.now();

    await measurePerformance('app-initialization', async () => {
      // 개발 도구 초기화 (개발 환경만)
      await initializeDevTools();

      // 1단계: 기본 인프라 초기화
      await initializeInfrastructure();

      // 2단계: Critical Path - 필수 시스템만 먼저 초기화
      await initializeCriticalSystems();

      // 3단계: 갤러리 앱 시작
      await startGalleryApp();

      // 4단계: Non-Critical - 백그라운드에서 지연 초기화
      initializeNonCriticalSystems();

      // 부가 기능 초기화
      setupGlobalEventHandlers();

      isStarted = true;
    });

    const duration = performance.now() - startTime;
    logger.info('✅ 애플리케이션 초기화 완료', {
      startupTime: `${duration.toFixed(2)}ms`,
    });

    // 개발 환경에서 전역 접근 제공
    if (import.meta.env.DEV) {
      (globalThis as Record<string, unknown>).__XEG_MAIN__ = {
        start: startApplication,
        createConfig: createAppConfig,
        cleanup,
        galleryApp,
      };
    }
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
  cleanup,
};

// 개발 환경에서 전역 접근 허용
if (import.meta.env.DEV) {
  (globalThis as Record<string, unknown>).__XEG_MAIN__ = {
    start: startApplication,
    createConfig: createAppConfig,
    cleanup,
  };
}
