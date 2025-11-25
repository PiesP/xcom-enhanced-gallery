/**
 * @fileoverview Gallery Renderer
 * @description Handles rendering and lifecycle of the gallery component
 */

import { GalleryContainer } from '@shared/components/isolation';
import { ErrorBoundary } from '@shared/components/ui/ErrorBoundary/ErrorBoundary';
import { getLanguageService, getThemeService } from '@shared/container/service-accessors';
import { isGMAPIAvailable } from '@shared/external/userscript';
import { getSolid } from '@shared/external/vendors';
import type { GalleryRenderer as GalleryRendererInterface } from '@shared/interfaces';
import { logger } from '@shared/logging';
import { DownloadOrchestrator } from '@shared/services/download/download-orchestrator';
import { NotificationService } from '@shared/services/notification-service';
import { acquireDownloadLock, isDownloadLocked } from '@shared/state/signals/download.signals';
import {
  closeGallery,
  gallerySignals,
  navigateNext,
  navigatePrevious,
  openGallery,
  setError,
  setViewMode,
} from '@shared/state/signals/gallery.signals';
import type { GalleryRenderOptions, MediaInfo } from '@shared/types/media.types';
import { VerticalGalleryView } from './components/vertical-gallery-view/VerticalGalleryView';
import './styles/gallery-global.css';

const downloadService = DownloadOrchestrator.getInstance();

export class GalleryRenderer implements GalleryRendererInterface {
  private container: HTMLDivElement | null = null;
  private isRenderingFlag = false;
  private stateUnsubscribe: (() => void) | null = null;
  private onCloseCallback?: () => void;
  private disposeApp: (() => void) | null = null;
  private readonly notificationService = NotificationService.getInstance();

  constructor() {
    this.setupStateSubscription();
  }

  setOnCloseCallback(onClose: () => void): void {
    this.onCloseCallback = onClose;
  }

  private setupStateSubscription(): void {
    this.stateUnsubscribe = gallerySignals.isOpen.subscribe(isOpen => {
      if (isOpen && !this.container) {
        this.renderGallery();
      } else if (!isOpen && this.container) {
        this.cleanupGallery();
      }
    });
  }

  private renderGallery(): void {
    if (this.isRenderingFlag || this.container) return;

    const { isOpen, mediaItems } = gallerySignals;
    if (!isOpen.value || mediaItems.value.length === 0) return;

    this.isRenderingFlag = true;
    logger.info('[GalleryRenderer] Rendering started');

    try {
      this.createContainer();
      this.renderComponent();
      logger.debug('[GalleryRenderer] Component rendering complete');
    } catch (error) {
      logger.error('[GalleryRenderer] Rendering failed:', error);
      setError('Gallery rendering failed');
    } finally {
      this.isRenderingFlag = false;
    }
  }

  private createContainer(): void {
    this.cleanupContainer();
    this.container = document.createElement('div');
    this.container.className = 'xeg-gallery-renderer';
    this.container.setAttribute('data-renderer', 'gallery');
    document.body.appendChild(this.container);
  }

  private renderComponent(): void {
    if (!this.container) return;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const { render, createComponent, createSignal, onCleanup } = getSolid();
    const themeService = getThemeService();
    const languageService = getLanguageService();

    const handleClose = () => {
      closeGallery();
      this.onCloseCallback?.();
    };

    const Root = () => {
      const [, setCurrentTheme] = createSignal(themeService.getCurrentTheme());
      const [, setCurrentLanguage] = createSignal(languageService.getCurrentLanguage());

      const unbindTheme = themeService.onThemeChange((_, setting) => setCurrentTheme(setting));
      const unbindLang = languageService.onLanguageChange(lang => setCurrentLanguage(lang));

      onCleanup(() => {
        unbindTheme();
        unbindLang();
      });

      return createComponent(GalleryContainer, {
        onClose: handleClose,
        className: 'xeg-gallery-renderer xeg-gallery-root xeg-theme-scope',
        get children() {
          return [
            createComponent(ErrorBoundary, {
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
            }),
          ];
        },
      });
    };

    this.disposeApp = render(Root, this.container);
    logger.info('[GalleryRenderer] Gallery mounted');
  }

  async handleDownload(type: 'current' | 'all'): Promise<void> {
    logger.info(`[GalleryRenderer] handleDownload called with type: ${type}`);
    if (!isGMAPIAvailable('download')) {
      logger.warn('[GalleryRenderer] GM_download not available');
      setError('Tampermonkey required for downloads.');
      return;
    }

    if (isDownloadLocked()) return;

    const releaseLock = acquireDownloadLock();

    try {
      const mediaItems = gallerySignals.mediaItems.value;

      if (type === 'current') {
        const currentMedia = mediaItems[gallerySignals.currentIndex.value];
        if (currentMedia) {
          const result = await downloadService.downloadSingle(currentMedia);
          if (result.success) {
            this.notificationService.success(`Download complete: ${result.filename}`);
          } else {
            setError(result.error || 'Download failed.');
          }
        }
      } else {
        await this.ensureDownloadService();

        const result = await downloadService.downloadBulk([...mediaItems]);
        if (result.success) {
          this.notificationService.success(
            `Bulk download complete: ${result.filesSuccessful} files`,
          );
        } else {
          setError(result.error || 'Download failed.');
        }
      }
    } catch (error) {
      logger.error(`[GalleryRenderer] ${type} download failed:`, error);
      setError('Download failed.');
    } finally {
      releaseLock();
    }
  }

  private async ensureDownloadService(): Promise<void> {
    try {
      const { ensureDownloadServiceRegistered } = await import(
        '@shared/services/lazy-service-registration'
      );
      await ensureDownloadServiceRegistered();
    } catch (error) {
      logger.warn('[GalleryRenderer] DownloadService lazy registration failed:', error);
    }
  }

  private cleanupGallery(): void {
    logger.debug('[GalleryRenderer] Cleanup started');
    this.isRenderingFlag = false;
    this.cleanupContainer();
  }

  private cleanupContainer(): void {
    if (this.container) {
      try {
        this.disposeApp?.();
        this.disposeApp = null;
        if (document.contains(this.container)) {
          this.container.remove();
        }
      } catch (error) {
        logger.warn('[GalleryRenderer] Container cleanup failed:', error);
      }
      this.container = null;
    }
  }

  async render(
    mediaItems: readonly MediaInfo[],
    renderOptions?: GalleryRenderOptions,
  ): Promise<void> {
    openGallery(mediaItems, renderOptions?.startIndex ?? 0);
    if (renderOptions?.viewMode) {
      setViewMode(renderOptions.viewMode === 'horizontal' ? 'horizontal' : 'vertical');
    }
  }

  close(): void {
    closeGallery();
  }

  isRendering(): boolean {
    return this.isRenderingFlag;
  }

  destroy(): void {
    logger.info('[GalleryRenderer] Full cleanup started');
    this.stateUnsubscribe?.();
    this.cleanupGallery();
  }
}
