/**
 * @fileoverview Removed: BatchDOMUpdateManager는 DOMBatcher로 완전히 대체됨
 * @deprecated This file will be removed in v3.0.0
 * @migration Use DOMBatcher directly:
 *   import { DOMBatcher } from './DOMBatcher'
 *   const batcher = new DOMBatcher()
 */

// 하위 호환성을 위한 최소한의 재export
export { DOMBatcher as BatchDOMUpdateManager } from './DOMBatcher';
