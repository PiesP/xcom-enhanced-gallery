/**
 * @fileoverview Toolbar Auto-Hide Hook
 * @version 1.0.0 - 툴바 자동 숨김 기능 구현
 */

import { getPreactHooks, getPreactSignals } from '@shared/external/vendors';
import { logger } from '@shared/logging/logger';

const { useEffect, useRef, useCallback, useMemo } = getPreactHooks();
const { signal } = getPreactSignals();

/**
 * 툴바 자동 숨김 훅 옵션 인터페이스
 */
export interface UseToolbarAutoHideOptions {
  /** 툴바 DOM 요소 */
  toolbarElement: HTMLElement | null;
  /** 호버 감지 영역 요소 (선택사항) */
  hoverZoneElement?: HTMLElement | null;
  /** 초기 딜레이 시간 (밀리초) */
  initialDelay: number;
  /** 자동 숨김 기능 활성화 여부 */
  enabled: boolean;
}

/**
 * 툴바 자동 숨김 상태 인터페이스
 */
export interface ToolbarAutoHideState {
  /** 툴바 가시성 상태 */
  isVisible: boolean;
  /** 자동 숨김 기능 활성화 상태 */
  isAutoHideActive: boolean;
  /** 수동으로 툴바 표시 */
  show: () => void;
  /** 수동으로 툴바 숨김 */
  hide: () => void;
  /** 자동 숨김 타이머 재시작 */
  restart: () => void;
}

/**
 * 툴바 자동 숨김 기능을 제공하는 커스텀 훅
 *
 * @param options 자동 숨김 옵션
 * @returns 툴바 자동 숨김 상태 및 제어 함수들
 */
