/**
 * @fileoverview 하위 호환성을 위한 re-export
 * @deprecated Use DOMBatcher from './DOMBatcher' instead
 */

// 하위 호환성을 위한 re-export
export {
  DOMBatcher as BatchDOMUpdateManager,
  globalDOMBatcher as batchDOMUpdateManager,
  updateElementsInBatch,
  updateElement,
} from './DOMBatcher';

// 기본 export (하위 호환성)
export { DOMBatcher as default } from './DOMBatcher';
