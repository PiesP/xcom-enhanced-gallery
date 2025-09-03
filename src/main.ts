/**
 * X.com Enhanced Gallery - 메인 진입점
 *
 * 단순화된 구조 - 유저스크립트에 최적화
 *
 * @version 4.0.0
 */

import { logger } from '@/shared/logging';
import type { AppConfig } from '@/types';
import { CoreService } from '@shared/services/ServiceManager';
import { InitializationManager } from '@shared/services/InitializationManager';
import { SERVICE_KEYS } from './constants';
import { FEATURE_INERTIA_VARIANT_B } from './constants';
import { setInertiaExperimentVariant } from '@shared/experiments/inertia-experiment';

// 전역 스타일
import './styles/globals';

// Vendor 초기화는 startApplication에서 처리하도록 이동

// 애플리케이션 상태 관리
let isStarted = false;
let galleryApp: unknown = null; // Features GalleryApp 인스턴스
let serviceManager: CoreService | null = null;
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
 * Critical Path - 필수 시스템 초기화 (동기 부분만)
 */
async function initializeCriticalSystems(): Promise<void> {
  try {
    logger.info('Critical Path 초기화 시작');

    serviceManager = CoreService.getInstance();

    // Core 서비스 등록 (동적 import)
    const { registerCoreServices } = await import('@shared/services/core-services');
    await registerCoreServices();

    // Critical Services만 즉시 초기화
    const criticalServices = [
      SERVICE_KEYS.VIDEO_CONTROL,
      SERVICE_KEYS.MEDIA_EXTRACTION,
      SERVICE_KEYS.TOAST,
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

    // Toast 컨테이너 초기화 (동적 import)
    await initializeToastContainer();

    logger.info(`✅ Critical Path 초기화 완료: ${criticalServices.length}개 서비스`);
  } catch (error) {
    logger.error('❌ Critical Path 초기화 실패:', error);
    throw error;
  }
}

/**
 * Feature Services 지연 등록 (필요시에만 로드)
 */
async function registerFeatureServicesLazy(): Promise<void> {
  try {
    // Features 서비스들을 지연 로딩으로 등록만 하고 초기화는 하지 않음
    logger.debug('Features 서비스 지연 등록 시작');

    // Settings Manager - Features 레이어
    const { SettingsService } = await import('@features/settings/services/SettingsService');
    serviceManager!.register(SERVICE_KEYS.SETTINGS, new SettingsService());

    // Twitter Token Extractor - Features 레이어
    const { TwitterTokenExtractor } = await import(
      '@features/settings/services/TwitterTokenExtractor'
    );
    serviceManager!.register(SERVICE_KEYS.TWITTER_TOKEN_EXTRACTOR, new TwitterTokenExtractor());

    logger.debug('✅ Features 서비스 지연 등록 완료');
  } catch (error) {
    // Features 레이어 서비스 로딩 실패는 치명적이지 않음
    logger.warn('⚠️ Features 서비스 지연 로딩 실패:', error);
  }
}

/**
 * 갤러리 앱 시작
 */
// Phase 10.2.A: IIFE 제거 - 중복 실행 방지
// 단일 시작점으로 통합 (DOM ready 패턴만 사용)

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
 * Toast 컨테이너 지연 초기화
 */
async function initializeToastContainer(): Promise<void> {
  try {
    logger.debug('Toast 컨테이너 지연 로딩 시작');

    // UI 컴포넌트를 지연 로딩
    const [{ ToastContainer }, { getPreact }] = await Promise.all([
      import('@shared/components/ui'),
      import('@shared/external/vendors'),
    ]);

    const { h, render } = getPreact();

    let toastContainer = document.getElementById('xeg-toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'xeg-toast-container';
      document.body.appendChild(toastContainer);
    }

    render(h(ToastContainer, {}), toastContainer);
    logger.debug('✅ Toast 컨테이너 지연 초기화 완료');
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
      await (galleryApp as { cleanup(): Promise<void> }).cleanup();
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
 * 갤러리 앱 생성 및 초기화 (지연 로딩)
 */
async function initializeGalleryApp(): Promise<void> {
  if (galleryApp) {
    logger.debug('갤러리 앱이 이미 초기화됨');
    return;
  }

  try {
    logger.info('🎨 갤러리 앱 지연 초기화 시작');

    // Gallery Renderer 서비스 등록 (갤러리 앱에만 필요)
    const { GalleryRenderer } = await import('@features/gallery/GalleryRenderer');
    serviceManager!.register(SERVICE_KEYS.GALLERY_RENDERER, new GalleryRenderer());

    // 갤러리 앱 인스턴스 생성
    const { GalleryApp } = await import('@features/gallery/GalleryApp');
    galleryApp = new GalleryApp();

    // 갤러리 앱 초기화
    await (galleryApp as { initialize(): Promise<void> }).initialize();
    logger.info('✅ 갤러리 앱 초기화 완료');

    // 개발 환경에서 디버깅용 전역 접근
    (globalThis as Record<string, unknown>).__XEG_GALLERY_APP__ = galleryApp;
  } catch (error) {
    logger.error('❌ 갤러리 앱 초기화 실패:', error);
    throw error;
  }
}

/**
 * 애플리케이션 메인 진입점 (Phase 4.1 GREEN - 초기화 순서 개선)
 */
async function startApplication(): Promise<void> {
  if (isStarted) {
    logger.debug('Application: Already started');
    return;
  }

  try {
    logger.info('🚀 X.com Enhanced Gallery 시작 중...');

    const startTime = performance.now();

    // Phase 4.1: InitializationManager 사용
    const initManager = new InitializationManager(import.meta.env.DEV);

    // 순차적 초기화 실행 (vendor → styles → app)
    const initSuccess = await initManager.initializeSequentially();

    if (!initSuccess) {
      throw new Error('Critical initialization failed');
    }

    // 개발 환경 디버깅 도구
    if (import.meta.env.DEV) {
      await initializeDevTools();
    }

    // 핵심 시스템 초기화
    await initializeCriticalSystems();

    // Feature Services 지연 등록
    await registerFeatureServicesLazy();

    // 전역 이벤트 핸들러 설정
    setupGlobalEventHandlers();

    // 갤러리 앱을 즉시 초기화
    await initializeGalleryImmediately();

    // 백그라운드에서 Non-Critical 시스템 초기화
    initializeNonCriticalSystems();

    // Phase 14: Inertia Variant B 플래그 활성 시 실험 Variant 자동 전환
    try {
      if (FEATURE_INERTIA_VARIANT_B) {
        setInertiaExperimentVariant('B');
        logger.info('Inertia Experiment: Variant B 활성화됨 (auto orchestration)');
      }
    } catch (err) {
      logger.warn('Inertia Variant 설정 실패 (무시):', err);
    }

    isStarted = true;

    const endTime = performance.now();
    const duration = endTime - startTime;

    logger.info('✅ 애플리케이션 초기화 완료', {
      startupTime: `${duration.toFixed(2)}ms`,
      initReport: initManager.getStatusReport(),
    });

    // 개발 환경에서 전역 접근 제공
    if (import.meta.env.DEV) {
      (globalThis as Record<string, unknown>).__XEG_MAIN__ = {
        start: startApplication,
        createConfig: createAppConfig,
        cleanup,
        galleryApp,
        initManager,
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
    }, 2000);
  }
}

/**
 * 갤러리 즉시 초기화 (지연 없음)
 */
async function initializeGalleryImmediately(): Promise<void> {
  try {
    logger.debug('🎯 갤러리 즉시 초기화 시작');

    // 기존의 scheduleGalleryInitialization 대신 즉시 실행
    await initializeGalleryApp();

    logger.debug('✅ 갤러리 즉시 초기화 완료');
  } catch (error) {
    logger.error('❌ 갤러리 즉시 초기화 실패:', error);
    throw error;
  }
}

/**
 * Phase 10.2.A: 유저스크립트 중복 실행 방지
 */
const GLOBAL_EXECUTION_KEY = '__XEG_EXECUTION_STATE__';

function ensureSingleExecution(): boolean {
  if (globalThis[GLOBAL_EXECUTION_KEY as keyof typeof globalThis]) {
    logger.debug('Application already running, skipping duplicate execution');
    return false;
  }
  (globalThis as Record<string, unknown>)[GLOBAL_EXECUTION_KEY] = {
    started: true,
    timestamp: Date.now(),
    instanceId: `xeg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // 인스턴스 식별
  };
  return true;
}

// Phase 10.2.A: 중복 시작점 제거 - 하나의 시작점만 유지
if (ensureSingleExecution()) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApplication, { once: true });
  } else {
    // 스택 정리 후 실행 (동기 실행으로 인한 문제 방지)
    setTimeout(startApplication, 0);
  }
}

// NOTE: 중복 시작 방지 - ensureSingleExecution 블록 내 로직만 사용
// (기존 이중 DOMContentLoaded 등록 제거)

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
