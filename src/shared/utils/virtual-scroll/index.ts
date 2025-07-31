/**
 * @fileoverview Virtual Scroll 유틸리티 재사용 모듈 (간단한 스크롤 헬퍼)
 * @description Phase 3: 복잡한 가상 스크롤 시스템을 간단한 헬퍼로 단순화
 */

// Phase 3: 기본 스크롤 헬퍼로 대체
export { ScrollHelper } from './ScrollHelper';
export type {
  ScrollConfig,
  ScrollVisibleRange,
  ScrollRenderRange,
  VisibleRange,
  RenderRange,
} from './ScrollHelper';

// 순환 의존성 방지를 위해 hooks는 별도로 import
