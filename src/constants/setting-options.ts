// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/** Finite setting domains shared by types, validation, services, and UI. */

export const THEME_OPTIONS = ['auto', 'light', 'dark'] as const;
export type ThemeSetting = (typeof THEME_OPTIONS)[number];

export const IMAGE_FIT_MODES = ['original', 'fitWidth', 'fitHeight', 'fitContainer'] as const;
export type ImageFitMode = (typeof IMAGE_FIT_MODES)[number];

export const VIDEO_CLICK_MODES = ['block-all', 'block-controls-only', 'allow-all'] as const;
export type VideoClickMode = (typeof VIDEO_CLICK_MODES)[number];

function isStringOption<const Options extends readonly string[]>(
  value: unknown,
  options: Options
): value is Options[number] {
  return typeof value === 'string' && options.some((option) => option === value);
}

export function isThemeSetting(value: unknown): value is ThemeSetting {
  return isStringOption(value, THEME_OPTIONS);
}

export function isImageFitMode(value: unknown): value is ImageFitMode {
  return isStringOption(value, IMAGE_FIT_MODES);
}

export function isVideoClickMode(value: unknown): value is VideoClickMode {
  return isStringOption(value, VIDEO_CLICK_MODES);
}
