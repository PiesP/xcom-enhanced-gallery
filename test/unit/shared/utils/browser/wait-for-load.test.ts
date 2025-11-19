import { describe, it, expect } from 'vitest';

describe.skip('waitForWindowLoad (browser shim)', () => {
  it('was removed alongside the userscript window-load shim', () => {
    expect(true).toBe(true);
  });
});
