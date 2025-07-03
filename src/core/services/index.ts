/**
 * Core Services Barrel Export
 *
 * Core layer의 모든 비즈니스 로직 서비스를 중앙 집중화하여 export합니다.
 * Clean Architecture 원칙을 따라 infrastructure 레이어만 의존합니다.
 */

// Bulk Download Service
export { BulkDownloadService } from './BulkDownloadService';

// New unified service management system
export { SERVICE_KEYS } from '../constants';
export { ServiceManager, serviceManager } from './ServiceManager';
export type { BaseService, ServiceConfig } from './ServiceManager';
export { getService, registerAllServices, type ServiceKey } from './ServiceRegistry';

// Diagnostics (development only)
export { diagnoseServiceManager } from './ServiceDiagnostics';

// Service types
export type { ServiceTypeMapping } from '../types/services.types';
export type { DownloadOptions, DownloadProgress, DownloadResult } from './BulkDownloadService';

// Theme Service (Simplified)
export { SimpleThemeManager, themeManager } from './AutoThemeService';
export type { Theme } from './AutoThemeService';

// Application Lifecycle Management
export { AppLifecycle, appLifecycle } from './AppLifecycle';
export type { AppLifecycleState, LifecycleConfig } from './AppLifecycle';

// Scroll Management
export { ScrollManager, scrollManager } from './scroll';
