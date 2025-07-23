/**
 * @fileoverview Media Extraction Strategies
 * @version 2.1.0 - Media Services 통합
 * @description 미디어 추출 전략들의 통합 export (Core로 리다이렉트)
 */

// 핵심 추출 전략들 (Core에서 가져오기)
export {
  ClickedElementTweetStrategy,
  DataAttributeTweetStrategy,
  DomStructureTweetStrategy,
  ParentTraversalTweetStrategy,
  UrlBasedTweetStrategy,
} from '@core/services/media-extraction/strategies';

// 로컬 전략들 (유지)
export { ClickedElementStrategy } from './ClickedElementStrategy';
export { DomStructureStrategy } from './DomStructureStrategy';
