/**
 * @fileoverview 비디오 및 시스템 관련 상수
 */

/**
 * 비디오 제어 요소 선택자
 */
export const VIDEO_CONTROL_SELECTORS = [
  '[data-testid="playButton"]',
  '[data-testid="pauseButton"]',
  '[data-testid="muteButton"]',
  '[data-testid="unmuteButton"]',
  '.video-controls button',
  '.video-progress button',
  'video::-webkit-media-controls-play-button',
  'video::-webkit-media-controls-mute-button',
] as const;

/**
 * 시스템 페이지 목록
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
 * 갤러리 뷰 모드 - 수직 갤러리만 지원
 */
export const VIEW_MODES = ['verticalList'] as const;
