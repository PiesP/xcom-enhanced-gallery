import { describe, expect, it } from 'vitest';

describe('FRAME-ALT-001 Stage D Phase 5 — vendor manager solid-only surface', () => {
  it('does not expose Preact getters on the primary vendor entry point', async () => {
    const vendors = await import('@shared/external/vendors');

    expect(vendors).not.toHaveProperty('getPreact');
    expect(vendors).not.toHaveProperty('getPreactHooks');
    expect(vendors).not.toHaveProperty('getPreactSignals');
    expect(vendors).not.toHaveProperty('getPreactCompat');
  });

  it('rejects legacy vendor module imports from production surface', async () => {
    await expect(import('@shared/external/vendors/preact-legacy')).rejects.toThrow();
  });

  it('provides a Solid-backed legacy harness only via test utilities', async () => {
    const legacy = await import('@test-utils/legacy-preact');

    expect(typeof legacy.getPreact).toBe('function');
    expect(typeof legacy.getPreactHooks).toBe('function');
    expect(typeof legacy.getPreactSignals).toBe('function');
    expect(typeof legacy.getPreactCompat).toBe('function');

    const preactApi = legacy.getPreact();
    expect(typeof preactApi.h).toBe('function');
    expect(typeof preactApi.render).toBe('function');
  });
});
