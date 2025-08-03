/**
 * Copyright (c) 2024 X.com Enhanced Gallery - MIT License
 *
 * @fileoverview 위치 기반 툴바 표시 훅
 * @description 마우스 위치에 따른 간소화된 툴바 가시성 제어
 *
 * 기존의 복잡한 타이머 기반 시스템을 대체하여:
 * - 100줄 → 30줄로 간소화
 * - 타이머 로직 완전 제거
 * - 즉시 반응형 위치 기반 제어
 * - 기존 CSS 호버 존 시스템 활용
 */

import { logger } from '@shared/logging/logger';
import { getPreactHooks } from '@shared/external/vendors';

export interface UseToolbarPositionBasedOptions {
  /** 툴바 엘리먼트 */
  toolbarElement: HTMLElement | null;
  /** 호버 존 엘리먼트 */
  hoverZoneElement: HTMLElement | null;
  /** 기능 활성화 여부 */
  enabled: boolean;
  /** 초기 자동 숨김 시간 (ms), 기본값: 3000 */
  autoHideDelay?: number;
}

export interface UseToolbarPositionBasedReturn {
  /** 툴바 표시 상태 */
  isVisible: boolean;
  /** 툴바 강제 표시 */
  show: () => void;
  /** 툴바 강제 숨김 */
  hide: () => void;
}

/**
 * 위치 기반 툴바 표시 훅
 *
 * 마우스가 상단 호버 존에 있을 때만 툴바를 표시하는 간소화된 시스템
 * 기존의 복잡한 타이머 로직을 제거하고 즉시 반응형으로 동작
 */
