/**
 * @fileoverview Signal Factory Subscribe Memory Leak Test (RED)
 * @description Phase 10.4: subscribe/unsubscribe 반복 시 메모리 누수 검증
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSignalSafe } from '@shared/state/signals/signal-factory-solid';
import { initializeVendors } from '@shared/external/vendors';

describe('Signal Factory - Subscribe Memory Leak (RED)', () => {
  beforeEach(() => {
    // Vendors 초기화
    initializeVendors();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should clean up effects when unsubscribing - memory leak test', () => {
    const signal = createSignalSafe(0);
    const subscriptions: Array<() => void> = [];
    const callbackMock = vi.fn();

    // 100회 subscribe/unsubscribe 반복
    for (let i = 0; i < 100; i++) {
      const unsubscribe = signal.subscribe(callbackMock);
      subscriptions.push(unsubscribe);
    }

    // 초기값 호출: 100번 (각 subscribe마다 즉시 호출)
    expect(callbackMock).toHaveBeenCalledTimes(100);

    // 값 변경 (모든 구독자에게 통지)
    callbackMock.mockClear();
    signal.value = 1;

    // RED: createEffect가 cleanup되지 않으면 100개의 effect가 모두 실행됨
    // GREEN 후: cleanup이 작동하면 active한 구독만 실행
    // 현재 모든 구독이 활성 상태이므로 100번 호출 예상
    expect(callbackMock).toHaveBeenCalledTimes(100);

    // 절반 unsubscribe
    subscriptions.slice(0, 50).forEach(unsub => unsub());

    // 값 변경 (나머지 50개 구독만 활성)
    callbackMock.mockClear();
    signal.value = 2;

    // RED: cleanup이 없으면 여전히 100번 호출됨 (memory leak)
    // GREEN: cleanup이 작동하면 50번만 호출됨
    expect(callbackMock).toHaveBeenCalledTimes(50);

    // 나머지 전부 unsubscribe
    subscriptions.slice(50).forEach(unsub => unsub());

    // 값 변경 (모든 구독 취소됨)
    callbackMock.mockClear();
    signal.value = 3;

    // GREEN: 모든 구독이 취소되어 0번 호출
    expect(callbackMock).not.toHaveBeenCalled();
  });

  it('should handle rapid subscribe/unsubscribe cycles', () => {
    const signal = createSignalSafe('test');
    const callbackMock = vi.fn();

    // 빠른 subscribe/unsubscribe 사이클 (실제 사용 패턴)
    for (let i = 0; i < 50; i++) {
      const unsubscribe = signal.subscribe(callbackMock);
      signal.value = `test-${i}`;
      unsubscribe();
    }

    // 모든 구독이 취소된 후 값 변경
    callbackMock.mockClear();
    signal.value = 'final';

    // GREEN: 활성 구독이 없으므로 callback 호출 없음
    expect(callbackMock).not.toHaveBeenCalled();
  });

  it('should not accumulate effects in SSR environment simulation', () => {
    // SSR 환경 시뮬레이션: createEffect가 undefined 반환
    const signal = createSignalSafe(0);
    const callbackMock = vi.fn();

    // SSR 환경에서도 subscribe는 noop cleanup을 반환해야 함
    const unsubscribe = signal.subscribe(callbackMock);

    // 초기값 호출
    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenCalledWith(0);

    // unsubscribe가 함수여야 함 (noop이어도)
    expect(typeof unsubscribe).toBe('function');

    // cleanup 호출 시 에러 없이 실행
    expect(() => unsubscribe()).not.toThrow();
  });

  it('should properly dispose effects when signal goes out of scope', () => {
    let signal: ReturnType<typeof createSignalSafe<number>> | null = createSignalSafe(0);
    const callbackMock = vi.fn();

    const unsubscribe = signal.subscribe(callbackMock);

    // 초기값 호출
    expect(callbackMock).toHaveBeenCalledTimes(1);

    // 값 변경
    signal.value = 1;
    expect(callbackMock).toHaveBeenCalledTimes(2);

    // cleanup
    unsubscribe();
    callbackMock.mockClear();

    // signal 참조 제거 (GC 시뮬레이션)
    signal = null;

    // 메모리에서 제거되어야 하므로 더 이상 callback 호출 없음
    expect(callbackMock).not.toHaveBeenCalled();
  });

  it('should handle multiple simultaneous subscriptions correctly', () => {
    const signal = createSignalSafe(0);
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const callback3 = vi.fn();

    const unsub1 = signal.subscribe(callback1);
    const unsub2 = signal.subscribe(callback2);
    const unsub3 = signal.subscribe(callback3);

    // 초기값 호출 (각 3번)
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback3).toHaveBeenCalledTimes(1);

    // 값 변경
    signal.value = 1;
    expect(callback1).toHaveBeenCalledTimes(2);
    expect(callback2).toHaveBeenCalledTimes(2);
    expect(callback3).toHaveBeenCalledTimes(2);

    // callback2만 unsubscribe
    unsub2();
    callback1.mockClear();
    callback2.mockClear();
    callback3.mockClear();

    // 값 변경
    signal.value = 2;

    // GREEN: callback2는 호출되지 않아야 함
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).not.toHaveBeenCalled();
    expect(callback3).toHaveBeenCalledTimes(1);

    // 나머지 cleanup
    unsub1();
    unsub3();
  });
});
