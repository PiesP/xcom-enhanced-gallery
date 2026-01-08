/**
 * @fileoverview Gallery DOM tokens (class names, data attributes, selectors).
 *
 * Single source of truth for CSS classes, data attributes, and DOM selectors.
 * All classes use `xeg-` prefix to avoid conflicts with Twitter's styles.
 *
 * @module constants/css
 */

/**
 * CSS class names for gallery elements (use `xeg-` prefix).
 *
 * @example
 * ```typescript
 * const overlay = document.createElement('div');
 * overlay.classList.add(CSS.CLASSES.OVERLAY);
 * ```
 */
const CLASSES = {
  /** Root overlay element containing the entire gallery UI */
  OVERLAY: 'xeg-gallery-overlay',
  /** Main container for gallery layout and positioning */
  CONTAINER: 'xeg-gallery-container',
  /** Gallery root element wrapping all gallery components */
  ROOT: 'xeg-gallery-root',
  /** Renderer component that manages gallery view switching */
  RENDERER: 'xeg-gallery-renderer',
  /** Vertical scrolling gallery view container */
  VERTICAL_VIEW: 'xeg-vertical-gallery',
  /** Individual gallery item (image or video) */
  ITEM: 'xeg-gallery-item',
} as const;

/**
 * Data attribute names for gallery metadata storage (use `data-xeg-` prefix).
 *
 * @example
 * ```typescript
 * element.setAttribute(CSS.DATA_ATTRIBUTES.GALLERY, 'true');
 * const galleries = document.querySelectorAll(`[${CSS.DATA_ATTRIBUTES.GALLERY}]`);
 * ```
 */
const DATA_ATTRIBUTES = {
  /** Boolean flag indicating element is part of enhanced gallery system */
  GALLERY: 'data-xeg-gallery',
  /** Marks element as gallery container (legacy) */
  CONTAINER: 'data-xeg-gallery-container',
  /** Generic gallery element marker (legacy) */
  ELEMENT: 'data-gallery-element',
  /** Semantic role identifier (e.g., "gallery", "items-container") */
  ROLE: 'data-xeg-role',
  /** Legacy role compatibility attribute for backward compatibility */
  ROLE_COMPAT: 'data-xeg-role-compat',
  /** Gallery type discriminator (e.g., "vertical", "grid") */
  GALLERY_TYPE: 'data-xeg-gallery-type',
  /** Version string for gallery implementation (e.g., "1.6.0") */
  GALLERY_VERSION: 'data-xeg-gallery-version',
} as const;

/**
 * CSS and attribute selectors for DOM queries.
 *
 * These selectors are generated from CLASSES and DATA_ATTRIBUTES to ensure consistency.
 * Use these constants instead of hardcoding selector strings throughout the codebase.
 *
 * @remarks
 * Selector types:
 * - Class selectors: `.xeg-gallery-*` format for styling-based queries
 * - Attribute selectors: `[data-xeg-*]` format for metadata-based queries
 * - Role selectors: `[data-xeg-role="..."]` format for semantic queries
 *
 * @example
 * ```typescript
 * import { CSS } from '@constants/css';
 *
 * // Query by class
 * const overlay = document.querySelector(CSS.SELECTORS.OVERLAY);
 * const items = document.querySelectorAll(CSS.SELECTORS.ITEM);
 *
 * // Query by data attribute
 * const galleries = document.querySelectorAll(CSS.SELECTORS.DATA_GALLERY);
 * const galleryContainers = document.querySelectorAll(CSS.SELECTORS.ROLE_GALLERY);
 *
 * // Check if element matches selector
 * if (element.matches(CSS.SELECTORS.ROLE_ITEMS_CONTAINER)) {
 *   // Handle items container
 * }
 * ```
 */
/**
 * CSS and attribute selectors for DOM queries.
 *
 * These selectors are generated from CLASSES and DATA_ATTRIBUTES to ensure consistency.
 * Use these constants instead of hardcoding selector strings throughout the codebase.
 *
 * @remarks
 * Selector types:
 * - Class selectors: `.xeg-gallery-*` format for styling-based queries
 * - Attribute selectors: `[data-xeg-*]` format for metadata-based queries
 * - Role selectors: `[data-xeg-role="..."]` format for semantic queries
 *
 * @example
 * ```typescript
 * import { CSS } from '@constants/css';
 *
 * // Query by class
 * const overlay = document.querySelector(CSS.SELECTORS.OVERLAY);
 * const items = document.querySelectorAll(CSS.SELECTORS.ITEM);
 *
 * // Query by data attribute
 * const galleries = document.querySelectorAll(CSS.SELECTORS.DATA_GALLERY);
 * const galleryContainers = document.querySelectorAll(CSS.SELECTORS.ROLE_GALLERY);
 *
 * // Check if element matches selector
 * if (element.matches(CSS.SELECTORS.ROLE_ITEMS_CONTAINER)) {
 *   // Handle items container
 * }
 * ```
 */
