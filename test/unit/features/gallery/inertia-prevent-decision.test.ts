import { describe, it, expect } from 'vitest';
import { decideInertiaPrevent } from '@/features/gallery/hooks/inertia-prevent-decision';

function base(overrides: Partial<Parameters<typeof decideInertiaPrevent>[0]> = {}) {
  return {
    variant: 'A' as const,
    flagEnabled: true,
    deltaY: -40,
    scrollTop: 0,
    clientHeight: 800,
    scrollHeight: 3000,
    ...overrides,
  };
}

describe('decideInertiaPrevent (inertia variant decision)', () => {
  it('Variant A always prevents (top overscroll upward)', () => {
    const r = decideInertiaPrevent(base({ variant: 'A', deltaY: -30, scrollTop: 0 }));
    expect(r).toBe(true);
  });

  it('Variant B upward overscroll at top -> NOT prevent', () => {
    const r = decideInertiaPrevent(base({ variant: 'B', deltaY: -20, scrollTop: 0 }));
    expect(r).toBe(false);
  });

  it('Variant B downward overscroll at bottom -> NOT prevent', () => {
    const r = decideInertiaPrevent(
      base({
        variant: 'B',
        deltaY: 35,
        scrollTop: 2200, // 2200 + 800 = 3000 bottom
      })
    );
    expect(r).toBe(false);
  });

  it('Variant B interior scroll still prevents', () => {
    const r = decideInertiaPrevent(
      base({ variant: 'B', deltaY: 10, scrollTop: 1000 /* interior */ })
    );
    expect(r).toBe(true);
  });

  it('Flag disabled => behaves like always prevent (even Variant B boundary)', () => {
    const r = decideInertiaPrevent(base({ variant: 'B', flagEnabled: false, deltaY: -15 }));
    expect(r).toBe(true);
  });
});
