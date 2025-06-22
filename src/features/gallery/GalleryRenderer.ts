/**
 * @fileoverview Unified Gallery Renderer
 * @version 2.0.0
 *
 * 여러 버전의 GalleryRenderer를 하나로 통합
 * 최고의 전략들을 결합하여 안정적이고 효율적인 렌더링 제공
 */

import type {
  GalleryRenderOptions,
  GalleryRenderer as GalleryRendererInterface,
} from '@core/interfaces/gallery.interfaces';
import { GalleryStateManager } from '@core/state/signals/GalleryStateSignals';
import type { MediaInfo } from '@core/types/media.types';
import { VerticalGalleryView } from '@features/gallery/components/vertical-gallery-view';
import '@features/gallery/styles/gallery-global.css';
import { logger } from '@infrastructure/logging/logger';
import { getPreact, getPreactSignals } from '@infrastructure/external/vendors';

const { effect } = getPreactSignals();
const { createElement, render } = getPreact();

/**
 * 통합된 갤러리 렌더러
 *
 * 기존 구현들의 장점을 결합:
 * - 안정적인 상태 관리
 * - 효율적인 렌더링
 * - 완전한 정리 메커니즘
 */
export class GalleryRenderer implements GalleryRendererInterface {
  private container: HTMLDivElement | null = null;
  private cleanupFunctions: (() => void)[] = [];
  private isRenderingFlag = false;
  private readonly galleryState: GalleryStateManager;
  private onCloseCallback: (() => void) | undefined;

  constructor(galleryState?: GalleryStateManager, onClose?: () => void) {
    this.galleryState = galleryState ?? GalleryStateManager.getInstance();
    this.onCloseCallback = onClose;
    this.setupStateEffects();
  }

  /**
   * 갤러리 닫기 콜백 설정
   */
  public setOnCloseCallback(onClose: () => void): void {
    this.onCloseCallback = onClose;
  }

  /**
   * 상태 효과 설정
   */
  private setupStateEffects(): void {
    const openEffect = effect(() => {
      try {
        const signals = this.galleryState.getSignals();
        const isOpen = signals.isOpen.value;

        if (isOpen === true) {
          this.show();
        } else if (isOpen === false) {
          this.hide();
        }
      } catch (error) {
        logger.warn('[GalleryRenderer] Effect error:', error);
      }
    });

    this.cleanupFunctions.push(openEffect);
    logger.debug('[GalleryRenderer] State effects 설정 완료');
  }

  /**
   * 갤러리 표시
   */
  show(): void {
    if (this.isRenderingFlag) {
      logger.debug('[GalleryRenderer] 이미 렌더링 중');
      return;
    }

    logger.info('[GalleryRenderer] 갤러리 표시 시작');
    this.isRenderingFlag = true;

    try {
      this.createGalleryContainer();
      this.renderGalleryComponent();
    } finally {
      this.isRenderingFlag = false;
    }
  }

  /**
   * 갤러리 숨김
   */
  hide(): void {
    logger.info('[GalleryRenderer] 갤러리 숨김 시작');

    this.isRenderingFlag = false;
    this.cleanupDOM();
    this.performCleanup();

    logger.debug('[GalleryRenderer] 갤러리 숨김 완료');
  }

