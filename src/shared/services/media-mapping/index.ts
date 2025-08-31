/**
 * @fileoverview Media Mapping Module Exports
 * @description 미디어 매핑 모듈의 중앙집중식 export
 */

// 서비스
export { MediaMappingService } from './MediaMappingService';

// 전략들
export { MediaTabUrlDirectStrategy } from './MediaTabUrlDirectStrategy';

// 타입들
export type { MappingCacheEntry, StrategyMetrics } from '@shared/types/core/core-types';
export type { MediaMappingStrategy } from '@shared/types/media.types';
