/**
 * hooks-bundled 모듈이 필요한 hook API를 제공하는지 검증
 */
import { describe, it, expect } from 'vitest';

import { preactHooks } from '../../../../src/shared/external/hooks-bundled';

describe('hooks-bundled', () => {
  it('exports core hook functions', () => {
    expect(typeof preactHooks.useState).toBe('function');
    expect(typeof preactHooks.useEffect).toBe('function');
    expect(typeof preactHooks.useMemo).toBe('function');
    expect(typeof preactHooks.useCallback).toBe('function');
    expect(typeof preactHooks.useRef).toBe('function');
  });
});
