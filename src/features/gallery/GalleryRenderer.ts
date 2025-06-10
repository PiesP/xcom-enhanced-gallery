/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * Enhanced Gallery Renderer - VerticalGalleryView 복원 버전
 * Preact 런타임 오류 해결 및 원래 기능 복원
 */

import type {
  GalleryRenderOptions,
  GalleryRenderer as GalleryRendererInterface,
} from '@core/interfaces/gallery.interfaces';
import { GalleryStateManager } from '@core/state/signals/gallery-state.signals';
import type { MediaInfo } from '@core/types/media.types';
import { VerticalGalleryView } from '@features/gallery/components/vertical-gallery-view';
import '@features/gallery/styles/gallery-global.css';
import { logger } from '@infrastructure/logging/logger';
import { getPreact, getPreactSignals } from '@shared/utils/external';

const { effect } = getPreactSignals();
const { createElement, options, render } = getPreact();

// Preact 옵션 설정으로 런타임 오류 방지
// eslint-disable-next-line @typescript-eslint/no-explicit-any
options.debounceRendering = (fn: any) => {
  setTimeout(fn, 0);
};

export class GalleryRenderer implements GalleryRendererInterface {
  private container: HTMLDivElement | null = null;
  private cleanupFunctions: (() => void)[] = [];
  private isRenderingFlag = false;
  private readonly galleryState: GalleryStateManager;

  constructor(galleryState?: GalleryStateManager) {
    this.galleryState = galleryState ?? GalleryStateManager.getInstance();
    this.setupStateEffects();
  }

  private setupStateEffects(): void {
    // 갤러리 열림/닫힘 상태만 처리 (과도한 리렌더링 방지)
    const openEffect = effect(() => {
      if (this.galleryState.isOpen.value) {
        this.show();
      } else {
        this.hide();
      }
    });

    this.cleanupFunctions.push(openEffect);
  }

  show(): void {
    // 컨테이너가 없으면 새로 생성
    if (!this.container) {
      this.createGalleryContainer();
    }

    if (this.container) {
      this.container.style.display = 'block';
      this.renderGalleryComponent();
    }
  }

  hide(): void {
    if (this.container) {
      // 완전한 DOM 제거로 재열기 문제 방지
      try {
        // Preact 컴포넌트 언마운트
        render(null, this.container);
      } catch (error) {
        logger.debug('Preact 언마운트 실패, DOM 직접 제거:', error);
      }

      this.container.remove();
      this.container = null;
      this.isRenderingFlag = false;
      logger.debug('갤러리 컨테이너 완전 제거됨');
    }
  }

