/**
 * @fileoverview 미디어 로딩 서비스 (하위 호환성 re-export)
 * @deprecated Use MediaLoadingService from './MediaLoadingService' instead
 */

import { MediaLoadingService } from './MediaLoadingService';

// 하위 호환성을 위한 re-export
export {
  MediaLoadingService as UnifiedMediaLoadingService,
  default as default,
} from './MediaLoadingService';
export type {
  MediaLoadingState as UnifiedMediaLoadingState,
  MediaLoadingOptions as UnifiedMediaLoadingOptions,
} from './MediaLoadingService';

/**
 * 하위 호환성을 위한 싱글톤 인스턴스
 * @deprecated Use new MediaLoadingService() instead
 */
export const unifiedMediaLoader = new MediaLoadingService();
