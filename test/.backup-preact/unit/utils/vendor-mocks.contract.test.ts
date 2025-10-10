import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  setupVendorMocks,
  cleanupVendorMocks,
  MockVendorManager,
} from '../../utils/mocks/vendor-mocks';

describe('vendor-mocks contract', () => {
  beforeEach(() => {
    cleanupVendorMocks();
  });

  afterEach(() => {
    cleanupVendorMocks();
  });

  it('provides getPreact/getFflate/getPreactSignals via mocked vendors getter', async () => {
    const mgr = setupVendorMocks();
    const { getPreact, getFflate, getPreactSignals } = await import('@shared/external/vendors');
    const preact = await getPreact();
    const fflate = await getFflate();
    const signals = await getPreactSignals();

    expect(preact).toBeTruthy();
    expect(typeof preact.render).toBe('function');
    expect(fflate).toBeTruthy();
    expect(typeof fflate.zip).toBe('function');
    expect(signals).toBeTruthy();
    expect(typeof signals.signal).toBe('function');

    // manager cache sanity
    expect(mgr.cache.size).toBeGreaterThanOrEqual(3);
  });
});
