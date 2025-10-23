/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Item Scroll State Signal Adapter
 * @description Solid.js Signal 기반의 ItemScrollState 관리 모듈
 */

import { getSolid } from '../../../shared/external/vendors';
import type { ItemScrollState } from './item-scroll-state.ts';
import {
  INITIAL_ITEM_SCROLL_STATE,
  createItemScrollState,
  updateItemScrollState,
  clearItemScrollTimeouts,
  isSameItemScrollState,
} from './item-scroll-state.ts';

const { createSignal } = getSolid();

type Setter<T> = (value: T | ((prev: T) => T)) => T;

/**
 * ItemScrollStateSignal: Solid.js Signal 기반의 상태 관리 인터페이스
 */
export interface ItemScrollStateSignal {
  /** 현재 상태를 반환하는 Signal getter */
  getState: () => ItemScrollState;
  /** 상태를 업데이트하는 Signal setter */
  setState: Setter<ItemScrollState>;
  /** 상태를 초기화 (정리용) */
  reset: () => void;
  /** 모든 타임아웃 ID 초기화 */
  clearTimeouts: () => void;
}

/**
 * Item Scroll State Signal 생성 팩토리 함수
 * @param initialState - 초기 상태값 (생략하면 기본값 사용)
 * @returns ItemScrollStateSignal 인터페이스
 *
 * @example
 * const stateSignal = createItemScrollStateSignal();
 * const state = stateSignal.getState(); // 현재 상태 읽기
 * stateSignal.setState(prev => ({ ...prev, lastScrolledIndex: 5 })); // 상태 업데이트
 */
export function createItemScrollStateSignal(
  initialState?: Partial<ItemScrollState>
): ItemScrollStateSignal {
  const [getState, setState] = createSignal<ItemScrollState>(createItemScrollState(initialState));

  return {
    getState,
    setState,
    reset: () => {
      setState(INITIAL_ITEM_SCROLL_STATE);
    },
    clearTimeouts: () => {
      setState(prev => clearItemScrollTimeouts(prev));
    },
  };
}

/**
 * Item Scroll State 업데이트 헬퍼 - Solid.js Signal과 호환
 * @param setterFn - Solid.js Signal의 setState 함수
 * @param updates - 업데이트할 속성들
 *
 * @example
 * const stateSignal = createItemScrollStateSignal();
 * updateStateSignal(stateSignal.setState, { lastScrolledIndex: 10 });
 */
export function updateStateSignal(
  setterFn: Setter<ItemScrollState>,
  updates: Partial<ItemScrollState>
): void {
  setterFn(prev => updateItemScrollState(prev, updates));
}

/**
 * Item Scroll State 동일성 비교 헬퍼 (Signal 인식)
 * @param currentState - 현재 상태
 * @param prevState - 이전 상태
 * @returns 상태가 변경되었는지 여부
 *
 * @example
 * if (hasStateChanged(newState, oldState)) {
 *   // 상태가 변경됨 - 필요한 작업 수행
 * }
 */
export function hasItemScrollStateChanged(
  currentState: ItemScrollState,
  prevState: ItemScrollState
): boolean {
  return !isSameItemScrollState(currentState, prevState);
}
