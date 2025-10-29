/**
 * @fileoverview Gallery Renderer
 * @version 3.0.0 - Simplified architecture
 *
 * 갤러리 렌더러 - 렌더링 및 생명주기만 담당
 * - Solid.js 컴포넌트 렌더링
 * - DOM 생명주기 관리
 * - 상태 변경은 signal 구독으로 처리
 */

import type {
  GalleryRenderOptions,
  GalleryRenderer as GalleryRendererInterface,
} from '@shared/interfaces/gallery.interfaces';
import {
  closeGallery,
  gallerySignals,
  setError,
  setLoading,
  openGallery,
  setViewMode,
  navigatePrevious,
  navigateNext,
} from '../../shared/state/signals/gallery.signals';
import type { MediaInfo } from '@shared/types/media.types';
import { VerticalGalleryView } from './components/vertical-gallery-view';
import { GalleryContainer } from '../../shared/components/isolation';
import { ErrorBoundary } from '../../shared/components/ui/ErrorBoundary/ErrorBoundary';
import './styles/gallery-global.css';
import { logger } from '@shared/logging';
import { getSolid } from '../../shared/external/vendors';

/**
 * 갤러리 렌더러 - DOM 렌더링 및 생명주기 관리
 */
export class GalleryRenderer implements GalleryRendererInterface {
  private container: HTMLDivElement | null = null;
  private isRenderingFlag = false;
  private stateUnsubscribe: (() => void) | null = null;
  private onCloseCallback?: () => void;
  private disposeApp: (() => void) | null = null;
  private disposeToast: (() => void) | null = null;

  constructor() {
    this.setupStateSubscription();
  }

  /**
   * 갤러리 닫기 콜백 설정
   */
  setOnCloseCallback(onClose: () => void): void {
    this.onCloseCallback = onClose;
  }

  /**
   * 상태 구독 설정 - signal 변경 감지
   */
  private setupStateSubscription(): void {
    // gallerySignals.isOpen 변경 감지하여 자동 렌더링/정리
    this.stateUnsubscribe = gallerySignals.isOpen.subscribe(isOpen => {
      if (isOpen && !this.container) {
        this.renderGallery();
      } else if (!isOpen && this.container) {
        this.cleanupGallery();
      }
    });
  }

  /**
   * 갤러리 렌더링 - 처음 한 번만 실행
   */
  private renderGallery(): void {
    if (this.isRenderingFlag || this.container) {
      return;
    }

    const isOpen = gallerySignals.isOpen.value;
    const mediaItems = gallerySignals.mediaItems.value;
    if (!isOpen || mediaItems.length === 0) {
      return;
    }

    this.isRenderingFlag = true;
    logger.info('[GalleryRenderer] 렌더링 시작');

    try {
      this.createContainer();
      this.renderComponent();
      logger.debug('[GalleryRenderer] 컴포넌트 렌더링 완료');
    } catch (error) {
      logger.error('[GalleryRenderer] 렌더링 실패:', error);
      setError('갤러리 렌더링 실패');
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
    this.container.className = 'xeg-gallery-renderer';
    this.container.setAttribute('data-renderer', 'gallery');
    document.body.appendChild(this.container);
  }

  /**
   * 컴포넌트 렌더링
   */
  private renderComponent(): void {
    if (!this.container) {
      return;
    }

    const { render, createComponent } = getSolid();
    const self = this;
    const handleClose = () => {
      closeGallery();
      self.onCloseCallback?.();
    };

    const elementFactory = () =>
      createComponent(GalleryContainer, {
        onClose: handleClose,
        className: 'xeg-gallery-renderer xeg-gallery-root',
        get children() {
          return createComponent(ErrorBoundary, {
            get children() {
              return createComponent(VerticalGalleryView, {
                onClose: handleClose,
                onPrevious: () => navigatePrevious('button'),
                onNext: () => navigateNext('button'),
                onDownloadCurrent: () => self.handleDownload('current'),
                onDownloadAll: () => self.handleDownload('all'),
                className: 'xeg-vertical-gallery',
              });
            },
          });
        },
      });

    this.disposeApp = render(elementFactory, this.container);

    // Toast 컨테이너를 갤러리 내부에 마운트
    this.renderToastContainer();
  }

  /**
   * Toast 컨테이너 렌더링
   */
  private async renderToastContainer(): Promise<void> {
    if (!this.container) {
      return;
    }

    try {
      const { ToastContainer } = await import('@shared/components/ui');
      const { render, createComponent } = getSolid();

      // Toast 컨테이너 DOM 생성
      const toastContainer = document.createElement('div');
      toastContainer.id = 'xeg-toast-container';
      toastContainer.setAttribute('data-gallery-toast', 'true');
      this.container.appendChild(toastContainer);

      // Toast 컴포넌트 마운트
      this.disposeToast = render(() => createComponent(ToastContainer, {}), toastContainer);

      logger.debug('[GalleryRenderer] Toast 컨테이너 렌더링 완료');
    } catch (error) {
      logger.warn('[GalleryRenderer] Toast 컨테이너 렌더링 실패:', error);
    }
  }

  /**
   * 다운로드 처리
   */
  private async handleDownload(type: 'current' | 'all'): Promise<void> {
    try {
      setLoading(true);

      // 다운로드 서비스 - factory 경유 사용 (Phase 6)
      const { getBulkDownloadService } = await import('../../shared/services/service-factories');
      const downloadService = await getBulkDownloadService();

      // Phase 21.5: Fine-grained signals 사용
      const mediaItems = gallerySignals.mediaItems.value;
      const currentIndex = gallerySignals.currentIndex.value;

      if (type === 'current') {
        const currentMedia = mediaItems[currentIndex];
        if (currentMedia) {
          await downloadService.downloadSingle(currentMedia);
        }
      } else {
        await downloadService.downloadMultiple(mediaItems);
      }
    } catch (error) {
      logger.error(`[GalleryRenderer] ${type} download failed:`, error);
      setError('다운로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  /**
   * 갤러리 정리
   */
  private cleanupGallery(): void {
    logger.debug('[GalleryRenderer] 정리 시작');
    this.isRenderingFlag = false;
    this.cleanupContainer();
  }

  /**
   * 컨테이너 정리
   */
  private cleanupContainer(): void {
    if (this.container) {
      try {
        // Toast 정리
        this.disposeToast?.();
        this.disposeToast = null;

        // 갤러리 앱 정리
        this.disposeApp?.();
        this.disposeApp = null;

        // DOM 제거
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
    openGallery(mediaItems, renderOptions?.startIndex ?? 0);
    if (renderOptions?.viewMode) {
      const mode = renderOptions.viewMode === 'horizontal' ? 'horizontal' : 'vertical';
      setViewMode(mode);
    }
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
    logger.debug('[GalleryRenderer] 완전 정리 완료');
  }
}

// 싱글톤 인스턴스 export
export const galleryRenderer = new GalleryRenderer();
