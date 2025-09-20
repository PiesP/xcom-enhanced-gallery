/**
 * @file viewport-var.test.ts
 * @description useViewportConstrainedVar 훅이 컨테이너에 CSS 변수를 설정/갱신하는지 검증 (P1 RED → GREEN)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getPreact, getPreactHooks } from '@/shared/external/vendors';

// 간단한 테스트 컴포넌트: 훅을 연결하여 동작 검증
function TestComponent({ refEl }: { refEl: { current: HTMLElement | null } }) {
  const { h } = getPreact();
  const { useEffect } = getPreactHooks();
  useEffect(() => {
    // no-op: mount only
  }, []);
  return h('div', { 'data-testid': 'noop' });
}

describe('useViewportConstrainedVar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('applies --xeg-viewport-height-constrained on mount and updates on resize', async () => {
    const el = document.createElement('div');
    // 동적으로 모듈 import (훅)
    const { useViewportConstrainedVar } = await import(
      '@/features/gallery/components/vertical-gallery-view/hooks/useViewportConstrainedVar'
    );

    // 훅을 직접 호출할 수 없으므로, 간단한 래퍼로 연결
    const ref = { current: el } as { current: HTMLElement | null };
    // 훅을 invoke하기 위해 임시 컴포넌트 내부에서 실행
    const { h, render } = getPreact();
    function Wrapper() {
      useViewportConstrainedVar(ref, { debounceMs: 10 });
      return h(TestComponent as any, { refEl: ref });
    }

    const host = document.createElement('div');
    render(h(Wrapper as any, {}), host);

    // mount 직후 값이 설정되어야 한다
    const initial = el.style.getPropertyValue('--xeg-viewport-height-constrained');
    expect(initial).toMatch(/px$/);

    // resize 시 갱신
    const prev = initial;
    (window as any).innerHeight = 777;
    window.dispatchEvent(new Event('resize'));
    vi.advanceTimersByTime(20);

    const after = el.style.getPropertyValue('--xeg-viewport-height-constrained');
    expect(after).toBe('777px');
    expect(after).not.toBe(prev);
  });
});
