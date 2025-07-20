/**
 * Core Services Export
 *
 * Phase 2B Step 3: 핵심 비즈니스 서비스만 export
 */

// Essential business services
export { BulkDownloadService } from './BulkDownloadService';
export { ThemeService, themeService } from './ThemeService';
export { ToastController, toastController } from './ToastController';

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
export type { ServiceTypeMapping } from '../types/services.types';
export type { BulkDownloadOptions, DownloadProgress, DownloadResult } from './BulkDownloadService';
export type { Theme } from './ThemeService';
export type { ToastOptions } from './ToastController';

// Development utilities (optional)
export { diagnoseServiceManager } from './ServiceDiagnostics';
