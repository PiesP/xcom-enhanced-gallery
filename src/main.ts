/**
 * X.com Enhanced Gallery - 메인 진입점
 *
 * 단순화된 구조 - 유저스크립트에 최적화
 *
 * @version 4.0.0
 */

import { logger } from '@/shared/logging';
import { initializeEnvironment } from '@/bootstrap/env-init';
import { wireGlobalEvents } from '@/bootstrap/event-wiring';
import type { AppConfig } from '@/types';
import { registerFeatureServicesLazy as registerFeatures } from '@/bootstrap/feature-registration';
import {
  warmupCriticalServices,
  warmupNonCriticalServices,
  registerGalleryRenderer,
} from '@shared/container/service-accessors';
import { CoreService } from '@shared/services/ServiceManager';
import { cleanupVendors } from '@shared/external/vendors';

// 전역 스타일
// 글로벌 스타일은 import 시점(side-effect)을 피하기 위해 런타임에 로드합니다.
// startApplication 내부에서 동적으로 로드하여 테스트/번들링 모두에 안전합니다.

// Vendor 초기화는 startApplication에서 처리하도록 이동
// 애플리케이션 상태 관리
let isStarted = false;
let startPromise: Promise<void> | null = null;
let galleryApp: unknown = null; // Features GalleryApp 인스턴스
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
    await initializeEnvironment();
    logger.debug('✅ Vendor 라이브러리 초기화 완료');
  } catch (error) {
    logger.error('❌ 인프라 초기화 실패:', error);
    throw error;
  }
}

/**
 * Critical Path - 필수 시스템 초기화 (동기 부분만)
 */
async function initializeCriticalSystems(): Promise<void> {
  try {
    logger.info('Critical Path 초기화 시작');

    // Core 서비스 등록 (동적 import)
    const { registerCoreServices } = await import('@shared/services/core-services');
    await registerCoreServices();

    // Critical Services만 즉시 초기화
    // 강제 로드 (팩토리/서비스 즉시 활성화)
    warmupCriticalServices();

    // Toast 컨테이너 초기화 (동적 import)
    await initializeToastContainer();

    logger.info('✅ Critical Path 초기화 완료');
  } catch (error) {
    logger.error('❌ Critical Path 초기화 실패:', error);
    throw error;
  }
}

/**
 * Features 서비스 지연 등록
 */
async function registerFeatureServicesLazy(): Promise<void> {
  await registerFeatures();
}

/**
 * 갤러리 앱 시작은 파일 하단의 DOM 준비 상태에서 한 번만 트리거됩니다.
 * 중복 호출은 startPromise로 병합되어 단일 초기화만 수행됩니다.
 */

/**
 * Non-Critical 시스템 백그라운드 초기화
 */
function initializeNonCriticalSystems(): void {
  setTimeout(async () => {
    try {
      logger.info('Non-Critical 시스템 백그라운드 초기화 시작');

      warmupNonCriticalServices();

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

    render(h(ToastContainer, {}), toastContainer as HTMLElement);
    logger.debug('✅ Toast 컨테이너 지연 초기화 완료');
  } catch (error) {
    logger.warn('Toast 컨테이너 초기화 실패:', error);
  }
}

/**
 * 전역 이벤트 핸들러 설정
 */
function setupGlobalEventHandlers(): void {
  const unregister = wireGlobalEvents(() => {
    cleanup().catch(error => logger.error('페이지 언로드 정리 중 오류:', error));
  });
  cleanupHandlers.push(unregister);
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

    // CoreService 인스턴스 정리 (features 레이어에서 접근 금지이므로 여기서만 수행)
    CoreService.getInstance().cleanup();

    // Vendor 리소스 정리 (명시적 호출; import 시점 부작용 없음)
    try {
      cleanupVendors();
    } catch (e) {
      logger.warn('벤더 정리 중 경고:', e);
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
    registerGalleryRenderer(new GalleryRenderer());

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
 * 애플리케이션 메인 진입점
 */
async function startApplication(): Promise<void> {
  if (isStarted) {
    logger.debug('Application: Already started');
    return;
  }

  if (startPromise) {
    logger.debug('Application: Start in progress - reusing promise');
    return startPromise;
  }

  startPromise = (async () => {
    logger.info('🚀 X.com Enhanced Gallery 시작 중...');

    const startTime = performance.now();

    // 전역 스타일 로드 (사이드이펙트 import 방지)
    await import('./styles/globals');

    // 개발 도구 초기화 (개발 환경만)
    await initializeDevTools();

    // 1단계: 기본 인프라 초기화
    await initializeInfrastructure();

    // 2단계: 핵심 시스템만 초기화 (갤러리 제외)
    await initializeCriticalSystems();

    // 3단계: Feature Services 지연 등록
    await registerFeatureServicesLazy();

    // 4단계: 전역 이벤트 핸들러 설정
    setupGlobalEventHandlers();

    // 5단계: 갤러리 앱을 즉시 초기화 (지연 없음)
    await initializeGalleryImmediately();

    // 6단계: 백그라운드에서 Non-Critical 시스템 초기화
    initializeNonCriticalSystems();

    isStarted = true;

    const endTime = performance.now();
    const duration = endTime - startTime;

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
  })()
    .catch(error => {
      logger.error('❌ 애플리케이션 초기화 실패:', error);
      // 에러 복구 시도
      setTimeout(() => {
        logger.info('🔄 애플리케이션 재시작 시도...');
        startApplication().catch(retryError => {
          logger.error('❌ 재시작 실패:', retryError);
        });
      }, 2000);
    })
    .finally(() => {
      // 다음 수동 호출을 위해 startPromise 해제(이미 시작된 경우 isStarted가 가드)
      startPromise = null;
    });

  return startPromise;
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
