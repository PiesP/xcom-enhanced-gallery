/**
 * Core Services Export - Phase 4: TDD 기반 중복 통합
 *
 * 통합된 서비스들:
 * - DOMService: 모든 DOM 관련 중복 기능 통합 (새로운 @shared/dom 모듈)
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
 * - ServiceManager: 서비스 관리 + 레지스트리 통합
 */

// ====================================
// 🆕 TDD 기반 통합 서비스들 (NEW)
// ====================================

// DOM 관련 통합 서비스 - @shared/dom 사용
export * from '@shared/dom';

// 스타일 관련 통합 서비스 (기존 StyleService 대체)
// StyleManager를 직접 사용하거나 style-service.ts 래퍼 사용
export { default as StyleManager } from '@shared/styles/style-manager';
export { StyleService, setCSSVariable, getCSSVariable, setCSSVariables } from './style-service';

// 성능 관련 통합 서비스
export {
  rafThrottle,
  throttle,
  createDebouncer,
  // 성능 유틸리티는 별도 모듈에서 제공
} from '@shared/utils/performance';

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

// 토스트 통합 유틸리티
export {
  toasts,
  addToast,
  removeToast,
  clearAllToasts,
  showSuccess,
  showError,
  showWarning,
  showInfo,
} from './toast-integration';

// 5. 브라우저 서비스
export { BrowserService } from '@shared/browser';

// 6. 갤러리 서비스
export { GalleryService } from './gallery';
export type { OpenGalleryOptions, NavigationResult, GalleryInfo } from './gallery';

// 8. 서비스 관리 (ServiceRegistry 통합)
export { CoreService } from './service-manager';

// 9. 스타일 서비스 (StyleManager로 대체됨 - 하위 호환성 유지)
// export { StyleService } from './style-service'; // 위에서 이미 export됨
export type { GlassmorphismIntensity, ComponentState } from './style-service';
// Theme 타입은 ThemeService에서 이미 export됨

// ====================================
// 🆕 통합 서비스 타입 정의들
// ====================================

// DOM 서비스 타입들 - 새로운 @shared/dom에서 import
export type {
  ElementOptions as DOMElementOptions,
  EventOptions as EventListenerOptions,
} from '@shared/dom';

// 스타일 서비스 타입들 (통합된 타입들)
export type {
  GlassmorphismIntensity as UnifiedGlassmorphismIntensity,
  Theme as UnifiedTheme,
  GlassmorphismConfig,
  ComponentState as UnifiedComponentState,
} from '@shared/styles/style-manager';

// 성능 서비스 타입들
// 성능 타입들은 별도 모듈에서 제공
export type {} from '@shared/utils/performance';

// ====================================
// 🆕 통합 서비스 유틸리티들
// ====================================

// 통합 서비스 관리 유틸리티들
export { cleanupAllServices, getServicesStatus } from './service-cleanup-utils';

// ====================================
// 유틸리티 및 타입들
// ====================================

// 로거 (서비스가 아닌 유틸리티)
export { type ILogger, ConsoleLogger, defaultLogger } from './core-services';

// 서비스 관리 유틸리티
export { SERVICE_KEYS } from '@/constants';

// ServiceTypeMapping 제거됨 - Phase 4 Step 4: 과도한 추상화 제거