  /**
   * 갤러리 컨테이너 생성
   */
  private createGalleryContainer(): void {
    this.cleanupDOM();

    this.container = document.createElement('div');
    this.container.className = 'xeg-gallery-container';
    this.container.setAttribute('data-gallery-element', 'root');

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
      contain: layout style paint !important;
    `;

    document.body.appendChild(this.container);
    logger.debug('[GalleryRenderer] 컨테이너 생성 완료');
  }

  /**
   * 갤러리 컴포넌트 렌더링
   */
  private renderGalleryComponent(): void {
    if (!this.container) {
      logger.error('[GalleryRenderer] 컨테이너가 없음');
      return;
    }

    const signals = this.galleryState.getSignals();
    const mediaItems = signals.mediaItems.value ?? [];
    const currentIndex = signals.currentIndex.value ?? 0;
    const isOpen = signals.isOpen.value ?? false;

    if (!isOpen || mediaItems.length === 0) {
      logger.warn('[GalleryRenderer] 갤러리가 닫혀있거나 미디어가 없음');
      return;
    }

    try {
      logger.info(`[GalleryRenderer] 렌더링 시작 - ${mediaItems.length}개 미디어`);

      const galleryElement = createElement(VerticalGalleryView, {
        mediaItems,
        currentIndex,
        isDownloading: signals.isLoading?.value ?? false,
        onClose: this.handleClose.bind(this),
        onPrevious: () => this.galleryState.goToPrevious(),
        onNext: () => this.galleryState.goToNext(),
        onDownloadCurrent: () => this.downloadCurrentMedia(),
        onDownloadAll: () => this.downloadAllMedia(),
        className: 'xeg-vertical-gallery',
      });

      render(galleryElement, this.container);
      logger.info('[GalleryRenderer] 컴포넌트 렌더링 완료');
    } catch (error) {
      logger.error('[GalleryRenderer] 렌더링 실패:', error);
    }
  }

  /**
   * 갤러리 닫기 처리
   */
  private handleClose(): void {
    logger.debug('[GalleryRenderer] 닫기 요청');

    // 1. UI 상태 닫기
    this.galleryState.closeGallery();

    // 2. 추가 정리 작업
    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
  }

  /**
   * 현재 미디어 다운로드
   */
  private async downloadCurrentMedia(): Promise<void> {
    const signals = this.galleryState.getSignals();
    const currentMedia = signals.currentMedia?.value;
    if (!currentMedia) return;

    try {
      this.galleryState.setLoading(true);

      const { GalleryDownloadService } = await import(
        '@features/gallery/services/GalleryDownloadService'
      );
      const downloadService = GalleryDownloadService.getInstance();
      const success = await downloadService.downloadCurrent(currentMedia);

      if (!success) {
        this.galleryState.setError('다운로드에 실패했습니다.');
      }
    } catch (error) {
      logger.error('[GalleryRenderer] 다운로드 실패:', error);
      this.galleryState.setError('다운로드에 실패했습니다.');
    } finally {
      this.galleryState.setLoading(false);
    }
  }

  /**
   * 전체 미디어 다운로드
   */
  private async downloadAllMedia(): Promise<void> {
    const signals = this.galleryState.getSignals();
    const mediaItems = signals.mediaItems?.value ?? [];
    if (mediaItems.length === 0) return;

    try {
      this.galleryState.setLoading(true);

      const { GalleryDownloadService } = await import(
        '@features/gallery/services/GalleryDownloadService'
      );
      const downloadService = GalleryDownloadService.getInstance();
      const result = await downloadService.downloadAll(mediaItems);

      if (!result.success) {
        this.galleryState.setError('ZIP 다운로드에 실패했습니다.');
      }
    } catch (error) {
      logger.error('[GalleryRenderer] ZIP 다운로드 실패:', error);
      this.galleryState.setError('ZIP 다운로드에 실패했습니다.');
    } finally {
      this.galleryState.setLoading(false);
    }
  }

  /**
   * GalleryRendererInterface 구현: 갤러리 렌더링
   */
  async render(
    mediaItems: readonly MediaInfo[],
    renderOptions?: GalleryRenderOptions
  ): Promise<void> {
    try {
      this.galleryState.openGallery(mediaItems, renderOptions?.startIndex ?? 0);

      if (renderOptions?.viewMode) {
        const signals = this.galleryState.getSignals();
        if (signals.viewMode) {
          signals.viewMode.value = renderOptions.viewMode;
        }
      }

      logger.info(`[GalleryRenderer] Rendered ${mediaItems.length} media items`);
    } catch (error) {
      logger.error('[GalleryRenderer] Failed to render gallery:', error);
      throw error;
    }
  }

  /**
   * GalleryRendererInterface 구현: 갤러리 닫기
   */
  close(): void {
    this.galleryState.closeGallery();
  }

  /**
   * GalleryRendererInterface 구현: 렌더링 상태 확인
   */
  isRendering(): boolean {
    return this.isRenderingFlag;
  }

  /**
   * 완전한 정리
   */
  destroy(): void {
    logger.info('[GalleryRenderer] 완전 정리 시작');

    this.isRenderingFlag = false;
    this.cleanupSignals();
    this.cleanupDOM();
    this.performCleanup();

    logger.info('[GalleryRenderer] 완전 정리 완료');
  }

  /**
   * 공통 정리 작업
   */
  private performCleanup(): void {
    this.cleanupMediaElements();
    this.restorePageState();
  }

  /**
   * Signals 정리
   */
  private cleanupSignals(): void {
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions = [];
  }

  /**
   * DOM 정리
   */
  private cleanupDOM(): void {
    // 갤러리 관련 CSS 클래스 정리
    document.body.classList.remove('xeg-gallery-open');

    // 기존 컨테이너 정리
    const existingContainers = document.querySelectorAll(
      '.xeg-gallery-container, [data-gallery-element="root"]'
    );
    existingContainers.forEach(container => {
      try {
        render(null, container as HTMLElement);
        container.remove();
      } catch (error) {
        logger.warn('[GalleryRenderer] Container cleanup failed:', error);
      }
    });

    // 현재 컨테이너 정리
    if (this.container) {
      try {
        render(null, this.container);
        if (document.contains(this.container)) {
          this.container.remove();
        }
      } catch (error) {
        logger.warn('[GalleryRenderer] Current container cleanup failed:', error);
      }
      this.container = null;
    }
  }

  /**
   * 미디어 요소 정리
   */
  private cleanupMediaElements(): void {
    try {
      const videos = document.querySelectorAll(
        '.xeg-gallery-container video, [data-gallery-element] video'
      );
      videos.forEach(video => {
        if (video instanceof HTMLVideoElement && !video.paused) {
          video.pause();
          video.currentTime = 0;
        }
      });
    } catch (error) {
      logger.debug('[GalleryRenderer] Media cleanup error:', error);
    }
  }

  /**
   * 페이지 상태 복원
   */
  private restorePageState(): void {
    requestAnimationFrame(() => {
      try {
        const twitterRoot = document.querySelector('#react-root');
        if (twitterRoot instanceof HTMLElement) {
          twitterRoot.style.removeProperty('pointer-events');
          twitterRoot.style.removeProperty('user-select');
        }
      } catch (error) {
        logger.warn('[GalleryRenderer] Page state restore failed:', error);
      }
    });
  }
}
