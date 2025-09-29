/**
 * @fileoverview RED test enforcing Solid-only vendor exports.
 */

import { describe, expect, it } from 'vitest';

const PREACT_EXPORTS = [
  'getPreact',
  'getPreactHooks',
  'getPreactSignals',
  'getPreactCompat',
  'h',
  'render',
  'Component',
  'Fragment',
];

describe('Vendor manager Solid-only exports (RED)', () => {
  it('does not expose any Preact-centric exports from @shared/external/vendors', async () => {
    const vendors = await import('@shared/external/vendors');

    for (const exportName of PREACT_EXPORTS) {
      expect(exportName in vendors).toBe(false);
    }

    expect(vendors).toHaveProperty('getSolidCore');
    expect(vendors).toHaveProperty('getSolidStore');
    expect(vendors).toHaveProperty('getSolidWeb');
  });
});
