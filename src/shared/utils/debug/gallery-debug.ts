/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * 갤러리 디버깅 유틸리티
 * 갤러리 컨테이너 상태 진단 및 강제 표시 기능
 */

import { logger } from '@infrastructure/logging';

/**
 * 갤러리 디버깅을 위한 유틸리티 함수들
 */
export const galleryDebugUtils = {
  /**
   * 갤러리 컨테이너 상태 진단
   */
  diagnoseContainer(): void {
    const container = document.querySelector('.xeg-gallery-container');

    if (!container) {
      logger.info('❌ 갤러리 컨테이너를 찾을 수 없습니다.');
      logger.debug('Gallery container not found in DOM');
      return;
    }

    const style = window.getComputedStyle(container);
    const rect = container.getBoundingClientRect();

    const diagnosis = {
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      zIndex: style.zIndex,
      position: style.position,
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
      children: container.children.length,
      isInViewport: rect.width > 0 && rect.height > 0,
      hasBackground: style.backgroundColor !== 'rgba(0, 0, 0, 0)',
    };

    logger.info('🔍 갤러리 컨테이너 상태:', diagnosis);
    logger.debug('Gallery container diagnosis', diagnosis);
  },

  /**
   * 갤러리 강제 표시
   */
  forceShow(): void {
    const container = document.querySelector('.xeg-gallery-container');

    if (!container) {
      logger.info('❌ 갤러리 컨테이너를 찾을 수 없습니다.');
      logger.debug('Gallery container not found for force show');
      return;
    }

    (container as HTMLElement).style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 10000 !important;
      display: flex !important;
      opacity: 1 !important;
      visibility: visible !important;
      background: rgba(0, 0, 0, 0.95) !important;
      flex-direction: column !important;
      pointer-events: auto !important;
    `;

    logger.info('✅ 갤러리 강제 표시 완료');
    logger.debug('Gallery container force shown');
  },

  /**
   * 갤러리 상태 확인
   */
  checkState(): void {
    interface GalleryStateManager {
      getSignals(): {
        isOpen?: { value: boolean };
        mediaItems?: { value: unknown[] };
        currentIndex?: { value: number };
        isLoading?: { value: boolean };
        error?: { value: string | null };
      };
    }

    const galleryState = (window as unknown as Record<string, unknown>).xegGalleryState as
      | GalleryStateManager
      | undefined;
    if (galleryState) {
      const signals = galleryState.getSignals();
      const stateInfo = {
        isOpen: signals.isOpen?.value,
        mediaCount: signals.mediaItems?.value?.length ?? 0,
        currentIndex: signals.currentIndex?.value ?? 0,
        isLoading: signals.isLoading?.value,
        error: signals.error?.value,
      };

      logger.info('📊 갤러리 상태:', stateInfo);
      logger.debug('Gallery state info', stateInfo);
    } else {
      logger.info('❌ 갤러리 상태 매니저를 찾을 수 없습니다.');
      logger.debug('Gallery state manager not found in global scope');
    }
  },

  /**
   * 모든 갤러리 컨테이너 제거
   */
  clearAllContainers(): void {
    const containers = document.querySelectorAll('.xeg-gallery-container');
    containers.forEach(container => container.remove());

    logger.info(`🧹 ${containers.length}개 갤러리 컨테이너 제거 완료`);
    logger.debug(`Cleared ${containers.length} gallery containers`);
  },

  /**
   * Signal 상태 강제 재설정
   */
  forceSignalReset(): void {
    try {
      interface GalleryStateManager {
        resetSignals?(): void;
      }

      const galleryState = (window as unknown as Record<string, unknown>).xegGalleryState as
        | GalleryStateManager
        | undefined;
      if (galleryState?.resetSignals) {
        galleryState.resetSignals();
        logger.info('✅ 갤러리 Signal 상태 리셋 완료');
        logger.debug('Gallery signals forcefully reset');
      } else {
        logger.info('❌ 갤러리 상태 리셋 기능을 찾을 수 없습니다.');
      }
    } catch (error) {
      logger.error('❌ Signal 리셋 중 오류 발생:', error);
      logger.error('Error during signal reset', error);
    }
  },

  /**
   * 완전한 갤러리 시스템 진단
   */
  fullDiagnosis(): void {
    logger.info('🔧 갤러리 시스템 전체 진단 시작...');

    this.checkState();
    this.diagnoseContainer();

    // Preact Signals 상태 확인
    const preactSignals = (window as unknown as Record<string, unknown>).preactSignals;
    logger.info('📡 Preact Signals 사용 가능:', !!preactSignals);

    // 이벤트 리스너 확인
    const tweetPhotos = document.querySelectorAll('[data-testid="tweetPhoto"]');
    logger.info('📸 트윗 사진 요소 개수:', tweetPhotos.length);

    logger.info('🔧 갤러리 시스템 진단 완료');
  },
};

// 개발 환경에서 전역으로 노출
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as unknown as Record<string, unknown>).galleryDebug = galleryDebugUtils;
  logger.debug('Gallery debug utilities exposed to window.galleryDebug');
}
