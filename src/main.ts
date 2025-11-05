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
import type { AppConfig } from '@shared/types';
import type { IGalleryApp } from '@shared/container/app-container';
import { waitForWindowLoad } from '@shared/utils/window-load';
import { registerFeatureServicesLazy } from '@/bootstrap/features';
import { warmupNonCriticalServices } from '@shared/container/service-accessors';
import { CoreService } from '@shared/services/service-manager';
import { cleanupVendors } from './shared/external/vendors';
import { globalTimerManager } from '@shared/utils/timer-management';
// Phase 2.1: 부트스트랩 로직 모듈화
import {
  initializeCriticalSystems,
  initializeCoreBaseServices,
  initializeDevTools,
  initializeGalleryApp,
  clearGalleryApp,
} from '@/bootstrap';

// 전역 스타일
// 글로벌 스타일은 import 시점(side-effect)을 피하기 위해 런타임에 로드합니다.
// startApplication 내부에서 동적으로 로드하여 테스트/번들링 모두에 안전합니다.

// Vendor 초기화는 startApplication에서 처리하도록 이동
// 애플리케이션 상태 관리
let isStarted = false;
let startPromise: Promise<void> | null = null;
let galleryApp: IGalleryApp | null = null;
let cleanupHandlers: (() => Promise<void> | void)[] = [];

/**
 * DEV 네임스페이스 설정 유틸리티
 * Phase 1.1: 중복 코드 제거를 위한 헬퍼 함수
 */
function setupDevNamespace(galleryAppInstance?: IGalleryApp | null): void {
  if (!import.meta.env.DEV) return;

  type WindowWithXEG = Window & {
    __XEG__?: {
      main?: {
        start: typeof startApplication;
        createConfig: typeof createAppConfig;
        cleanup: typeof cleanup;
        galleryApp?: IGalleryApp;
      };
    };
  };

  const win = globalThis as unknown as WindowWithXEG;
  win.__XEG__ = win.__XEG__ || {};
  win.__XEG__.main = {
    start: startApplication,
    createConfig: createAppConfig,
    cleanup,
  };

  if (galleryAppInstance) {
    win.__XEG__.main.galleryApp = galleryAppInstance;
  }
}

/**
 * 개발 모드 tracing 헬퍼 함수
 * Phase 1.2: traceAsync 조건부 호출 패턴 추상화
 */
async function traceIfDev<T>(label: string, fn: () => T | Promise<T>): Promise<T> {
  if (__DEV__ && traceAsync) {
    return traceAsync(label, fn);
  }
  return Promise.resolve(fn());
}

/**
 * 테스트 모드 진단 로깅 헬퍼 함수
 * Phase 1.3: 중복된 테스트 진단 로직 통합
 */
async function logTestDiagnostics(phase: 'before' | 'after'): Promise<void> {
  if (import.meta.env.MODE !== 'test') return;

  try {
    const { getEventListenerStatus } = await import('@shared/utils/events');
    const timers = globalTimerManager.getActiveTimersCount();
    const events = getEventListenerStatus();

    logger.debug(`[TEST][cleanup:${phase}] activeTimers:`, timers, 'managedEvents:', {
      total: events.total,
      byType: events.byType,
      byContext: events.byContext,
    });
  } catch (e) {
    logger.debug(`[TEST] cleanup ${phase}-diagnostics skipped:`, e);
  }
}

/**
 * 재시작 정책 인터페이스
 * Phase 2.2: 구성 가능한 재시작 로직
 */
interface RetryPolicy {
  /** 최대 재시도 횟수 */
  maxRetries: number;
  /** 기본 지연 시간 (ms) */
  delayMs: number;
  /** 백오프 전략 */
  backoff?: 'linear' | 'exponential';
}

/**
 * 유휴 작업 스케줄링 옵션
 * Phase 3.1: requestIdleCallback 지원
 */
interface IdleWorkOptions {
  /** 최대 대기 시간 (ms) */
  timeout?: number;
}

