/**
 * Core Services Barrel Export
 *
 * Core layer의 모든 비즈니스 로직 서비스를 중앙 집중화하여 export합니다.
 * Clean Architecture 원칙을 따라 infrastructure 레이어만 의존합니다.
 */

// Bulk Download Service
// Legacy export for compatibility
export { BulkDownloadService } from './BulkDownloadService';

// New unified service management system
export {
  IntegratedServiceManager,
  getIntegratedServiceManager,
  getServiceFromIntegrated,
  getServiceFromIntegratedAsync,
} from './IntegratedServiceManager';
export { ServiceManager, serviceManager } from './ServiceManager';
export { SERVICE_KEYS, getService, registerAllServices, type ServiceKey } from './ServiceRegistry';

// Diagnostics (development only)
export { diagnoseServiceManager } from './ServiceDiagnostics';

// Service types
export type { ServiceTypeMapping } from '@core/types/services.types';
export type { DownloadOptions, DownloadProgress, DownloadResult } from './BulkDownloadService';
