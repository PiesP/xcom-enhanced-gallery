/**
 * 간소화된 툴바 가시성 훅 테스트
 * @description 기본 동작 검증을 위한 단위 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock implementation
const mockUseState = vi.fn();
const mockUseRef = vi.fn();
const mockUseEffect = vi.fn();
const mockUseCallback = vi.fn();

// ComponentManager.getHookManager 모킹
vi.mock('@shared/components/ComponentManager', () => ({
  ComponentManager: {
    getHookManager: () => ({
      useState: mockUseState,
      useRef: mockUseRef,
      useEffect: mockUseEffect,
      useCallback: mockUseCallback,
    }),
  },
}));

describe('useToolbarVisibility - 기본 동작 검증', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // useState mock setup
    mockUseState.mockImplementation(initial => [initial, vi.fn()]);

    // useRef mock setup
    mockUseRef.mockImplementation(initial => ({ current: initial }));

    // useEffect mock setup - 즉시 실행
    mockUseEffect.mockImplementation(effect => {
      if (typeof effect === 'function') {
        effect();
      }
    });

    // useCallback mock setup
    mockUseCallback.mockImplementation(callback => callback);
  });

  it('훅이 정상적으로 임포트되어야 한다', async () => {
    const { useToolbarVisibility } = await import('@shared/hooks/useToolbarVisibility');
    expect(useToolbarVisibility).toBeDefined();
    expect(typeof useToolbarVisibility).toBe('function');
  });

  it('훅 호출 시 preact hooks가 사용되어야 한다', async () => {
    const { useToolbarVisibility } = await import('@shared/hooks/useToolbarVisibility');

    useToolbarVisibility();

    expect(mockUseState).toHaveBeenCalled();
    expect(mockUseRef).toHaveBeenCalled();
    expect(mockUseEffect).toHaveBeenCalled();
    expect(mockUseCallback).toHaveBeenCalled();
  });

  it('기본 옵션으로 호출 가능해야 한다', async () => {
    const { useToolbarVisibility } = await import('@shared/hooks/useToolbarVisibility');

    expect(() => {
      useToolbarVisibility();
    }).not.toThrow();
  });

  it('커스텀 옵션으로 호출 가능해야 한다', async () => {
    const { useToolbarVisibility } = await import('@shared/hooks/useToolbarVisibility');

    expect(() => {
      useToolbarVisibility({
        initialShowDuration: 2000,
        hideDelay: 500,
      });
    }).not.toThrow();
  });

  it('필요한 프로퍼티를 반환해야 한다', async () => {
    const { useToolbarVisibility } = await import('@shared/hooks/useToolbarVisibility');

    const result = useToolbarVisibility();

    expect(result).toHaveProperty('isVisible');
    expect(result).toHaveProperty('hoverZoneRef');
    expect(result).toHaveProperty('showToolbar');
    expect(result).toHaveProperty('hideToolbar');
  });
});
