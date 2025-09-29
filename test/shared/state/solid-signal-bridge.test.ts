import { describe, expect, it } from 'vitest';

describe('legacy solidSignalBridge module', () => {
  it('no longer exports any bridge helpers', async () => {
    const module = await import('@shared/utils/solidSignalBridge');
    expect(Object.keys(module)).toHaveLength(0);
  });
});
