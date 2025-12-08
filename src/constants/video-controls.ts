/**
 * @fileoverview Video and system-related constants
 */

/**
 * Video control element selectors
 */
export const VIDEO_CONTROL_SELECTORS = [
  '[data-testid="playButton"]',
  '[data-testid="pauseButton"]',
  '[data-testid="muteButton"]',
  '[data-testid="unmuteButton"]',
  '[data-testid="volumeButton"]',
  '[data-testid="volumeSlider"]',
  '[data-testid="volumeControl"]',
  '[data-testid="videoProgressSlider"]',
  '[data-testid="seekBar"]',
  '[data-testid="scrubber"]',
  '[data-testid="videoPlayer"] [role="slider"]',
  '[data-testid="videoPlayer"] [role="progressbar"]',
  '[data-testid="videoPlayer"] [data-testid="SliderRail"]',
  '[data-testid="videoPlayer"] input[type="range"]',
  '[data-testid="videoPlayer"] [aria-label*="Volume"]',
  '.video-controls button',
  '.video-progress button',
] as const;

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
 * System page list
 */
export const SYSTEM_PAGES = [
  'home',
  'explore',
  'notifications',
  'messages',
  'bookmarks',
  'lists',
  'profile',
  'settings',
  'help',
  'search',
  'login',
  'signup',
] as const;

/**
 * Gallery view modes - supports vertical gallery only
 */
export const VIEW_MODES = ['verticalList'] as const;
