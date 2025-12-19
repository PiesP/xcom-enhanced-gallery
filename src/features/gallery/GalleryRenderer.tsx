/**
 * @fileoverview Gallery Renderer
 * @description Handles rendering and lifecycle of the gallery component
 */

import { CSS } from '@constants/css';
import { VerticalGalleryView } from '@features/gallery/components/vertical-gallery-view/VerticalGalleryView';
import { GalleryContainer, mountGallery, unmountGallery } from '@shared/components/isolation';
import { ErrorBoundary } from '@shared/components/ui/ErrorBoundary/ErrorBoundary';
import {
  getDownloadOrchestrator,
  getLanguageService,
  getThemeService,
} from '@shared/container/service-accessors';
import { getErrorMessage } from '@shared/error/normalize';
import type { GalleryRenderer as GalleryRendererInterface } from '@shared/interfaces';
import { logger } from '@shared/logging';
import type { DownloadOrchestrator } from '@shared/services/download/download-orchestrator';
import { acquireDownloadLock, isDownloadLocked } from '@shared/state/signals/download.signals';
import {
  closeGallery,
  gallerySignals,
  navigateNext,
  navigatePrevious,
  openGallery,
} from '@shared/state/signals/gallery.signals';
import { setError } from '@shared/state/signals/ui.state';
import type { GalleryRenderOptions, MediaInfo } from '@shared/types/media.types';
import { pauseAmbientVideosForGallery } from '@shared/utils/media/ambient-video-coordinator';
import { createSignal, onCleanup } from 'solid-js';
import './styles/gallery-global.css';

export class GalleryRenderer implements GalleryRendererInterface {
  private container: HTMLDivElement | null = null;
  private isMounting = false;
  private stateUnsubscribe: (() => void) | null = null;
  private onCloseCallback?: () => void;

  constructor() {
    this.setupStateSubscription();
  }

  setOnCloseCallback(onClose: () => void): void {
    this.onCloseCallback = onClose;
  }

  private setupStateSubscription(): void {
    this.stateUnsubscribe = gallerySignals.isOpen.subscribe((isOpen) => {
      if (isOpen && !this.container) {
        this.renderGallery();
      } else if (!isOpen && this.container) {
        this.cleanupGallery();
      }
    });
  }

  private renderGallery(): void {
    if (this.isMounting || this.container) return;

    const { isOpen, mediaItems } = gallerySignals;
    if (!isOpen.value || mediaItems.value.length === 0) return;

    this.isMounting = true;
    logger.info('[GalleryRenderer] Rendering started');

    try {
      this.createContainer();
      this.renderComponent();
      logger.debug('[GalleryRenderer] Component rendering complete');
    } catch (error) {
      logger.error('[GalleryRenderer] Rendering failed:', error);
      // Ensure we never leave a half-mounted container behind (which can
      // make the gallery appear "stuck" on subsequent open attempts).
      this.cleanupContainer();
      setError(getErrorMessage(error) || 'Gallery rendering failed');
    } finally {
      this.isMounting = false;
    }
  }

  private createContainer(): void {
    this.cleanupContainer();
    this.container = document.createElement('div');
    this.container.className = CSS.CLASSES.RENDERER;
    this.container.setAttribute('data-renderer', 'gallery');
    document.body.appendChild(this.container);
  }

  private renderComponent(): void {
    if (!this.container) return;

    const themeService = getThemeService();
    const languageService = getLanguageService();

    const handleClose = () => {
      closeGallery();
      this.onCloseCallback?.();
    };

    const handleDownload = (type: 'current' | 'all') => this.handleDownload(type);

    const Root = () => {
      const [currentTheme, setCurrentTheme] = createSignal(themeService.getCurrentTheme());
      const [currentLanguage, setCurrentLanguage] = createSignal(
        languageService.getCurrentLanguage()
      );

      const unbindTheme = themeService.onThemeChange((_, setting) => setCurrentTheme(setting));
      const unbindLanguage = languageService.onLanguageChange((lang) => setCurrentLanguage(lang));

      onCleanup(() => {
        unbindTheme();
        unbindLanguage();
      });

      return (
        <GalleryContainer
          onClose={handleClose}
          className={`${CSS.CLASSES.RENDERER} ${CSS.CLASSES.ROOT} xeg-theme-scope`}
          data-theme={currentTheme()}
          data-language={currentLanguage()}
        >
          <ErrorBoundary>
            <VerticalGalleryView
              onClose={handleClose}
              onPrevious={() => navigatePrevious('button')}
              onNext={() => navigateNext('button')}
              onDownloadCurrent={() => handleDownload('current')}
              onDownloadAll={() => handleDownload('all')}
              className={CSS.CLASSES.VERTICAL_VIEW}
            />
          </ErrorBoundary>
        </GalleryContainer>
      );
    };

    mountGallery(this.container, () => <Root />);
    logger.info('[GalleryRenderer] Gallery mounted');
  }

  async handleDownload(type: 'current' | 'all'): Promise<void> {
    logger.info(`[GalleryRenderer] handleDownload called with type: ${type}`);
    if (isDownloadLocked()) return;

    const releaseLock = acquireDownloadLock();

    try {
      const mediaItems = gallerySignals.mediaItems.value;
      // Lazy load download service on first use
      const downloadService = await this.getDownloadService();

      if (type === 'current') {
        const currentMedia = mediaItems[gallerySignals.currentIndex.value];
        if (currentMedia) {
          const result = await downloadService.downloadSingle(currentMedia);
          if (!result.success) {
            setError(result.error || 'Download failed.');
          }
        }
      } else {
        const result = await downloadService.downloadBulk([...mediaItems]);
        if (!result.success) {
          setError(result.error || 'Download failed.');
        }
      }
    } catch (error) {
      logger.error(`[GalleryRenderer] ${type} download failed:`, error);
      setError(getErrorMessage(error) || 'Download failed.');
    } finally {
      releaseLock();
    }
  }

  /**
   * Lazy load download service on first use.
   * This enables code splitting - download code is only loaded when user initiates a download.
   */
  private async getDownloadService(): Promise<DownloadOrchestrator> {
    return getDownloadOrchestrator();
  }

  private cleanupGallery(): void {
    logger.debug('[GalleryRenderer] Cleanup started');
    this.isMounting = false;
    this.cleanupContainer();
  }

  private cleanupContainer(): void {
    if (this.container) {
      const container = this.container;

      try {
        unmountGallery(container);
      } catch (error) {
        logger.warn('[GalleryRenderer] Container unmount failed:', error);
      }

      try {
        container.remove();
      } catch (error) {
        logger.warn('[GalleryRenderer] Container removal failed:', error);
      } finally {
        this.container = null;
      }
    }
  }

  async render(
    mediaItems: readonly MediaInfo[],
    renderOptions?: GalleryRenderOptions
  ): Promise<void> {
    const pauseContext = renderOptions?.pauseContext ?? { reason: 'programmatic' };

    try {
      pauseAmbientVideosForGallery(pauseContext);
    } catch (error) {
      logger.warn('[GalleryRenderer] Ambient video pause failed', { error });
    }

    openGallery(mediaItems, renderOptions?.startIndex ?? 0);
  }

  close(): void {
    if (!gallerySignals.isOpen.value) {
      return;
    }

    closeGallery();
    this.onCloseCallback?.();
  }

  isRendering(): boolean {
    return Boolean(this.container && gallerySignals.isOpen.value);
  }

  destroy(): void {
    logger.info('[GalleryRenderer] Full cleanup started');
    this.stateUnsubscribe?.();
    this.cleanupGallery();
  }
}
