import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getPreact, getPreactHooks } from '@shared/external/vendors';
import { useBodyScrollLock } from '@shared/hooks/useBodyScrollLock';

// 간단 렌더 헬퍼 (Preact without testing-library)
function renderHook<T>(hook: () => T): { result: { current: T } } {
  const { render, h } = getPreact();
  const { useRef } = getPreactHooks();
  const container = document.createElement('div');
  document.body.appendChild(container);
  const result: { current: T | null } = { current: null };
  function Test() {
    const initialized = useRef(false);
    if (!initialized.current) {
      result.current = hook();
      initialized.current = true;
    }
    return null;
  }
  render(h(Test, {}), container);
  return {
    result: {
      get current() {
        return result.current as T;
      },
    },
  };
}

describe('useBodyScrollLock', () => {
  const initial = () => ({
    body: {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
    },
    html: { overflow: document.documentElement.style.overflow },
    scrollY: window.scrollY,
  });

  let snapshot: ReturnType<typeof initial>;

  beforeEach(() => {
    snapshot = initial();
    // jsdom scrollTo 미구현 방어 mock
    // @ts-expect-error - jsdom 환경 확장
    window.scrollTo = (x: number, y: number) => {
      // simulate position update
      Object.defineProperty(window, 'scrollX', { value: x, configurable: true });
      Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
    };
    window.scrollTo(0, 0);
  });

  afterEach(() => {
    // cleanup side effects (최소 방어)
    document.body.style.overflow = snapshot.body.overflow;
    document.documentElement.style.overflow = snapshot.html.overflow;
    document.body.style.position = snapshot.body.position;
    document.body.style.top = snapshot.body.top;
  });

  it('locks and releases body scroll', async () => {
    const { result } = renderHook(() => useBodyScrollLock({ enabled: true, debugLabel: 'test' }));
    // layoutEffect는 동기지만 Preact 렌더 주기 후 상태 반영 확인용 microtask yield
    await Promise.resolve();
    expect(result.current.isLocked()).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('does not lock when disabled', () => {
    const { result } = renderHook(() => useBodyScrollLock({ enabled: false }));
    expect(result.current.isLocked()).toBe(false);
    expect(document.body.style.overflow).not.toBe('hidden');
  });
});
