import { describe, it, expect } from 'vitest';
import { APP_CONFIG, CSS } from '@/constants';

describe('JS constants tokenization policy', () => {
  it('APP_CONFIG.ANIMATION_DURATION must be a token var string', () => {
    expect(typeof APP_CONFIG.ANIMATION_DURATION).toBe('string');
    expect(APP_CONFIG.ANIMATION_DURATION).toMatch(/^var\(--xeg-duration-/);
  });

  it('CSS.Z_INDEX must use token vars (no raw numbers)', () => {
    const values = Object.values(CSS.Z_INDEX as Record<string, unknown>);
    expect(values.length).toBeGreaterThan(0);
    for (const v of values) {
      expect(typeof v).toBe('string');
      expect(String(v)).toMatch(/^var\(--xeg-z-/);
    }
  });

  it('CSS.SPACING must use token vars (no raw numbers)', () => {
    const values = Object.values(CSS.SPACING as Record<string, unknown>);
    expect(values.length).toBeGreaterThan(0);
    for (const v of values) {
      expect(typeof v).toBe('string');
      expect(String(v)).toMatch(/^var\(--xeg-spacing-/);
    }
  });
});
