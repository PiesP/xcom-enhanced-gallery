/**
 * App Layer Types - Phase 1A 통합
 *
 * 모든 애플리케이션 타입이 core/types/app.types.ts로 통합되었습니다.
 * 이 파일은 하위 호환성을 위한 re-export입니다.
 */

// 통합된 타입들을 core에서 가져옴
export type {
  AppConfig,
  AppInstance,
  ApplicationState,
  AppLifecycleState,
  ServiceState,
  ApplicationMetadata,
  PerformanceMetrics,
  GalleryAppConfig,
  IGalleryApp,
  MediaExtractionResult,
  LifecycleConfig,
  BootstrapOptions,
} from '../core/types/app.types';
