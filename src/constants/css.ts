/**
 * @fileoverview Centralized gallery DOM tokens (class names, data attributes, selectors)
 * @description Keeps DOM-facing identifiers consistent across detection logic and UI shells.
 */

const CLASS_PREFIX = 'xeg';

const toSelector = (className: string): string => `.${className}`;
const toAttributeSelector = (attribute: string, value?: string): string =>
  value ? `[${attribute}="${value}"]` : `[${attribute}]`;

const CLASSES = {
  OVERLAY: `${CLASS_PREFIX}-gallery-overlay`,
  CONTAINER: `${CLASS_PREFIX}-gallery-container`,
  ROOT: `${CLASS_PREFIX}-gallery-root`,
  RENDERER: `${CLASS_PREFIX}-gallery-renderer`,
  VERTICAL_VIEW: `${CLASS_PREFIX}-vertical-gallery`,
  ITEM: `${CLASS_PREFIX}-gallery-item`,
  LEGACY_SCOPE: `${CLASS_PREFIX}-gallery`,
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
  OVERLAY: toSelector(CLASSES.OVERLAY),
  CONTAINER: toSelector(CLASSES.CONTAINER),
  ROOT: toSelector(CLASSES.ROOT),
  RENDERER: toSelector(CLASSES.RENDERER),
  VERTICAL_VIEW: toSelector(CLASSES.VERTICAL_VIEW),
  ITEM: toSelector(CLASSES.ITEM),
  LEGACY_SCOPE: toSelector(CLASSES.LEGACY_SCOPE),
  DATA_GALLERY: toAttributeSelector(DATA_ATTRIBUTES.GALLERY),
  DATA_CONTAINER: toAttributeSelector(DATA_ATTRIBUTES.CONTAINER),
  DATA_ELEMENT: toAttributeSelector(DATA_ATTRIBUTES.ELEMENT),
  DATA_ROLE: toAttributeSelector(DATA_ATTRIBUTES.ROLE),
  DATA_ROLE_COMPAT: toAttributeSelector(DATA_ATTRIBUTES.ROLE_COMPAT),
  DATA_GALLERY_TYPE: toAttributeSelector(DATA_ATTRIBUTES.GALLERY_TYPE),
  DATA_GALLERY_VERSION: toAttributeSelector(DATA_ATTRIBUTES.GALLERY_VERSION),
  ROLE_GALLERY: toAttributeSelector(DATA_ATTRIBUTES.ROLE, 'gallery'),
  ROLE_ITEMS_CONTAINER: toAttributeSelector(DATA_ATTRIBUTES.ROLE, 'items-container'),
} as const;

const INTERNAL_SELECTORS = Object.freeze(
  Array.from(
    new Set(
      [
        SELECTORS.OVERLAY,
        SELECTORS.CONTAINER,
        SELECTORS.ROOT,
        SELECTORS.RENDERER,
        SELECTORS.VERTICAL_VIEW,
        SELECTORS.ITEM,
        SELECTORS.LEGACY_SCOPE,
        SELECTORS.DATA_GALLERY,
        SELECTORS.DATA_CONTAINER,
        SELECTORS.DATA_ELEMENT,
        SELECTORS.DATA_ROLE,
        SELECTORS.DATA_ROLE_COMPAT,
        SELECTORS.DATA_GALLERY_TYPE,
        SELECTORS.DATA_GALLERY_VERSION,
        SELECTORS.ROLE_GALLERY,
        SELECTORS.ROLE_ITEMS_CONTAINER,
      ].filter(Boolean)
    )
  )
);

const SCOPES = {
  HOSTS: Object.freeze(
    Array.from(
      new Set([
        SELECTORS.ROOT,
        SELECTORS.DATA_GALLERY,
        SELECTORS.CONTAINER,
        SELECTORS.DATA_CONTAINER,
      ])
    )
  ),
} as const;

export const CSS = {
  CLASSES,
  DATA_ATTRIBUTES,
  SELECTORS,
  INTERNAL_SELECTORS,
  SCOPES,
} as const;
