/**
 * Core Services Export
 *
 * Phase 1 Step 3: 서비스 파일 통합 후 export
 */

// Essential business services
export { BulkDownloadService } from './BulkDownloadService';
export { ThemeService, themeService } from './ThemeService';
export { ToastController, toastController } from './ToastController';

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
