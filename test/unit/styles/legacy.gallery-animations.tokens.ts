import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Enforce tokenized animation durations/easing in feature component CSS.
// Files under test: Gallery.module.css and VerticalImageItem.module.css

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const root = resolve(__dirname, '..', '..', '..');

const galleryCssPath = join(root, 'src', 'features', 'gallery', 'styles', 'Gallery.module.css');
const verticalItemCssPath = join(
  root,
  'src',
  'features',
  'gallery',
  'components',
  'vertical-gallery-view',
  'VerticalImageItem.module.css'
);

const read = p => readFileSync(p, 'utf-8');

describe('Animation token policy - gallery feature css', () => {
  it('Gallery.module.css: no hardcoded animation durations; must use var(--xeg-duration-*) and var(--xeg-ease-*|--xeg-easing-*)', () => {
    const css = read(galleryCssPath);

    // Forbid raw numeric durations in animation shorthand within component CSS
    expect(css).not.toMatch(/animation:[^;]*\b\d+\s*(?:ms|s)\b/);

    // For real animation declarations (not 'none'), ensure they reference duration/easing tokens
    const animDecls = (css.match(/animation:\s*[^;]+;/g) || []).filter(
      d => !/animation:\s*none\b/.test(d)
    );
    for (const decl of animDecls) {
      expect(decl).toMatch(/var\(--xeg-duration-[^)]+\)/);
      expect(decl).toMatch(/var\(--xeg-eas(?:e|ing)-[^)]+\)/);
    }
  });

  it('VerticalImageItem.module.css: no hardcoded animation durations; must use var(--xeg-duration-*) and var(--xeg-ease-*|--xeg-easing-*)', () => {
    const css = read(verticalItemCssPath);

    expect(css).not.toMatch(/animation:[^;]*\b\d+\s*(?:ms|s)\b/);

    const animDecls = (css.match(/animation:\s*[^;]+;/g) || []).filter(
      d => !/animation:\s*none\b/.test(d)
    );
    for (const decl of animDecls) {
      expect(decl).toMatch(/var\(--xeg-duration-[^)]+\)/);
      expect(decl).toMatch(/var\(--xeg-eas(?:e|ing)-[^)]+\)/);
    }
  });
});
