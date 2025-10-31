/**
 * X.com Enhanced Gallery - 메인 진입점
 *
 * 단순화된 구조 - 유저스크립트에 최적화
 *
 * @version 4.0.0
 */

import { logger, tracePoint, traceAsync, startFlowTrace, stopFlowTrace } from '@/shared/logging';
import { initializeEnvironment } from '@/bootstrap/environment';
import { wireGlobalEvents } from '@/bootstrap/events';
import type { AppConfig } from '@/types';
import { registerFeatureServicesLazy } from '@/bootstrap/features';
import {
  warmupCriticalServices,
  warmupNonCriticalServices,
  registerGalleryRenderer,
  registerCoreBaseServices,
  initializeBaseServices,
} from '@shared/container/service-accessors';
import { CoreService } from '@shared/services/service-manager';
import { cleanupVendors } from './shared/external/vendors';
import { globalTimerManager } from '@shared/utils/timer-management';

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
    if (__DEV__ && tracePoint) tracePoint('infra:init:start');
    await initializeEnvironment();
    logger.debug('✅ Vendor 라이브러리 초기화 완료');
    if (__DEV__ && tracePoint) tracePoint('infra:init:done');
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
    if (__DEV__ && tracePoint) tracePoint('critical:init:start');

    // Core 서비스 등록 (동적 import)
    const { registerCoreServices } = await import('@shared/services/core-services');
    await registerCoreServices();

    // Critical Services만 즉시 초기화
    // 강제 로드 (팩토리/서비스 즉시 활성화)
    warmupCriticalServices();

    logger.info('✅ Critical Path 초기화 완료');
    if (__DEV__ && tracePoint) tracePoint('critical:init:done');
  } catch (error) {
    logger.error('❌ Critical Path 초기화 실패:', error);
    throw error;
  }
}

/**
 * Phase A5.2: BaseService 생명주기 중앙화 초기화
 * service-manager에서 AnimationService, ThemeService, LanguageService 관리
 */
async function initializeCoreBaseServices(): Promise<void> {
  try {
    logger.debug('🔄 BaseService 레지스트리 등록 중...');
    if (__DEV__ && tracePoint) tracePoint('baseservice:register:start');
    registerCoreBaseServices();

    logger.debug('🔄 BaseService 초기화 중...');
    if (__DEV__ && tracePoint) tracePoint('baseservice:init:start');
    await initializeBaseServices();

    logger.debug('✅ BaseService 초기화 완료');
    if (__DEV__ && tracePoint) tracePoint('baseservice:init:done');
  } catch (error) {
    logger.warn('BaseService 초기화 실패 (계속 진행):', error);
  }
}

/**
 * Non-Critical 시스템 백그라운드 초기화
 */
function initializeNonCriticalSystems(): void {
  // 테스트 모드에서는 비필수 시스템 초기화를 건너뛰어 불필요한 타이머를 만들지 않는다
  if (import.meta.env.MODE === 'test') {
    logger.debug('Non-Critical 시스템 초기화 생략 (test mode)');
    return;
  }

  globalTimerManager.setTimeout(async () => {
    try {
      logger.info('Non-Critical 시스템 백그라운드 초기화 시작');
      if (__DEV__ && tracePoint) tracePoint('noncritical:init:start');

      warmupNonCriticalServices();

      logger.info('✅ Non-Critical 시스템 백그라운드 초기화 완료');
      if (__DEV__ && tracePoint) tracePoint('noncritical:init:done');
    } catch (error) {
      logger.warn('Non-Critical 시스템 초기화 중 오류 (앱 동작에는 영향 없음):', error);
    }
  }, 0);
}

/**
 * 전역 이벤트 핸들러 설정
 */
function setupGlobalEventHandlers(): void {
  const unregister = wireGlobalEvents(() => {
    cleanup().catch(error => logger.error('페이지 언로드 정리 중 오류:', error));
  });
  cleanupHandlers.push(unregister);
  if (__DEV__ && tracePoint) tracePoint('global:events:registered');
}

/**
 * 애플리케이션 정리
 */
