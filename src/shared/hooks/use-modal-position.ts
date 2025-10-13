/**
 * @fileoverview Modal Position Hook (Phase 35 Step 2-B)
 * @description 툴바 기준 동적 모달 위치 계산
 */

import type { Accessor } from 'solid-js';
import { getSolid } from '../external/vendors';

const { createSignal, createEffect, onCleanup } = getSolid();

/**
 * 모달 위치 계산 결과
 */
export interface ModalPosition {
  top: number;
  left: number;
}

/**
 * 모달 크기 정보
 */
export interface ModalSize {
  width: number;
  height: number;
}

/**
 * 위치 계산 옵션
 */
export interface PositionOptions {
  /** 툴바 요소 선택자 또는 요소 */
  toolbarRef?: HTMLElement | null;
  /** 모달 크기 */
  modalSize: ModalSize;
  /** 여백 (기본 16px) */
  margin?: number;
  /** 수평 중앙 정렬 여부 (기본 true) */
  centerHorizontally?: boolean;
}

/**
 * 툴바 기준 모달 위치 계산 훅
 *
 * @example
 * ```tsx
 * const [position] = useModalPosition({
 *   toolbarRef: toolbarElement,
 *   modalSize: { width: 600, height: 400 },
 * });
 * ```
 */
export function useModalPosition(options: PositionOptions): Accessor<ModalPosition> {
  const { toolbarRef, modalSize, margin = 16, centerHorizontally = true } = options;

  // 위치 계산 함수
  const calculatePosition = (): ModalPosition => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 툴바 위치 가져오기
    const toolbarRect = toolbarRef?.getBoundingClientRect();

    // 수직 위치 계산
    let top: number;
    if (toolbarRect && toolbarRect.height > 0) {
      // 툴바 아래에 배치
      top = toolbarRect.bottom + margin;
    } else {
      // fallback: 상단에서 오프셋
      top = calculateFallbackTop(margin);
    }

    // 화면 경계 체크 (수직)
    const maxTop = viewportHeight - modalSize.height - margin;
    top = Math.max(margin, Math.min(top, maxTop));

    // 수평 위치 계산
    let left: number;
    if (centerHorizontally) {
      // 화면 중앙 정렬
      left = calculateCenterLeft(modalSize.width, margin);
    } else if (toolbarRect && toolbarRect.width > 0) {
      // 툴바 왼쪽 정렬
      left = toolbarRect.left;
    } else {
      // fallback: 중앙 정렬
      left = calculateCenterLeft(modalSize.width, margin);
    }

    // 화면 경계 체크 (수평)
    const maxLeft = viewportWidth - modalSize.width - margin;
    left = Math.max(margin, Math.min(left, maxLeft));

    return { top, left };
  };

  const [position, setPosition] = createSignal<ModalPosition>(calculatePosition());

  // 리사이즈 이벤트 리스너
  createEffect(() => {
    const handleResize = () => {
      setPosition(calculatePosition());
    };

    window.addEventListener('resize', handleResize);
    onCleanup(() => {
      window.removeEventListener('resize', handleResize);
    });
  });

  return position;
}

/**
 * Fallback 수직 위치 계산
 */
function calculateFallbackTop(_margin: number): number {
  // 상단에서 80px 오프셋 (기존 고정값)
  return 80;
}

/**
 * 화면 중앙 수평 위치 계산
 */
function calculateCenterLeft(modalWidth: number, margin: number): number {
  const viewportWidth = window.innerWidth;
  const effectiveWidth = Math.min(modalWidth, viewportWidth - margin * 2);
  return (viewportWidth - effectiveWidth) / 2;
}
