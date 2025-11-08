/**
 * Core Services Export - Phase 3: Service Optimization
 * @version 2.3.0
 *
 * Optimized core services:
 * - MediaService: All media-related functionality unified (MediaLoading, Prefetching, WebP, BulkDownload included)
 * - ThemeService: Theme management
 * - ToastService: Toast notifications
 * - LanguageService: Multilingual support
 * - EventManager: DOM event management
 * - ServiceManager: Service management + integrated registry
 *
 * Relocated services:
 * - AnimationService → removed (Phase 414, optional feature)
 * - HighContrastDetection → @shared/utils/high-contrast
 * - StabilityDetector → @shared/utils/stability
 * - IconRegistry → @shared/components/ui/Icon/icon-registry
 */

// ====================================
// Base service class
// ====================================

export { BaseServiceImpl } from './base-service';

// ====================================
// Core services (7)
// ====================================

// 1. Unified media service (BulkDownload fully integrated)
export { MediaService } from './media-service';
export { extractUsername, parseUsernameFast } from './media-service';
export type {
  UsernameExtractionResult,
  MediaLoadingState,
  MediaLoadingOptions,
  PrefetchOptions,
  BulkDownloadOptions,
  DownloadResult,
} from './media-service';
export type { DownloadProgress } from './download/types';

// 3. Theme service
export { ThemeService } from './theme-service';
export type { Theme } from './theme-service';

// 4. Language service
export { LanguageService } from './language-service';
export type { SupportedLanguage, LanguageStrings, BaseLanguageCode } from './language-service';

// 5. Focus service (Phase 150.3)
export {
  FocusObserverManager,
  createFocusObserverManager,
  FocusApplicatorService,
  createFocusApplicatorService,
  FocusStateManagerService,
  createFocusStateManagerService,
} from './focus';

// 6. Toast service - unified manager (Phase 327: ToastController removed)
export { toastManager, ToastManager } from './unified-toast-manager';
export type { ToastOptions, ToastItem } from './unified-toast-manager';

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

// Token extraction service
// Phase 380: Direct import required to break circular dependency
// import { TwitterTokenExtractor } from '@shared/services/token-extraction';
// export type { TokenExtractionResult, TokenValidationResult } from '@shared/services/token-extraction';

// Service management (ServiceRegistry integrated)
export {
  CoreService,
  serviceManager,
  getService,
  registerServiceFactory,
} from './core/core-service-manager';

// ====================================
// Storage services
// ====================================

// ─────────────────────────────────────────
// Storage (Phase 360: StorageAdapter removed)
// ─────────────────────────────────────────

export { PersistentStorage, getPersistentStorage } from './persistent-storage';
export {
  NotificationService,
  getNotificationService,
  type NotificationOptions,
  type NotificationProviderInfo,
} from './notification-service';
export {
  UnifiedDownloadService,
  unifiedDownloadService,
  type DownloadOptions as UnifiedDownloadOptions,
  type SingleDownloadResult as UnifiedSingleDownloadResult,
  type BulkDownloadResult as UnifiedBulkDownloadResult,
} from './unified-download-service';
export {
  DownloadService,
  downloadService,
  type BlobDownloadOptions,
  type BlobDownloadResult,
} from './download-service';
export {
  HttpRequestService,
  getHttpRequestService,
  type HttpRequestOptions,
  type BinaryRequestOptions,
  type HttpResponse,
  HttpError,
} from './http-request-service';

// Error Formatter (Phase 314-2)
// ====================================
// Utilities and types
// ====================================

// Logger (utility, not a service)
export { logger } from '@shared/logging';
export type { Logger as ILogger, Logger } from '@shared/logging';

// Service management utility
// Note: Service key constants are not re-exported here to reduce direct usage pathways.
