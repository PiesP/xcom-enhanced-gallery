/**
 * @fileoverview 갤러리 유틸리티 클래스
 */

import { logger } from '@shared/logging/logger';
import { galleryState } from '@shared/state/signals/gallery.signals';

/** 갤러리 통합 유틸리티 클래스 */
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

  // 비디오 제어 요소 선택자들
  private static readonly VIDEO_CONTROL_SELECTORS = [
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

  /** 갤러리 트리거 가능 여부 확인 */
  static canTriggerGallery(event?: MouseEvent): boolean {
    try {
      if (galleryState.value.isOpen) {
        logger.debug('GalleryUtils: Gallery already open, blocking trigger');
        return false;
      }
      if (event) {
        // 마우스 좌클릭만 허용
        if (event.button !== 0) {
          logger.debug('GalleryUtils: Non-left click, blocking trigger');
          return false;
        }

        const target = event.target as HTMLElement;

        // 3. 비디오 제어 요소 차단
        if (this.shouldBlockGalleryTrigger(target, event)) {
          logger.debug('GalleryUtils: Video control element, blocking trigger');
          return false;
        }

        // 4. 갤러리 내부 요소 체크
        if (this.isGalleryInternalElement(target)) {
          logger.debug('GalleryUtils: Gallery internal element, blocking trigger');
          return false;
        }
      }

      // 5. 모든 체크 통과
      logger.debug('GalleryUtils: All checks passed, allowing gallery trigger');
      return true;
    } catch (error) {
      logger.error('GalleryUtils: Error in canTriggerGallery:', error);
      return false; // 에러 시 안전하게 차단
    }
  }

  /**
   * 비디오 제어 요소 여부 확인 및 갤러리 트리거 차단 필요성 체크
   * @param element 확인할 요소
   * @param event 클릭 이벤트 (선택사항)
   * @returns 갤러리 트리거를 차단해야 하는지 여부
   */
  static shouldBlockGalleryTrigger(element: HTMLElement, _event?: MouseEvent): boolean {
    try {
      // null 체크
      if (!element) {
        logger.debug('VideoControlBlocker: No element provided');
        return false;
      }

      // 1. 비디오 제어 요소 직접 체크
      if (this.isVideoControlElement(element)) {
        logger.debug('VideoControlBlocker: Direct video control element detected');
        return true;
      }

      // 2. 부모 요소들 중 비디오 제어 요소 체크 (최대 5단계)
      let current = element.parentElement;
      let depth = 0;
      const maxDepth = 5;

      while (current && depth < maxDepth) {
        if (this.isVideoControlElement(current)) {
          logger.debug(
            `VideoControlBlocker: Parent video control element detected at depth ${depth}`
          );
          return true;
        }
        current = current.parentElement;
        depth++;
      }

      // 3. 갤러리가 열린 상태에서는 모든 갤러리 내부 요소 차단
      if (!this.canTriggerGallery() || this.isGalleryInternalElement(element)) {
        logger.debug('VideoControlBlocker: Gallery internal interaction, blocking');
        return true;
      }

      // 4. 모든 체크 통과 - 차단하지 않음
      return false;
    } catch (error) {
      logger.error('VideoControlBlocker: Error in shouldBlockGalleryTrigger:', error);
      return true; // 에러 시 안전하게 차단
    }
  }

  /**
   * 비디오 제어 요소인지 확인
   * @param element 확인할 요소
   * @returns 비디오 제어 요소 여부
   */
  static isVideoControlElement(element: HTMLElement): boolean {
    if (!element) return false;

    try {
      // 1. 선택자 기반 체크
      const isVideoControl = this.VIDEO_CONTROL_SELECTORS.some(selector => {
        try {
          return element.matches(selector);
        } catch {
          return false;
        }
      });

      if (isVideoControl) {
        logger.debug(`VideoControlBlocker: Video control element detected: ${element.tagName}`);
        return true;
      }

      // 2. 역할 기반 체크
      const role = element.getAttribute('role');
      if (role === 'slider' || role === 'button') {
        const ariaLabel = element.getAttribute('aria-label') || '';
        const isPlayControl = /재생|play|일시정지|pause|다시보기|replay/i.test(ariaLabel);
        if (isPlayControl) {
          logger.debug('VideoControlBlocker: Play control detected via aria-label');
          return true;
        }
      }

      // 3. 비디오 요소 직접 체크
      if (element.tagName === 'VIDEO') {
        logger.debug('VideoControlBlocker: Direct video element');
        return true;
      }

      return false;
    } catch (error) {
      logger.error('VideoControlBlocker: Error checking video control element:', error);
      return false;
    }
  }

  /**
   * 갤러리 내부 요소인지 확인
   * @param element 확인할 요소
   * @returns 갤러리 내부 요소 여부
   */
  static isGalleryInternalElement(element: HTMLElement): boolean {
    if (!element) return false;

    try {
      // 1. 자기 자신이 갤러리 요소인지 체크
      const isGalleryElement = this.GALLERY_SELECTORS.some(selector => {
        try {
          return element.matches(selector);
        } catch {
          return false;
        }
      });

      if (isGalleryElement) {
        return true;
      }

      // 2. 부모 요소 중 갤러리 컨테이너 체크
      return this.isGalleryContainer(element);
    } catch (error) {
      logger.error('GalleryUtils: Error checking gallery internal element:', error);
      return false;
    }
  }

  /**
   * 갤러리 컨테이너 내부에 있는지 확인
   * @param element 확인할 요소
   * @returns 갤러리 컨테이너 내부 여부
   */
  static isGalleryContainer(element: HTMLElement): boolean {
    if (!element) return false;

    try {
      let current: HTMLElement | null = element;
      const maxDepth = 10; // 무한 루프 방지
      let depth = 0;

      while (current && depth < maxDepth) {
        const isContainer = this.GALLERY_SELECTORS.some(selector => {
          try {
            return current!.matches(selector);
          } catch {
            return false;
          }
        });

        if (isContainer) {
          return true;
        }

        current = current.parentElement;
        depth++;
      }

      return false;
    } catch (error) {
      logger.error('GalleryUtils: Error checking gallery container:', error);
      return false;
    }
  }
}
