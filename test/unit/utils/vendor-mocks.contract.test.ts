import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupVendorMocks, cleanupVendorMocks } from '../../utils/mocks/vendor-mocks';

describe('vendor-mocks contract', () => {
  beforeEach(() => {
    cleanupVendorMocks();
  });

  afterEach(() => {
    cleanupVendorMocks();
  });

  it('provides getSolid via mocked vendors getter', async () => {
    const mgr = setupVendorMocks();
    const { getSolid } = await import('@shared/external/vendors');
    const solid = getSolid();

    expect(solid).toBeTruthy();
    expect(typeof solid.render).toBe('function');
    expect(typeof solid.createSignal).toBe('function');
    expect(typeof solid.createEffect).toBe('function');

    // Verify cache
    expect(mgr).toBeTruthy();
  });
});
