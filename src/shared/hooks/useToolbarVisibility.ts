/**
 * Copyright (c) 2024 X.com Enhanced Gallery - MIT License
 *
 * @fileoverview 통합 툴바 가시성 제어 훅
 * @description TDD 방식으로 구현된 단일 책임 툴바 가시성 관리
 *
 * 핵심 기능:
 * - 초기 자동 표시/숨김
 * - 호버 존 기반 상호작용
 * - 수동 제어 API
 * - 자동 메모리 정리
 */

import { ComponentManager } from '@shared/components/component-manager';

interface ToolbarVisibilityOptions {
  /** 초기 표시 시간 (기본: 1000ms) */
  readonly initialShowDuration?: number;
  /** 호버 이탈 후 숨김 지연 시간 (기본: 300ms) */
  readonly hideDelay?: number;
}

interface ToolbarVisibilityReturn {
  /** 툴바 표시 상태 */
  readonly isVisible: boolean;
  /** 호버 존 참조 */
  readonly hoverZoneRef: { current: HTMLDivElement | null };
  /** 수동 툴바 표시 */
  readonly showToolbar: () => void;
  /** 수동 툴바 숨김 */
  readonly hideToolbar: () => void;
}

/**
 * 통합 툴바 가시성 제어 훅
 *
 * @param options 가시성 제어 옵션
 * @returns 툴바 가시성 상태 및 제어 함수들
 */
export function useToolbarVisibility({
  initialShowDuration = 1000,
  hideDelay = 300,
}: ToolbarVisibilityOptions = {}): ToolbarVisibilityReturn {
  const { useState, useRef, useEffect, useCallback } = ComponentManager.getHookManager();

  // 🎯 단일 상태 관리
  const [isVisible, setIsVisible] = useState(true);

  // 참조 관리
  const hoverZoneRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<number>();

  // 🔄 수동 제어 API
  const showToolbar = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setIsVisible(true);
  }, []);

  const hideToolbar = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setIsVisible(false);
  }, []);

  const hideWithDelay = useCallback(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
    }, hideDelay);
  }, [hideDelay]);

  // 🚀 초기 자동 숨김 타이머
  useEffect(() => {
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
    }, initialShowDuration);

    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [initialShowDuration]);

  // 🖱️ 호버 존 이벤트 핸들러
  useEffect(() => {
    const hoverZone = hoverZoneRef.current;
    if (!hoverZone) return;

    const handleMouseEnter = () => {
      showToolbar();
    };

    const handleMouseLeave = () => {
      hideWithDelay();
    };

    hoverZone.addEventListener('mouseenter', handleMouseEnter);
    hoverZone.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      hoverZone.removeEventListener('mouseenter', handleMouseEnter);
      hoverZone.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [showToolbar, hideWithDelay]);

  // 🧹 정리 함수
  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  return {
    isVisible,
    hoverZoneRef,
    showToolbar,
    hideToolbar,
  };
}
