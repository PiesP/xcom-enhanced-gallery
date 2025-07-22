/**
 * @fileoverview Gallery Coordinators - Core로 리다이렉트
 * @version 3.1.0 - Core 통합 완료
 */

// Core로 이동된 코디네이터들을 re-export
export { CoordinatorManager } from '@core/managers/coordinators/CoordinatorManager';
export { Coordinator } from '@core/managers/coordinators/Coordinator';
export { MediaExtractorCoordinator } from '@core/managers/coordinators/MediaExtractorCoordinator';

// Type exports
export type { ManagedExtractionResult } from '@core/managers/coordinators/CoordinatorManager';
