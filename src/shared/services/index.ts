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

// 통합된 UI 서비스
export { UIService, uiService } from './UIService';
export { themeService, toastController } from './UIService'; // 호환성
export type { Theme, ToastOptions } from './UIService';

// ====================================
// 독립 유지 서비스들
// ====================================

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
