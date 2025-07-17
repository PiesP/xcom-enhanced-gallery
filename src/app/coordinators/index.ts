/**
 * 코디네이터 통합 Export
 * @version 2.0.0 - Clean Architecture
 */

export { GalleryEventCoordinator } from './GalleryEventCoordinator';
export { MediaExtractorCoordinator } from './MediaExtractionCoordinator';
export { CoordinatorManager } from './CoordinatorManager';

// 타입 exports
export type { EventCoordinatorConfig, EventHandlers } from './GalleryEventCoordinator';
export type { ExtractionResult } from './MediaExtractionCoordinator';
export type { CoordinatorManagerConfig, ManagedExtractionResult } from './CoordinatorManager';
