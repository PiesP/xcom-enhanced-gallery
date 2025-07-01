/**
 * @fileoverview Media Services Exports
 * @version 2.0.0 - Clean Architecture
 */

// 메인 통합 서비스 (권장)
export { UnifiedMediaExtractionService } from './UnifiedMediaExtractionService';

// 새로운 통합 서비스 (v2)
export { UnifiedMediaExtractionService as UnifiedMediaExtractionServiceV2 } from '../extraction/services/UnifiedMediaExtractionService.v2';

// 백그라운드 서비스들
export { BackgroundTweetLoader } from './BackgroundTweetLoader';
export { HiddenTweetLoaderService } from './HiddenTweetLoaderService';

// 레거시 서비스들 (deprecated - 사용하지 마세요)
/** @deprecated UnifiedMediaExtractionServiceV2를 사용하세요 */
export { MediaExtractionService } from './MediaExtractionService';
/** @deprecated UnifiedMediaExtractionServiceV2를 사용하세요 */
export { StableMediaExtractionService } from './StableMediaExtractionService';
/** @deprecated UnifiedMediaExtractionServiceV2를 사용하세요 */
export { EnhancedMediaExtractor } from './EnhancedMediaExtractor';
