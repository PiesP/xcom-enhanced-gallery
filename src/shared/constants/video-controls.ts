/**
 * @fileoverview Video Control Selectors - Constants
 * @version 1.0.0
 *
 * 비디오 제어 요소 선택자를 통합 관리하여 중복을 제거하고 일관성을 보장합니다.
 */

/**
 * 비디오 제어 요소 선택자 목록
 *
 * 이 선택자들과 일치하는 요소에서의 클릭은 갤러리 열기를 차단해야 합니다.
 * Twitter의 비디오 플레이어 UI 요소들을 포함합니다.
 */
export const VIDEO_CONTROL_SELECTORS = [
  // Twitter 비디오 플레이어 기본 버튼
  '[data-testid="playButton"]',
  '[data-testid="pauseButton"]',
  '[data-testid="muteButton"]',
  '[data-testid="unmuteButton"]',

  // 접근성 라벨 기반 선택자 (다국어 지원)
  'button[aria-label*="재생"]',
  'button[aria-label*="Play"]',
  'button[aria-label*="일시정지"]',
  'button[aria-label*="Pause"]',
  'button[aria-label*="음소거"]',
  'button[aria-label*="Mute"]',
  'button[aria-label*="소리 켜기"]',
  'button[aria-label*="Unmute"]',
  'button[aria-label*="다시보기"]',
  'button[aria-label*="Replay"]',

  // 비디오 요소 자체
  'video',

  // 일반적인 비디오 제어 클래스
  '.video-controls',
  '.player-controls',
  '.video-overlay',
  '.video-player-controls',

  // 프로그레스 바 및 시간 관련
  '.video-progress',
  '.video-scrubber',
  '.video-timeline',

  // 볼륨 관련
  '.volume-control',
  '.volume-slider',
] as const;

/**
 * 비디오 제어 요소인지 확인하는 유틸리티 함수
 *
 * @param element - 확인할 DOM 요소
 * @returns 비디오 제어 요소인지 여부
 */
export function isVideoControlElement(element: HTMLElement): boolean {
  return VIDEO_CONTROL_SELECTORS.some(selector => {
    try {
      return element.matches(selector) || element.closest(selector) !== null;
    } catch {
      // 잘못된 선택자인 경우 무시
      return false;
    }
  });
}

/**
 * 갤러리 트리거를 차단해야 하는 비디오 관련 요소인지 확인
 *
 * @param target - 클릭된 요소
 * @returns 갤러리 트리거 차단 여부
 */
export function shouldBlockGalleryForVideo(target: HTMLElement): boolean {
  return isVideoControlElement(target);
}
