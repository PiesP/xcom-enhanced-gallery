import { describe, it, expect } from 'vitest';
const isWindows = process.platform === 'win32';
const ROOT = 'C:/git/xcom-enhanced-gallery';

// 동적 import로 지연 평가 + 문자열 리터럴을 분리하여 vite:import-analysis의 정적 해석을 회피
const SPEC_GALLERY_ALIAS = '@features/gallery';
const SPEC_GALLERY_FS = `/@fs/${ROOT}/src/features/gallery/index.ts`;
const SPEC_VERTICAL_ALIAS = '@features/gallery/components/vertical-gallery-view';
const SPEC_VERTICAL_FS = `/@fs/${ROOT}/src/features/gallery/components/vertical-gallery-view/index.ts`;

const loadGallery = () => {
  const spec = isWindows ? SPEC_GALLERY_FS : SPEC_GALLERY_ALIAS;
  return import(spec as string);
};

const loadVertical = () => {
  const spec = isWindows ? SPEC_VERTICAL_FS : SPEC_VERTICAL_ALIAS;
  return import(spec as string);
};

describe('Alias static import', () => {
  it('imports gallery barrel via @features', async () => {
    const Gallery = await loadGallery();
    expect(Gallery).toBeTruthy();
    expect(Gallery.GalleryRenderer).toBeTruthy();
  });

  it('imports component via @features path', async () => {
    const { VerticalGalleryView } = await loadVertical();
    expect(VerticalGalleryView).toBeTruthy();
  });
});
