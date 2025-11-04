/**
 * @fileoverview Media Extraction Strategies Exports
 * @version 3.1.0 - Phase 2B Clean Architecture Optimization
 */

// Tweet info extraction strategies (active ones only)
// export { ClickedElementStrategy } from './ClickedElementStrategy'; // DISABLED
export { ClickedElementTweetStrategy } from './clicked-element-tweet-strategy';
export { UrlBasedTweetStrategy } from './url-based-tweet-strategy';
// export { DomStructureStrategy } from './DomStructureStrategy'; // DISABLED
export { DomStructureTweetStrategy } from './dom-structure-tweet-strategy';
export { DataAttributeTweetStrategy } from './data-attribute-tweet-strategy';
export { ParentTraversalTweetStrategy } from './parent-traversal-tweet-strategy';

// Phase 342: Quote Tweet Detection
export { QuoteTweetDetector } from './quote-tweet-detector';

// Fallback strategies have been moved to features/media/extraction/strategies/fallback/
