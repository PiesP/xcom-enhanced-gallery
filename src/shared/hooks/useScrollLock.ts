/**
 * @fileoverview useScrollLock Hook (TDD Phase T4)
 * @description Modal이 열렸을 때 배경 스크롤을 막는 훅
 */

import { useEffect } from 'preact/hooks';

export interface ScrollLockOptions {
  enabled: boolean;
  reserveScrollBarGap?: boolean;
}

export function useScrollLock(options: ScrollLockOptions) {
  useEffect(() => {
    if (!options.enabled) return;

    // 현재 스크롤 위치 저장
    const originalStyle = window.getComputedStyle(document.body);
    const originalOverflow = originalStyle.overflow;
    const originalPaddingRight = originalStyle.paddingRight;

    // 스크롤바 너비 계산 (스크롤바 간격 예약이 필요한 경우)
    let scrollBarWidth = 0;
    if (options.reserveScrollBarGap) {
      const scrollDiv = document.createElement('div');
      scrollDiv.style.cssText =
        'width: 100px; height: 100px; overflow: scroll; position: absolute; top: -9999px;';
      document.body.appendChild(scrollDiv);
      scrollBarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
      document.body.removeChild(scrollDiv);
    }

    // 스크롤 잠금 적용
    document.body.style.overflow = 'hidden';
    if (options.reserveScrollBarGap && scrollBarWidth > 0) {
      const currentPaddingRight = parseInt(originalPaddingRight) || 0;
      document.body.style.paddingRight = `${currentPaddingRight + scrollBarWidth}px`;
    }

    // Cleanup: 원래 스타일 복원
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [options.enabled, options.reserveScrollBarGap]);

  return {
    // 필요시 추가 유틸리티 함수들
    lock: () => {
      // 수동으로 스크롤 잠금 (이미 effect에서 처리됨)
    },
    unlock: () => {
      // 수동으로 스크롤 잠금 해제 (cleanup에서 처리됨)
    },
  };
}
