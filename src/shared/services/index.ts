/**
 * Core Services Export - Phase 4: TDD 기반 중복 통합
 *
 * 통합된 서비스들:
 * - UnifiedDOMService: 모든 DOM 관련 중복 기능 통합
 * - UnifiedStyleService: 모든 CSS/스타일 관련 중복 기능 통합
 * - UnifiedPerformanceService: 모든 성능 관련 중복 기능 통합
 *
 * 기존 서비스들 (8개):
 * - AnimationService: 애니메이션 관리
 * - MediaService: 모든 미디어 관련 기능 통합 (MediaLoading, Prefetching, WebP, BulkDownload 포함)
 * - ThemeService: 테마 관리
 * - ToastService: 토스트 알림
 * - BrowserService: 브라우저 유틸리티
 * - GalleryService: 갤러리 핵심 기능
 * - LazyLoadingService: 지연 로딩 관리
 * - ServiceManager: 서비스 관리 + 레지스트리 통합
 */

// ====================================
// 🆕 TDD 기반 통합 서비스들 (NEW)
// ====================================

// DOM 관련 통합 서비스
export {
  unifiedDOMService,
  createElement,
  querySelector,
  querySelectorAll,
  addEventListener,
  setStyle,
  addClass,
  removeClass,
  removeElement,
  isVisible,
  // 하위 호환성 별칭들
  safeQuerySelector,
  cachedQuerySelector,
  safeAddClass,
  safeRemoveClass,
  safeSetStyle,
  safeRemoveElement,
} from './unified-dom-service';

// 스타일 관련 통합 서비스 (기존 StyleService 대체)
export {
  unifiedStyleService,
  combineClasses,
  setCSSVariable,
  getCSSVariable,
  setCSSVariables,
  applyGlassmorphism,
  setTheme,
  updateComponentState,
  applyUtilityClasses,
  createThemedClassName,
  // 하위 호환성 별칭들
  styleService,
} from './unified-style-service';

// 성능 관련 통합 서비스
export {
  unifiedPerformanceService,
  createDebouncer,
  createThrottle,
  rafThrottle,
  runWhenIdle,
  measurePerformance,
  batchExecute,
  // 하위 호환성 별칭들
  debounce,
  throttle,
} from './unified-performance-service';

// ====================================
// 기존 핵심 서비스들 (8개) - 유지
// ====================================

// 1. 애니메이션 서비스
export { AnimationService } from './AnimationService';

// 2. 통합 미디어 서비스 (BulkDownload 완전 통합)
export { MediaService } from './MediaService';
export { extractUsername, parseUsernameFast } from './MediaService';
export type {
  UsernameExtractionResult,
  MediaLoadingState,
  MediaLoadingOptions,
  PrefetchOptions,
  DownloadProgress,
  BulkDownloadOptions,
  DownloadResult,
  SingleDownloadResult,
} from './MediaService';

// 3. 테마 서비스
export { ThemeService } from './ThemeService';
export type { Theme } from './ThemeService';

// 4. 토스트 서비스 (통합됨 - ToastController 제거됨)
export { ToastService } from './ToastService';
export type { ToastOptions } from './ToastService';

// 5. 브라우저 서비스
export { BrowserService } from '@shared/browser';

// 6. 갤러리 서비스
export { GalleryService } from './gallery';
export type { OpenGalleryOptions, NavigationResult, GalleryInfo } from './gallery';

// 7. 지연 로딩 서비스
export { LazyLoadingService } from './LazyLoadingService';

// 8. 서비스 관리 (ServiceRegistry 통합)
export { CoreService } from './ServiceManager';

// 9. 스타일 서비스 (UnifiedStyleService로 대체됨 - 하위 호환성 유지)
export { StyleService } from './style-service';
export type { GlassmorphismIntensity, ComponentState } from './style-service';
// Theme 타입은 ThemeService에서 이미 export됨

// ====================================
// 🆕 통합 서비스 타입 정의들
// ====================================

// DOM 서비스 타입들
export type { DOMElementOptions, EventListenerOptions } from './unified-dom-service';

// 스타일 서비스 타입들 (통합된 타입들)
export type {
  GlassmorphismIntensity as UnifiedGlassmorphismIntensity,
  Theme as UnifiedTheme,
  GlassmorphismConfig,
  ComponentState as UnifiedComponentState,
} from './unified-style-service';

// 성능 서비스 타입들
export type {
  DebounceOptions,
  ThrottleOptions,
  PerformanceMetrics,
} from './unified-performance-service';

// ====================================
// 🆕 통합 서비스 유틸리티들
// ====================================

/**
 * 모든 통합 서비스 정리 함수
 * 앱 종료 시 호출하여 메모리 누수 방지
 */
export function cleanupAllUnifiedServices(): void {
  const {
    unifiedDOMService,
    unifiedStyleService,
    unifiedPerformanceService,
  } = require('./unified-dom-service');

  try {
    unifiedDOMService.cleanup();
    unifiedStyleService.cleanup();
    unifiedPerformanceService.cleanup();
  } catch (error) {
    console.error('[Services] Failed to cleanup unified services:', error);
  }
}

/**
 * 통합 서비스 상태 확인
 */
export function getUnifiedServicesStatus(): {
  dom: { active: boolean };
  style: { active: boolean; resources: number };
  performance: { active: boolean; metricsCount: number };
} {
  try {
    const { unifiedStyleService, unifiedPerformanceService } = require('./unified-style-service');

    return {
      dom: {
        active: true,
      },
      style: {
        active: true,
        resources: unifiedStyleService.getActiveResources().size,
      },
      performance: {
        active: true,
        metricsCount: (unifiedPerformanceService.getMetrics() as Map<string, unknown>).size,
      },
    };
  } catch (error) {
    console.error('[Services] Failed to get unified services status:', error);
    return {
      dom: { active: false },
      style: { active: false, resources: 0 },
      performance: { active: false, metricsCount: 0 },
    };
  }
}

// ====================================
// 유틸리티 및 타입들
// ====================================

// 로거 (서비스가 아닌 유틸리티)
export { type ILogger, ConsoleLogger, defaultLogger } from './core-services';

// 서비스 관리 유틸리티
export { SERVICE_KEYS } from '@/constants';

// ServiceTypeMapping 제거됨 - Phase 4 Step 4: 과도한 추상화 제거
