/**
 * @fileoverview DOM 유틸리티 배럴 export
 */

export { DOMBatcher, globalDOMBatcher, updateElementsInBatch, updateElement } from './DOMBatcher';
export { BatchDOMUpdateManager, batchDOMUpdateManager } from './BatchDOMUpdateManager';
export type { DOMUpdate as DOMUpdateTask } from './DOMBatcher';
