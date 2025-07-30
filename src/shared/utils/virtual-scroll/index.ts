/**
 * @fileoverview Virtual Scroll 유틸리티 재사용 모듈 (간단한 스크롤 헬퍼)
 * @description Phase C2: 복잡한 가상 스크롤 시스템을 간단한 헬퍼로 단순화
 */

// Phase C2: 기본 스크롤 헬퍼로 대체
export { ScrollHelper } from './ScrollHelper';
export type {
  SimpleScrollConfig,
  ScrollVisibleRange,
  ScrollRenderRange,
  VisibleRange,
  RenderRange,
} from './ScrollHelper';

// 하위 호환성을 위한 별칭
export { ScrollHelper as VirtualScrollManager } from './ScrollHelper';
export type { SimpleScrollConfig as VirtualScrollConfig } from './ScrollHelper';

// 순환 의존성 방지를 위해 hooks는 별도로 import
