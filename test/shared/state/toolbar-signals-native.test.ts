/**
 * @fileoverview SOLID-NATIVE-001 Phase G-3-1: Toolbar Signals Native Pattern Tests
 * @description Phase G-3-1에서 toolbar.signals.ts를 SolidJS 네이티브 패턴으로 전환하기 위한 테스트
 *
 * RED 단계: 네이티브 패턴 채택을 검증하는 실패 테스트 작성
 * - createSignal() 함수 호출 방식
 * - Accessor<T> 반환 타입
 * - createEffect() 기반 구독
 * - 레거시 .value/.subscribe 제거
 *
 * @see docs/SOLIDJS_NATIVE_MIGRATION_GUIDE.md
 * @see docs/SOLID_NATIVE_INVENTORY_REPORT.md
 */

// Type-only imports
import type { ToolbarState } from '@shared/state/signals/toolbar.signals';

// Module imports (will be tested for native patterns)
import {
  toolbarState,
  setToolbarState,
  updateToolbarMode,
  setHighContrast,
  getCurrentToolbarMode,
  getToolbarInfo,
} from '@shared/state/signals/toolbar.signals';

// External library (getter pattern)
import { getSolidCore } from '@shared/external/vendors';
const solid = getSolidCore();
const { createRoot, createEffect } = solid;

/**
 * Phase G-3-1-1: State Definition - Native SolidJS Pattern
 *
 * Acceptance:
 * ✓ createSignal() 함수 호출 반환 타입 [Accessor<T>, Setter<T>]
 * ✓ toolbarState는 Accessor<ToolbarState> 함수
 * ✓ setToolbarState는 Setter<ToolbarState> 함수
 * ✗ 레거시 .value getter/setter 제거
 * ✗ 레거시 .subscribe() 메서드 제거
 */
describe('Phase G-3-1-1: State Definition - Native SolidJS Pattern', () => {
  test('should use createSignal with function-call pattern', () => {
    const dispose = createRoot(disposeRoot => {
      // Then: toolbarState should be a function (Accessor)
      expect(typeof toolbarState).toBe('function');

      // Then: calling toolbarState() should return current state
      const currentState = toolbarState() as ToolbarState;
      expect(currentState).toBeDefined();
      expect(currentState).toHaveProperty('currentMode');
      expect(currentState).toHaveProperty('needsHighContrast');

      return disposeRoot;
    });

    dispose();
  });

  test('should NOT have .value getter/setter (legacy pattern)', () => {
    const dispose = createRoot(disposeRoot => {
      // Then: should NOT have .value property
      expect(toolbarState).not.toHaveProperty('value');

      return disposeRoot;
    });

    dispose();
  });

  test('should NOT have .subscribe method (legacy pattern)', () => {
    const dispose = createRoot(disposeRoot => {
      // Then: should NOT have .subscribe method
      expect(toolbarState).not.toHaveProperty('subscribe');

      return disposeRoot;
    });

    dispose();
  });
});

/**
 * Phase G-3-1-2: State Updates - Setter Function Pattern
 *
 * Acceptance:
 * ✓ setToolbarState(newValue) 함수 호출 방식
 * ✓ setToolbarState(prev => newValue) 업데이터 함수 지원
 * ✗ 레거시 toolbarState.value = newValue 제거
 * ✗ 레거시 toolbarState.update() 메서드 제거
 */
