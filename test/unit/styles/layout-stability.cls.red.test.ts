import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

describe('Layout Stability (CLS) — aspect-ratio reservation (RED)', () => {
  setupGlobalTestIsolation();

  it('VerticalImageItem.module.css should reserve space using aspect-ratio token', () => {
    const here = fileURLToPath(import.meta.url);
    // test/unit/styles/... -> go up three levels to repo root
    const cwd = resolve(here, '../../../..');
    const cssPath = resolve(
      cwd,
      'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css'
    );
    const css = readFileSync(cssPath, 'utf-8');

    // Expect aspect-ratio with a token var
    expect(css).toMatch(/aspect-ratio:\s*var\(--xeg-aspect-default(?:,\s*[^)]+)?\)/);
    expect(css).toContain('--xeg-gallery-item-intrinsic-width');
    expect(css).toContain('--xeg-gallery-item-intrinsic-height');
    expect(css).toContain('--xeg-gallery-item-intrinsic-ratio');
  });
});
