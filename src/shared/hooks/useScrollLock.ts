/**
 * Copyright (c) 2024 X.com Enhanced Gallery - MIT License
 *
 * @fileoverview 스크롤 잠금 전용 커스텀 훅
 * @description 트위터 스크롤 컨테이너를 타겟으로 한 안전한 스크롤 잠금/해제
 * @version 1.0.0 - TDD 기반 스크롤 격리 개선
 */

import { getPreactHooks } from '@shared/external/vendors';
import { findTwitterScrollContainer } from '@shared/utils/core-utils';
import { logger } from '@shared/logging/logger';

const { useCallback, useRef } = getPreactHooks();

interface UseScrollLockReturn {
  lockScroll: () => void;
  unlockScroll: () => void;
  isLocked: () => boolean;
}

interface OriginalScrollState {
  overflow: string;
  overscrollBehavior: string;
}

/**
 * 스크롤 잠금 전용 커스텀 훅
 *
 * @description
 * - 트위터 스크롤 컨테이너만 타겟으로 잠금
 * - document.body 대신 특정 컨테이너 사용으로 갤러리 내부 스크롤 보호
 * - 안전한 상태 관리 및 복원
 *
 * @returns 스크롤 잠금 제어 함수들
 */
export function useScrollLock(): UseScrollLockReturn {
  const originalStateRef = useRef<OriginalScrollState | null>(null);
  const targetRef = useRef<HTMLElement | null>(null);

  const lockScroll = useCallback(() => {
    const twitterContainer = findTwitterScrollContainer();

    // 이미 잠겨있거나 컨테이너를 찾을 수 없으면 건너뜀
    if (!twitterContainer || originalStateRef.current) {
      return;
    }

    // 원본 상태 저장
    originalStateRef.current = {
      overflow: twitterContainer.style.overflow || '',
      overscrollBehavior: twitterContainer.style.overscrollBehavior || '',
    };

    // 트위터 컨테이너만 잠금 (갤러리는 별도 fixed 컨테이너이므로 영향 없음)
    twitterContainer.style.overflow = 'hidden';
    twitterContainer.style.overscrollBehavior = 'contain';
    targetRef.current = twitterContainer;

    logger.debug('🔒 Twitter container scroll locked (targeted approach)');
  }, []);

  const unlockScroll = useCallback(() => {
    const target = targetRef.current;
    const originalState = originalStateRef.current;

    if (!target || !originalState) {
      logger.debug('🔓 Scroll unlock skipped - no target or state');
      return;
    }

    try {
      // 원본 상태 복원
      target.style.overflow = originalState.overflow;
      target.style.overscrollBehavior = originalState.overscrollBehavior;

      // 상태 초기화
      originalStateRef.current = null;
      targetRef.current = null;

      logger.debug('🔓 Twitter container scroll unlocked (targeted approach)');
    } catch (error) {
      logger.warn('Failed to unlock scroll:', error);

      // 실패한 경우에도 상태 초기화
      originalStateRef.current = null;
      targetRef.current = null;
    }
  }, []);

  const isLocked = useCallback(() => {
    return originalStateRef.current !== null;
  }, []);

  return { lockScroll, unlockScroll, isLocked };
}
