/**
 * @fileoverview DOM Utilities Barrel Export
 * @version Phase 326.7: Removed isInsideGallery (now internal to core-utils)
 */

// Primary DOM batch utilities
export { DOMBatcher, globalDOMBatcher, updateElementsInBatch, updateElement } from './dom-batcher';
export type { DOMUpdate, DOMUpdate as DOMUpdateTask } from './dom-batcher';

// Backward compatibility alias - direct DOMBatcher use recommended
export { DOMBatcher as BatchDOMUpdateManager } from './dom-batcher';

// CSS validation utilities
export {
  isValidCSSSelector,
  calculateSelectorComplexity,
  hasPerformanceIssues,
} from './css-validation';