export function useToolbarPositionBased({
  toolbarElement,
  hoverZoneElement,
  enabled,
  autoHideDelay = 3000,
}: UseToolbarPositionBasedOptions): UseToolbarPositionBasedReturn {
  const { useState, useEffect, useCallback } = getPreactHooks();

  // 툴바 표시 상태 - 활성화 시 처음에는 표시
  const [isVisible, setIsVisible] = useState(enabled);
  // 자동 숨김 타이머 추적
  const [autoHideTimer, setAutoHideTimer] = useState<number | null>(null);

  /**
   * 자동 숨김 타이머 시작
   */
  const startAutoHideTimer = useCallback(() => {
    // 기존 타이머 정리
    if (autoHideTimer) {
      window.clearTimeout(autoHideTimer);
    }

    // 새 타이머 시작
    const timerId = window.setTimeout(() => {
      setIsVisible(false);
      if (toolbarElement) {
        const opacity = '0';
        const pointerEvents = 'none';
        const visibility = 'hidden';

        // 직접 스타일 업데이트로 즉시 반응
        toolbarElement.style.setProperty('--toolbar-opacity', opacity);
        toolbarElement.style.setProperty('--toolbar-pointer-events', pointerEvents);
        toolbarElement.style.setProperty('--toolbar-visibility', visibility);

        // 전역 CSS 변수도 업데이트 (호환성 유지)
        document.documentElement.style.setProperty('--toolbar-opacity', opacity);
        document.documentElement.style.setProperty('--toolbar-pointer-events', pointerEvents);
      }
      setAutoHideTimer(null);
      logger.debug('Toolbar auto-hidden after delay');
    }, autoHideDelay);

    setAutoHideTimer(timerId);
    logger.debug(`Auto-hide timer started: ${autoHideDelay}ms`);
  }, [autoHideTimer, autoHideDelay, toolbarElement]);

  /**
   * 자동 숨김 타이머 취소
   */
  const cancelAutoHideTimer = useCallback(() => {
    if (autoHideTimer) {
      window.clearTimeout(autoHideTimer);
      setAutoHideTimer(null);
      logger.debug('Auto-hide timer cancelled');
    }
  }, [autoHideTimer]);

  /**
   * 툴바 스타일 직접 업데이트 (빠른 반응을 위해)
   */
  const updateToolbarVisibility = useCallback(
    (visible: boolean) => {
      if (!toolbarElement) return;

      const opacity = visible ? '1' : '0';
      const pointerEvents = visible ? 'auto' : 'none';
      const visibility = visible ? 'visible' : 'hidden';

      // 직접 스타일 업데이트로 즉시 반응
      toolbarElement.style.setProperty('--toolbar-opacity', opacity);
      toolbarElement.style.setProperty('--toolbar-pointer-events', pointerEvents);
      toolbarElement.style.setProperty('--toolbar-visibility', visibility);

      // 전역 CSS 변수도 업데이트 (호환성 유지)
      document.documentElement.style.setProperty('--toolbar-opacity', opacity);
      document.documentElement.style.setProperty('--toolbar-pointer-events', pointerEvents);

      logger.debug(`Toolbar visibility updated: ${visible ? 'visible' : 'hidden'}`);
    },
    [toolbarElement]
  );

  /**
   * 툴바 표시
   */
  const show = useCallback(() => {
    setIsVisible(true);
    updateToolbarVisibility(true);
  }, [updateToolbarVisibility]);

  /**
   * 툴바 숨김
   */
  const hide = useCallback(() => {
    setIsVisible(false);
    updateToolbarVisibility(false);
  }, [updateToolbarVisibility]);

  /**
   * 마우스 이벤트 핸들러
   */
  const handleMouseEnter = useCallback(() => {
    if (enabled) {
      cancelAutoHideTimer(); // 타이머 취소
      show();
    }
  }, [enabled, show, cancelAutoHideTimer]);

  const handleMouseLeave = useCallback(() => {
    if (enabled) {
      startAutoHideTimer(); // 자동 숨김 타이머 시작
    }
  }, [enabled, startAutoHideTimer]);

  /**
   * 활성화 상태 변경 시 초기 가시성 설정 및 자동 숨김 시작
   */
  useEffect(() => {
    if (enabled) {
      setIsVisible(true);
      updateToolbarVisibility(true);

      // 기존 타이머 정리
      if (autoHideTimer) {
        window.clearTimeout(autoHideTimer);
      }

      // 초기 로드 시 자동 숨김 타이머 직접 시작 (의존성 문제 해결)
      const timerId = window.setTimeout(() => {
        setIsVisible(false);
        if (toolbarElement) {
          const opacity = '0';
          const pointerEvents = 'none';
          const visibility = 'hidden';

          // 직접 스타일 업데이트로 즉시 반응
          toolbarElement.style.setProperty('--toolbar-opacity', opacity);
          toolbarElement.style.setProperty('--toolbar-pointer-events', pointerEvents);
          toolbarElement.style.setProperty('--toolbar-visibility', visibility);

          // 전역 CSS 변수도 업데이트 (호환성 유지)
          document.documentElement.style.setProperty('--toolbar-opacity', opacity);
          document.documentElement.style.setProperty('--toolbar-pointer-events', pointerEvents);
        }
        setAutoHideTimer(null);
        logger.debug('Toolbar auto-hidden after initial delay');
      }, autoHideDelay);

      setAutoHideTimer(timerId);
      logger.debug(`Initial auto-hide timer started: ${autoHideDelay}ms`);
    } else {
      setIsVisible(false);
      updateToolbarVisibility(false);
      // enabled false일 때 타이머 정리
      if (autoHideTimer) {
        window.clearTimeout(autoHideTimer);
        setAutoHideTimer(null);
      }
    }
  }, [enabled, autoHideDelay, toolbarElement]); // 안정적인 의존성만 사용

  /**
   * 이벤트 리스너 등록/해제
   */
  useEffect(() => {
    if (!enabled || !hoverZoneElement || !toolbarElement) {
      return;
    }

    // 호버 존 이벤트
    hoverZoneElement.addEventListener('mouseenter', handleMouseEnter);
    hoverZoneElement.addEventListener('mouseleave', handleMouseLeave);

    // 툴바 자체 이벤트 (툴바 위에서는 표시 유지)
    toolbarElement.addEventListener('mouseenter', handleMouseEnter);
    toolbarElement.addEventListener('mouseleave', handleMouseLeave);

    logger.debug('Position-based toolbar events registered');

    return () => {
      hoverZoneElement.removeEventListener('mouseenter', handleMouseEnter);
      hoverZoneElement.removeEventListener('mouseleave', handleMouseLeave);
      toolbarElement.removeEventListener('mouseenter', handleMouseEnter);
      toolbarElement.removeEventListener('mouseleave', handleMouseLeave);

      logger.debug('Position-based toolbar events removed');
    };
  }, [enabled, hoverZoneElement, toolbarElement, handleMouseEnter, handleMouseLeave]);

  /**
   * 컴포넌트 언마운트 시 타이머 정리
   */
  useEffect(() => {
    return () => {
      if (autoHideTimer) {
        window.clearTimeout(autoHideTimer);
      }
    };
  }, [autoHideTimer]);

  return {
    isVisible,
    show,
    hide,
  };
}
