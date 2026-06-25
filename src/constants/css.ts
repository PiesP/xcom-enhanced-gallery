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
} as const;

const ARIA_ROLES = {
  GALLERY: '[role="dialog"]',
  LIST: '[role="list"]',
  LIST_ITEM: '[role="listitem"]',
} as const;

const SELECTORS = {
  OVERLAY: `.${CLASSES.OVERLAY}`,
  CONTAINER: `.${CLASSES.CONTAINER}`,
  ROOT: `.${CLASSES.ROOT}`,
  RENDERER: `.${CLASSES.RENDERER}`,
  VERTICAL_VIEW: `.${CLASSES.VERTICAL_VIEW}`,
  ITEM: `.${CLASSES.ITEM}`,
  DATA_GALLERY: `[${DATA_ATTRIBUTES.GALLERY}]`,
  ROLE_GALLERY: ARIA_ROLES.GALLERY,
  ROLE_LIST: ARIA_ROLES.LIST,
  ROLE_LIST_ITEM: ARIA_ROLES.LIST_ITEM,
} as const;

/** All gallery selectors for batch queries/cleanup and internal-element detection.
 *  Used by isGalleryInternalElement() — BROAD: matches any element inside the gallery DOM tree,
 *  including the overlay/container divs themselves. */
const INTERNAL_SELECTORS = [
  SELECTORS.OVERLAY,
  SELECTORS.CONTAINER,
  SELECTORS.ROOT,
  SELECTORS.RENDERER,
  SELECTORS.VERTICAL_VIEW,
  SELECTORS.ITEM,
  SELECTORS.DATA_GALLERY,
  '[data-gallery-element]',
  SELECTORS.ROLE_LIST_ITEM,
  '[data-role="toolbar"]',
  '[data-role="toolbar-hover-zone"]',
] as const;

/** Selectors for interactive gallery elements that should NOT trigger background actions.
 *  Used by handleBackgroundClick() — NARROW: only toolbar, items, and interactive controls.
 *  Excludes overlay/container/root/renderer — clicking the gallery background SHOULD close. */
const GALLERY_ELEMENT_SELECTORS = [
  SELECTORS.ITEM,
  '[data-gallery-element]',
  SELECTORS.ROLE_LIST_ITEM,
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

/** CSS custom property for toolbar icon size. Use in CSS as `var(--xeg-toolbar-icon-size)`. */
export const TOOLBAR_ICON_SIZE_VAR = 'var(--xeg-toolbar-icon-size)';
