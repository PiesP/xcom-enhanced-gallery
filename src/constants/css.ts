/**
 * @fileoverview Centralized gallery DOM tokens (class names, data attributes, selectors)
 * @description Keeps DOM-facing identifiers consistent across detection logic and UI shells.
 */

// Keep these as compile-time literals to minimize runtime initialization code.
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
  CONTAINER: 'data-xeg-gallery-container',
  ELEMENT: 'data-gallery-element',
  ROLE: 'data-xeg-role',
  ROLE_COMPAT: 'data-xeg-role-compat',
  GALLERY_TYPE: 'data-xeg-gallery-type',
  GALLERY_VERSION: 'data-xeg-gallery-version',
} as const;

const SELECTORS = {
  OVERLAY: `.${CLASSES.OVERLAY}`,
  CONTAINER: `.${CLASSES.CONTAINER}`,
  ROOT: `.${CLASSES.ROOT}`,
  RENDERER: `.${CLASSES.RENDERER}`,
  VERTICAL_VIEW: `.${CLASSES.VERTICAL_VIEW}`,
  ITEM: `.${CLASSES.ITEM}`,
  DATA_GALLERY: `[${DATA_ATTRIBUTES.GALLERY}]`,
  DATA_CONTAINER: `[${DATA_ATTRIBUTES.CONTAINER}]`,
  DATA_ELEMENT: `[${DATA_ATTRIBUTES.ELEMENT}]`,
  DATA_ROLE: `[${DATA_ATTRIBUTES.ROLE}]`,
  DATA_ROLE_COMPAT: `[${DATA_ATTRIBUTES.ROLE_COMPAT}]`,
  DATA_GALLERY_TYPE: `[${DATA_ATTRIBUTES.GALLERY_TYPE}]`,
  DATA_GALLERY_VERSION: `[${DATA_ATTRIBUTES.GALLERY_VERSION}]`,
  ROLE_GALLERY: `[${DATA_ATTRIBUTES.ROLE}="gallery"]`,
  ROLE_ITEMS_CONTAINER: `[${DATA_ATTRIBUTES.ROLE}="items-container"]`,
} as const;

// Unique list (manually de-duplicated) to avoid Set/Array.from/Object.freeze runtime work.
const INTERNAL_SELECTORS = [
  SELECTORS.OVERLAY,
  SELECTORS.CONTAINER,
  SELECTORS.ROOT,
  SELECTORS.RENDERER,
  SELECTORS.VERTICAL_VIEW,
  SELECTORS.ITEM,
  SELECTORS.DATA_GALLERY,
  SELECTORS.DATA_CONTAINER,
  SELECTORS.DATA_ELEMENT,
  SELECTORS.DATA_ROLE,
  SELECTORS.DATA_ROLE_COMPAT,
  SELECTORS.DATA_GALLERY_TYPE,
  SELECTORS.DATA_GALLERY_VERSION,
  SELECTORS.ROLE_GALLERY,
  SELECTORS.ROLE_ITEMS_CONTAINER,
] as const;

export const CSS = {
  CLASSES,
  DATA_ATTRIBUTES,
  SELECTORS,
  INTERNAL_SELECTORS,
} as const;
