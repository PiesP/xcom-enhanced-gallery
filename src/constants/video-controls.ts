/**
 * @fileoverview Video and system-related constants
 */

/**
 * Data-testid prefixes that identify video chrome controls
 */
export const VIDEO_CONTROL_DATASET_PREFIXES = [
  'play',
  'pause',
  'mute',
  'unmute',
  'volume',
  'slider',
  'seek',
  'scrub',
  'progress',
] as const;

/**
 * Role attributes that imply an interactive media control when scoped to the video player
 */
export const VIDEO_CONTROL_ROLES = ['slider', 'progressbar'] as const;

/**
 * Aria-label tokens that commonly describe video controls (volume, scrubber, etc.)
 */
export const VIDEO_CONTROL_ARIA_TOKENS = [
  'volume',
  'mute',
  'unmute',
  'seek',
  'scrub',
  'timeline',
  'progress',
] as const;

/**
 * Gallery view modes - supports vertical gallery only
 */
export const VIEW_MODES = ['verticalList'] as const;
