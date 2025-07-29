/**
 * @fileoverview Virtual Scroll 유틸리티 재사용 모듈 (간단한 스크롤 헬퍼)
 * @description Phase C2: 복잡한 가상 스크롤 시스템을 간단한 헬퍼로 단순화
 */

// Phase C2: 기본 스크롤 헬퍼로 대체
export { SimpleScrollHelper } from './SimpleScrollHelper';
export type {
  SimpleScrollConfig,
  ScrollVisibleRange,
  ScrollRenderRange,
  VisibleRange,
  RenderRange,
} from './SimpleScrollHelper';

// 하위 호환성을 위한 별칭
export { SimpleScrollHelper as VirtualScrollManager } from './SimpleScrollHelper';
export type { SimpleScrollConfig as VirtualScrollConfig } from './SimpleScrollHelper';

// 훅은 그대로 유지
export { useVirtualScroll } from '../../hooks/useVirtualScroll';
export type { UseVirtualScrollOptions, UseVirtualScrollReturn } from '../../hooks/useVirtualScroll';
