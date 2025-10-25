import { describe, it, expect } from 'vitest';

describe('[sanity] accessibility index re-exports', () => {
  it('ensurePoliteLiveRegion is a function via @/shared/utils/accessibility', async () => {
    const mod = await import('@/shared/utils/accessibility');
    expect(typeof mod.ensurePoliteLiveRegion).toBe('function');
    expect(typeof mod.ensureAssertiveLiveRegion).toBe('function');
  });
});
