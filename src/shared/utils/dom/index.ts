/**
 * @fileoverview DOM 유틸리티 배럴 export - DOMService 통합 완료
 * @deprecated Most functions moved to @shared/dom/DOMService
 */

// 주요 DOM 배처 유틸리티 - DOMService.batchUpdate() 사용 권장
/** @deprecated Use DOMService.batchUpdate() instead */
export { DOMBatcher, globalDOMBatcher, updateElementsInBatch, updateElement } from './DOMBatcher';
/** @deprecated Use DOMService.DOMUpdate instead */
export type { DOMUpdate, DOMUpdate as DOMUpdateTask } from './DOMBatcher';

// 하위 호환성을 위한 별칭 - DOMService 사용 권장
/** @deprecated Use DOMService.batchUpdate() instead */
export { DOMBatcher as BatchDOMUpdateManager } from './DOMBatcher';

// 권장 사용법 안내
export const MIGRATION_GUIDE = {
  DOMBatcher: 'Use DOMService.batchUpdate() instead',
  updateElement: 'Use DOMService.updateElement() instead',
  updateElementsInBatch: 'Use DOMService.batchDOMOperations() instead',
} as const;
