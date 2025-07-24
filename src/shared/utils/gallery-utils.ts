/**
 * @fileoverview 갤러리 유틸리티 통합 모듈
 * @version 3.0.0 - Phase 4 통합
 *
 * 갤러리 상태 관리와 이벤트 제어를 위한 통합 유틸리티
 * - 갤러리 상태 보호 (중복 열기 방지)
 * - 비디오 제어 요소 차단
 * - 갤러리 내부 요소 감지
 */

import { logger } from '@shared/logging';
import { galleryState } from '@shared/state/signals/gallery.signals';

/**
 * 갤러리 통합 유틸리티 클래스
 *
 * 이전의 GalleryStateGuard와 VideoControlBlocker를 통합하여
 * 갤러리 관련 모든 상태 확인과 이벤트 제어를 단일 지점에서 처리합니다.
 */
export class GalleryUtils {
  // 갤러리 요소 선택자들
  private static readonly GALLERY_SELECTORS = [
    '.xeg-gallery-container',
    '[data-gallery-element]',
    '#xeg-gallery-root',
    '.vertical-gallery-view',
    '[data-xeg-gallery-container]',
    '[data-xeg-gallery]',
    '.xeg-vertical-gallery',
    '[data-xeg-role="gallery"]',
    '.toolbar',
    '.toolbarButton',
    '.fitButton',
    '.xeg-toolbar',
    '.xeg-button',
    '.gallery-controls',
    '.gallery-toolbar',
    '.gallery-header',
    '.gallery-footer',
    '.gallery-content',
    '.gallery-item',
    '.media-viewer',
    '.xeg-toast-container',
    '.xeg-toast',
    '.toast-container',
    '.notification',
  ];

  // 비디오 제어 요소 선택자들 (구체적인 제어 요소만 차단)
  private static readonly VIDEO_CONTROL_SELECTORS = [
    // 플레이 버튼 (가장 구체적)
    '[data-testid="playButton"]',
    'button[aria-label*="재생"]',
    'button[aria-label*="Play"]',
    'button[aria-label*="일시정지"]',
    'button[aria-label*="Pause"]',
    'button[aria-label*="다시보기"]',
    'button[aria-label*="Replay"]',

    // 비디오 컨트롤 UI (구체적인 컨트롤만)
    '.video-controls button',
    '.player-controls button',
    '[role="slider"]', // 진행 바
    'video::-webkit-media-controls-play-button',
    'video::-webkit-media-controls-fullscreen-button',

    // 갤러리 내 컨트롤 (더 구체적으로)
    '.xeg-gallery-container .video-controls',
    '.xeg-gallery-container button[aria-label*="Play"]',
    '.xeg-gallery-container button[aria-label*="Pause"]',
    '[data-gallery-element] .video-controls',

    // 트위터 비디오 관련 (구체적인 컨트롤 요소만)
    '[data-testid="videoPlayer"] button',
    '[data-testid="videoComponent"] button',
    '.tweet-video-control button',
  ];

