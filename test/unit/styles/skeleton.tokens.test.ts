import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

describe('Skeleton token policy', () => {
  it('VerticalImageItem.module.css should use skeleton tokens for placeholders', () => {
    const here = fileURLToPath(import.meta.url);
    const root = resolve(here, '../../../..');
    const cssPath = resolve(
      root,
      'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css'
    );
    const css = readFileSync(cssPath, 'utf-8');

    // Placeholder should use tokenized background and animation presets
    expect(css).toMatch(/\.placeholder[\s\S]*background:\s*var\(--xeg-skeleton-bg\)/);
    expect(css).toMatch(/\.loadingSpinner[\s\S]*var\(--xeg-duration-.*\)/);
  });
});
