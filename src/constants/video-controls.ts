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
  ".video-controls button",
  ".video-progress button",
  "video::-webkit-media-controls-play-button",
  "video::-webkit-media-controls-mute-button",
] as const;

/**
 * System page list
 */
export const SYSTEM_PAGES = [
  "home",
  "explore",
  "notifications",
  "messages",
  "bookmarks",
  "lists",
  "profile",
  "settings",
  "help",
  "search",
  "login",
  "signup",
] as const;

/**
 * Gallery view modes - supports vertical gallery only
 */
export const VIEW_MODES = ["verticalList"] as const;
