/**
 * @fileoverview Scroll Direction Detection Hook
 * @version 1.0.0
 *
 * 스크롤 방향을 감지하여 툴바 표시/숨김을 제어하는 커스텀 훅
 */

import { ComponentManager } from '@shared/components/component-manager';
import { logger } from '@shared/logging';

/**
 * 스크롤 방향 타입
 */
export type ScrollDirection = 'up' | 'down' | 'idle';

/**
 * 스크롤 방향 감지 옵션
 */
export interface UseScrollDirectionOptions {
  /** 스크롤 감지 임계값 (픽셀) */
  threshold?: number;
  /** 이벤트 throttle 간격 (밀리초) */
  throttleMs?: number;
  /** 최상단에서의 동작 무시 여부 */
  ignoreAtTop?: boolean;
  /** 활성화 여부 */
  enabled?: boolean;
}

/**
 * 스크롤 방향 감지 반환 타입
 */
export interface UseScrollDirectionReturn {
  /** 현재 스크롤 방향 */
  scrollDirection: ScrollDirection;
  /** 현재 스크롤 Y 위치 */
  scrollY: number;
  /** 최상단 여부 */
  isAtTop: boolean;
  /** 스크롤 중 여부 */
  isScrolling: boolean;
}

/**
 * 스크롤 방향을 감지하는 커스텀 훅
 *
 * @param options - 스크롤 감지 옵션
 * @returns 스크롤 상태 정보
 */
export function useScrollDirection({
  threshold = 5,
  throttleMs = 16, // ~60fps
  ignoreAtTop = true,
  enabled = true,
}: UseScrollDirectionOptions = {}): UseScrollDirectionReturn {
  const { useState, useEffect, useRef, useCallback } = ComponentManager.getHookManager();

  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>('idle');
  const [scrollY, setScrollY] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);

  const lastScrollY = useRef(0);
  const scrollTimeoutRef = useRef<number | null>(null);
  const lastThrottleTime = useRef(0);

  // 스크롤 상태 업데이트
  const updateScrollState = useCallback(
    (currentScrollY: number) => {
      const now = Date.now();

      // Throttle 적용
      if (now - lastThrottleTime.current < throttleMs) {
        return;
      }
      lastThrottleTime.current = now;

      const deltaY = currentScrollY - lastScrollY.current;
      const atTop = currentScrollY <= threshold;

      setScrollY(currentScrollY);
      setIsAtTop(atTop);
      setIsScrolling(true);

      // 스크롤 방향 결정
      if (Math.abs(deltaY) > threshold) {
        if (ignoreAtTop && atTop) {
          setScrollDirection('idle');
        } else {
          setScrollDirection(deltaY > 0 ? 'down' : 'up');
        }
        lastScrollY.current = currentScrollY;
      }

      // 스크롤 완료 감지를 위한 타이머
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = window.setTimeout(() => {
        setIsScrolling(false);
        setScrollDirection('idle');
      }, 150);

      logger.debug('Scroll direction updated', {
        direction: deltaY > 0 ? 'down' : 'up',
        scrollY: currentScrollY,
        deltaY,
        atTop,
      });
    },
    [threshold, throttleMs, ignoreAtTop]
  );

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback(() => {
    if (!enabled) return;

    const currentScrollY = window.scrollY || document.documentElement.scrollTop;
    updateScrollState(currentScrollY);
  }, [enabled, updateScrollState]);

  // 초기 설정 및 이벤트 리스너 등록
  useEffect(() => {
    if (!enabled) return;

    // 초기 스크롤 위치 설정
    const initialScrollY = window.scrollY || document.documentElement.scrollTop;
    lastScrollY.current = initialScrollY;
    setScrollY(initialScrollY);
    setIsAtTop(initialScrollY <= threshold);

    // 이벤트 리스너 등록
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [enabled, handleScroll, threshold]);

  return {
    scrollDirection,
    scrollY,
    isAtTop,
    isScrolling,
  };
}
