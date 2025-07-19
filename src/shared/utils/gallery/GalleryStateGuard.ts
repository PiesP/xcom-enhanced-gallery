/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview 갤러리 상태 보호 유틸리티
 * @description 갤러리 중복 열기 방지 및 상태 관리를 위한 중앙화된 가드 시스템
 * @version 1.0.0
 */

import { logger } from '@core/logging';
import { galleryState } from '@core/state/signals/gallery.signals';

/**
 * 갤러리 상태 보호 유틸리티
 *
 * 주요 기능:
 * - 갤러리 중복 열기 방지
 * - 갤러리 내부 요소 클릭 감지
 * - 상태 기반 액션 제어
 */
export class GalleryStateGuard {
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
  ];

  /**
   * 갤러리 액션 실행 가능 여부 확인
   * @param event 클릭 이벤트 (선택사항)
   * @returns 갤러리 트리거 가능 여부
   */
  static canTriggerGallery(event?: MouseEvent): boolean {
    try {
      // 1. 기본 갤러리 열림 상태 체크
      if (galleryState.value.isOpen) {
        logger.debug('GalleryStateGuard: Gallery already open, blocking trigger');
        return false;
      }

      // 2. 이벤트 유효성 체크
      if (event) {
        // 마우스 좌클릭만 허용
        if (event.button !== 0) {
          logger.debug('GalleryStateGuard: Non-left click, blocking trigger');
          return false;
        }

        // 갤러리 내부 요소 체크
        const target = event.target as HTMLElement;
        if (this.isGalleryInternalElement(target)) {
          logger.debug('GalleryStateGuard: Click on gallery internal element, blocking');
          return false;
        }

        // 갤러리 컨테이너 직접 클릭 체크
        if (this.isGalleryContainer(target)) {
          logger.debug('GalleryStateGuard: Click on gallery container, blocking');
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('GalleryStateGuard: Error checking gallery trigger capability:', error);
      return false;
    }
  }

  /**
   * 갤러리 내부 요소인지 확인
   * @param element 확인할 DOM 요소
   * @returns 갤러리 내부 요소 여부
   */
  private static isGalleryInternalElement(element: HTMLElement): boolean {
    return this.GALLERY_SELECTORS.some(selector => {
      try {
        return element.closest(selector) !== null;
      } catch {
        return false;
      }
    });
  }

  /**
   * 갤러리 컨테이너 자체인지 확인
   * @param element 확인할 DOM 요소
   * @returns 갤러리 컨테이너 여부
   */
  private static isGalleryContainer(element: HTMLElement): boolean {
    return this.GALLERY_SELECTORS.some(selector => {
      try {
        // 클래스명 기반 확인
        if (selector.startsWith('.')) {
          const className = selector.substring(1);
          return element.classList.contains(className);
        }
        // 속성 기반 확인
        if (selector.includes('[') && selector.includes(']')) {
          const match = selector.match(/\[([^\]]+)\]/);
          const matchedAttr = match?.[1];
          if (matchedAttr) {
            const attrName = matchedAttr.split('=')[0]?.trim();
            if (attrName) {
              return element.hasAttribute(attrName);
            }
          }
        }
        // ID 기반 확인
        if (selector.startsWith('#')) {
          const id = selector.substring(1);
          return element.id === id;
        }
        return false;
      } catch {
        return false;
      }
    });
  }

  /**
   * 갤러리 트리거 차단이 필요한 요소인지 확인
   * @param element 확인할 DOM 요소
   * @returns 차단 필요 여부
   */
  static shouldBlockGalleryTrigger(element: HTMLElement): boolean {
    try {
      // 갤러리가 열려있는 상태에서는 모든 내부 요소 차단
      if (galleryState.value.isOpen && this.isGalleryInternalElement(element)) {
        return true;
      }

      // 비디오 컨트롤 요소 차단
      if (this.isVideoControlElement(element)) {
        return true;
      }

      return false;
    } catch (error) {
      logger.error('GalleryStateGuard: Error checking gallery trigger blocking:', error);
      return false;
    }
  }

  /**
   * 비디오 컨트롤 요소인지 확인
   * @param element 확인할 DOM 요소
   * @returns 비디오 컨트롤 요소 여부
   */
  private static isVideoControlElement(element: HTMLElement): boolean {
    const videoControlSelectors = [
      '[data-testid="playButton"]',
      'button[aria-label*="재생"]',
      'button[aria-label*="Play"]',
      'button[aria-label*="일시정지"]',
      'button[aria-label*="Pause"]',
      'button[aria-label*="다시보기"]',
      'button[aria-label*="Replay"]',
      '.video-controls',
      '.player-controls',
      '[role="slider"]',
    ];

    return videoControlSelectors.some(selector => {
      try {
        return element.closest(selector) !== null;
      } catch {
        return false;
      }
    });
  }

  /**
   * 갤러리 상태 변경 감지를 위한 리스너 등록
   * @param callback 상태 변경 콜백
   * @returns 리스너 해제 함수
   */
  static onGalleryStateChange(callback: (isOpen: boolean) => void): () => void {
    const unsubscribe = galleryState.subscribe((state: { isOpen: boolean }) => {
      callback(state.isOpen);
    });

    return unsubscribe;
  }

  /**
   * 현재 갤러리 열림 상태 반환
   * @returns 갤러리 열림 상태
   */
  static isGalleryOpen(): boolean {
    return galleryState.value.isOpen;
  }

  /**
   * 디버깅용 갤러리 상태 정보 반환
   * @returns 갤러리 상태 정보
   */
  static getDebugInfo(): {
    isOpen: boolean;
    mediaCount: number;
    currentIndex: number;
    timestamp: number;
  } {
    const state = galleryState.value;
    return {
      isOpen: state.isOpen,
      mediaCount: state.mediaItems.length,
      currentIndex: state.currentIndex,
      timestamp: Date.now(),
    };
  }
}
