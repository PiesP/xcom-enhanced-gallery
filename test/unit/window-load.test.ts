import { describe, it, expect } from 'vitest';
import { waitForWindowLoad } from '@/shared/utils/window-load';

describe('waitForWindowLoad (deprecated)', () => {
  it('resolves immediately without depending on document state', async () => {
    const result = await waitForWindowLoad({ timeoutMs: 1, forceEventPath: true });
    expect(result).toBe(true);
  });
});
