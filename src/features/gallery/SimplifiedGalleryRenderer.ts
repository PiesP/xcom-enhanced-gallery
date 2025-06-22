/**
 * @fileoverview Simplified Gallery Renderer
 * @version 1.0.0 - Clean Architecture 적용
 *
 * 단일 책임 원칙에 따른 갤러리 렌더러
 * - 렌더링만 담당
 * - 상태 관리는 signals에 위임
 * - 간결한 생명주기 관리
 */

import type {
  GalleryRenderOptions,
  GalleryRenderer as GalleryRendererInterface,
} from '@core/interfaces/gallery.interfaces';
import {
  closeGallery,
  galleryState,
  setError,
  setLoading,
} from '@core/state/signals/unified-gallery.signals';
import type { MediaInfo } from '@core/types/media.types';
import { VerticalGalleryView } from '@features/gallery/components/vertical-gallery-view';
import '@features/gallery/styles/gallery-global.css';
import { logger } from '@infrastructure/logging/logger';
import { getPreact } from '@infrastructure/external/vendors';

/**
 * 갤러리 정리 관리자
 */
class GalleryCleanupManager {
  private cleanupTasks: (() => void)[] = [];

  addTask(task: () => void): void {
    this.cleanupTasks.push(task);
  }

  executeAll(): void {
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        logger.warn('[CleanupManager] 정리 작업 실패:', error);
      }
    });
    this.cleanupTasks = [];
  }
}

/**
 * 간소화된 갤러리 렌더러
 */
export class SimplifiedGalleryRenderer implements GalleryRendererInterface {
  private container: HTMLDivElement | null = null;
  private isRenderingFlag = false;
  private readonly cleanupManager = new GalleryCleanupManager();
  private stateUnsubscribe: (() => void) | null = null;
  private onCloseCallback?: () => void;

  constructor() {
    this.setupStateSubscription();
  }

  /**
   * 갤러리 닫기 콜백 설정 (인터페이스 구현)
   */
  setOnCloseCallback(onClose: () => void): void {
    this.onCloseCallback = onClose;
  }

  /**
   * 상태 구독 설정
   */
  private setupStateSubscription(): void {
    this.stateUnsubscribe = galleryState.subscribe(state => {
      if (state.isOpen && !this.isRenderingFlag) {
        this.renderGallery();
      } else if (!state.isOpen && this.container) {
        this.cleanupGallery();
      }
    });
  }

  /**
   * 갤러리 렌더링
   */
  private renderGallery(): void {
    if (this.isRenderingFlag) return;

    const state = galleryState.value;
    if (!state.isOpen || state.mediaItems.length === 0) return;

    this.isRenderingFlag = true;
    logger.info('[GalleryRenderer] 렌더링 시작');

    try {
      this.createContainer();
      this.renderComponent(state);
    } catch (error) {
      logger.error('[GalleryRenderer] 렌더링 실패:', error);
      setError('갤러리 렌더링에 실패했습니다.');
    } finally {
      this.isRenderingFlag = false;
    }
  }

  /**
   * 컨테이너 생성
   */
  private createContainer(): void {
    this.cleanupContainer();

    this.container = document.createElement('div');
    this.container.className = 'xeg-gallery-container';
    this.container.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 10000 !important;
      background: rgba(0, 0, 0, 0.95) !important;
      display: flex !important;
      flex-direction: column !important;
    `;

    document.body.appendChild(this.container);
    document.body.classList.add('xeg-gallery-open');

    // 정리 작업 등록
    this.cleanupManager.addTask(() => {
      document.body.classList.remove('xeg-gallery-open');
    });
  }

  /**
   * 컴포넌트 렌더링
   */
  private renderComponent(state: typeof galleryState.value): void {
    if (!this.container) return;

    const { render, createElement } = getPreact();

    const galleryElement = createElement(VerticalGalleryView, {
      mediaItems: state.mediaItems,
      currentIndex: state.currentIndex,
      isDownloading: state.isLoading,
      onClose: () => {
        closeGallery();
        if (this.onCloseCallback) {
          this.onCloseCallback();
        }
      },
      onPrevious: () => this.handleNavigation('previous'),
      onNext: () => this.handleNavigation('next'),
      onDownloadCurrent: () => this.handleDownload('current'),
      onDownloadAll: () => this.handleDownload('all'),
      className: 'xeg-vertical-gallery',
    });

    render(galleryElement, this.container);
    logger.info('[GalleryRenderer] 컴포넌트 렌더링 완료');
  }

  /**
   * 네비게이션 처리
   */
  private handleNavigation(direction: 'previous' | 'next'): void {
    // unified-gallery.signals의 함수들을 사용
    const {
      navigatePrevious,
      navigateNext,
    } = require('@core/state/signals/unified-gallery.signals');

    if (direction === 'previous') {
      navigatePrevious();
    } else {
      navigateNext();
    }
  }

  /**
   * 다운로드 처리
   */
  private async handleDownload(type: 'current' | 'all'): Promise<void> {
    try {
      setLoading(true);

      // 다운로드 서비스는 별도 모듈로 분리
      const { GalleryDownloadService } = await import(
        '@features/gallery/services/GalleryDownloadService'
      );

      const downloadService = GalleryDownloadService.getInstance();
      const state = galleryState.value;

      if (type === 'current') {
        const currentMedia = state.mediaItems[state.currentIndex];
        if (currentMedia) {
          await downloadService.downloadCurrent(currentMedia);
        }
      } else {
        await downloadService.downloadAll(state.mediaItems);
      }
    } catch (error) {
      logger.error(`[GalleryRenderer] ${type} 다운로드 실패:`, error);
      setError('다운로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  /**
   * 갤러리 정리
   */
  private cleanupGallery(): void {
    logger.info('[GalleryRenderer] 정리 시작');

    this.isRenderingFlag = false;
    this.cleanupContainer();
    this.cleanupManager.executeAll();

    logger.debug('[GalleryRenderer] 정리 완료');
  }

  /**
   * 컨테이너 정리
   */
  private cleanupContainer(): void {
    if (this.container) {
      try {
        const { render } = getPreact();
        render(null, this.container);

        if (document.contains(this.container)) {
          this.container.remove();
        }
      } catch (error) {
        logger.warn('[GalleryRenderer] 컨테이너 정리 실패:', error);
      }
      this.container = null;
    }
  }

  // =============================================================================
  // GalleryRendererInterface 구현
  // =============================================================================

  async render(
    mediaItems: readonly MediaInfo[],
    renderOptions?: GalleryRenderOptions
  ): Promise<void> {
    // unified-gallery.signals의 함수들을 사용
    const { openGallery, setViewMode } = require('@core/state/signals/unified-gallery.signals');

    openGallery(mediaItems, renderOptions?.startIndex ?? 0);

    if (renderOptions?.viewMode) {
      setViewMode(renderOptions.viewMode);
    }

    logger.info(`[GalleryRenderer] ${mediaItems.length}개 미디어로 갤러리 렌더링`);
  }

  close(): void {
    closeGallery();
  }

  isRendering(): boolean {
    return this.isRenderingFlag;
  }

  destroy(): void {
    logger.info('[GalleryRenderer] 완전 정리 시작');

    this.stateUnsubscribe?.();
    this.cleanupGallery();

    logger.info('[GalleryRenderer] 완전 정리 완료');
  }
}

// 싱글톤 인스턴스 export
export const galleryRenderer = new SimplifiedGalleryRenderer();