async function cleanup(): Promise<void> {
  try {
    logger.info('🧹 애플리케이션 정리 시작');

    // 테스트 모드 진단: 정리 전 타이머/이벤트 상태 출력
    if (import.meta.env.MODE === 'test') {
      try {
        const { getEventListenerStatus } = await import('@shared/utils/events');
        const beforeTimers = globalTimerManager.getActiveTimersCount();
        const beforeEvents = getEventListenerStatus();
        logger.debug('[TEST][cleanup:before] activeTimers:', beforeTimers, 'managedEvents:', {
          total: beforeEvents.total,
          byType: beforeEvents.byType,
          byContext: beforeEvents.byContext,
        });
        // Phase 19: 테스트용 console.log 제거, logger.debug로 충분
      } catch (e) {
        logger.debug('[TEST] cleanup pre-diagnostics skipped:', e);
      }
    }

    if (galleryApp) {
      await (galleryApp as { cleanup(): Promise<void> }).cleanup();
      galleryApp = null;
      if (import.meta.env.DEV) {
        delete (globalThis as Record<string, unknown>).__XEG_GALLERY_APP__;
      }
    }

    // CoreService 인스턴스 정리 (features 레이어에서 접근 금지이므로 여기서만 수행)
    CoreService.getInstance().cleanup();

    // Vendor 리소스 정리 (명시적 호출; import 시점 부작용 없음)
    try {
      cleanupVendors();
    } catch (e) {
      logger.warn('벤더 정리 중 경고:', e);
    }

    // DOMCache 전역 인스턴스 정리 (import 시점 interval 제거)
    try {
      const { globalDOMCache } = await import('@shared/dom/dom-cache');
      if (globalDOMCache) {
        globalDOMCache.dispose();
      }
    } catch (e) {
      logger.warn('DOMCache 정리 중 경고:', e);
    }

    await Promise.all(
      cleanupHandlers.map(handler =>
        Promise.resolve(handler()).catch((error: unknown) =>
          logger.warn('정리 핸들러 실행 중 오류:', error)
        )
      )
    );
    cleanupHandlers = [];

    // 전역 타이머 정리 (non-critical init 등)
    try {
      globalTimerManager.cleanup();
    } catch (e) {
      logger.warn('글로벌 타이머 정리 중 경고:', e);
    }

    // 모듈 레벨에서 등록된 DOMContentLoaded 핸들러 제거 (테스트 환경 안정화)
    // Phase 236: @run-at document-idle 보장으로 DOMContentLoaded 리스너 제거됨
    // 더 이상 제거할 리스너가 없으므로 이 블록 자체를 제거

    // 전역 에러 핸들러 정리 (window:error/unhandledrejection 리스너 제거)
    try {
      const { GlobalErrorHandler } = await import('@shared/error');
      GlobalErrorHandler.getInstance().destroy();
    } catch (e) {
      logger.debug('Global error handlers cleanup skipped or failed:', e);
    }

    isStarted = false;
    logger.info('✅ 애플리케이션 정리 완료');

    // 테스트 모드 진단: 정리 후 타이머/이벤트 상태 출력
    if (import.meta.env.MODE === 'test') {
      try {
        const { getEventListenerStatus } = await import('@shared/utils/events');
        const afterTimers = globalTimerManager.getActiveTimersCount();
        const afterEvents = getEventListenerStatus();
        logger.debug('[TEST][cleanup:after] activeTimers:', afterTimers, 'managedEvents:', {
          total: afterEvents.total,
          byType: afterEvents.byType,
          byContext: afterEvents.byContext,
        });
        // Phase 19: 테스트용 console.log 제거, logger.debug로 충분
      } catch (e) {
        logger.debug('[TEST] cleanup post-diagnostics skipped:', e);
      }
    }
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
    // 갤러리 디버깅 유틸리티 제거됨 (Phase 140.2 - 미사용 코드 정리)
    // DEV 전용 전역 키를 런타임 생성하여 프로덕션 번들에 문자열이 포함되지 않도록 함
    // const __devKey = (codes: number[]) => String.fromCharCode(...codes);
    // const kDebug = __devKey([95, 95, 88, 69, 71, 95, 68, 69, 66, 85, 71, 95, 95]); // "__XEG_DEBUG__"
    // (globalThis as Record<string, unknown>)[kDebug] = galleryDebugUtils;

    // 서비스 진단 도구
    const { ServiceDiagnostics } = await import('@shared/services/core-services');
    // DEV 전용 전역 진단 등록 (import 부작용 제거)
    ServiceDiagnostics.registerGlobalDiagnostic();
    await ServiceDiagnostics.diagnoseServiceManager();

    logger.info('🛠️ 개발 도구 활성화됨');
    if (__DEV__ && tracePoint) tracePoint('devtools:ready');
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
    if (__DEV__ && tracePoint) tracePoint('gallery:init:start');

    // Gallery Renderer 서비스 등록 (갤러리 앱에만 필요)
    const { GalleryRenderer } = await import('@features/gallery/GalleryRenderer');
    registerGalleryRenderer(new GalleryRenderer());

    // 갤러리 앱 인스턴스 생성
    const { GalleryApp } = await import('@features/gallery/GalleryApp');
    galleryApp = new GalleryApp();

    // 갤러리 앱 초기화
    await (galleryApp as { initialize(): Promise<void> }).initialize();
    logger.info('✅ 갤러리 앱 초기화 완료');
    if (__DEV__ && tracePoint) tracePoint('gallery:init:done');

    // 개발 환경에서만 디버깅용 전역 접근 허용 (R1)
    if (import.meta.env.DEV) {
      const __devKey = (codes: number[]) => String.fromCharCode(...codes);
      const kApp = __devKey([
        95, 95, 88, 69, 71, 95, 71, 65, 76, 76, 69, 82, 89, 95, 65, 80, 80, 95, 95,
      ]); // "__XEG_GALLERY_APP__"
      (globalThis as Record<string, unknown>)[kApp] = galleryApp;
    }
  } catch (error) {
    logger.error('❌ 갤러리 앱 초기화 실패:', error);
    if (__DEV__ && tracePoint) tracePoint('gallery:init:error', { error: String(error) });
    throw error;
  }
}