  private createGalleryContainer(): void {
    this.container = document.createElement('div');
    this.container.className = 'xeg-gallery-container';
    this.container.setAttribute('data-gallery-element', 'root');

    // 컨테이너 스타일 설정
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 10000;
      pointer-events: auto;
    `;

    document.body.appendChild(this.container);
    logger.debug('갤러리 컨테이너 생성 완료');
  }

  private renderGalleryComponent(): void {
    if (!this.container || this.isRenderingFlag) {
      return;
    }

    this.isRenderingFlag = true;

    try {
      const mediaItems = this.galleryState.mediaItems.value;
      const currentIndex = this.galleryState.currentIndex.value;
      const isLoading = this.galleryState.isLoading.value;
      const error = this.galleryState.error.value;

      logger.info(
        `🎬 VerticalGalleryView 렌더링 시작 - ${mediaItems.length}개 미디어, ` +
          `현재 인덱스: ${currentIndex}`
      );

      // 미디어 아이템이 없으면 렌더링하지 않음
      if (mediaItems.length === 0) {
        logger.warn('미디어 아이템이 없어 갤러리를 렌더링하지 않습니다.');
        this.isRenderingFlag = false;
        return;
      }

      // Preact 컴포넌트를 createElement로 생성

      const galleryElement = createElement(VerticalGalleryView, {
        mediaItems,
        currentIndex,
        isDownloading: isLoading,
        onClose: () => this.galleryState.closeGallery(),
        onPrevious: () => this.galleryState.goToPrevious(),
        onNext: () => this.galleryState.goToNext(),
        onDownloadCurrent: () => this.downloadCurrentMedia(),
        onDownloadAll: () => this.downloadAllMedia(),
        className: 'xeg-vertical-gallery',
        showToast: !!error,
        toastMessage: error ?? '',
        toastType: error ? 'error' : 'info',
      });

      // 안전한 Preact 렌더링
      render(galleryElement, this.container);

      logger.info('✅ VerticalGalleryView 렌더링 완료');
    } catch (error) {
      logger.error('❌ 갤러리 렌더링 실패:', error);
      logger.error('에러 스택:', (error as Error).stack);
      // 폴백: 단순한 DOM 렌더링
      this.renderFallbackGallery();
    } finally {
      this.isRenderingFlag = false;
    }
  }

  private renderFallbackGallery(): void {
    if (!this.container) {
      return;
    }

    const mediaItems = this.galleryState.mediaItems.value;
    const currentIndex = this.galleryState.currentIndex.value;

    this.container.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: var(--xeg-gallery-background, rgba(0, 0, 0, 0.95));
        display: flex;
        flex-direction: column;
        z-index: var(--xeg-z-gallery, 10000);
      ">
        <div style="
          position: absolute;
          top: var(--xeg-spacing-lg, 20px);
          right: var(--xeg-spacing-lg, 20px);
          z-index: var(--xeg-z-modal, 10001);
          display: flex;
          gap: var(--xeg-spacing-sm, 10px);
          background: rgba(0, 0, 0, 0.7);
          padding: var(--xeg-spacing-sm, 10px);
          border-radius: var(--xeg-gallery-border-radius, 5px);
        ">
          <button id="xeg-prev-btn" style="
            background: var(--xeg-color-primary, #1d9bf0);
            color: white;
            border: none;
            padding: var(--xeg-spacing-xs, 8px) var(--xeg-spacing-md, 12px);
            border-radius: var(--xeg-gallery-border-radius, 4px);
            cursor: pointer;
            transition: var(--xeg-transition-fast, 0.15s ease);
          ">이전</button>
          <span style="color: white; padding: var(--xeg-spacing-xs, 8px);">${
            currentIndex + 1
          } / ${mediaItems.length}</span>
          <button id="xeg-next-btn" style="
            background: var(--xeg-color-primary, #1d9bf0);
            color: white;
            border: none;
            padding: var(--xeg-spacing-xs, 8px) var(--xeg-spacing-md, 12px);
            border-radius: var(--xeg-gallery-border-radius, 4px);
            cursor: pointer;
            transition: var(--xeg-transition-fast, 0.15s ease);
          ">다음</button>
          <button id="xeg-close-btn" style="
            background: var(--xeg-button-danger, #f91880);
            color: white;
            border: none;
            padding: var(--xeg-spacing-xs, 8px) var(--xeg-spacing-md, 12px);
            border-radius: var(--xeg-gallery-border-radius, 4px);
            cursor: pointer;
            transition: var(--xeg-transition-fast, 0.15s ease);
          ">닫기</button>
        </div>

        <div style="
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: auto;
          padding: var(--xeg-spacing-lg, 20px);
        ">
          ${this.renderCurrentMedia(mediaItems[currentIndex])}
        </div>
      </div>
    `;

    // 폴백 이벤트 리스너
    this.setupFallbackEvents();
    logger.warn('폴백 갤러리로 렌더링됨');
  }

  private setupFallbackEvents(): void {
    if (!this.container) {
      return;
    }

    const prevBtn = this.container.querySelector('#xeg-prev-btn') as HTMLButtonElement;
    const nextBtn = this.container.querySelector('#xeg-next-btn') as HTMLButtonElement;
    const closeBtn = this.container.querySelector('#xeg-close-btn') as HTMLButtonElement;

    prevBtn?.addEventListener('click', () => this.galleryState.goToPrevious());
    nextBtn?.addEventListener('click', () => this.galleryState.goToNext());
    closeBtn?.addEventListener('click', () => this.galleryState.closeGallery());

    // 키보드 이벤트
    const handleKeydown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          this.galleryState.closeGallery();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.galleryState.goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.galleryState.goToNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeydown);
    this.cleanupFunctions.push(() => document.removeEventListener('keydown', handleKeydown));

    // 배경 클릭으로 닫기
    this.container.addEventListener('click', e => {
      if (e.target === this.container) {
        this.galleryState.closeGallery();
      }
    });

