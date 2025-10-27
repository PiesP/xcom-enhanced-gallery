/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Item Scroll State Export
 *
 * 아이템 스크롤 상태 관리 모듈 통합 인터페이스
 * - 타입: ItemScrollState, ItemScrollStateSignal
 * - 상수: INITIAL_ITEM_SCROLL_STATE
 * - 팩토리/유틸: 생성, 업데이트, 비교, 신호 관리
 */

/* ============================================================================
 * Types
 * ============================================================================ */
export type { ItemScrollState } from './item-scroll-state.ts';
export type { ItemScrollStateSignal } from './item-scroll-signal.ts';

/* ============================================================================
 * Constants & Factories
 * ============================================================================ */
export {
  INITIAL_ITEM_SCROLL_STATE,
  createItemScrollState,
  updateItemScrollState,
  resetItemScrollState,
  clearItemScrollTimeouts,
  isSameItemScrollState,
} from './item-scroll-state.ts';

/* ============================================================================
 * Signal Adapter & Utilities
 * ============================================================================ */
export {
  createItemScrollStateSignal,
  updateStateSignal,
  hasItemScrollStateChanged,
} from './item-scroll-signal.ts';
