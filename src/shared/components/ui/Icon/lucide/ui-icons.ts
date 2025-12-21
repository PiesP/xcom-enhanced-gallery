import type { LucideIconName } from '@shared/components/ui/Icon/lucide/icon-nodes';

export const UI_ICONS = {
  // Navigation
  toolbarPrev: 'chevron-left',
  toolbarNext: 'chevron-right',

  // Download
  toolbarDownloadCurrent: 'download',
  toolbarDownloadAll: 'folder-down',

  // Fit / sizing
  fitOriginal: 'maximize-2',
  fitWidth: 'move-horizontal',
  fitHeight: 'move-vertical',
  fitContainer: 'minimize-2',

  // Settings
  toolbarSettings: 'settings-2',

  // Communication
  toolbarTweetText: 'messages-square',

  // Close
  toolbarClose: 'x',
} as const satisfies Record<string, LucideIconName>;

export type UiIconKey = keyof typeof UI_ICONS;
export type UiIconName = (typeof UI_ICONS)[UiIconKey];
