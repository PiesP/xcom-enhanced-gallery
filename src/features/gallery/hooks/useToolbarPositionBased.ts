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
  /** 초기 자동 숨김 지연 시간 (ms) - 0이면 자동 숨김 비활성화 */
  initialAutoHideDelay?: number;
  /** 상단 edge fallback 활성화 여부 (호버 존 이벤트 누락/레이어 충돌 대비) */
  enableTopEdgeFallback?: boolean;
  /** top-edge fallback 감지 임계값 (px) */
  topEdgeThresholdPx?: number;
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
  initialAutoHideDelay = 1000, // 기본값 1초
  enableTopEdgeFallback = true,
  topEdgeThresholdPx = 4,
}: UseToolbarPositionBasedOptions): UseToolbarPositionBasedReturn {
  const { useState, useEffect, useCallback, useRef } = getPreactHooks();

  // 툴바 표시 상태
  const [isVisible, setIsVisible] = useState(enabled);

  // 자동 숨김 타이머 관리
  const autoHideTimerRef = useRef<number | null>(null);
  const isHoveredRef = useRef(false);
  // top-edge fallback 활성 감지
  const topEdgeActiveRef = useRef(false);
  // 첫 mousemove 즉시 처리되도록 음수 초기화
  const lastTopEdgeTriggerTsRef = useRef<number>(-1e9);

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
   * 타이머 정리 함수
   */
  const clearAutoHideTimer = useCallback(() => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
  }, []);

  /**
   * 자동 숨김 타이머 시작
   */
  const startAutoHideTimer = useCallback(() => {
    // 자동 숨김이 비활성화된 경우 스킵
    if (initialAutoHideDelay === 0 || !enabled) return;

    clearAutoHideTimer();

    logger.debug(`Starting auto-hide timer: ${initialAutoHideDelay}ms`);

    autoHideTimerRef.current = window.setTimeout(() => {
      // 호버 상태가 아닐 때만 숨김
      if (!isHoveredRef.current) {
        logger.debug('Auto-hide timer triggered - hiding toolbar');
        setIsVisible(false);
        updateToolbarVisibility(false);
      } else {
        logger.debug('Auto-hide timer triggered but toolbar is hovered - keeping visible');
      }
    }, initialAutoHideDelay);
  }, [initialAutoHideDelay, enabled, clearAutoHideTimer, updateToolbarVisibility]);

  /**
   * 마우스 이벤트 핸들러
   */
  const handleMouseEnter = useCallback(() => {
    if (enabled) {
      isHoveredRef.current = true;
      clearAutoHideTimer(); // 자동 숨김 취소
      show();
    }
  }, [enabled, show, clearAutoHideTimer]);

  const handleMouseLeave = useCallback(() => {
    if (enabled) {
      isHoveredRef.current = false;
      hide();
      // 마우스 이탈 후 다시 자동 숨김 타이머 시작하지 않음 (기존 동작 유지)
    }
  }, [enabled, hide]);

  /**
   * 상단 edge mousemove fallback
   * - hoverZoneElement 이벤트가 브라우저 / 레이아웃 변형 / transform stacking 문제로 누락될 가능성에 대비
   * - clientY <= threshold 영역에서 mousemove 발생 시 툴바 표시
   * - 과도한 reflow 방지를 위해 최소 50ms 간격 throttle
   */
  const handleGlobalMouseMove = useCallback(
    (ev: MouseEvent) => {
      if (!enableTopEdgeFallback || !enabled || !toolbarElement) return;
      const now = performance.now();
      // 50ms throttle
      if (now - lastTopEdgeTriggerTsRef.current < 50) return;
      const y = ev.clientY;
      if (y <= topEdgeThresholdPx) {
        lastTopEdgeTriggerTsRef.current = now;
        // top-edge 활성
        topEdgeActiveRef.current = true;
        show();
      } else if (topEdgeActiveRef.current && y > topEdgeThresholdPx + 24 && !isHoveredRef.current) {
        // edge 영역 벗어난 뒤 충분히 내려갔고 hover 상태 아님 → 숨김
        topEdgeActiveRef.current = false;
        hide();
      }
    },
    [enableTopEdgeFallback, enabled, toolbarElement, topEdgeThresholdPx, show, hide]
  );

  /**
   * 활성화 상태 변경 시 초기 가시성 설정 및 자동 숨김 타이머 시작
   */
  useEffect(() => {
    setIsVisible(enabled);
    updateToolbarVisibility(enabled);

    // 활성화 시 자동 숨김 타이머 시작
    if (enabled) {
      startAutoHideTimer();
    } else {
      clearAutoHideTimer();
    }
  }, [enabled, updateToolbarVisibility, startAutoHideTimer, clearAutoHideTimer]);

  /**
   * 이벤트 리스너 등록/해제
   */
  useEffect(() => {
    if (!enabled) return;
    if (!toolbarElement) return;

    // hoverZoneElement 가 존재할 때만 호버 이벤트 등록
    if (hoverZoneElement) {
      hoverZoneElement.addEventListener('mouseenter', handleMouseEnter);
      hoverZoneElement.addEventListener('mouseleave', handleMouseLeave);
    }

    toolbarElement.addEventListener('mouseenter', handleMouseEnter);
    toolbarElement.addEventListener('mouseleave', handleMouseLeave);

    logger.debug('Position-based toolbar events registered', {
      hoverZoneBound: Boolean(hoverZoneElement),
      topEdgeFallback: enableTopEdgeFallback,
    });

    return () => {
      if (hoverZoneElement) {
        hoverZoneElement.removeEventListener('mouseenter', handleMouseEnter);
        hoverZoneElement.removeEventListener('mouseleave', handleMouseLeave);
      }
      toolbarElement.removeEventListener('mouseenter', handleMouseEnter);
      toolbarElement.removeEventListener('mouseleave', handleMouseLeave);
      clearAutoHideTimer();
      logger.debug('Position-based toolbar events removed');
    };
  }, [
    enabled,
    hoverZoneElement,
    toolbarElement,
    handleMouseEnter,
    handleMouseLeave,
    clearAutoHideTimer,
    enableTopEdgeFallback,
  ]);

  // 전역 top-edge fallback 리스너
  useEffect(() => {
    if (!enabled || !enableTopEdgeFallback) return;
    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [enabled, enableTopEdgeFallback, handleGlobalMouseMove]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      clearAutoHideTimer();
    };
  }, [clearAutoHideTimer]);

  return {
    isVisible,
    show,
    hide,
  };
}
