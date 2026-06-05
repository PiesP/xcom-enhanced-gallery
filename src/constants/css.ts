// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Gallery DOM tokens (class names, data attributes, selectors).
 *
 * Single source of truth for CSS classes, data attributes, and DOM selectors.
 * All classes use `xeg-` prefix to avoid conflicts with Twitter's styles.
 *
 * @module constants/css
 */

const CLASSES = {
  OVERLAY: 'xeg-gallery-overlay',
  CONTAINER: 'xeg-gallery-container',
  ROOT: 'xeg-gallery-root',
  RENDERER: 'xeg-gallery-renderer',
  VERTICAL_VIEW: 'xeg-vertical-gallery',
  ITEM: 'xeg-gallery-item',
} as const;

const DATA_ATTRIBUTES = {
  GALLERY: 'data-xeg-gallery',
  ROLE: 'data-xeg-role',
} as const;

const SELECTORS = {
  OVERLAY: `.${CLASSES.OVERLAY}`,
  CONTAINER: `.${CLASSES.CONTAINER}`,
  ROOT: `.${CLASSES.ROOT}`,
  RENDERER: `.${CLASSES.RENDERER}`,
  VERTICAL_VIEW: `.${CLASSES.VERTICAL_VIEW}`,
  ITEM: `.${CLASSES.ITEM}`,
  DATA_GALLERY: `[${DATA_ATTRIBUTES.GALLERY}]`,
  DATA_ROLE: `[${DATA_ATTRIBUTES.ROLE}]`,
  ROLE_GALLERY: `[${DATA_ATTRIBUTES.ROLE}="gallery"]`,
} as const;

/** All gallery selectors for batch queries/cleanup. */
const INTERNAL_SELECTORS = [
  SELECTORS.OVERLAY,
  SELECTORS.CONTAINER,
  SELECTORS.ROOT,
  SELECTORS.RENDERER,
  SELECTORS.VERTICAL_VIEW,
  SELECTORS.ITEM,
  SELECTORS.DATA_GALLERY,
  SELECTORS.DATA_ROLE,
  SELECTORS.ROLE_GALLERY,
] as const;

/** Selectors for interactive gallery elements that should not trigger background actions
 *  (e.g., closing the gallery when clicking inside an item or toolbar). */
const GALLERY_ELEMENT_SELECTORS = [
  ...INTERNAL_SELECTORS,
  '[data-gallery-element]',
  '[data-xeg-role="gallery-item"]',
  '[data-xeg-role="scroll-spacer"]',
  '[data-role="toolbar"]',
  '[data-role="toolbar-hover-zone"]',
] as const;

export const CSS = {
  CLASSES,
  DATA_ATTRIBUTES,
  SELECTORS,
  INTERNAL_SELECTORS,
  GALLERY_ELEMENT_SELECTORS,
} as const;

/** Standard toolbar icon size in pixels. */
export const TOOLBAR_ICON_SIZE = 18;
