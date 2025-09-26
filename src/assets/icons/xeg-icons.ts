/**
 * @fileoverview XEG Icon definitions for SVG-based icons
 * Type definitions and base interfaces for custom SVG icon system
 */

export interface SvgPathDefinition {
  /** SVG path data string */
  d: string;
  /** Optional fill color */
  fill?: string;
  /** Optional stroke line cap style */
  strokeLinecap?: string;
  /** Optional stroke line join style */
  strokeLinejoin?: string;
  /** Optional stroke miter limit */
  strokeMiterlimit?: number;
}

export interface XegIconDefinition {
  /** SVG viewBox attribute */
  viewBox: string;
  /** Array of path definitions for the icon */
  paths: SvgPathDefinition[];
  /** Metadata for icon identification */
  metadata: string;
}

// Icon definitions following Material Design and Heroicons patterns
export const XEG_ICONS = {
  Download: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M12 16l-4-4h3V4h2v8h3l-4 4z',
        fill: 'currentColor',
      },
      {
        d: 'M3 18v2h18v-2H3z',
        fill: 'currentColor',
      },
    ],
    metadata: 'download',
  },
  Settings: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z',
        fill: 'currentColor',
      },
      {
        d: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.2.07-.47-.12-.61L19.14 12.94z',
        fill: 'currentColor',
      },
    ],
    metadata: 'settings',
  },
  Close: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
        fill: 'currentColor',
      },
    ],
    metadata: 'close',
  },
  ChevronLeft: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z',
        fill: 'currentColor',
      },
    ],
    metadata: 'chevron-left',
  },
  ChevronRight: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
        fill: 'currentColor',
      },
    ],
    metadata: 'chevron-right',
  },
  ZoomIn: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
        fill: 'currentColor',
      },
      {
        d: 'M12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z',
        fill: 'currentColor',
      },
    ],
    metadata: 'zoom-in',
  },
  ArrowAutofitWidth: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M4 12l4-4v3h8V8l4 4-4 4v-3H8v3l-4-4z',
        fill: 'currentColor',
      },
    ],
    metadata: 'arrow-autofit-width',
  },
  ArrowAutofitHeight: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M12 4l4 4h-3v8h3l-4 4-4-4h3V8H8l4-4z',
        fill: 'currentColor',
      },
    ],
    metadata: 'arrow-autofit-height',
  },
  ArrowsMaximize: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M4 4v6h2V6.41l4.59 4.59 1.41-1.41L7.41 5H10V4H4zM4 20h6v-2H6.41l4.59-4.59-1.41-1.41L5 16.59V14H4v6zM20 4h-6v2h3.59l-4.59 4.59 1.41 1.41L18.59 8V10h2V4zM20 20v-6h-2v3.59l-4.59-4.59-1.41 1.41L16.59 18H14v2h6z',
        fill: 'currentColor',
      },
    ],
    metadata: 'arrows-maximize',
  },
  FileZip: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z',
        fill: 'currentColor',
      },
      {
        d: 'M14 9V3.5L19.5 9H14z',
        fill: 'currentColor',
      },
      {
        d: 'M10 12h2v2h-2v-2zM8 14h2v2H8v-2zM10 16h2v2h-2v-2zM8 18h2v2H8v-2z',
        fill: 'currentColor',
      },
    ],
    metadata: 'file-zip',
  },
} as const satisfies Record<string, XegIconDefinition>;

export type XegIconName = keyof typeof XEG_ICONS;
