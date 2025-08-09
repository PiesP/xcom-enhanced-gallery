/**
 * signals-bundled 모듈이 필요한 signals API를 제공하는지 검증
 */
import { describe, it, expect } from 'vitest';

import { preactSignals } from '../../../../src/shared/external/signals-bundled';

describe('signals-bundled', () => {
  it('exports core signal functions', () => {
    expect(typeof preactSignals.signal).toBe('function');
    expect(typeof preactSignals.computed).toBe('function');
    expect(typeof preactSignals.effect).toBe('function');
  });
});