    this.container.tabIndex = 0;
    this.container.focus();
  }

  private renderCurrentMedia(media: MediaInfo | undefined): string {
    if (!media) {
      return '<div style="color: white;">미디어를 찾을 수 없습니다.</div>';
    }

    if (media.type === 'image') {
      return `
        <img
          src="${media.url}"
          alt="${media.alt ?? ''}"
          style="
            max-width: 90vw;
            max-height: 80vh;
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
          "
        />
      `;
    } else if (media.type === 'video') {
      return `
        <video
          src="${media.url}"
          controls
          autoplay
          style="
            max-width: 90vw;
            max-height: 80vh;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
          "
        ></video>
      `;
    }

    return '<div style="color: white;">지원되지 않는 미디어 형식입니다.</div>';
  }

  private async downloadCurrentMedia(): Promise<void> {
    const currentMedia = this.galleryState.currentMedia.value;
    if (!currentMedia) {
      return;
    }

    try {
      this.galleryState.setLoading(true);

      // GalleryDownloadService를 통한 개별 다운로드 (Clean Architecture 준수)
      const { GalleryDownloadService } = await import(
        '@features/gallery/services/GalleryDownloadService'
      );
      const downloadService = GalleryDownloadService.getInstance();
      const success = await downloadService.downloadCurrent(currentMedia);

      if (success) {
        logger.info('미디어 다운로드 완료:', currentMedia.filename);
      } else {
        this.galleryState.setError('다운로드에 실패했습니다.');
      }
    } catch (error) {
      logger.error('미디어 다운로드 실패:', error);
      this.galleryState.setError('다운로드에 실패했습니다.');
    } finally {
      this.galleryState.setLoading(false);
    }
  }

  private async downloadAllMedia(): Promise<void> {
    const mediaItems = this.galleryState.mediaItems.value;
    if (mediaItems.length === 0) {
      return;
    }

    try {
      this.galleryState.setLoading(true);
      logger.info(`${mediaItems.length}개 미디어 ZIP 다운로드 시작`);

      // GalleryDownloadService를 통한 ZIP 다운로드 (Clean Architecture 준수)
      const { GalleryDownloadService } = await import(
        '@features/gallery/services/GalleryDownloadService'
      );
      const downloadService = GalleryDownloadService.getInstance();

      const result = await downloadService.downloadAll(mediaItems);

      if (result.success) {
        logger.info('전체 미디어 ZIP 다운로드 완료');
      } else {
        this.galleryState.setError('ZIP 다운로드에 실패했습니다.');
        logger.error('ZIP 다운로드 실패:', result.error);
      }
    } catch (error) {
      logger.error('전체 ZIP 다운로드 실패:', error);
      this.galleryState.setError('ZIP 다운로드에 실패했습니다.');
    } finally {
      this.galleryState.setLoading(false);
    }
  }

  /**
   * GalleryRendererInterface 인터페이스 구현: 갤러리를 렌더링합니다
   */
  async render(
    mediaItems: readonly MediaInfo[],
    renderOptions?: GalleryRenderOptions
  ): Promise<void> {
    try {
      // 갤러리 상태 업데이트 - 기존 메서드 사용
      this.galleryState.openGallery(mediaItems, renderOptions?.startIndex ?? 0);

      if (renderOptions?.viewMode) {
        // viewMode signal 직접 설정
        this.galleryState.viewMode.value = renderOptions.viewMode;
      }

      logger.info(`[GalleryRenderer] Rendered ${mediaItems.length} media items`);
    } catch (error) {
      logger.error('[GalleryRenderer] Failed to render gallery:', error);
      throw error;
    }
  }

  /**
   * GalleryRendererInterface 인터페이스 구현: 갤러리를 닫습니다
   */
  close(): void {
    this.galleryState.closeGallery();
  }

  /**
   * GalleryRendererInterface 인터페이스 구현: 렌더링 상태를 확인합니다
   */
  isRendering(): boolean {
    return this.isRenderingFlag;
  }

  destroy(): void {
    // 렌더링 중지
    this.isRenderingFlag = false;

    // effect 정리
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions = [];

    // DOM 정리
    if (this.container) {
      try {
        // Preact 컴포넌트 언마운트
        render(null, this.container);
      } catch (error) {
        logger.debug('Preact 언마운트 실패, DOM 직접 제거:', error);
      }

      this.container.remove();
      this.container = null;
    }

    logger.info('Enhanced Gallery Renderer 정리 완료');
  }
}
