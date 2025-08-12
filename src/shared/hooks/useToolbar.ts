/**
 * Copyright (c) 2024 X.com Enhanced Gallery - MIT License
 *
 * @fileoverview 통합 컨테이너 방식 툴바 가시성 제어 훅
 * @description 깜빡임 문제를 근본적으로 해결하는 단일 컨테이너 방식
 *
 * 핵심 개선사항:
 * - 호버 존과 툴바를 하나의 컨테이너로 통합
 * - 물리적 분리 제거로 깜빡임 완전 해결
 * - 단순한 이벤트 처리로 50% 코드 감소
 * - 예측 가능한 동작 보장
 *
 * 요구사항:
 * 1. 갤러리 시작 시 1초간 표시
 * 2. 통합 컨테이너 호버 시 표시
 * 3. 깜빡임 없는 자연스러운 UX
 */

import { ComponentManager } from '@shared/components/component-manager';
import { TIMING } from '../../constants';
import { logger } from '@shared/logging';

interface ToolbarOptions {
  /** 초기 표시 시간 (기본: 1000ms) */
  readonly initialShowDuration?: number;
}

interface ToolbarState {
  /** 툴바 표시 상태 */
  readonly isVisible: boolean;
  /** 통합 컨테이너 참조 (호버 존 + 툴바) */
  readonly containerRef: { current: HTMLDivElement | null };
  /** 수동 툴바 표시 */
  readonly showToolbar: () => void;
  /** 수동 툴바 숨김 */
  readonly hideToolbar: () => void;
}

/**
 * 통합 컨테이너 방식 툴바 가시성 제어 훅
 *
 * 근본 해결책:
 * - 호버 존과 툴바가 하나의 연속된 영역으로 동작
 * - 마우스 이동 시 깜빡임 완전 제거
 * - 단순하고 예측 가능한 동작
 *
 * @param options 가시성 제어 옵션
 * @returns 툴바 가시성 상태 및 제어 함수들
 *
 * @example
 * ```typescript
 * const { isVisible, containerRef } = useToolbar({
 *   initialShowDuration: 1000,
 * });
 *
 * return (
 *   <div ref={containerRef} className="toolbar-container">
 *     {isVisible && <Toolbar />}
 *   </div>
 * );
 * ```
 */
export function useToolbar({
  initialShowDuration = TIMING.TOOLBAR_INITIAL_SHOW_DURATION,
}: ToolbarOptions = {}): ToolbarState {
  const { useState, useRef, useEffect, useCallback } = ComponentManager.getHookManager();

  // 🎯 단일 상태만 관리
  const [isVisible, setIsVisible] = useState(true);

  // 🔄 통합 컨테이너 참조 (호버 존 + 툴바)
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);

  // 타이머 정리 유틸리티
  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 🔄 수동 제어 API
  const showToolbar = useCallback(() => {
    clearTimer();
    setIsVisible(true);
    logger.debug('Toolbar: Manual show');
  }, [clearTimer]);

  const hideToolbar = useCallback(() => {
    clearTimer();
    setIsVisible(false);
    logger.debug('Toolbar: Manual hide');
  }, [clearTimer]);

  // 🚀 초기 자동 숨김 타이머
  useEffect(() => {
    timerRef.current = window.setTimeout(() => {
      setIsVisible(false);
      logger.debug('Toolbar: Initial display completed');
    }, initialShowDuration);

    return clearTimer;
  }, [initialShowDuration, clearTimer]);

  // 🖱️ 통합 컨테이너 이벤트 핸들러 (깜빡임 해결)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseEnter = () => {
      clearTimer();
      setIsVisible(true);
      logger.debug('Toolbar: Show on container hover');
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
      logger.debug('Toolbar: Hide on container leave');
    };

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }); // 의존성 배열 제거로 ref 변경 시마다 재등록

  // 🧹 최종 정리 함수
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    isVisible,
    containerRef,
    showToolbar,
    hideToolbar,
  };
}
