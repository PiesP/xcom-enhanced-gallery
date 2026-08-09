// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const srcDir = resolve(import.meta.dirname, '../../../src');
const galleryContainerSrc = readFileSync(
  resolve(srcDir, 'shared/components/isolation/GalleryContainer.tsx'),
  'utf8'
);
const galleryViewSrc = readFileSync(
  resolve(srcDir, 'features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx'),
  'utf8'
);
const galleryItemSrc = readFileSync(
  resolve(srcDir, 'features/gallery/components/vertical-gallery-view/VerticalImageItem.tsx'),
  'utf8'
);
const galleryRendererSrc = readFileSync(
  resolve(srcDir, 'features/gallery/gallery-renderer.tsx'),
  'utf8'
);
const galleryHostStateSrc = readFileSync(
  resolve(srcDir, 'shared/components/isolation/gallery-host-state.ts'),
  'utf8'
);
const toolbarSrc = readFileSync(
  resolve(srcDir, 'shared/components/ui/Toolbar/ToolbarView.tsx'),
  'utf8'
);
const lifecycleSrc = readFileSync(
  resolve(srcDir, 'shared/utils/events/lifecycle/gallery-lifecycle.ts'),
  'utf8'
);

describe('gallery accessibility source contract', () => {
  it('keeps dialog semantics, labeling, language, and background isolation', () => {
    expect(galleryContainerSrc).toContain('role="dialog"');
    expect(galleryContainerSrc).toContain('aria-modal="true"');
    expect(galleryContainerSrc).toContain("aria-label={translate('msg.gal.imageGallery')}");
    expect(galleryContainerSrc).toContain('lang={');
    expect(galleryContainerSrc).toContain('activateGalleryHostState(containerEl)');
    expect(galleryHostStateSrc).toContain('hideBackgroundElement(element)');
    expect(galleryHostStateSrc).toContain('restoreBackgroundElement(element)');
  });

  it('keeps native list and media interaction semantics', () => {
    expect(galleryViewSrc).toContain('<ul');
    expect(galleryViewSrc).not.toContain('data-role="toolbar"');
    expect(galleryViewSrc).not.toContain('data-xeg-role="items-container"');
    expect(galleryItemSrc).toContain('<li');
    expect(galleryItemSrc).toContain('<button');
    expect(galleryItemSrc).not.toContain('onClick={handleContainerClick}');
    expect(galleryItemSrc).toContain('aria-posinset={local.index + 1}');
    expect(galleryItemSrc).toContain('aria-setsize={totalItems()}');
    expect(galleryItemSrc).toContain("translate('msg.gal.imageCount'");
    expect(galleryItemSrc).toContain("translate('msg.gal.videoCount'");
    expect(galleryItemSrc).toContain('tabIndex={isFocused() ? 0 : -1}');
  });

  it('keeps renderer, toolbar, progress, and focus restoration semantics', () => {
    expect(galleryRendererSrc).toContain('lang={');
    expect(toolbarSrc).toContain('<fieldset');
    expect(toolbarSrc).toContain('role="progressbar"');
    expect(toolbarSrc).toContain("aria-label={translate('tb.progress')}");
    expect(toolbarSrc).toContain('aria-live="polite"');
    expect(galleryContainerSrc).toContain('focusableElements');
    expect(galleryContainerSrc).toContain('firstElement.focus()');
    expect(lifecycleSrc).toContain('Focus restoration is handled by GalleryContainer.tsx');
    expect(galleryHostStateSrc).toContain('this.previousFocus.focus()');
  });
});
