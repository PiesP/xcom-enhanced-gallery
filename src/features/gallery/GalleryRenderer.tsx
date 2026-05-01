/** Handles rendering and lifecycle of the gallery component. */

import { CSS } from '@constants/css';
import { VerticalGalleryView } from '@features/gallery/components/vertical-gallery-view/VerticalGalleryView';
import {
  GalleryContainer,
  mountGallery,
  unmountGallery,
} from '@shared/components/isolation/GalleryContainer';
import { ErrorBoundary } from '@shared/components/ui/ErrorBoundary/ErrorBoundary';
import {
  getDownloadOrchestrator,
  getLanguageService,
  getMediaService,
  getThemeService,
} from '@shared/container/service-accessors';
import { getErrorMessage } from '@shared/error/normalize';
import type { GalleryRenderer as GalleryRendererInterface } from '@shared/interfaces/gallery.interfaces';
import { logger } from '@shared/logging/logger';
import type { DownloadOrchestrator } from '@shared/services/download/download-orchestrator';
import { getUserscriptSafe } from '@shared/external/userscript/adapter';
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
import { createSignal, onCleanup } from 'solid-js';

import './styles/gallery-global.css';

export class GalleryRenderer implements GalleryRendererInterface {
  private container: HTMLDivElement | null = null;
  private isMounting = false;
  private stateUnsubscribe: (() => void) | null = null;
  private onCloseCallback: (() => void) | null = null;
  private get userscript() { return getUserscriptSafe(); }

  constructor() {
    this.setupStateSubscription();
  }

  setOnCloseCallback(onClose: (() => void) | null): void {
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

    if (!gallerySignals.isOpen || gallerySignals.mediaItems.length === 0) return;

    this.isMounting = true;
    __DEV__ && logger.info('[GalleryRenderer] Rendering started');

    try {
      this.createContainer();
      this.renderComponent();
      __DEV__ && logger.debug('[GalleryRenderer] Component rendering complete');
    } catch (error) {
      logger.error('Render failed', error);
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
    __DEV__ && logger.info('[GalleryRenderer] Gallery mounted');
  }

  private getDownloadErrorNotification(error: unknown): { body: string; title: string } {
    const message = getErrorMessage(error) || 'Unknown error';

    try {
      const languageService = getLanguageService();
      return {
        title: languageService.translate('msg.dl.one.err.t'),
        body: languageService.translate('msg.dl.one.err.b', { error: message }),
      };
    } catch {
      return {
        title: 'Download failed',
        body: message,
      };
    }
  }

  async handleDownload(type: 'current' | 'all'): Promise<void> {
    __DEV__ && logger.info(`[GalleryRenderer] handleDownload called with type: ${type}`);
    if (isDownloadLocked()) return;

    const releaseLock = acquireDownloadLock();

    const notifyError = (title: string, body: string): void => {
      this.userscript.notification({ title, text: body });
    };

    try {
      const languageService = getLanguageService();
      const mediaItems = gallerySignals.mediaItems;
      const mediaService = getMediaService();
      // Lazy load download service on first use
      const downloadService = await this.getDownloadService();

      if (type === 'current') {
        const currentMedia = mediaItems[gallerySignals.currentIndex];
        if (currentMedia) {
          let blob: Blob | undefined;
          try {
            const pending = mediaService.getCachedMedia(currentMedia.url);
            if (pending) {
              blob = await pending;
            }
          } catch {
            // Ignore prefetch failures; fallback to network download.
          }

          const result = await downloadService.downloadSingle(currentMedia, {
            ...(blob ? { blob } : {}),
          });
          if (!result.success) {
            const error = result.error || 'Unknown error';
            const title = languageService.translate('msg.dl.one.err.t');
            const body = languageService.translate('msg.dl.one.err.b', { error });
            setError(body);
            notifyError(title, body);
          }
        }
      } else {
        const prefetchedBlobs = new Map<string, Blob | Promise<Blob>>();
        for (const item of mediaItems) {
          if (!item) continue;
          const pending = mediaService.getCachedMedia(item.url);
          if (!pending) continue;
          prefetchedBlobs.set(item.url, pending);
        }

        const result = await downloadService.downloadBulk([...mediaItems], {
          ...(prefetchedBlobs.size > 0 ? { prefetchedBlobs } : {}),
        });

        if (!result.success) {
          if (result.filesSuccessful === 0) {
            const title = languageService.translate('msg.dl.allFail.t');
            const body = languageService.translate('msg.dl.allFail.b');
            setError(body);
            notifyError(title, body);
          } else {
            const error = result.error || 'Failed to save ZIP file';
            const title = languageService.translate('msg.dl.one.err.t');
            const body = languageService.translate('msg.dl.one.err.b', { error });
            setError(body);
            notifyError(title, body);
          }
          return;
        }

        if (result.status === 'partial') {
          const failures = Math.max(0, result.filesProcessed - result.filesSuccessful);
          if (failures > 0) {
            const title = languageService.translate('msg.dl.part.t');
            const body = languageService.translate('msg.dl.part.b', { count: failures });
            setError(body);
            notifyError(title, body);
          }
        }
      }
    } catch (error) {
      logger.error('Download failed', error);
      const { title, body } = this.getDownloadErrorNotification(error);
      setError(body);
      notifyError(title, body);
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
    __DEV__ && logger.debug('[GalleryRenderer] Cleanup started');
    this.isMounting = false;
    this.cleanupContainer();
  }

  private cleanupContainer(): void {
    if (this.container) {
      const container = this.container;

      try {
        unmountGallery(container);
      } catch (error) {
        __DEV__ && logger.warn('[GalleryRenderer] Container unmount failed:', error);
      }

      try {
        container.remove();
      } catch (error) {
        __DEV__ && logger.warn('[GalleryRenderer] Container removal failed:', error);
      } finally {
        this.container = null;
      }
    }
  }

  async render(
    mediaItems: readonly MediaInfo[],
    renderOptions?: GalleryRenderOptions
  ): Promise<void> {
    openGallery(mediaItems, renderOptions?.startIndex ?? 0);
  }

  close(): void {
    if (!gallerySignals.isOpen) {
      return;
    }

    closeGallery();
    this.onCloseCallback?.();
  }

  isRendering(): boolean {
    return !!(this.container && gallerySignals.isOpen);
  }

  destroy(): void {
    __DEV__ && logger.info('[GalleryRenderer] Full cleanup started');
    this.stateUnsubscribe?.();
    this.stateUnsubscribe = null;
    this.cleanupGallery();
  }
}
