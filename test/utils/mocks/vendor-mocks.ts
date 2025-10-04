/**
 * Vendor 라이브러리 모킹 유틸리티 (SolidJS 전용)
 * Phase D: Preact 레거시 모킹 제거 완료
 * 프로젝트의 vendors getter 패턴에 맞는 테스트 Mock
 */

import * as solid from 'solid-js';
import * as solidStore from 'solid-js/store';
import * as solidWeb from 'solid-js/web';
import { vi } from 'vitest';

// ================================
// SolidJS Mock Vendor Implementations
// ================================

/**
 * SolidJS Core API Mock
 * 실제 solid-js 모듈을 래핑하여 테스트 환경에서 사용
 */
export function createMockSolidCore() {
  return {
    // Reactive primitives
    createSignal: solid.createSignal,
    createEffect: solid.createEffect,
    createMemo: solid.createMemo,
    createRoot: solid.createRoot,
    createComputed: solid.createComputed,

    // Component utilities
    createComponent: solid.createComponent,
    mergeProps: solid.mergeProps,
    splitProps: solid.splitProps,

    // Lifecycle
    onCleanup: solid.onCleanup,

    // Batching and control
    batch: solid.batch,
    untrack: solid.untrack,

    // Context
    createContext: solid.createContext,
    useContext: solid.useContext,
  };
}

/**
 * SolidJS Store API Mock
 * Store 관리 API 제공
 */
export function createMockSolidStore() {
  return {
    createStore: solidStore.createStore,
    produce: solidStore.produce,
    reconcile: solidStore.reconcile,
    unwrap: solidStore.unwrap,
  };
}

/**
 * SolidJS Web API Mock
 * DOM 렌더링 API 제공
 */
export function createMockSolidWeb() {
  return {
    render: solidWeb.render,
  };
}

/**
 * Mock Motion API 생성
 */
export function createMockMotion() {
  return {
    animate: vi.fn().mockImplementation(async (element, keyframes) => {
      // 즉시 완료되는 애니메이션 시뮬레이션
      if (element && typeof element === 'object' && 'style' in element) {
        Object.assign(element.style, keyframes);
      }
      return Promise.resolve();
    }),

    scroll: vi.fn().mockImplementation(onScroll => {
      // 스크롤 이벤트 시뮬레이션
      onScroll({ scrollY: 0, scrollX: 0 });
      return vi.fn(); // cleanup function
    }),

    timeline: vi.fn().mockImplementation(async () => {
      // 타임라인 애니메이션 즉시 완료
      return Promise.resolve();
    }),

    stagger: vi.fn().mockImplementation((duration = 0.1) => {
      return vi.fn().mockImplementation(index => index * duration);
    }),
  };
}

// ================================
// Vendor Manager Mock (SolidJS Only)
// ================================

/**
 * Vendor Manager Mock 클래스
 * Phase D: SolidJS 전용으로 정리됨
 */
export class MockVendorManager {
  static instance: MockVendorManager | null = null;
  cache = new Map<string, unknown>();

  static getInstance(): MockVendorManager {
    MockVendorManager.instance ??= new MockVendorManager();
    return MockVendorManager.instance;
  }

  static resetInstance(): void {
    MockVendorManager.instance = null;
  }

  getMotion() {
    if (!this.cache.has('motion')) {
      this.cache.set('motion', createMockMotion());
    }
    return this.cache.get('motion');
  }

  getSolidCore() {
    if (!this.cache.has('solid-core')) {
      this.cache.set('solid-core', createMockSolidCore());
    }
    return this.cache.get('solid-core');
  }

  getSolidStore() {
    if (!this.cache.has('solid-store')) {
      this.cache.set('solid-store', createMockSolidStore());
    }
    return this.cache.get('solid-store');
  }

  getSolidWeb() {
    if (!this.cache.has('solid-web')) {
      this.cache.set('solid-web', createMockSolidWeb());
    }
    return this.cache.get('solid-web');
  }

  // 테스트 헬퍼 메서드
  clearCache(): void {
    this.cache.clear();
  }
}

// ================================
// Vendor Mock Setup Functions
// ================================

/**
 * 전역 vendor getter Mock 설정 (SolidJS 전용)
 */
export function setupVendorMocks() {
  const mockManager = MockVendorManager.getInstance();

  // @shared/external/vendors 모듈 Mock
  vi.doMock('@shared/external/vendors', () => ({
    __esModule: true,
    getMotion: () => mockManager.getMotion(),
    getSolidCore: () => mockManager.getSolidCore(),
    getSolidStore: () => mockManager.getSolidStore(),
    getSolidWeb: () => mockManager.getSolidWeb(),
  }));

  return mockManager;
}

/**
 * Vendor Mock 정리
 */
export function cleanupVendorMocks(): void {
  MockVendorManager.resetInstance();
  vi.clearAllMocks();
}
