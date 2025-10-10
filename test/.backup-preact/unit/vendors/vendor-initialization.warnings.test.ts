import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Vendors initialization (test mode warnings)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not emit console.warn when auto-initializing via getters in test mode', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const vendors = await import('@/shared/external/vendors');
    // Reset instance to simulate uninitialized state even though setup initialized vendors
    if (typeof vendors.resetVendorManagerInstance === 'function') {
      vendors.resetVendorManagerInstance();
    }

    // Accessing getter should auto-initialize without warn in test mode (debug only)
    const api = vendors.getPreact();
    expect(api).toBeTruthy();
    expect(typeof api.render).toBe('function');

    // Ensure no warn logs were produced for auto-init path
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