/**
 * 유휴 시간에 작업 스케줄링
 * Phase 3.1: requestIdleCallback 활용 (폴백: setTimeout)
 *
 * 브라우저가 유휴 상태일 때 작업을 실행하여 메인 스레드 부하 감소
 *
 * @param callback 실행할 작업
 * @param options 스케줄링 옵션
 */
function scheduleIdleWork(callback: () => void | Promise<void>, options?: IdleWorkOptions): void {
  // globalThis를 통한 안전한 접근
  const global = globalThis as typeof globalThis & {
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
  };

  if (typeof global.requestIdleCallback !== 'undefined') {
    const idleOptions: IdleRequestOptions | undefined = options?.timeout
      ? { timeout: options.timeout }
      : undefined;

    global.requestIdleCallback(async () => {
      await callback();
    }, idleOptions);
  } else {
    // requestIdleCallback 미지원 환경: setTimeout 폴백
    globalTimerManager.setTimeout(callback, 0);
  }
}

/**
 * 애플리케이션 재시작 헬퍼 함수
 * Phase 2.2: 구성 가능한 retry 정책 (exponential backoff 지원)
 *
 * @param error 초기 에러
 * @param attempt 현재 시도 횟수
 * @param policy 재시도 정책
 */
async function retryStartApplication(
  error: unknown,
  attempt = 1,
  policy: RetryPolicy = { maxRetries: 3, delayMs: 2000, backoff: 'exponential' }
): Promise<void> {
  if (attempt > policy.maxRetries) {
    logger.error('❌ 최대 재시도 횟수 초과:', error);
    return;
  }

  const delay =
    policy.backoff === 'exponential' ? policy.delayMs * Math.pow(2, attempt - 1) : policy.delayMs;

  logger.info(`🔄 애플리케이션 재시작 시도 (${attempt}/${policy.maxRetries}), 지연: ${delay}ms`);

  globalTimerManager.setTimeout(async () => {
    try {
      await startApplication();
    } catch (retryError) {
      await retryStartApplication(retryError, attempt + 1, policy);
    }
  }, delay);
}

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
    renderAfterLoad: true,
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
 * Non-Critical 시스템 백그라운드 초기화
 * Phase 3.1: requestIdleCallback 활용
 */
