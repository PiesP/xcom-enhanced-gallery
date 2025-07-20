/**
 * @fileoverview Media Extraction Strategies
 * @version 2.0.0 - Phase 2B Optimization
 * @description 미디어 추출 전략들의 통합 export
 */

// 핵심 추출 전략들
export { ClickedElementStrategy } from './ClickedElementStrategy';
export { ClickedElementTweetStrategy } from './ClickedElementTweetStrategy';
export { DataAttributeTweetStrategy } from './DataAttributeTweetStrategy';
export { DomStructureStrategy } from './DomStructureStrategy';
export { DomStructureTweetStrategy } from './DomStructureTweetStrategy';
export { ParentTraversalTweetStrategy } from './ParentTraversalTweetStrategy';
export { UrlBasedTweetStrategy } from './UrlBasedTweetStrategy';

// 폴백 전략들
export * from './fallback';
