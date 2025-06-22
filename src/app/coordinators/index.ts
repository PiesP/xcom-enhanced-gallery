/**
 * 코디네이터들의 Barrel Export
 *
 * 갤러리 앱의 모든 코디네이터를 중앙에서 관리
 */

export { GalleryEventCoordinator } from './GalleryEventCoordinator';
export { MediaExtractionCoordinator } from './MediaExtractionCoordinator';
export { CoordinatorManager } from './CoordinatorManager';

// 타입 exports
export type { EventCoordinatorConfig, EventHandlers } from './GalleryEventCoordinator';
export type { ExtractionCoordinatorConfig, ExtractionResult } from './MediaExtractionCoordinator';
export type { CoordinatorManagerConfig, ManagedExtractionResult } from './CoordinatorManager';
