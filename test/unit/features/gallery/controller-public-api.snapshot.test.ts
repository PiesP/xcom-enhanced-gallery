import { describe, it, expect } from 'vitest';

// Intentionally import wide surface (legacy) and new controller facade
import * as GallerySignals from '@shared/state/signals/gallery.signals';
import { GalleryController } from '@features/gallery/GalleryController';

function collectLegacyExportKeys(): string[] {
  // We consider only function exports that don't start with '_' and are not types
  return Object.keys(GallerySignals).filter(k => typeof (GallerySignals as any)[k] === 'function');
}

describe('Gallery Public API surface reduction (Phase13)', () => {
  it('legacy signals export count should be reduced by controller facade', async () => {
    const legacyKeys = collectLegacyExportKeys();
    // Controller facade public methods we expose intentionally
    const controller = new GalleryController();
    const facadeKeys = Object.getOwnPropertyNames(Object.getPrototypeOf(controller)).filter(
      k => k !== 'constructor' && !k.startsWith('_') && typeof (controller as any)[k] === 'function'
    );

    // Ensure facade is strictly smaller by ratio OR absolute threshold
    const legacyCount = legacyKeys.length;
    const facadeCount = facadeKeys.length;
    // Ratio requirement: facade <= 70% of legacy; also facadeCount <= 10 (absolute guard)
    const ratio = facadeCount / Math.max(1, legacyCount);

    expect(legacyCount).toBeGreaterThan(0);
    expect(facadeCount).toBeGreaterThan(0);

    // RED expectation before trimming (fail if ratio not met)
    expect(ratio).toBeLessThanOrEqual(0.7);
    expect(facadeCount).toBeLessThanOrEqual(10);
  });
});