export function useToolbarAutoHide(options: UseToolbarAutoHideOptions): ToolbarAutoHideState {
  const { toolbarElement, hoverZoneElement, initialDelay, enabled } = options;

  // 상태 시그널
  const isVisible = signal(true);
  const isAutoHideActive = signal(false);

  // 타이머 및 이벤트 참조
  const autoHideTimerRef = useRef<number | null>(null);
  const isHovering = useRef(false);
  const isFocused = useRef(false);

  /**
   * 타이머 정리 함수
   */
  const clearAutoHideTimer = useCallback(() => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
  }, []);

  /**
   * 툴바에 CSS 스타일 적용
   */
  const applyToolbarStyles = useCallback(
    (visible: boolean) => {
      if (!toolbarElement) return;

      if (visible) {
        // 툴바 표시 스타일
        toolbarElement.style.setProperty('opacity', '1', 'important');
        toolbarElement.style.setProperty('transform', 'translateY(0)', 'important');
        toolbarElement.style.setProperty('pointer-events', 'auto', 'important');
        toolbarElement.style.setProperty('visibility', 'visible', 'important');
      } else {
        // 툴바 숨김 스타일
        toolbarElement.style.setProperty('opacity', '0', 'important');
        toolbarElement.style.setProperty('transform', 'translateY(-100%)', 'important');
        toolbarElement.style.setProperty('pointer-events', 'none', 'important');
      }
    },
    [toolbarElement]
  );

  /**
   * 툴바 표시 함수
   */
  const showToolbar = useCallback(() => {
    if (!enabled) return;

    isVisible.value = true;
    applyToolbarStyles(true);
    logger.debug('Toolbar auto-hide: 툴바 표시됨');
  }, [enabled, applyToolbarStyles]);

  /**
   * 툴바 숨김 함수
   */
  const hideToolbar = useCallback(() => {
    if (!enabled) return;

    // 호버 상태이거나 포커스가 있으면 숨기지 않음
    if (isHovering.current || isFocused.current) {
      return;
    }

    isVisible.value = false;
    isAutoHideActive.value = true;
    applyToolbarStyles(false);
    logger.debug('Toolbar auto-hide: 툴바 숨겨짐');
  }, [enabled, applyToolbarStyles]);

  /**
   * 자동 숨김 타이머 시작
   */
  const startAutoHideTimer = useCallback(() => {
    if (!enabled) return;

    clearAutoHideTimer();
    autoHideTimerRef.current = window.setTimeout(() => {
      hideToolbar();
    }, initialDelay);

    logger.debug(`Toolbar auto-hide: 타이머 시작 (${initialDelay}ms)`);
  }, [enabled, initialDelay, hideToolbar, clearAutoHideTimer]);

  /**
   * 포커스 체크 함수
   */
  const checkFocus = useCallback(() => {
    if (!toolbarElement) return false;

    const activeElement = document.activeElement;
    const hasFocus = toolbarElement.contains(activeElement);
    isFocused.current = hasFocus;

    return hasFocus;
  }, [toolbarElement]);

  // 마우스 이벤트 핸들러
  const handleMouseEnter = useCallback(() => {
    if (!enabled) return;

    isHovering.current = true;
    clearAutoHideTimer();
    showToolbar();
  }, [enabled, clearAutoHideTimer, showToolbar]);

  const handleMouseLeave = useCallback(() => {
    if (!enabled) return;

    isHovering.current = false;

    // 포커스가 없으면 즉시 숨김
    if (!checkFocus()) {
      hideToolbar();
    }
  }, [enabled, checkFocus, hideToolbar]);

  // 포커스 이벤트 핸들러
  const handleFocusIn = useCallback(() => {
    if (!enabled) return;

    isFocused.current = true;
    clearAutoHideTimer();
    showToolbar();
  }, [enabled, clearAutoHideTimer, showToolbar]);

  const handleFocusOut = useCallback(() => {
    if (!enabled) return;

    // 다음 틱에서 포커스 상태 확인 (포커스 이동이 완료된 후)
    setTimeout(() => {
      const hasFocus = checkFocus();
      isFocused.current = hasFocus;

      // 호버도 없고 포커스도 없으면 숨김
      if (!isHovering.current && !hasFocus) {
        hideToolbar();
      }
    }, 0);
  }, [enabled, checkFocus, hideToolbar]);

  // 이벤트 리스너 설정
  useEffect(() => {
    if (!enabled || !toolbarElement) return;

    // 툴바 요소에 이벤트 리스너 추가
    toolbarElement.addEventListener('mouseenter', handleMouseEnter);
    toolbarElement.addEventListener('mouseleave', handleMouseLeave);
    toolbarElement.addEventListener('focusin', handleFocusIn);
    toolbarElement.addEventListener('focusout', handleFocusOut);

    // 호버 영역이 있으면 추가 이벤트 리스너 설정
    if (hoverZoneElement) {
      hoverZoneElement.addEventListener('mouseenter', handleMouseEnter);
      hoverZoneElement.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      toolbarElement.removeEventListener('mouseenter', handleMouseEnter);
      toolbarElement.removeEventListener('mouseleave', handleMouseLeave);
      toolbarElement.removeEventListener('focusin', handleFocusIn);
      toolbarElement.removeEventListener('focusout', handleFocusOut);

      if (hoverZoneElement) {
        hoverZoneElement.removeEventListener('mouseenter', handleMouseEnter);
        hoverZoneElement.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [
    enabled,
    toolbarElement,
    hoverZoneElement,
    handleMouseEnter,
    handleMouseLeave,
    handleFocusIn,
    handleFocusOut,
  ]);

  // 초기 자동 숨김 타이머 시작
  useEffect(() => {
    if (enabled) {
      startAutoHideTimer();
    }

    return () => {
      clearAutoHideTimer();
    };
  }, [enabled, startAutoHideTimer, clearAutoHideTimer]);

  // 수동 제어 함수들
  const manualShow = useCallback(() => {
    clearAutoHideTimer();
    showToolbar();
  }, [clearAutoHideTimer, showToolbar]);

  const manualHide = useCallback(() => {
    clearAutoHideTimer();
    hideToolbar();
  }, [clearAutoHideTimer, hideToolbar]);

  const restart = useCallback(() => {
    clearAutoHideTimer();
    showToolbar();
    startAutoHideTimer();
  }, [clearAutoHideTimer, showToolbar, startAutoHideTimer]);

  // 메모이제이션된 반환값
  return useMemo(
    () => ({
      isVisible: isVisible.value,
      isAutoHideActive: isAutoHideActive.value,
      show: manualShow,
      hide: manualHide,
      restart,
    }),
    [isVisible.value, isAutoHideActive.value, manualShow, manualHide, restart]
  );
}
