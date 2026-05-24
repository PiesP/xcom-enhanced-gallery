/** @fileoverview Video player control detection constants. */

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

export const VIDEO_CONTROL_ROLES = ['slider', 'progressbar'] as const;

export const VIDEO_CONTROL_ARIA_TOKENS = [
  'volume',
  'mute',
  'unmute',
  'seek',
  'scrub',
  'timeline',
  'progress',
] as const;

type VideoControlDatasetPrefix = (typeof VIDEO_CONTROL_DATASET_PREFIXES)[number];
type VideoControlRole = (typeof VIDEO_CONTROL_ROLES)[number];
type VideoControlAriaToken = (typeof VIDEO_CONTROL_ARIA_TOKENS)[number];
