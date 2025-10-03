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

const RAW_ICON_DEFINITIONS = {
  download: {
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
  settings: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z',
        fill: 'currentColor',
      },
      {
        d: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.2.07-.47-.12-.61l-2.03-1.58z',
        fill: 'currentColor',
      },
    ],
    metadata: 'settings',
  },
  close: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
        fill: 'currentColor',
      },
    ],
    metadata: 'close',
  },
  'chevron-left': {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z',
        fill: 'currentColor',
      },
    ],
    metadata: 'chevron-left',
  },
  'chevron-right': {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
        fill: 'currentColor',
      },
    ],
    metadata: 'chevron-right',
  },
  'zoom-in': {
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
  'arrow-autofit-width': {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M4 12l4-4v3h8V8l4 4-4 4v-3H8v3l-4-4z',
        fill: 'currentColor',
      },
    ],
    metadata: 'arrow-autofit-width',
  },
  'arrow-autofit-height': {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M12 4l4 4h-3v8h3l-4 4-4-4h3V8H8l4-4z',
        fill: 'currentColor',
      },
    ],
    metadata: 'arrow-autofit-height',
  },
  'arrows-maximize': {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M4 4v6h2V6.41l4.59 4.59 1.41-1.41L7.41 5H10V4H4zM4 20h6v-2H6.41l4.59-4.59-1.41-1.41L5 16.59V14H4v6zM20 4h-6v2h3.59l-4.59 4.59 1.41 1.41L18.59 8V10h2V4zM20 20v-6h-2v3.59l-4.59-4.59-1.41 1.41L16.59 18H14v2h6z',
        fill: 'currentColor',
      },
    ],
    metadata: 'arrows-maximize',
  },
  'file-zip': {
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
  'language-auto': {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
        fill: 'currentColor',
      },
    ],
    metadata: 'language-auto',
  },
  'language-ko': {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
        fill: 'currentColor',
      },
      {
        d: 'M9 9h2v2H9V9zm2 4h2v2h-2v-2z',
        fill: 'currentColor',
      },
    ],
    metadata: 'language-ko',
  },
  'language-en': {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
        fill: 'currentColor',
      },
      {
        d: 'M8 9h2v1H8V9zm0 2h2v1H8v-1zm0 2h2v1H8v-1zm4-4h2v1h-2V9zm0 2h2v1h-2v-1z',
        fill: 'currentColor',
      },
    ],
    metadata: 'language-en',
  },
  'language-ja': {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
        fill: 'currentColor',
      },
      {
        d: 'M10 9h1v1h-1V9zm2 0h1v1h-1V9zm-2 2h1v1h-1v-1zm2 0h1v1h-1v-1zm-2 2h4v1h-4v-1z',
        fill: 'currentColor',
      },
    ],
    metadata: 'language-ja',
  },
  notifications: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
        fill: 'currentColor',
      },
    ],
    metadata: 'notifications',
  },
  'notifications-off': {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M20 18.69L7.84 6.14 5.27 3.49 4 4.76l2.8 2.8v.01c-.52.99-.8 2.16-.8 3.42v5l-2 2v1h13.73l2 2L21 19.72l-1-1.03zM12 22c1.11 0 2-.89 2-2h-4c0 1.11.89 2 2 2zm6-7.32V11c0-3.08-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68c-.15.03-.29.08-.42.12-.1.03-.2.07-.3.11h-.01c-.01 0-.01 0-.02.01-.23.09-.46.2-.68.31 0 0-.01 0-.01.01z',
        fill: 'currentColor',
      },
      {
        d: 'M3.41 1.86L2 3.27l3.18 3.18C5.06 7.08 5 7.54 5 8v5l-2 2v1h13.73l2 2 1.41-1.41L3.41 1.86z',
        fill: 'currentColor',
      },
    ],
    metadata: 'notifications-off',
  },
} as const satisfies Record<string, XegIconDefinition>;

export type XegIconSlug = keyof typeof RAW_ICON_DEFINITIONS;

export const XEG_ICON_DEFINITIONS: Readonly<typeof RAW_ICON_DEFINITIONS> =
  Object.freeze(RAW_ICON_DEFINITIONS);

export const XEG_ICONS = {
  Download: RAW_ICON_DEFINITIONS.download,
  Settings: RAW_ICON_DEFINITIONS.settings,
  Close: RAW_ICON_DEFINITIONS.close,
  ChevronLeft: RAW_ICON_DEFINITIONS['chevron-left'],
  ChevronRight: RAW_ICON_DEFINITIONS['chevron-right'],
  ZoomIn: RAW_ICON_DEFINITIONS['zoom-in'],
  ArrowAutofitWidth: RAW_ICON_DEFINITIONS['arrow-autofit-width'],
  ArrowAutofitHeight: RAW_ICON_DEFINITIONS['arrow-autofit-height'],
  ArrowsMaximize: RAW_ICON_DEFINITIONS['arrows-maximize'],
  FileZip: RAW_ICON_DEFINITIONS['file-zip'],
  LanguageAuto: RAW_ICON_DEFINITIONS['language-auto'],
  LanguageKo: RAW_ICON_DEFINITIONS['language-ko'],
  LanguageEn: RAW_ICON_DEFINITIONS['language-en'],
  LanguageJa: RAW_ICON_DEFINITIONS['language-ja'],
  Notifications: RAW_ICON_DEFINITIONS.notifications,
  NotificationsOff: RAW_ICON_DEFINITIONS['notifications-off'],
} as const satisfies Record<string, XegIconDefinition>;

export type XegIconName = keyof typeof XEG_ICONS;
