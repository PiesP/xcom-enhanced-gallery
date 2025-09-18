/**
 * boundary-keyboard-guard.test.ts (GREEN)
 */
import { describe, it, expect } from 'vitest';
import { shouldConsumeKeyboardAtBoundary } from '@shared/utils/scroll/boundary-keyboard-guard';

describe('shouldConsumeKeyboardAtBoundary', () => {
  const S = { scrollHeight: 2000, clientHeight: 400 };

  it('중간 위치 PageDown -> false', () => {
    expect(shouldConsumeKeyboardAtBoundary({ ...S, scrollTop: 600, key: 'PageDown' })).toBe(false);
  });
  it('top boundary + Home -> true', () => {
    expect(shouldConsumeKeyboardAtBoundary({ ...S, scrollTop: 0, key: 'Home' })).toBe(true);
  });
  it('top boundary + PageUp -> true', () => {
    expect(shouldConsumeKeyboardAtBoundary({ ...S, scrollTop: 0, key: 'PageUp' })).toBe(true);
  });
  it('bottom boundary + PageDown -> true', () => {
    expect(shouldConsumeKeyboardAtBoundary({ ...S, scrollTop: 1600, key: 'PageDown' })).toBe(true);
  });
  it('bottom boundary + End -> true', () => {
    expect(shouldConsumeKeyboardAtBoundary({ ...S, scrollTop: 1600, key: 'End' })).toBe(true);
  });
  it('bottom boundary + Space -> true', () => {
    expect(shouldConsumeKeyboardAtBoundary({ ...S, scrollTop: 1600, key: ' ' })).toBe(true);
  });
  it('non-scrollable -> true', () => {
    expect(
      shouldConsumeKeyboardAtBoundary({
        scrollTop: 0,
        scrollHeight: 200,
        clientHeight: 400,
        key: 'PageDown',
      })
    ).toBe(true);
  });
});
