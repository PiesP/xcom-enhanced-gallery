/** Lucide icon SVG node definitions (inlined, data-driven, ISC Licensed). */

/** SVG element tag type for icon nodes. */
type LucideIconTag = 'path' | 'circle';

/** SVG node: [tag, attributes]. */
export type LucideIconNode = readonly [
  tag: LucideIconTag,
  attrs: Readonly<Record<string, string | number>>,
];

/** Array of SVG nodes representing a complete icon. */
type LucideIconNodes = readonly LucideIconNode[];

/**
 * Lucide icon definitions as SVG node arrays.
 * Source: https://github.com/lucide-icons/lucide (ISC License)
 */
export const LUCIDE_ICON_NODES = {
  // Navigation
  'chevron-left': [['path', { d: 'm15 18-6-6 6-6' }]],
  'chevron-right': [['path', { d: 'm9 18 6-6-6-6' }]],

  // Download
  download: [
    ['path', { d: 'M12 15V3' }],
    ['path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }],
    ['path', { d: 'm7 10 5 5 5-5' }],
  ],
  'folder-down': [
    [
      'path',
      {
        d: 'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z',
      },
    ],
    ['path', { d: 'M12 10v6' }],
    ['path', { d: 'm15 13-3 3-3-3' }],
  ],

  // Fit / sizing
  'maximize-2': [
    ['path', { d: 'M15 3h6v6' }],
    ['path', { d: 'm21 3-7 7' }],
    ['path', { d: 'm3 21 7-7' }],
    ['path', { d: 'M9 21H3v-6' }],
  ],
  'minimize-2': [
    ['path', { d: 'm14 10 7-7' }],
    ['path', { d: 'M20 10h-6V4' }],
    ['path', { d: 'm3 21 7-7' }],
    ['path', { d: 'M4 14h6v6' }],
  ],
  'move-horizontal': [
    ['path', { d: 'm18 8 4 4-4 4' }],
    ['path', { d: 'M2 12h20' }],
    ['path', { d: 'm6 8-4 4 4 4' }],
  ],
  'move-vertical': [
    ['path', { d: 'M12 2v20' }],
    ['path', { d: 'm8 18 4 4 4-4' }],
    ['path', { d: 'm8 6 4-4 4 4' }],
  ],

  // Settings
  'settings-2': [
    ['path', { d: 'M14 17H5' }],
    ['path', { d: 'M19 7h-9' }],
    ['circle', { cx: 17, cy: 17, r: 3 }],
    ['circle', { cx: 7, cy: 7, r: 3 }],
  ],

  // Communication
  'messages-square': [
    [
      'path',
      {
        d: 'M16 10a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 14.286V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z',
      },
    ],
    [
      'path',
      {
        d: 'M20 9a2 2 0 0 1 2 2v10.286a.71.71 0 0 1-1.212.502l-2.202-2.202A2 2 0 0 0 17.172 19H10a2 2 0 0 1-2-2v-1',
      },
    ],
  ],

  // Links
  'external-link': [
    ['path', { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' }],
    ['path', { d: 'm15 3 6 6' }],
    ['path', { d: 'M10 14 21 3' }],
  ],

  // Close
  x: [
    ['path', { d: 'M18 6 6 18' }],
    ['path', { d: 'm6 6 12 12' }],
  ],
} as const satisfies Record<string, LucideIconNodes>;

/** Type-safe icon name (derived from LUCIDE_ICON_NODES keys). */
export type LucideIconName = keyof typeof LUCIDE_ICON_NODES;
