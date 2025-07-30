/**
 * Core Services Export - Phase 2: Service Consolidation
 *
 * 통합된 서비스들:
 * - MediaService: 모든 미디어 관련 기능 통합
 * - UIService: 테마, 토스트 등 UI 관련 기능 통합
 * - BulkDownloadService: 다운로드 기능 (단독 유지)
 * - GalleryService: 갤러리 핵심 기능 (단독 유지)
 */

// ====================================
// 통합 서비스들
// ====================================

// 통합된 미디어 서비스
export { MediaService, mediaService } from './MediaService';
export { extractUsername, parseUsernameFast } from './MediaService';
export type { UsernameExtractionResult } from './MediaService';

// 새로운 명명 (간소화)
export { MediaLoadingService } from './MediaLoadingService';
export type { MediaLoadingState, MediaLoadingOptions } from './MediaLoadingService';

// 하위 호환성 제거됨 - 직접 MediaLoadingService 사용 권장

// Phase 4: 런타임 성능 최적화 서비스들
export { LazyLoadingService } from './LazyLoadingService';

// 이벤트 처리 서비스
export { EarlyEventCaptureService } from './EarlyEventCaptureService';

// Phase 3: 동적 import 서비스들
export { LazyMotionService } from './LazyMotionService';
export { LazyVirtualScrollService } from './LazyVirtualScrollService';
export { LazyIntersectionService } from './LazyIntersectionService';
// LazyMemoizationService 제거됨 - 간단한 memo 사용 권장

// Phase 3: 편의 함수들
export {
  createVirtualScrollWhenNeeded,
  checkVirtualScrollNeed,
  forceLoadVirtualScroll,
} from './LazyVirtualScrollService';

export {
  observeImageWhenSupported,
  observeVideoWhenSupported,
  observeElementWhenSupported,
} from './LazyIntersectionService';

// memoizeConditionally, smartMemoize 제거됨 - 기본 memo 사용 권장

// 통합된 UI 서비스
export { UIService, uiService } from './UIService';
export { themeService, toastController } from './UIService'; // 호환성
export type { Theme, ToastOptions } from './UIService';

// ====================================
// 독립 유지 서비스들
// ====================================

// 애니메이션 서비스 (Motion One 통합)
export { AnimationService } from './AnimationService';

// 대량 다운로드 서비스 (복잡도로 인해 독립 유지)
export { BulkDownloadService } from './BulkDownloadService';
export type { BulkDownloadOptions, DownloadProgress, DownloadResult } from './BulkDownloadService';

// 갤러리 서비스 (핵심 비즈니스 로직으로 독립 유지)
export { GalleryService, galleryService } from './gallery';
export type { OpenGalleryOptions, NavigationResult, GalleryInfo } from './gallery';

// ====================================
// 레거시 호환성 및 유틸리티
// ====================================

// 통합된 핵심 서비스들
export { type ILogger, ConsoleLogger, defaultLogger, ServiceDiagnostics } from './core-services';

// 서비스 관리
export { SERVICE_KEYS } from '@/constants';
export { ServiceManager, serviceManager } from './ServiceManager';
export { getService, registerCoreServices, type ServiceKey } from './core-services';

// 필수 타입들
export type { BaseService } from '@shared/types/app.types';
export type { ServiceTypeMapping } from '@shared/types/core/core-types';
