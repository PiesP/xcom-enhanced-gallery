/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview DOM Ready Detection Hook
 * @description DOM 렌더링 완료를 감지하는 커스텀 훅
 */

import { ComponentManager } from '@shared/components/component-manager';
import { logger } from '@shared/logging/logger';

/**
 * DOM 렌더링 완료를 감지하는 훅
 *
 * @description
 * 컴포넌트의 DOM 렌더링이 완전히 완료된 후 true를 반환합니다.
 * requestAnimationFrame을 이중으로 사용하여 브라우저의 레이아웃과 페인트가
 * 모두 완료된 후에 DOM이 준비되었다고 판단합니다.
 *
 * @param dependencies 의존성 배열 (변경 시 다시 체크)
 * @returns DOM 준비 상태
 *
 * @example
 * ```typescript
 * const isDOMReady = useDOMReady([mediaItems.length]);
 *
 * useEffect(() => {
 *   if (isDOMReady) {
 *     // DOM이 완전히 렌더링된 후 실행
 *     scrollToInitialItem();
 *   }
 * }, [isDOMReady]);
 * ```
 */
export function useDOMReady(dependencies: unknown[] = []): boolean {
  const { useEffect, useState, useRef } = ComponentManager.getHookManager();
  const [isReady, setIsReady] = useState(false);
  const frameRef = useRef<number>();

  useEffect(() => {
    setIsReady(false);

    // 기존 애니메이션 프레임 취소
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }

    logger.debug('useDOMReady: DOM 준비 상태 체크 시작');

    // 이중 requestAnimationFrame으로 확실한 렌더링 완료 보장
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = requestAnimationFrame(() => {
        logger.debug('useDOMReady: DOM 렌더링 완료 감지');
        setIsReady(true);
      });
    });

    // 클린업 함수
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, dependencies);

  return isReady;
}
