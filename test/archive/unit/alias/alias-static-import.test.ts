/**
 * @fileoverview ARCHIVED: Platform-specific /@fs/ import test
 *
 * Reason for archival:
 * - Tests Windows/Unix platform-specific /@fs/ prefix paths
 * - /@fs/ is dev server only; build uses alias resolution
 * - Complex logic (hardcoded paths) adds maintenance burden
 * - Functionality validated by alias-resolution.test.ts is sufficient
 *
 * Original content (2025-10-25):
 */

import { describe, it, expect } from 'vitest';

const isWindows = process.platform === 'win32';
const ROOT = 'C:/git/xcom-enhanced-gallery';

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

describe.skip('Alias static import (ARCHIVED)', () => {
  it('imports gallery barrel via @features', async () => {
    const Gallery = await loadGallery();
    expect(Gallery).toBeTruthy();
    expect(Object.keys(Gallery).length).toBe(0);
  });

  it('imports component via @features path', async () => {
    const { VerticalGalleryView } = await loadVertical();
    expect(VerticalGalleryView).toBeTruthy();
  });
});
