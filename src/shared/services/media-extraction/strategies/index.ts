/**
 * @fileoverview Media Extraction Strategies Exports
 * @version 3.1.0 - Phase 2B Clean Architecture Optimization
 */

// Tweet info extraction strategies (active ones only)
// export { ClickedElementStrategy } from './ClickedElementStrategy'; // DISABLED
export { ClickedElementTweetStrategy } from './ClickedElementTweetStrategy';
export { UrlBasedTweetStrategy } from './UrlBasedTweetStrategy';
// export { DomStructureStrategy } from './DomStructureStrategy'; // DISABLED
export { DomStructureTweetStrategy } from './DomStructureTweetStrategy';
export { DataAttributeTweetStrategy } from './DataAttributeTweetStrategy';
export { ParentTraversalTweetStrategy } from './ParentTraversalTweetStrategy';

// Fallback strategies have been moved to features/media/extraction/strategies/fallback/
