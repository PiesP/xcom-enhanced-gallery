/**
 * App Layer Export
 *
 * Phase 2B Step 4: 애플리케이션 진입점과 조정자만 export
 */

// Application entry points
export { Application, appLifecycle } from './Application';
export { GalleryApp } from './GalleryApp';

// Essential types
export type {
  AppConfig,
  AppInstance,
  ApplicationMetadata,
  ApplicationState,
  PerformanceMetrics,
  ServiceState,
} from '@core/types/app.types';
export type { AppLifecycleState, LifecycleConfig } from './Application';