  /**
   * 갤러리 트리거 가능 여부 확인 (통합 메인 함수)
   * @param event 클릭 이벤트 (선택사항)
   * @returns 갤러리 트리거 가능 여부
   */
  static canTriggerGallery(event?: MouseEvent): boolean {
    try {
      // 1. 기본 갤러리 열림 상태 체크
      if (galleryState.value.isOpen) {
        logger.debug('GalleryUtils: Gallery already open, blocking trigger');
        return false;
      }

      // 2. 이벤트 유효성 체크
      if (event) {
        // 마우스 좌클릭만 허용
        if (event.button !== 0) {
          logger.debug('GalleryUtils: Non-left click, blocking trigger');
          return false;
        }

        const target = event.target as HTMLElement;

        // 3. 갤러리 내부 요소 체크
        if (this.isGalleryInternalElement(target)) {
          logger.debug('GalleryUtils: Click on gallery internal element, blocking');
          return false;
        }

        // 4. 갤러리 컨테이너 직접 클릭 체크
        if (this.isGalleryContainer(target)) {
          logger.debug('GalleryUtils: Click on gallery container, blocking');
          return false;
        }

        // 5. 비디오 제어 요소 체크
        if (this.isVideoControlElement(target)) {
          logger.debug('GalleryUtils: Click on video control element, blocking');
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('GalleryUtils: Error checking gallery trigger capability:', error);
      return false;
    }
  }

  /**
   * 갤러리 트리거 차단 여부 확인 (별칭)
   * @param element 확인할 DOM 요소
   * @returns 갤러리 트리거 차단 여부
   */
  static shouldBlockGalleryTrigger(element: HTMLElement): boolean {
    return (
      !this.canTriggerGallery() ||
      this.isGalleryInternalElement(element) ||
      this.isVideoControlElement(element)
    );
  }

  /**
   * 갤러리 내부 요소인지 확인
   * @param element 확인할 DOM 요소
   * @returns 갤러리 내부 요소 여부
   */
  static isGalleryInternalElement(element: HTMLElement): boolean {
    if (!element) return false;

    try {
      // 1. 직접 선택자 매칭
      for (const selector of this.GALLERY_SELECTORS) {
        if (element.matches(selector)) {
          return true;
        }
      }

      // 2. 부모 요소 중 갤러리 요소 탐색
      for (const selector of this.GALLERY_SELECTORS) {
        if (element.closest(selector)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.warn('GalleryUtils: Error checking gallery internal element:', error);
      return false;
    }
  }

  /**
   * 갤러리 컨테이너 자체인지 확인
   * @param element 확인할 DOM 요소
   * @returns 갤러리 컨테이너 여부
   */
  static isGalleryContainer(element: HTMLElement): boolean {
    if (!element) return false;

    const containerSelectors = [
      '.xeg-gallery-container',
      '[data-gallery-element]',
      '#xeg-gallery-root',
      '.vertical-gallery-view',
      '[data-xeg-gallery-container]',
      '[data-xeg-gallery]',
    ];

    try {
      return containerSelectors.some(selector => element.matches(selector));
    } catch (error) {
      logger.warn('GalleryUtils: Error checking gallery container:', error);
      return false;
    }
  }

  /**
   * 비디오 제어 요소인지 확인
   * @param element 확인할 DOM 요소
   * @returns 비디오 제어 요소 여부
   */
  static isVideoControlElement(element: HTMLElement): boolean {
    if (!element) return false;

    try {
      // 1. 직접 선택자 매칭
      for (const selector of this.VIDEO_CONTROL_SELECTORS) {
        if (element.matches(selector)) {
          return true;
        }
      }

      // 2. 부모 요소 중 비디오 제어 요소 탐색
      for (const selector of this.VIDEO_CONTROL_SELECTORS) {
        if (element.closest(selector)) {
          return true;
        }
      }

      // 3. 특별 체크: 비디오 요소의 자식
      if (element.closest('video')) {
        return true;
      }

      // 4. 비디오 관련 속성 체크
      if (
        element.hasAttribute('controls') ||
        element.getAttribute('role') === 'slider' ||
        element.tagName.toLowerCase() === 'video'
      ) {
        return true;
      }

      return false;
    } catch (error) {
      logger.warn('GalleryUtils: Error checking video control element:', error);
      return false;
    }
  }

  /**
   * 갤러리 내부 이벤트인지 확인
   * @param event 마우스 이벤트
   * @returns 갤러리 내부 이벤트 여부
   */
  static isGalleryInternalEvent(event: MouseEvent): boolean {
    if (!event.target) return false;
    return this.isGalleryInternalElement(event.target as HTMLElement);
  }

  /**
   * 갤러리 이벤트 차단 여부 확인
   * @param event 마우스 이벤트
   * @returns 이벤트 차단 여부
   */
  static shouldBlockGalleryEvent(event: MouseEvent): boolean {
    if (!event.target) return false;

    const target = event.target as HTMLElement;
    return this.isGalleryInternalElement(target) || this.isVideoControlElement(target);
  }
}

// 하위 호환성을 위한 별칭들
export const GalleryStateGuard = GalleryUtils;
export const VideoControlBlocker = {
  shouldBlockGalleryTrigger: GalleryUtils.shouldBlockGalleryTrigger.bind(GalleryUtils),
};

// 편의 함수들
export const {
  canTriggerGallery,
  shouldBlockGalleryTrigger,
  isGalleryInternalElement,
  isGalleryContainer,
  isVideoControlElement,
  isGalleryInternalEvent,
  shouldBlockGalleryEvent,
} = GalleryUtils;