/**
 * 애플리케이션 메인 진입점
 *
 * 📋 7단계 부트스트랩 프로세스:
 * 1️⃣  인프라 초기화 (Vendor 로드) - src/bootstrap/environment.ts
 * 2️⃣  핵심 시스템 (Core 서비스 + Toast) - src/shared/services/core-services.ts
 * 3️⃣  기본 서비스 (Animation/Theme/Language) - src/shared/services/service-manager.ts
 * 4️⃣  기능 서비스 등록 (지연 로드) - src/bootstrap/features.ts
 * 5️⃣  전역 이벤트 핸들러 설정 - src/bootstrap/events.ts
 * 6️⃣  갤러리 앱 초기화 - src/features/gallery/GalleryApp.ts
 * 7️⃣  백그라운드 시스템 초기화 (비필수 서비스)
 *
 * 💡 Critical vs Non-Critical:
 * - Critical: 페이지 로드 후 즉시 필요 (인프라, 핵심, 갤러리)
 * - Non-Critical: 사용자 상호작용 후에도 괜찮음 (백그라운드 타이머)
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
    if (__DEV__ && startFlowTrace) startFlowTrace();
    if (__DEV__ && tracePoint) tracePoint('app:start');

    const startTime = performance.now();

    // 전역 스타일 로드 (사이드이펙트 import 방지)
    await (traceAsync
      ? traceAsync('styles:load', () => import('./styles/globals'))
      : import('./styles/globals'));

    // 개발 도구 초기화 (개발 환경만; 테스트 모드에서는 제외하여 누수 스캔 간섭 방지)
    if (import.meta.env.DEV && import.meta.env.MODE !== 'test') {
      await (traceAsync
        ? traceAsync('devtools:init', () => initializeDevTools())
        : initializeDevTools());
    } else if (import.meta.env.DEV) {
      logger.debug('DevTools initialization skipped (test mode)');
    }

    // 1단계: 기본 인프라 초기화
    await (traceAsync
      ? traceAsync('infra:init', () => initializeInfrastructure())
      : initializeInfrastructure());

    // 2단계: 핵심 시스템만 초기화 (갤러리 제외)
    await (traceAsync
      ? traceAsync('critical:init', () => initializeCriticalSystems())
      : initializeCriticalSystems());

    // Phase A5.2: BaseService 생명주기 중앙화 (이전: initializeLanguageService)
    await (traceAsync
      ? traceAsync('baseservice:init', () => initializeCoreBaseServices())
      : initializeCoreBaseServices());

    // 3단계: Feature Services 지연 등록
    if (__DEV__ && tracePoint) tracePoint('features:register:start');
    await registerFeatureServicesLazy();
    if (__DEV__ && tracePoint) tracePoint('features:register:done');

    // 4단계: 전역 이벤트 핸들러 설정
    setupGlobalEventHandlers();

    // 5단계: 갤러리 앱을 즉시 초기화 (지연 없음)
    // 테스트 모드에서는 Preact의 전역 이벤트 위임 리스너가 등록되어
    // 누수 스캔 테스트(active EventTarget listeners)에 간섭할 수 있으므로 생략한다.
    if (import.meta.env.MODE !== 'test') {
      await (traceAsync
        ? traceAsync('gallery:immediate', () => initializeGalleryImmediately())
        : initializeGalleryImmediately());
    } else {
      logger.debug('Gallery initialization skipped (test mode)');
    }

    // 6단계: 백그라운드에서 Non-Critical 시스템 초기화
    initializeNonCriticalSystems();

    isStarted = true;

    const endTime = performance.now();
    const duration = endTime - startTime;

    logger.info('✅ 애플리케이션 초기화 완료', {
      startupTime: `${duration.toFixed(2)}ms`,
    });
    if (__DEV__ && tracePoint) tracePoint('app:ready', { startupMs: duration.toFixed(2) });

    // 개발 환경에서 전역 접근 제공
    if (import.meta.env.DEV) {
      const __devKey = (codes: number[]) => String.fromCharCode(...codes);
      const kMain = __devKey([95, 95, 88, 69, 71, 95, 77, 65, 73, 78, 95, 95]); // "__XEG_MAIN__"
      (globalThis as Record<string, unknown>)[kMain] = {
        start: startApplication,
        createConfig: createAppConfig,
        cleanup,
        galleryApp,
      };
    }
  })()
    .catch(error => {
      logger.error('❌ 애플리케이션 초기화 실패:', error);
      if (__DEV__ && tracePoint) tracePoint('app:error', { error: String(error) });
      // 에러 복구 시도
      // 전역 타이머 매니저를 통해 예약하여 cleanup 보장 (R4)
      globalTimerManager.setTimeout(() => {
        logger.info('🔄 애플리케이션 재시작 시도...');
        startApplication().catch(retryError => {
          logger.error('❌ 재시작 실패:', retryError);
        });
      }, 2000);
    })
    .finally(() => {
      // 다음 수동 호출을 위해 startPromise 해제(이미 시작된 경우 isStarted가 가드)
      startPromise = null;
      if (__DEV__ && stopFlowTrace) stopFlowTrace();
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

/**
 * 애플리케이션 즉시 시작
 *
 * @run-at document-idle 보장:
 * 유저스크립트 엔진(Tampermonkey/Greasemonkey)이 DOM 준비 완료 후 실행하므로
 * DOMContentLoaded 리스너가 불필요합니다. 즉시 startApplication을 호출합니다.
 *
 * Phase 236: DOMContentLoaded 리스너 제거로 트위터 네이티브 페이지 간섭 최소화
 */
startApplication();

// 모듈 기본 export (외부에서 수동 시작 가능)
export default {
  start: startApplication,
  createConfig: createAppConfig,
  cleanup,
};

// 개발 환경에서 전역 접근 허용
if (import.meta.env.DEV) {
  const __devKey = (codes: number[]) => String.fromCharCode(...codes);
  const kMain = __devKey([95, 95, 88, 69, 71, 95, 77, 65, 73, 78, 95, 95]); // "__XEG_MAIN__"
  (globalThis as Record<string, unknown>)[kMain] = {
    start: startApplication,
    createConfig: createAppConfig,
    cleanup,
  };
}
