import { describe, it, expect } from 'vitest';
import { waitForWindowLoad } from '@shared/utils/window-load';

describe('waitForWindowLoad (browser shim)', () => {
  it('always resolves true immediately', async () => {
    const result = await waitForWindowLoad();
    expect(result).toBe(true);
  });
});
