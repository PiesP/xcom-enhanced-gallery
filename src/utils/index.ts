/**
 * @fileoverview Utils Layer Exports
 * @description 유틸리티 및 서비스 exports
 */

// 공유 서비스와 유틸리티들
export * from '../shared';

// CoreService 별칭 for backward compatibility
export { CoreService } from '../shared/services/ServiceManager';

// 로거 export
export { logger } from '../shared/logging/logger';
