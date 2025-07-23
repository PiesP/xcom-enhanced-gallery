/**
 * Core Services Export
 *
 * Phase 1 Step 2: Gallery Services 통합 완료
 */

// Essential business services
export { BulkDownloadService } from './BulkDownloadService';
export { ThemeService, themeService } from './ThemeService';
export { ToastController, toastController } from './ToastController';

// Gallery services
export {
  GalleryService,
  galleryService,
  GalleryInitializer,
  type OpenGalleryOptions,
  type NavigationResult,
  type GalleryInfo,
  type GalleryInitConfig,
} from './gallery';

// Consolidated core services
export { type ILogger, ConsoleLogger, defaultLogger, ServiceDiagnostics } from './core-services';

// Media services
export {
  UsernameParser,
  extractUsername,
  parseUsernameFast,
  type UsernameExtractionResult,
} from './media/UsernameExtractionService';

// Service management
export { SERVICE_KEYS } from '../../constants';
export { ServiceManager, serviceManager } from './ServiceManager';
export { getService, registerAllServices, type ServiceKey } from './ServiceRegistry';

// Essential types
export type { BaseService, ServiceConfig } from './ServiceManager';
export type { ServiceTypeMapping } from '../types/core-types';
export type { BulkDownloadOptions, DownloadProgress, DownloadResult } from './BulkDownloadService';
export type { Theme } from './ThemeService';
export type { ToastOptions } from './ToastController';
