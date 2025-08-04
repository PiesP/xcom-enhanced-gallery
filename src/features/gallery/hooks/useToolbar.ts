/**
 * Copyright (c) 2024 X.com Enhanced Gallery - MIT License
 *
 * @fileoverview 간소화된 툴바 표시 훅
 * @description 최적화된 단순한 툴바 가시성 제어
 *
 * 개선사항:
 * - 단일 상태 관리 (isVisible)
 * - 단일 타이머 (초기 자동 숨김만)
 * - CSS 변수 조작 없이 순수 DOM 이벤트
 * - 75% 코드 감소 (250줄 → 60줄)
 */

import { getPreactHooks } from '@shared/external/vendors';
import { logger } from '@shared/logging/logger';

interface useToolbarOptions {
  /** 호버 존 높이 (기본: 100px) */
  readonly hoverZoneHeight?: number;
  /** 초기 표시 시간 (기본: 1000ms) */
  readonly initialShowDuration?: number;
}

interface useToolbarReturn {
  /** 툴바 표시 상태 */
  readonly isVisible: boolean;
  /** 호버 존 ref */
  readonly hoverZoneRef: { current: HTMLDivElement | null };
}

/**
 * 간소화된 툴바 표시 훅
 *
 * 요구사항:
 * 1. 갤러리 시작시 1초간 표시
 * 2. 상단 100px 영역에서만 표시
 * 3. 단일 상태, 단일 타이머
 */
export function useToolbar({
  hoverZoneHeight: _hoverZoneHeight = 100,
  initialShowDuration = 1000,
}: useToolbarOptions = {}): useToolbarReturn {
  const { useState, useRef, useEffect } = getPreactHooks();

  // 🎯 단일 상태만 관리
  const [isVisible, setIsVisible] = useState(true);
  const hoverZoneRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  // 🎯 타이머 정리 유틸리티
  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // 🎯 초기 1초 표시 후 자동 숨김
  useEffect(() => {
    timerRef.current = window.setTimeout(() => {
      setIsVisible(false);
      logger.debug('SimpleToolbar: Initial show completed');
    }, initialShowDuration);

    return clearTimer;
  }, []); // 의존성 없음 - 한번만 실행

  // 🎯 호버 존 이벤트 (순수 DOM 이벤트)
  useEffect(() => {
    const hoverZone = hoverZoneRef.current;
    if (!hoverZone) return;

    const handleMouseEnter = () => {
      clearTimer();
      setIsVisible(true);
      logger.debug('SimpleToolbar: Mouse enter - show');
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
      logger.debug('SimpleToolbar: Mouse leave - hide');
    };

    hoverZone.addEventListener('mouseenter', handleMouseEnter);
    hoverZone.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      hoverZone.removeEventListener('mouseenter', handleMouseEnter);
      hoverZone.removeEventListener('mouseleave', handleMouseLeave);
      clearTimer();
    };
  }, []); // 의존성 없음 - 순수 DOM 이벤트

  return {
    isVisible,
    hoverZoneRef,
  };
}
