/**
 * @file Toolbar token unification guard
 * Ensures unified namespaced tokens (--xeg-toolbar-*) control visibility, with legacy mapping present.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const thisFile = fileURLToPath(import.meta.url);
const root = join(dirname(thisFile), '..', '..', '..');

describe('Toolbar token unification', () => {
  it('VerticalGalleryView.module.css uses --xeg-toolbar-* tokens only (no legacy mapping)', () => {
    const css = readFileSync(
      join(
        root,
        'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
      ),
      'utf-8'
    );
    // must reference namespaced tokens
    expect(css).toMatch(/--xeg-toolbar-opacity/);
    expect(css).toMatch(/--xeg-toolbar-visibility/);
    expect(css).toMatch(/--xeg-toolbar-pointer-events/);
    expect(css).toMatch(/--xeg-toolbar-transform-y/);

    // legacy mapping must be removed now
    expect(css).not.toMatch(/--toolbar-opacity\s*:/);
    expect(css).not.toMatch(/--toolbar-visibility\s*:/);
    expect(css).not.toMatch(/--toolbar-pointer-events\s*:/);
    expect(css).not.toMatch(/--toolbar-transform-y\s*:/);
  });

  it('useToolbarPositionBased sets only namespaced tokens', () => {
    const ts = readFileSync(
      join(root, 'src/features/gallery/hooks/useToolbarPositionBased.ts'),
      'utf-8'
    );
    expect(ts).toMatch(/--xeg-toolbar-opacity/);
    expect(ts).toMatch(/--xeg-toolbar-pointer-events/);
    expect(ts).not.toMatch(/--toolbar-opacity/);
    expect(ts).not.toMatch(/--toolbar-pointer-events/);
  });
});
