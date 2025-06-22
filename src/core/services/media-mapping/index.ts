/**
 * @fileoverview Media Mapping Module Exports
 * @description 미디어 매핑 모듈의 중앙집중식 export
 */

// 서비스
export { SimplifiedMediaMappingService } from './SimplifiedMediaMappingService';

// 전략들
export { MediaTabUrlDirectStrategy } from './MediaTabUrlDirectStrategy';

// 타입들
export type { MappingCacheEntry, MediaMappingStrategy, StrategyMetrics } from './types';