const SELECTORS = {
  /** Class selector for gallery overlay element */
  OVERLAY: `.${CLASSES.OVERLAY}`,
  /** Class selector for gallery container element */
  CONTAINER: `.${CLASSES.CONTAINER}`,
  /** Class selector for gallery root element */
  ROOT: `.${CLASSES.ROOT}`,
  /** Class selector for gallery renderer component */
  RENDERER: `.${CLASSES.RENDERER}`,
  /** Class selector for vertical gallery view */
  VERTICAL_VIEW: `.${CLASSES.VERTICAL_VIEW}`,
  /** Class selector for individual gallery item */
  ITEM: `.${CLASSES.ITEM}`,
  /** Attribute selector for gallery-enabled elements */
  DATA_GALLERY: `[${DATA_ATTRIBUTES.GALLERY}]`,
  /** Attribute selector for gallery container elements */
  DATA_CONTAINER: `[${DATA_ATTRIBUTES.CONTAINER}]`,
  /** Attribute selector for generic gallery elements */
  DATA_ELEMENT: `[${DATA_ATTRIBUTES.ELEMENT}]`,
  /** Attribute selector for role-annotated elements */
  DATA_ROLE: `[${DATA_ATTRIBUTES.ROLE}]`,
  /** Attribute selector for legacy role compatibility */
  DATA_ROLE_COMPAT: `[${DATA_ATTRIBUTES.ROLE_COMPAT}]`,
  /** Attribute selector for gallery type metadata */
  DATA_GALLERY_TYPE: `[${DATA_ATTRIBUTES.GALLERY_TYPE}]`,
  /** Attribute selector for gallery version metadata */
  DATA_GALLERY_VERSION: `[${DATA_ATTRIBUTES.GALLERY_VERSION}]`,
  /** Specific role selector for main gallery elements */
  ROLE_GALLERY: `[${DATA_ATTRIBUTES.ROLE}="gallery"]`,
  /** Specific role selector for items container elements */
  ROLE_ITEMS_CONTAINER: `[${DATA_ATTRIBUTES.ROLE}="items-container"]`,
} as const;

/**
 * De-duplicated array of all internal gallery selectors.
 *
 * This array provides a complete list of all selectors used by the gallery system,
 * useful for:
 * - Batch DOM queries (e.g., `document.querySelectorAll(selectors.join(', '))`)
 * - Feature detection (check if any gallery element exists)
 * - Cleanup operations (remove all gallery elements)
 *
 * @remarks
 * Manually de-duplicated to avoid runtime Set/Array.from operations, minimizing
 * bundle size and initialization overhead.
 *
 * @example
 * ```typescript
 * import { CSS } from '@constants/css';
 *
 * // Find any gallery element
 * const anyGalleryElement = document.querySelector(
 *   CSS.INTERNAL_SELECTORS.join(', ')
 * );
 *
 * // Check if gallery is present
 * const hasGallery = CSS.INTERNAL_SELECTORS.some(
 *   selector => document.querySelector(selector) !== null
 * );
 *
 * // Remove all gallery elements
 * CSS.INTERNAL_SELECTORS.forEach(selector => {
 *   document.querySelectorAll(selector).forEach(el => el.remove());
 * });
 * ```
 */
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

/**
 * Centralized CSS constants for the gallery system.
 *
 * Single export containing all CSS-related constants (classes, data attributes, selectors).
 * This structure provides type-safe access to all DOM identifiers used throughout the application.
 *
 * @property CLASSES - CSS class name constants
 * @property DATA_ATTRIBUTES - Data attribute name constants
 * @property SELECTORS - Pre-generated CSS/attribute selectors
 * @property INTERNAL_SELECTORS - De-duplicated array of all gallery selectors
 *
 * @example
 * ```typescript
 * import { CSS } from '@constants/css';
 *
 * // Access class names
 * overlay.classList.add(CSS.CLASSES.OVERLAY);
 *
 * // Set data attributes
 * element.setAttribute(CSS.DATA_ATTRIBUTES.ROLE, 'gallery');
 *
 * // Query with selectors
 * const items = document.querySelectorAll(CSS.SELECTORS.ITEM);
 *
 * // Batch operations with internal selectors
 * const hasAnyGalleryElement = CSS.INTERNAL_SELECTORS.some(
 *   selector => document.querySelector(selector) !== null
 * );
 * ```
 */
export const CSS = {
  CLASSES,
  DATA_ATTRIBUTES,
  SELECTORS,
  INTERNAL_SELECTORS,
} as const;
