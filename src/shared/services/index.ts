/**
 * Core Services Export - Phase 3: Service Optimization
 *
 * 최적화된 핵심 서비스들 (8개):
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
// 베이스 서비스 클래스
// ====================================

export { SingletonServiceImpl as BaseService } from './BaseServiceImpl';

// ====================================
// 핵심 서비스들 (8개)
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

// 4. 언어 서비스
export { LanguageService } from './LanguageService';
export type { SupportedLanguage, LanguageStrings } from './LanguageService';

// 4. 토스트 서비스 - UnifiedToastManager 사용
export { UnifiedToastManager } from './UnifiedToastManager';
export { ToastController } from './ToastController';
export type { ToastOptions } from './UnifiedToastManager';

// 5. 브라우저 서비스
export { BrowserService } from '@shared/browser';

// 6. 갤러리 서비스 - GalleryService 제거됨
// export { GalleryService } from './gallery';
// export type { OpenGalleryOptions, NavigationResult, GalleryInfo } from './gallery';

// 7. 지연 로딩 서비스 - 제거됨 (현재 구현되지 않음)
// export { LazyLoadingService } from './LazyLoadingService';

// 8. 서비스 관리 (ServiceRegistry 통합)
export { CoreService } from './ServiceManager';

// ====================================
// 유틸리티 및 타입들
// ====================================

// 로거 (서비스가 아닌 유틸리티)
export { type ILogger, ConsoleLogger, defaultLogger } from './core-services';

// 서비스 관리 유틸리티
// Note: Service key constants are not re-exported here to reduce direct usage pathways.

// ServiceTypeMapping 제거됨 - Phase 4 Step 4: 과도한 추상화 제거
