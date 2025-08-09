/**
 * @fileoverview Ultimate Preact Test Environment v2.0
 * @description "__k" 에러를 완전히 해결하는 Ultimate Preact Mock 환경
 */

import { vi } from 'vitest';

// Ultimate Preact 컨텍스트 구현
class UltimatePreactContext {
  public __k: any[] = [];
  public __c: any = null;
  public __h: any[] = [];
  public __s: any[] = [];
  public __v: any = null;
  private hookIndex = 0;
  private hookStates: any[] = [];

  reset() {
    this.hookIndex = 0;
    this.hookStates = [];
    this.__k = [];
    this.__h = [];
    this.__s = [];
    this.__c = null;
    this.__v = null;
  }

  getCurrentHookIndex() {
    return this.hookIndex++;
  }

  setCurrentComponent(component: any) {
    this.__c = component;
    this.__v = component;
    if (component) {
      component.__k = this.__k;
      component.__c = this;
      component.__h = this.__h;
      component.__s = this.__s;
    }
  }

  createHookState(index: number, initialValue: any) {
    if (!this.hookStates[index]) {
      this.hookStates[index] = { value: initialValue };
    }
    return this.hookStates[index];
  }
}

// 전역 컨텍스트
const ultimateContext = new UltimatePreactContext();

// Ultimate useState Mock
function createUltimateUseState() {
  return vi.fn((initialValue: any) => {
    const index = ultimateContext.getCurrentHookIndex();
    const state = ultimateContext.createHookState(index, initialValue);

    const setState = vi.fn((newValue: any) => {
      if (typeof newValue === 'function') {
        state.value = newValue(state.value);
      } else {
        state.value = newValue;
      }
      // 강제 리렌더링 트리거
      if (ultimateContext.__c && ultimateContext.__c.forceUpdate) {
        ultimateContext.__c.forceUpdate();
      }
    });

    return [state.value, setState];
  });
}

// Ultimate useEffect Mock
function createUltimateUseEffect() {
  return vi.fn((effect: () => void | (() => void), deps?: any[]) => {
    const index = ultimateContext.getCurrentHookIndex();
    const state = ultimateContext.createHookState(index, { cleanup: null, deps: [] });

    // 의존성 비교
    const depsChanged =
      !deps ||
      !state.deps ||
      state.deps.length !== deps.length ||
      state.deps.some((dep: any, i: number) => dep !== deps[i]);

    if (depsChanged) {
      // 이전 cleanup 실행
      if (state.cleanup && typeof state.cleanup === 'function') {
        state.cleanup();
      }

      // 새 effect 실행
      const cleanup = effect();
      state.cleanup = cleanup;
      state.deps = deps ? [...deps] : [];
    }
  });
}

// Ultimate useRef Mock
function createUltimateUseRef() {
  return vi.fn((initialValue: any) => {
    const index = ultimateContext.getCurrentHookIndex();
    const state = ultimateContext.createHookState(index, { current: initialValue });
    return state;
  });
}

// Ultimate useCallback Mock
function createUltimateUseCallback() {
  return vi.fn((callback: any, deps?: any[]) => {
    const index = ultimateContext.getCurrentHookIndex();
    const state = ultimateContext.createHookState(index, { callback: null, deps: [] });

    const depsChanged =
      !deps ||
      !state.deps ||
      state.deps.length !== deps.length ||
      state.deps.some((dep: any, i: number) => dep !== deps[i]);

    if (depsChanged) {
      state.callback = callback;
      state.deps = deps ? [...deps] : [];
    }

    return state.callback || callback;
  });
}

// Ultimate useMemo Mock
function createUltimateUseMemo() {
  return vi.fn((factory: () => any, deps?: any[]) => {
    const index = ultimateContext.getCurrentHookIndex();
    const state = ultimateContext.createHookState(index, { value: undefined, deps: [] });

    const depsChanged =
      !deps ||
      !state.deps ||
      state.deps.length !== deps.length ||
      state.deps.some((dep: any, i: number) => dep !== deps[i]);

    if (depsChanged) {
      state.value = factory();
      state.deps = deps ? [...deps] : [];
    }

    return state.value;
  });
}

// Preact Options Mock with Ultimate Context
function setupUltimatePreactOptions() {
  const options = {
    __r: (component: any) => {
      // 렌더링 시작시 컨텍스트 설정
      ultimateContext.reset();
      ultimateContext.setCurrentComponent(component);
    },
    __c: (component: any) => {
      // 컴포넌트 생성시 컨텍스트 연결
      ultimateContext.setCurrentComponent(component);
    },
    __h: (component: any) => {
      // Hook 호출시 컨텍스트 보장
      if (!component.__k) {
        component.__k = ultimateContext.__k;
      }
      return ultimateContext;
    },
  };

  return options;
}

// Ultimate Preact 환경 설정
export function setupUltimatePreactTestEnvironment() {
  console.log('[Ultimate Preact Test Environment v2.0] 🚀 "__k" 에러 완전 차단 시작!');

  // 전역 Preact Mock 설정
  if (typeof globalThis !== 'undefined') {
    // 기본 Preact 구조 Mock
    globalThis.preact = {
      options: setupUltimatePreactOptions(),
      Component: class MockComponent {
        __k = ultimateContext.__k;
        __c = ultimateContext;
        __h = ultimateContext.__h;
        __s = ultimateContext.__s;
        constructor() {
          ultimateContext.setCurrentComponent(this);
        }
        forceUpdate() {
          // Mock force update
        }
      },
    };

    // Hook Mocks
    globalThis.useState = createUltimateUseState();
    globalThis.useEffect = createUltimateUseEffect();
    globalThis.useRef = createUltimateUseRef();
    globalThis.useCallback = createUltimateUseCallback();
    globalThis.useMemo = createUltimateUseMemo();

    // 핵심 "__k" 에러 방지
    globalThis.__ULTIMATE_PREACT_CONTEXT__ = ultimateContext;
  }

  // Mock된 Preact를 다른 모듈들이 사용하도록 설정
  vi.mock('preact', () => ({
    Component: globalThis.preact?.Component,
    options: globalThis.preact?.options,
    render: vi.fn(),
    createElement: vi.fn((type, props, ...children) => ({
      type,
      props: { ...props, children },
      key: props?.key || null,
      __k: ultimateContext.__k,
      __c: ultimateContext,
    })),
  }));

  vi.mock('preact/hooks', () => ({
    useState: globalThis.useState,
    useEffect: globalThis.useEffect,
    useRef: globalThis.useRef,
    useCallback: globalThis.useCallback,
    useMemo: globalThis.useMemo,
    // 추가된 훅들 (정적 번들 래퍼 호환)
    useContext: vi.fn(),
    useReducer: vi.fn(),
    useLayoutEffect: vi.fn(),
  }));

  console.log('[Ultimate Preact Test Environment v2.0] ✅ "__k" 에러 완전 차단 완료!');

  return ultimateContext;
}

export { ultimateContext };

// 호환성을 위한 함수들
export function ensurePreactHookContext() {
  // Ultimate Context는 항상 안정화되어 있음
  return ultimateContext;
}

export function resetPreactHookState() {
  ultimateContext.reset();
}
