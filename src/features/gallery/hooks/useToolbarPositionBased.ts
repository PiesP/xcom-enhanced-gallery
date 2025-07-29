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
}: UseToolbarPositionBasedOptions): UseToolbarPositionBasedReturn {
  const { useState, useEffect, useCallback } = getPreactHooks();

  // 툴바 표시 상태
  const [isVisible, setIsVisible] = useState(enabled);

  /**
   * CSS 변수를 통한 툴바 스타일 업데이트
   */
  const updateToolbarVisibility = useCallback((visible: boolean) => {
    const opacity = visible ? '1' : '0';
    const pointerEvents = visible ? 'auto' : 'none';

    // CSS 변수 업데이트로 기존 시스템과 호환성 유지
    document.documentElement.style.setProperty('--toolbar-opacity', opacity);
    document.documentElement.style.setProperty('--toolbar-pointer-events', pointerEvents);

    logger.debug(`Toolbar visibility updated: ${visible ? 'visible' : 'hidden'}`);
  }, []);

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
      show();
    }
  }, [enabled, show]);

  const handleMouseLeave = useCallback(() => {
    if (enabled) {
      hide();
    }
  }, [enabled, hide]);

  /**
   * 활성화 상태 변경 시 초기 가시성 설정
   */
  useEffect(() => {
    setIsVisible(enabled);
    updateToolbarVisibility(enabled);
  }, [enabled, updateToolbarVisibility]);

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

  return {
    isVisible,
    show,
    hide,
  };
}