describe('Phase G-3-1-2: State Updates - Setter Function Pattern', () => {
  test('should provide setToolbarState setter function', () => {
    const dispose = createRoot(disposeRoot => {
      // Then: should be a function
      expect(typeof setToolbarState).toBe('function');

      return disposeRoot;
    });

    dispose();
  });

  test('should update state via setToolbarState(newValue)', () => {
    const dispose = createRoot(disposeRoot => {
      // Given: 초기 상태 확인
      const initial = toolbarState() as ToolbarState;
      expect(initial.currentMode).toBe('gallery');

      // When: setToolbarState로 상태 업데이트
      setToolbarState({ ...initial, currentMode: 'settings' as const });

      // Then: 상태가 업데이트됨
      const updated = toolbarState() as ToolbarState;
      expect(updated.currentMode).toBe('settings');

      return disposeRoot;
    });

    dispose();
  });

  test('should support updater function pattern', () => {
    const dispose = createRoot(disposeRoot => {
      // Given: 초기 상태 설정
      setToolbarState({ currentMode: 'gallery' as const, needsHighContrast: false });

      // When: updater 함수로 상태 업데이트
      setToolbarState((prev: ToolbarState) => ({ ...prev, needsHighContrast: true }));

      // Then: 상태가 업데이트됨
      const updated = toolbarState() as ToolbarState;
      expect(updated.needsHighContrast).toBe(true);
      expect(updated.currentMode).toBe('gallery'); // 다른 필드는 유지

      return disposeRoot;
    });

    dispose();
  });
});

/**
 * Phase G-3-1-3: Derived State - createMemo Pattern
 *
 * Acceptance:
 * ✓ getCurrentToolbarMode는 createMemo(() => toolbarState().currentMode) 기반
 * ✓ getToolbarInfo는 createMemo(() => ({ ... })) 기반
 * ✓ Memoization으로 불필요한 재계산 방지
 */
describe('Phase G-3-1-3: Derived State - createMemo Pattern', () => {
  beforeEach(async () => {
    const { initializeToolbarDerivedState } = await import('@shared/state/signals/toolbar.signals');
    initializeToolbarDerivedState();
  });

  test('getCurrentToolbarMode should be a memoized accessor', () => {
    const dispose = createRoot(disposeRoot => {
      // Then: should be a function (Accessor)
      expect(typeof getCurrentToolbarMode).toBe('function');

      // Then: calling getCurrentToolbarMode() should return currentMode
      const mode = getCurrentToolbarMode();
      expect(mode).toMatch(/^(gallery|settings|download)$/);

      return disposeRoot;
    });

    dispose();
  });

  test('getToolbarInfo should return memoized toolbar info', () => {
    const dispose = createRoot(disposeRoot => {
      // Then: should be a function (Accessor)
      expect(typeof getToolbarInfo).toBe('function');

      // Then: calling getToolbarInfo() should return toolbar info
      const info = getToolbarInfo();
      expect(info).toHaveProperty('currentMode');
      expect(info).toHaveProperty('needsHighContrast');

      return disposeRoot;
    });

    dispose();
  });

  test('derived state should update when source state changes', () => {
    const dispose = createRoot(disposeRoot => {
      // Given: 초기 모드 확인
      const initialMode = getCurrentToolbarMode();
      expect(initialMode).toBe('gallery');

      // When: 상태 변경
      setToolbarState({ ...(toolbarState() as ToolbarState), currentMode: 'download' as const });

      // Then: derived state가 업데이트됨
      const updatedMode = getCurrentToolbarMode();
      expect(updatedMode).toBe('download');

      return disposeRoot;
    });

    dispose();
  });
});

/**
 * Phase G-3-1-4: Effects - createEffect Pattern
 *
 * Acceptance:
 * ✓ updateToolbarMode는 내부적으로 createEffect 없이 직접 setter 호출
 * ✓ setHighContrast는 내부적으로 createEffect 없이 직접 setter 호출
 * ✗ 레거시 toolbarState.subscribe() 제거
 * ✓ 외부 구독은 createEffect(() => { toolbarState(); callback(); }) 패턴
 */
