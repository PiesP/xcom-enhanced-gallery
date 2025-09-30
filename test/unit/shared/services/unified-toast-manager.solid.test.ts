import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  toastManager,
  addToast,
  removeToast,
  clearAllToasts,
} from '@shared/services/UnifiedToastManager';

const resetToasts = () => {
  toastManager.clear();
};

describe('UnifiedToastManager Solid integration', () => {
  beforeEach(() => {
    resetToasts();
  });

  it('updates the Solid accessor when showing and removing toasts', () => {
    const toastId = toastManager.show({
      title: 'Hello',
      message: 'World',
      type: 'info',
      route: 'toast-only',
    });

    expect(toastManager.signal.accessor()).toHaveLength(1);
    expect(toastManager.signal.accessor()[0]?.id).toBe(toastId);

    toastManager.remove(toastId);
    expect(toastManager.signal.accessor()).toHaveLength(0);
  });

  it('notifies subscribers about toast list changes', () => {
    const listener = vi.fn();
    const unsubscribe = toastManager.subscribe(listener);

    // subscribe() 호출 시 초기 값(빈 배열)이 즉시 전달되므로 listener가 1번 호출됨
    expect(listener).toHaveBeenCalledTimes(1);

    const toastId = toastManager.show({
      title: 'Info',
      message: 'Message',
      type: 'info',
      route: 'toast-only',
    });
    expect(listener).toHaveBeenCalledTimes(2); // show 후 +1

    toastManager.remove(toastId);
    expect(listener).toHaveBeenCalledTimes(3); // remove 후 +1

    unsubscribe();
    toastManager.show({
      title: 'Ignored',
      message: 'After unsubscribe',
      type: 'warning',
      route: 'toast-only',
    });
    expect(listener).toHaveBeenCalledTimes(3); // 구독 해제 후에는 호출되지 않음
  });

  it('delegates helper functions to the unified manager', () => {
    // addToast()는 ToastOptions를 받으므로, 기본 라우팅 정책이 적용됨
    // info 타입은 기본적으로 'live-only' → 토스트 목록에 추가되지 않음
    // 명시적으로 route: 'toast-only'를 지정해야 함
    const infoId = toastManager.show({
      title: 'Legacy Info',
      message: 'Delegated to manager',
      type: 'info',
      route: 'toast-only', // 명시적 라우팅 지정
    });

    expect(toastManager.signal.accessor()).toHaveLength(1);

    removeToast(infoId);
    expect(toastManager.signal.accessor()).toHaveLength(0);

    // success도 기본적으로 'live-only' → 명시적 라우팅 필요
    toastManager.show({
      title: 'Another',
      message: 'Toast',
      type: 'success',
      route: 'toast-only',
    });
    expect(toastManager.signal.accessor()).toHaveLength(1);
    clearAllToasts();
    expect(toastManager.signal.accessor()).toHaveLength(0);
  });
});