function initializeNonCriticalSystems(): void {
  // 테스트 모드에서는 비필수 시스템 초기화를 건너뛰어 불필요한 타이머를 만들지 않는다
  if (import.meta.env.MODE === 'test') {
    logger.debug('Non-Critical 시스템 초기화 생략 (test mode)');
    return;
  }

  // Phase 3.1: requestIdleCallback을 활용한 유휴 시간 스케줄링
  scheduleIdleWork(
    async () => {
      try {
        logger.info('Non-Critical 시스템 백그라운드 초기화 시작');
        if (__DEV__ && tracePoint) tracePoint('noncritical:init:start');

        warmupNonCriticalServices();

        logger.info('✅ Non-Critical 시스템 백그라운드 초기화 완료');
        if (__DEV__ && tracePoint) tracePoint('noncritical:init:done');
      } catch (error) {
        logger.warn('Non-Critical 시스템 초기화 중 오류 (앱 동작에는 영향 없음):', error);
      }
    },
    { timeout: 1000 }
  );
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
    await logTestDiagnostics('before');

    if (galleryApp) {
      await galleryApp.cleanup();
      clearGalleryApp(); // Phase 2.1: bootstrap 모듈을 통한 정리
      galleryApp = null;
      // Phase 290: 네임스페이스 격리 - 개발 환경에서만 정리
      if (import.meta.env.DEV) {
        type WindowWithXEG = Window & {
          __XEG__?: {
            main?: {
              galleryApp?: unknown;
            };
          };
        };
        const win = globalThis as unknown as WindowWithXEG;
        if (win.__XEG__?.main) {
          delete win.__XEG__.main.galleryApp;
        }
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
    await logTestDiagnostics('after');
  } catch (error) {
    logger.error('❌ 애플리케이션 정리 중 오류:', error);
    throw error;
  }
}

/**
 * 애플리케이션 메인 진입점
 *
 * 📋 7단계 부트스트랩 프로세스:
 * 1️⃣  인프라 초기화 (Vendor 로드) - src/bootstrap/environment.ts
 * 2️⃣  핵심 시스템 (Core 서비스 + Toast) - src/bootstrap/critical-systems.ts (Phase 2.1)
 * 3️⃣  기본 서비스 (Animation/Theme/Language) - src/bootstrap/base-services.ts (Phase 2.1)
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
    await traceIfDev('styles:load', () => import('./styles/globals'));

    // 개발 도구 초기화 (개발 환경만; 테스트 모드에서는 제외하여 누수 스캔 간섭 방지)
    if (import.meta.env.DEV && import.meta.env.MODE !== 'test') {
      await traceIfDev('devtools:init', () => initializeDevTools());
    } else if (import.meta.env.DEV) {
      logger.debug('DevTools initialization skipped (test mode)');
    }

    // 1단계: 기본 인프라 초기화
    await traceIfDev('infra:init', () => initializeInfrastructure());

    // 2단계: 핵심 시스템만 초기화 (갤러리 제외)
    await traceIfDev('critical:init', () => initializeCriticalSystems());

    // Phase A5.2: BaseService 생명주기 중앙화 (이전: initializeLanguageService)
    await traceIfDev('baseservice:init', () => initializeCoreBaseServices());

    // 3단계: Feature Services 지연 등록
    if (__DEV__ && tracePoint) tracePoint('features:register:start');
    await registerFeatureServicesLazy();
    if (__DEV__ && tracePoint) tracePoint('features:register:done');

    // 4단계: 전역 이벤트 핸들러 설정
    setupGlobalEventHandlers();

    // 5단계: 갤러리 앱 초기화 (옵션에 따라 window.load 이후로 지연)
    // 테스트 모드에서는 Preact의 전역 이벤트 위임 리스너가 등록되어
    // 누수 스캔 테스트(active EventTarget listeners)에 간섭할 수 있으므로 생략한다.
    if (import.meta.env.MODE !== 'test') {
      const appConfig = createAppConfig();
      if (appConfig.renderAfterLoad !== false) {
        if (__DEV__ && tracePoint) tracePoint('window:load:wait:start');
        await traceIfDev('window:load:wait', () => waitForWindowLoad({ timeoutMs: 8000 }));
        if (__DEV__ && tracePoint) tracePoint('window:load:wait:done');
      }

      await traceIfDev('gallery:immediate', () => initializeGalleryImmediately());
    } else {
      logger.debug('Gallery initialization skipped (test mode)');
    }

    // 6단계: 백그라운드에서 Non-Critical 시스템 초기화
    initializeNonCriticalSystems();

    // Phase 326: Code Splitting - 프리로드 전략 실행
    // 선택 기능(Settings 등) 청크를 유휴 시간에 미리 로드
    if (import.meta.env.MODE !== 'test') {
      void (async () => {
        try {
          const { executePreloadStrategy } = await import('@/bootstrap');
          await executePreloadStrategy();
        } catch (error) {
          logger.warn('[Phase 326] 프리로드 전략 실행 중 오류:', error);
        }
      })();
    }

    isStarted = true;

    const endTime = performance.now();
    const duration = endTime - startTime;

    logger.info('✅ 애플리케이션 초기화 완료', {
      startupTime: `${duration.toFixed(2)}ms`,
    });
    if (__DEV__ && tracePoint) tracePoint('app:ready', { startupMs: duration.toFixed(2) });

    // Phase 290: 네임스페이스 격리 - 개발 환경에서만 단일 네임스페이스로 전역 접근 제공
    setupDevNamespace(galleryApp);
  })()
    .catch(error => {
      logger.error('❌ 애플리케이션 초기화 실패:', error);
      if (__DEV__ && tracePoint) tracePoint('app:error', { error: String(error) });
      // Phase 2.2: 구성 가능한 재시작 로직 (exponential backoff)
      void retryStartApplication(error);
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

    // Phase 2.1: bootstrap 모듈을 통한 초기화
    galleryApp = await initializeGalleryApp();

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

// Phase 290: 네임스페이스 격리 - 개발 환경에서만 전역 접근 허용
setupDevNamespace();
