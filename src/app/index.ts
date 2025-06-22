/**
 * 통합된 앱 진입점
 *
 * 기존의 여러 Application 클래스들을 하나로 통합하고
 * 새로운 UnifiedApplication을 사용하도록 업데이트
 */

import { UnifiedApplication } from './UnifiedApplication';

// 메인 exports
export { UnifiedApplication } from './UnifiedApplication';
export { UnifiedGalleryApp } from './UnifiedGalleryApp';

// 타입 정의들
export type {
  AppConfig,
  AppInstance,
  ApplicationMetadata,
  ApplicationState,
  PerformanceMetrics,
  ServiceState,
} from './types';

// 기존 호환성을 위한 별칭 (deprecated)
export { UnifiedApplication as Application } from './UnifiedApplication';
export { UnifiedApplication as AppBootstrapper } from './UnifiedApplication';

/**
 * @deprecated Use UnifiedApplication instead
 */
export const createApplication = UnifiedApplication.create;

/**
 * @deprecated Use UnifiedApplication instead
 */
export const createBootstrapper = UnifiedApplication.create;
