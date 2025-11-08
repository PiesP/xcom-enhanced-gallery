/**
 * @fileoverview CSS classes and style constants
 */

export const CSS = {
  CLASSES: {
    GALLERY_CONTAINER: 'xeg-gallery-container',
    OVERLAY: 'xeg-overlay',
    MEDIA_CONTAINER: 'xeg-media-container',
    TOOLBAR: 'xeg-toolbar',
    BUTTON: 'xeg-button',
  },
  Z_INDEX: {
    GALLERY: 'var(--xeg-z-gallery)',
    MODAL: 'var(--xeg-z-modal)',
    TOOLBAR: 'var(--xeg-z-toolbar)',
    TOAST: 'var(--xeg-z-toast)',
  },
  SPACING: {
    XS: 'var(--xeg-spacing-xs)',
    SM: 'var(--xeg-spacing-sm)',
    MD: 'var(--xeg-spacing-md)',
    LG: 'var(--xeg-spacing-lg)',
    XL: 'var(--xeg-spacing-xl)',
    XXL: 'var(--xeg-spacing-2xl)',
  },
} as const;
