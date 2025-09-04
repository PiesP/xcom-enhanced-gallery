/**
 * @fileoverview ScrollCoordinator 전환 시 window scroll listener 카운트 테스트 (SR-5)
 * 목적: Coordinator 활성화 시 직접 window scroll 리스너가 증가하지 않음을 보증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupVendorMocks, cleanupVendorMocks } from '../../utils/mocks/vendor-mocks-clean';

describe('ScrollCoordinator Window Listener Count', () => {
  let originalAddEventListener: typeof globalThis.window.addEventListener | undefined;
  let originalRemoveEventListener: typeof globalThis.window.removeEventListener | undefined;
  let scrollListenerCount = 0;
  let mockAddEventListener: any;
  let mockRemoveEventListener: any;

  beforeEach(async () => {
    setupVendorMocks();
    scrollListenerCount = 0;

    // window 객체가 없으면 생성
    if (typeof globalThis.window === 'undefined') {
      (globalThis as any).window = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        scrollX: 0,
        scrollY: 0,
        innerHeight: 600,
        dispatchEvent: vi.fn(),
      };
    }

    // scroll 리스너 카운팅을 위한 spy 설정
    originalAddEventListener = globalThis.window?.addEventListener;
    originalRemoveEventListener = globalThis.window?.removeEventListener;

    mockAddEventListener = vi.fn((type: string, listener: any, options?: any) => {
      if (type === 'scroll') {
        scrollListenerCount++;
      }
      return originalAddEventListener?.call(globalThis.window, type, listener, options);
    });

    mockRemoveEventListener = vi.fn((type: string, listener: any, options?: any) => {
      if (type === 'scroll') {
        scrollListenerCount = Math.max(0, scrollListenerCount - 1);
      }
      return originalRemoveEventListener?.call(globalThis.window, type, listener, options);
    });

    globalThis.window.addEventListener = mockAddEventListener;
    globalThis.window.removeEventListener = mockRemoveEventListener;

    // document 모킹
    if (typeof globalThis.document === 'undefined') {
      (globalThis as any).document = {
        documentElement: {
          scrollHeight: 1000,
        },
      };
    }
  });

  afterEach(() => {
    cleanupVendorMocks();

    if (originalAddEventListener && globalThis.window) {
      globalThis.window.addEventListener = originalAddEventListener;
    }
    if (originalRemoveEventListener && globalThis.window) {
      globalThis.window.removeEventListener = originalRemoveEventListener;
    }
  });

  it('FEATURE_SCROLL_REFACTORED=false 시 레거시 방식으로 scroll 리스너 추가됨', async () => {
    // ScrollCoordinator 비활성화 상태로 강제 설정
    const constants = await import('@/constants');
    const originalFlag = constants.FEATURE_SCROLL_REFACTORED;

    // 강제 오버라이드
    (globalThis as any).__XEG_FORCE_FLAGS__ = {
      FEATURE_SCROLL_REFACTORED: false,
    };

    const initialCount = scrollListenerCount;

    // Toolbar 컴포넌트 스크롤 감지 사용 시뮬레이션
    const { throttleScroll } = await import('@shared/utils');
    const throttledCallback = throttleScroll(() => {});

    if (typeof globalThis.window !== 'undefined') {
      globalThis.window.addEventListener('scroll', throttledCallback, { passive: true });
    }

    expect(scrollListenerCount).toBe(initialCount + 1);

    // 정리
    if (typeof globalThis.window !== 'undefined') {
      globalThis.window.removeEventListener('scroll', throttledCallback);
    }
    expect(scrollListenerCount).toBe(initialCount);

    // 플래그 복원
    (globalThis as any).__XEG_FORCE_FLAGS__ = {
      FEATURE_SCROLL_REFACTORED: originalFlag,
    };
  });

  it('FEATURE_SCROLL_REFACTORED=true 시 ScrollCoordinator 단일 리스너만 사용', async () => {
    // ScrollCoordinator 활성화 상태로 강제 설정
    (globalThis as any).__XEG_FORCE_FLAGS__ = {
      FEATURE_SCROLL_REFACTORED: true,
    };

    const initialCount = scrollListenerCount;

    // ScrollCoordinator 초기화
    const { getScrollCoordinator } = await import('@shared/scroll');
    const coord = getScrollCoordinator();

    // attach 호출 시 하나의 scroll 리스너만 추가되어야 함
    coord.attach();
    expect(scrollListenerCount).toBe(initialCount + 1);

    // 동일한 coordinator를 여러 번 attach 해도 리스너는 하나만 유지
    coord.attach();
    expect(scrollListenerCount).toBe(initialCount + 1);

    // detach 시 리스너 제거
    coord.detach();
    expect(scrollListenerCount).toBe(initialCount);

    // 플래그 복원
    delete (globalThis as any).__XEG_FORCE_FLAGS__;
  });

  it('Toolbar 컴포넌트가 ScrollCoordinator 경로 사용 시 추가 scroll 리스너 없음', async () => {
    // ScrollCoordinator 활성화
    (globalThis as any).__XEG_FORCE_FLAGS__ = {
      FEATURE_SCROLL_REFACTORED: true,
    };

    const initialCount = scrollListenerCount;

    // Toolbar 배경 밝기 감지 시뮬레이션 (ScrollCoordinator 경로)
    const { getScrollCoordinator } = await import('@shared/scroll');
    const coord = getScrollCoordinator();
    coord.attach();

    // Coordinator 자체는 1개 리스너 추가
    expect(scrollListenerCount).toBe(initialCount + 1);

    // Toolbar에서 coord.subscribe() 사용 시 추가 리스너 없어야 함
    const unsubscribe = coord.subscribe(() => {
      // background brightness detection logic would go here
    });

    // subscribe는 추가 scroll 리스너를 만들지 않음
    expect(scrollListenerCount).toBe(initialCount + 1);

    // 정리
    unsubscribe();
    coord.detach();
    expect(scrollListenerCount).toBe(initialCount);

    delete (globalThis as any).__XEG_FORCE_FLAGS__;
  });

  it('여러 컴포넌트가 ScrollCoordinator 사용해도 window 리스너는 1개 유지', async () => {
    (globalThis as any).__XEG_FORCE_FLAGS__ = {
      FEATURE_SCROLL_REFACTORED: true,
    };

    const initialCount = scrollListenerCount;
    const { getScrollCoordinator } = await import('@shared/scroll');

    // 첫 번째 컴포넌트가 coordinator 사용
    const coord1 = getScrollCoordinator();
    coord1.attach();
    expect(scrollListenerCount).toBe(initialCount + 1);

    // 두 번째 컴포넌트가 동일한 singleton coordinator 사용
    const coord2 = getScrollCoordinator();
    expect(coord1).toBe(coord2); // singleton 확인
    coord2.attach(); // 이미 attached이므로 추가 리스너 없음
    expect(scrollListenerCount).toBe(initialCount + 1);

    // 여러 구독자가 있어도 리스너는 1개
    const unsub1 = coord1.subscribe(() => {});
    const unsub2 = coord2.subscribe(() => {});
    expect(scrollListenerCount).toBe(initialCount + 1);

    // 정리
    unsub1();
    unsub2();
    coord1.detach();
    expect(scrollListenerCount).toBe(initialCount);

    delete (globalThis as any).__XEG_FORCE_FLAGS__;
  });
});
