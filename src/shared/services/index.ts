/**
 * Core Services Export - Phase 2: Service Consolidation
 *
 * 통합된 핵심 서비스들만 export (10개 이하):
 * - MediaService: 모든 미디어 관련 기능 통합 (MediaLoading, Prefetching, WebP 최적화, BulkDownload 포함)
 * - ThemeService: 테마 관리
 * - ToastService: 토스트 알림 (ToastController 별칭)
 * - BrowserService: 브라우저 유틸리티 + 애니메이션 (AnimationService 포함)
 * - GalleryService: 갤러리 핵심 기능
 * - ServiceManager: 서비스 관리 + 진단 (ServiceDiagnostics 포함)
 * - BaseService: 베이스 서비스 구현
 */

// ====================================
// 베이스 서비스 클래스
// ====================================

export { SingletonServiceImpl as BaseService } from './BaseServiceImpl';

// ====================================
// 통합된 핵심 서비스들 (6개)
// ====================================

// 1. 통합 미디어 서비스 (MediaLoading, Prefetching, WebP 최적화, BulkDownload 통합)
export { MediaService, mediaService } from './MediaService';
export { BulkDownloadService, bulkDownloadService } from './BulkDownloadService'; // 별도 export 추가
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

// 2. 테마 서비스
export { ThemeService, themeService } from './ThemeService';
export type { Theme } from './ThemeService';

// 3. 토스트 서비스 (간소화된 직접 클래스)
export { ToastService, ToastService as ToastController } from './ToastService';
export type { ToastOptions } from './ToastService';

// 4. 브라우저 서비스 (AnimationService 통합됨)
export { BrowserService } from '@shared/browser';

// 5. 갤러리 서비스
export { GalleryService, galleryService } from './gallery';
export type { OpenGalleryOptions, NavigationResult, GalleryInfo } from './gallery';

// 6. 서비스 관리 (ServiceDiagnostics 통합됨)
export { ServiceManager, serviceManager } from './ServiceManager';

// 7. 간단한 서비스 레지스트리 (Phase 4 간소화)
export { ServiceRegistry, serviceRegistry } from './service-registry';

// ====================================
// 유틸리티 및 타입들
// ====================================

// 로거 (서비스가 아닌 유틸리티)
export { type ILogger, ConsoleLogger, defaultLogger } from './core-services';

// 서비스 관리 유틸리티
export { SERVICE_KEYS } from '@/constants';
export { getService, registerCoreServices, type ServiceKey } from './core-services';

// ServiceTypeMapping 제거됨 - Phase 4 Step 4: 과도한 추상화 제거
