/**
 * @fileoverview DOM 유틸리티 배럴 export
 */

// 주요 DOM 배처 유틸리티
export { DOMBatcher, globalDOMBatcher, updateElementsInBatch, updateElement } from './dom-batcher';
export type { DOMUpdate, DOMUpdate as DOMUpdateTask } from './dom-batcher';

// 하위 호환성을 위한 별칭 - 직접 DOMBatcher 사용 권장
export { DOMBatcher as BatchDOMUpdateManager } from './dom-batcher';

// DOM 검사 유틸리티
export { isInsideGallery } from '../core-utils';

// CSS 검증 유틸리티
export {
  isValidCSSSelector,
  calculateSelectorComplexity,
  hasPerformanceIssues,
} from './css-validation';
