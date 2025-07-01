/**
 * @fileoverview Media Services Exports
 * @version 2.0.0 - Simplified Architecture
 */

// 간소화된 미디어 추출기 (메인 서비스)
export { SimplifiedMediaExtractor } from '../extraction/services/SimplifiedMediaExtractor';

// DOM 직접 추출기
export { DOMDirectExtractor } from '../extraction/services/DOMDirectExtractor';

// 호환성을 위한 서비스 래퍼
export { MediaExtractionService } from './MediaExtractionService';
