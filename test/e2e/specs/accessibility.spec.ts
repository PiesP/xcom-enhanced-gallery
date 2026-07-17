// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Accessibility tests for X.com Enhanced Gallery.
 *
 * Tests verify ARIA attributes, focus management, and accessibility features.
 * Since the gallery requires a real X.com page with specific DOM structure
 * for full E2E testing, we verify:
 * 1. Source code patterns for ARIA attributes
 * 2. Rendered DOM structure for static accessibility attributes
 * 3. Focus management patterns in source code
 */

import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Source files loaded at module level (Node context)
const __filename = fileURLToPath(import.meta.url);
const srcDir = resolve(__filename, '../../../../src');
const galleryContainerSrc = readFileSync(resolve(srcDir, 'shared/components/isolation/GalleryContainer.tsx'), 'utf-8');
const galleryViewSrc = readFileSync(resolve(srcDir, 'features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx'), 'utf-8');
const galleryItemSrc = readFileSync(resolve(srcDir, 'features/gallery/components/vertical-gallery-view/VerticalImageItem.tsx'), 'utf-8');
const galleryRendererSrc = readFileSync(resolve(srcDir, 'features/gallery/gallery-renderer.tsx'), 'utf-8');
const toolbarSrc = readFileSync(resolve(srcDir, 'shared/components/ui/Toolbar/ToolbarView.tsx'), 'utf-8');
const lifecycleSrc = readFileSync(resolve(srcDir, 'shared/utils/events/lifecycle/gallery-lifecycle.ts'), 'utf-8');

test.describe('X.com Enhanced Gallery Accessibility', () => {
  // ── 1. Gallery container: dialog semantics ────────────────────

  test('GalleryContainer source includes role=dialog and aria-modal', () => {
    expect(galleryContainerSrc).toContain('role="dialog"');
    expect(galleryContainerSrc).toContain('aria-modal="true"');
  });

  test('GalleryContainer source includes aria-label', () => {
    expect(galleryContainerSrc).toContain('aria-label="Image gallery"');
  });

  test('GalleryContainer source includes inert management', () => {
    expect(galleryContainerSrc).toContain('document.body.inert = true');
    expect(galleryContainerSrc).toContain('document.body.inert = false');
  });

  test('GalleryContainer source includes lang attribute', () => {
    expect(galleryContainerSrc).toContain('lang={');
  });

  // ── 2. Gallery items: listitem semantics ──────────────────────

  test('VerticalGalleryView source uses standard ARIA roles', () => {
    // Verify custom data-role/data-xeg-role were replaced with standard roles
    expect(galleryViewSrc).toContain('role="toolbar"');
    expect(galleryViewSrc).toContain('role="list"');
    expect(galleryViewSrc).toContain('role="presentation"');
    // Verify old custom attributes are removed from these elements
    expect(galleryViewSrc).not.toContain('data-role="toolbar"');
    expect(galleryViewSrc).not.toContain('data-xeg-role="items-container"');
  });

  test('VerticalImageItem source includes resolved container role', () => {
    // The component uses dynamic role resolution
    expect(galleryItemSrc).toContain('resolvedContainerRole()');
  });

  test('VerticalImageItem source includes aria-posinset and aria-setsize', () => {
    expect(galleryItemSrc).toContain('aria-posinset={local.index + 1}');
    expect(galleryItemSrc).toContain('aria-setsize={totalItems()}');
  });

  test('VerticalImageItem source has meaningful alt text', () => {
    // Verify alt text includes position and alt text
    expect(galleryItemSrc).toContain('Image ${local.index + 1} of');
  });

  test('VerticalImageItem source has aria-label on video elements', () => {
    expect(galleryItemSrc).toContain('Video ${local.index + 1} of');
  });

  test('VerticalImageItem source includes focus trap', () => {
    expect(galleryItemSrc).toContain('focusableElements');
    expect(galleryItemSrc).toContain('firstElement.focus()');
  });

  test('VerticalImageItem source uses tabIndex={-1} for arrow-key navigation', () => {
    expect(galleryItemSrc).toContain('tabIndex={-1}');
  });

  // ── 3. Gallery renderer: lang attribute ───────────────────────

  test('GalleryRenderer passes lang attribute to container', () => {
    expect(galleryRendererSrc).toContain('lang={');
  });

  // ── 4. Toolbar: proper ARIA role ──────────────────────────────

  test('ToolbarView source uses role=toolbar', () => {
    expect(toolbarSrc).toContain("props.role ?? 'toolbar'");
  });

  test('ToolbarView source has aria-label on progressbar', () => {
    expect(toolbarSrc).toContain('role="progressbar"');
    expect(toolbarSrc).toContain('aria-label="Progress"');
  });

  test('ToolbarView source has aria-live for counter updates', () => {
    expect(toolbarSrc).toContain('aria-live="polite"');
  });

  // ── 5. Focus restoration ─────────────────────────────────────

  test('gallery-lifecycle source includes focus restoration', () => {
    expect(lifecycleSrc).toContain('openerElement');
    expect(lifecycleSrc).toContain('focus({ preventScroll: true })');
  });
});
