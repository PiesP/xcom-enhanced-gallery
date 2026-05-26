// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/** @fileoverview Shared event types for gallery event handling. */

export interface EventHandlers {
  readonly onMediaClick: (element: HTMLElement, event: MouseEvent) => Promise<void>;
  readonly onGalleryClose: () => void;
  readonly onKeyboardEvent?: (event: KeyboardEvent) => void;
}

export interface GalleryEventOptions {
  readonly enableKeyboard: boolean;
  readonly enableMediaDetection: boolean;
  readonly debugMode: boolean;
  readonly preventBubbling: boolean;
  readonly context: string;
}
