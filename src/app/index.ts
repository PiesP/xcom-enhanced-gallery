/**
 * 통합된 앱 진입점
 *
 * Clean Architecture 기반 통합된 Application 클래스들
 */

// 메인 exports
export { Application } from './Application';
export { GalleryApp } from './GalleryApp';

// 타입 정의들
export type {
  AppConfig,
  AppInstance,
  ApplicationMetadata,
  ApplicationState,
  PerformanceMetrics,
  ServiceState,
} from './types';

// Coordinators
export * from './coordinators';
