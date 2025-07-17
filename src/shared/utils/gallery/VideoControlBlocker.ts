/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * @fileoverview 비디오 제어 요소 차단 유틸리티
 * @description 비디오 플레이어 제어 요소에서 갤러리 트리거를 차단하는 통합 유틸리티
 * @version 1.0.0
 */

import { logger } from '@infrastructure/logging';

/**
 * 비디오 제어 요소 차단 통합 유틸리티
 *
 * 주요 기능:
 * - 비디오 플레이어 컨트롤 요소 감지
 * - 갤러리 트리거 차단 로직 통합
 * - 다양한 플레이어 UI 지원
 */
export class VideoControlBlocker {
  private static readonly BLOCK_SELECTORS = [
    // 플레이 버튼
    '[data-testid="playButton"]',
    'button[aria-label*="재생"]',
    'button[aria-label*="Play"]',
    'button[aria-label*="일시정지"]',
    'button[aria-label*="Pause"]',
    'button[aria-label*="다시보기"]',
    'button[aria-label*="Replay"]',

    // 비디오 컨트롤 UI
    '.video-controls',
    '.player-controls',
    '[role="slider"]', // 진행 바
    'video::-webkit-media-controls',

    // 갤러리 내 컨트롤
    '.xeg-gallery-container video',
    '.xeg-gallery-container button',
    '[data-gallery-element] button',

    // Twitter/X 특화 비디오 컨트롤
    '[data-testid="videoPlayer"]',
    '[data-testid="videoComponent"]',
    '.tweet-video-control',
    '.r-1niwhzg', // Twitter 비디오 컨트롤 클래스

    // 일반적인 비디오 컨트롤 요소
    'video',
    'video *',
    '.video-player',
    '.video-wrapper',
    '[controls]',
  ];

  /**
   * 비디오 제어 요소 클릭인지 확인 (갤러리 트리거 차단)
   * @param element 확인할 DOM 요소
   * @returns 갤러리 트리거 차단 여부
   */
  static shouldBlockGalleryTrigger(element: HTMLElement): boolean {
    try {
      // 직접 선택자 매칭
      const isDirectMatch = this.BLOCK_SELECTORS.some(selector => {
        try {
          return element.matches(selector) || element.closest(selector) !== null;
        } catch {
          return false;
        }
      });

      if (isDirectMatch) {
        logger.debug('VideoControlBlocker: Direct match found, blocking gallery trigger');
        return true;
      }

      // 비디오 요소 내부인지 확인
      const videoElement = element.closest('video');
      if (videoElement) {
        logger.debug('VideoControlBlocker: Inside video element, blocking gallery trigger');
        return true;
      }

      // 비디오 컨테이너 내부인지 확인
      const videoContainer = element.closest(
        '[data-testid="videoComponent"], [data-testid="videoPlayer"]'
      );
      if (videoContainer) {
        logger.debug('VideoControlBlocker: Inside video container, blocking gallery trigger');
        return true;
      }

      return false;
    } catch (error) {
      logger.error('VideoControlBlocker: Error checking video control element:', error);
      return false;
    }
  }

  /**
   * 비디오 관련 요소인지 확인 (디버깅용)
   * @param element 확인할 DOM 요소
   * @returns 비디오 관련 요소 여부
   */
  static isVideoRelatedElement(element: HTMLElement): boolean {
    try {
      // 비디오 태그 확인
      if (element.tagName.toLowerCase() === 'video') {
        return true;
      }

      // 비디오 컨테이너 확인
      const videoContainerSelectors = [
        '[data-testid="videoComponent"]',
        '[data-testid="videoPlayer"]',
        '.video-player',
        '.video-wrapper',
        '.tweet-video',
      ];

      return videoContainerSelectors.some(selector => {
        try {
          return element.matches(selector) || element.closest(selector) !== null;
        } catch {
          return false;
        }
      });
    } catch (error) {
      logger.error('VideoControlBlocker: Error checking video related element:', error);
      return false;
    }
  }

  /**
   * 커스텀 차단 선택자 추가
   * @param selectors 추가할 선택자 배열
   */
  static addCustomBlockSelectors(selectors: string[]): void {
    this.BLOCK_SELECTORS.push(...selectors);
    logger.debug('VideoControlBlocker: Added custom block selectors:', selectors);
  }

  /**
   * 현재 차단 선택자 목록 반환 (디버깅용)
   * @returns 차단 선택자 배열
   */
  static getBlockSelectors(): readonly string[] {
    return [...this.BLOCK_SELECTORS];
  }

  /**
   * 특정 요소에서 비디오 제어 요소 찾기
   * @param container 검색할 컨테이너 요소
   * @returns 찾은 비디오 제어 요소들
   */
  static findVideoControlElements(container: HTMLElement): HTMLElement[] {
    const elements: HTMLElement[] = [];

    this.BLOCK_SELECTORS.forEach(selector => {
      try {
        const found = container.querySelectorAll<HTMLElement>(selector);
        elements.push(...Array.from(found));
      } catch {
        // 유효하지 않은 선택자 무시
      }
    });

    return elements;
  }
}
