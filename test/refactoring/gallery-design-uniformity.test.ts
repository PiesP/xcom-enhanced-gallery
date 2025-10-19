import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

const galleryModulePath = 'src/features/gallery/styles/Gallery.module.css';
const verticalGalleryModulePath =
  'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css';
const galleryGlobalPath = 'src/features/gallery/styles/gallery-global.css';

const tintedOklchPattern = /oklch\([^)]*(?:[1-9]\d*|0?\.\d*[1-9])deg/gi;

function readCss(path: string): string {
  return readFileSync(path, 'utf8');
}

describe('Gallery design uniformity', () => {
  it('Gallery.module.css should avoid tinted OKLCH definitions', () => {
    const css = readCss(galleryModulePath);

    expect(css).not.toMatch(tintedOklchPattern);
    expect(css).not.toMatch(/--xeg-gallery-[a-z-]*oklch/);
    expect(css).toMatch(/background:\s*var\(--xeg-gallery-bg\)/);
  });

  it('VerticalGalleryView.module.css should reuse shared gallery tokens', () => {
    const css = readCss(verticalGalleryModulePath);

    expect(css).not.toMatch(tintedOklchPattern);
    expect(css).not.toMatch(/--xeg-vertical-[a-z-]*oklch/);
    expect(css).toMatch(/background:\s*var\(--xeg-gallery-bg\)/);
  });

  it('gallery-global.css should rely on component shadow tokens', () => {
    const css = readCss(galleryGlobalPath);

    expect(css).not.toMatch(tintedOklchPattern);
    expect(css).toMatch(/var\(--shadow-gallery-nav\)/);
    expect(css).toMatch(/var\(--shadow-gallery-image\)/);
  });
});
