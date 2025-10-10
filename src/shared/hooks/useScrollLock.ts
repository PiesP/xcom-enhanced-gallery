/**
 * @fileoverview useScrollLock Hook (TDD Phase T4)
 * @description Modal이 열렸을 때 배경 스크롤을 막는 훅
 */

import { getSolid } from '../external/vendors';

export interface ScrollLockOptions {
  enabled: boolean;
  reserveScrollBarGap?: boolean;
}

type Accessor<T> = () => T;
type MaybeAccessor<T> = T | Accessor<T>;

const toAccessor = <T>(value: MaybeAccessor<T>): Accessor<T> =>
  typeof value === 'function' ? (value as Accessor<T>) : () => value;

export function useScrollLock(options: MaybeAccessor<ScrollLockOptions>) {
  const { createEffect, onCleanup } = getSolid();
  const resolveOptions = toAccessor(options);

  createEffect(() => {
    const { enabled, reserveScrollBarGap } = resolveOptions();
    if (!enabled) return;

    const originalStyle = window.getComputedStyle(document.body);
    const originalOverflow = originalStyle.overflow;
    const originalPaddingRight = originalStyle.paddingRight;

    let scrollBarWidth = 0;
    if (reserveScrollBarGap) {
      const scrollDiv = document.createElement('div');
      scrollDiv.style.cssText =
        'width: 100px; height: 100px; overflow: scroll; position: absolute; top: -9999px;';
      document.body.appendChild(scrollDiv);
      scrollBarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
      document.body.removeChild(scrollDiv);
    }

    document.body.style.overflow = 'hidden';
    if (reserveScrollBarGap && scrollBarWidth > 0) {
      const currentPaddingRight = parseInt(originalPaddingRight) || 0;
      document.body.style.paddingRight = `${currentPaddingRight + scrollBarWidth}px`;
    }

    onCleanup(() => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    });
  });

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
