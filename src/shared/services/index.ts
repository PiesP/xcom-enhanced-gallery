/**
 * Core Services Export - Phase 3: Service Optimization
 * @version 2.1.0 - 유틸리티성 서비스 재배치 완료
 *
 * 최적화된 핵심 서비스들:
 * - AnimationService: 애니메이션 관리
 * - MediaService: 모든 미디어 관련 기능 통합 (MediaLoading, Prefetching, WebP, BulkDownload 포함)
 * - ThemeService: 테마 관리
 * - ToastService: 토스트 알림
 * - LanguageService: 다국어 지원
 * - EventManager: DOM 이벤트 관리
 * - ServiceManager: 서비스 관리 + 레지스트리 통합
 *
 * 재배치된 서비스:
 * - HighContrastDetection → @shared/utils/high-contrast
 * - StabilityDetector → @shared/utils/stability
 * - IconRegistry → @shared/components/ui/Icon/icon-registry
 */

// ====================================
// 베이스 서비스 클래스
// ====================================

export { SingletonServiceImpl as BaseService } from './base-service';

// ====================================
// 핵심 서비스들 (8개)
// ====================================

// 1. 애니메이션 서비스
export { AnimationService } from './animation-service';

// 2. 통합 미디어 서비스 (BulkDownload 완전 통합)
export { MediaService } from './media-service';
export { extractUsername, parseUsernameFast } from './media-service';
export type {
  UsernameExtractionResult,
  MediaLoadingState,
  MediaLoadingOptions,
  PrefetchOptions,
  BulkDownloadOptions,
  DownloadResult,
  SingleDownloadResult,
} from './media-service';
export type { DownloadProgress } from './download/types';

// 3. 테마 서비스
export { ThemeService } from './theme-service';
export type { Theme } from './theme-service';

// 4. 언어 서비스
export { LanguageService } from './language-service';
export type { SupportedLanguage, LanguageStrings, BaseLanguageCode } from './language-service';

// 5. 포커스 서비스 (Phase 150.3)
export {
  FocusObserverManager,
  createFocusObserverManager,
  FocusApplicatorService,
  createFocusApplicatorService,
  FocusStateManagerService,
  createFocusStateManagerService,
} from './focus';

// 6. 토스트 서비스 - ToastManager 인스턴스 사용 권장
export {
  toastManager,
  ToastManager,
  ToastController,
  toastController,
} from './unified-toast-manager';
export type { ToastOptions } from './unified-toast-manager';

// File Naming Service
export {
  FilenameService,
  generateMediaFilename,
  generateZipFilename,
  isValidMediaFilename,
  isValidZipFilename,
  type FilenameOptions,
  type ZipFilenameOptions,
} from './file-naming';

// 5. 브라우저 서비스
export { BrowserService } from '@shared/browser';

// 6. 토큰 추출 서비스 (Phase 192.4: shared/services로 이동)
export { TwitterTokenExtractor } from './token-extraction';
export type { TokenExtractionResult, TokenValidationResult } from './token-extraction';

// 6. 갤러리 서비스 - GalleryService 제거됨
// export { GalleryService } from './gallery';
// export type { OpenGalleryOptions, NavigationResult, GalleryInfo } from './gallery';

// 7. 지연 로딩 서비스 - 제거됨 (현재 구현되지 않음)
// export { LazyLoadingService } from './LazyLoadingService';

// 8. 서비스 관리 (ServiceRegistry 통합)
export { CoreService } from './service-manager';

// ====================================
// Storage 어댑터 (인터페이스 + 구현)
// ====================================

export { type StorageAdapter, UserscriptStorageAdapter } from './storage';
export { PersistentStorage, getPersistentStorage, type StorageUsage } from './persistent-storage';
export {
  NotificationService,
  getNotificationService,
  type NotificationOptions,
} from './notification-service';

// ====================================
// 유틸리티 및 타입들
// ====================================

// 로거 (서비스가 아닌 유틸리티)
export { logger, type ILogger, type Logger } from './core-services';

// 서비스 관리 유틸리티
// Note: Service key constants are not re-exported here to reduce direct usage pathways.
