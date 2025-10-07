/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Solid primitive for hover-based toolbar positioning
 * @description 툴바의 호버 기반 표시/숨김을 관리하는 Solid.js primitive
 * @version 1.0.0 - Preact hook에서 Solid primitive로 전환
 */

import { createEffect, createSignal, onCleanup, type Accessor } from 'solid-js';
import { toolbarSlideDown, toolbarSlideUp } from '@shared/utils/animations';

export interface CreateToolbarPositionOptions {
  /** 툴바 element */
  toolbarElement: HTMLElement | null;
  /** 호버 존 element */
  hoverZoneElement: HTMLElement | null;
  /** 활성화 여부 */
  enabled: boolean;
}

export interface CreateToolbarPositionReturn {
  /** 표시 여부 signal accessor */
  isVisible: Accessor<boolean>;
  /** 툴바 표시 함수 */
  show: () => void;
  /** 툴바 숨김 함수 */
  hide: () => void;
}

/**
 * 호버 기반 툴바 위치 관리를 위한 Solid.js primitive
 *
 * @description
 * - Solid.js createSignal/createEffect/onCleanup 사용
 * - 호버 존 기반 툴바 표시/숨김
 * - 애니메이션 통합 (toolbarSlideDown/Up)
 * - CSS 변수 제어 (--toolbar-opacity, --toolbar-pointer-events)
 *
 * @param options 툴바 옵션
 */
export function createToolbarPosition(
  options: CreateToolbarPositionOptions
): CreateToolbarPositionReturn {
  const { toolbarElement, hoverZoneElement, enabled } = options;

  // State management with createSignal for isVisible
  const [isVisible, setIsVisible] = createSignal(enabled);

  /**
   * CSS 변수 적용 헬퍼
   */
  const applyVisibility = (visible: boolean): void => {
    const el = toolbarElement;
    if (!el) return;

    el.style.setProperty('--toolbar-opacity', visible ? '1' : '0');
    el.style.setProperty('--toolbar-pointer-events', visible ? 'auto' : 'none');
  };

  /**
   * 툴바 표시
   */
  const show = (): void => {
    const el = toolbarElement;
    if (!el) return;

    setIsVisible(true);
    applyVisibility(true);
    void toolbarSlideDown(el);
  };

  /**
   * 툴바 숨김
   */
  const hide = (): void => {
    const el = toolbarElement;
    if (!el) return;

    setIsVisible(false);
    applyVisibility(false);
    void toolbarSlideUp(el);
  };

  /**
   * enabled 상태 변경 시 즉시 반영
   */
  createEffect(() => {
    setIsVisible(enabled);
    applyVisibility(enabled);
  });

  /**
   * 이벤트 리스너 등록/해제
   */
  createEffect(() => {
    if (!enabled || !hoverZoneElement || !toolbarElement) {
      return;
    }

    // 이벤트 핸들러
    const onHoverEnter = (): void => show();
    const onHoverLeave = (): void => hide();
    const onToolbarEnter = (): void => show();
    const onToolbarLeave = (): void => hide();

    // 이벤트 리스너 등록
    hoverZoneElement.addEventListener('mouseenter', onHoverEnter);
    hoverZoneElement.addEventListener('mouseleave', onHoverLeave);
    toolbarElement.addEventListener('mouseenter', onToolbarEnter);
    toolbarElement.addEventListener('mouseleave', onToolbarLeave);

    // Cleanup
    onCleanup(() => {
      hoverZoneElement.removeEventListener('mouseenter', onHoverEnter);
      hoverZoneElement.removeEventListener('mouseleave', onHoverLeave);
      toolbarElement.removeEventListener('mouseenter', onToolbarEnter);
      toolbarElement.removeEventListener('mouseleave', onToolbarLeave);
    });
  });

  return {
    isVisible,
    show,
    hide,
  };
}