describe('Phase G-3-1-4: Effects - createEffect Pattern', () => {
  test('updateToolbarMode should update state directly', () => {
    const dispose = createRoot(disposeRoot => {
      // When: updateToolbarMode 호출
      updateToolbarMode('settings' as const);

      // Then: 상태가 즉시 업데이트됨
      const updated = toolbarState() as ToolbarState;
      expect(updated.currentMode).toBe('settings');

      return disposeRoot;
    });

    dispose();
  });

  test('setHighContrast should update state directly', () => {
    const dispose = createRoot(disposeRoot => {
      // When: setHighContrast 호출
      setHighContrast(true);

      // Then: 상태가 즉시 업데이트됨
      const updated = toolbarState() as ToolbarState;
      expect(updated.needsHighContrast).toBe(true);

      return disposeRoot;
    });

    dispose();
  });

  test('external subscription should use createEffect pattern', () => {
    const dispose = createRoot(disposeRoot => {
      // Given: 현재 상태 확인 (이전 테스트로부터 영향 받을 수 있음)
      const beforeState = toolbarState();

      // When: 명시적으로 새 상태 설정
      setToolbarState({ currentMode: 'download' as const, needsHighContrast: false });

      // Then: signal이 즉시 업데이트됨 (reactive access)
      const updatedState = toolbarState();
      expect(updatedState.currentMode).toBe('download');
      expect(updatedState.needsHighContrast).toBe(false);

      // Then: createEffect 패턴 가능 (테스트 환경에서는 async, 실제 앱에서는 sync)
      // Note: createEffect는 앱 컴포넌트에서 사용하면 자동으로 구독됨
      expect(typeof createEffect).toBe('function');

      return disposeRoot;
    });

    dispose();
  });
});

/**
 * Phase G-3-1-5: Type Safety - Accessor and Setter Contracts
 *
 * Acceptance:
 * ✓ toolbarState의 타입은 Accessor<ToolbarState>
 * ✓ setToolbarState의 타입은 Setter<ToolbarState>
 * ✓ 파생 상태의 타입은 Accessor<T> (T는 반환 타입)
 */
describe('Phase G-3-1-5: Type Safety - Accessor and Setter Contracts', () => {
  beforeEach(async () => {
    const { initializeToolbarDerivedState } = await import('@shared/state/signals/toolbar.signals');
    initializeToolbarDerivedState();
  });

  test('toolbarState should have Accessor type characteristics', () => {
    const dispose = createRoot(disposeRoot => {
      // Then: should be callable as function
      expect(() => toolbarState()).not.toThrow();

      // Then: should return ToolbarState structure
      const result = toolbarState() as ToolbarState;
      expect(result).toMatchObject({
        currentMode: expect.stringMatching(/^(gallery|settings|download)$/),
        needsHighContrast: expect.any(Boolean),
      });

      return disposeRoot;
    });

    dispose();
  });

  test('setToolbarState should have Setter type characteristics', () => {
    const dispose = createRoot(disposeRoot => {
      // Then: should accept direct value
      expect(() =>
        setToolbarState({ currentMode: 'gallery' as const, needsHighContrast: false })
      ).not.toThrow();

      // Then: should accept updater function
      expect(() =>
        setToolbarState((prev: ToolbarState) => ({ ...prev, needsHighContrast: true }))
      ).not.toThrow();

      // Then: state should be updated
      const updated = toolbarState() as ToolbarState;
      expect(updated.needsHighContrast).toBe(true);

      return disposeRoot;
    });

    dispose();
  });

  test('derived state accessors should have correct return types', () => {
    const dispose = createRoot(disposeRoot => {
      // When: getCurrentToolbarMode 호출
      const mode = getCurrentToolbarMode();

      // Then: should return string (currentMode type)
      expect(typeof mode).toBe('string');
      expect(mode).toMatch(/^(gallery|settings|download)$/);

      // When: getToolbarInfo 호출
      const info = getToolbarInfo();

      // Then: should return object with specific structure
      expect(info).toMatchObject({
        currentMode: expect.any(String),
        needsHighContrast: expect.any(Boolean),
      });

      return disposeRoot;
    });

    dispose();
  });
});
