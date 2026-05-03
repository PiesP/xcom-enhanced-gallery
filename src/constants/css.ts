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

export const CSS = {
  CLASSES,
  DATA_ATTRIBUTES,
  SELECTORS,
  INTERNAL_SELECTORS,
} as const;
