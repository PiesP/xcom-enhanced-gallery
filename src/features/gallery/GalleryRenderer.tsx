/** Handles rendering and lifecycle of the gallery component. */

import { CSS } from '@constants/css';
import { VerticalGalleryView } from '@features/gallery/components/vertical-gallery-view/VerticalGalleryView';
import { useGalleryDownload } from '@features/gallery/hooks/use-gallery-download';
import {
  GalleryContainer,
  mountGallery,
  unmountGallery,
} from '@shared/components/isolation/GalleryContainer';
import { ErrorBoundary } from '@shared/components/ui/ErrorBoundary/ErrorBoundary';
import { getLanguageService, getThemeService } from '@shared/container/container';
import { normalizeErrorMessage } from '@shared/error/normalize';
import { logger } from '@shared/logging/logger';
import {
  closeGallery,
  gallerySignals,
  navigateNext,
  navigatePrevious,
  openGallery,
  setError,
} from '@shared/state/signals/gallery.signals';
import { effectSafe } from '@shared/state/signals/signal-factory';
import type { GalleryRenderOptions, MediaInfo } from '@shared/types/media.types';
import { createSignal, onCleanup } from 'solid-js';

import './styles/gallery-global.css';

export class GalleryRenderer {
  private container: HTMLDivElement | null = null;
  private isMounting = false;
  private stateUnsubscribe: (() => void) | null = null;
  private onCloseCallback: (() => void) | null = null;
  private readonly downloadHandler: ReturnType<typeof useGalleryDownload>['handleDownload'];

  constructor() {
    this.downloadHandler = useGalleryDownload().handleDownload;
    this.setupStateSubscription();
  }

  setOnCloseCallback(onClose: (() => void) | null): void {
    this.onCloseCallback = onClose;
  }

  private setupStateSubscription(): void {
    this.stateUnsubscribe = effectSafe(() => {
      if (gallerySignals.isOpen && !this.container) {
        this.renderGallery();
      } else if (!gallerySignals.isOpen && this.container) {
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
      this.container = null;
      setError(normalizeErrorMessage(error));
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

    const handleDownload = (type: 'current' | 'all') => this.downloadHandler(type);

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

  private cleanupGallery(): void {
    __DEV__ && logger.debug('[GalleryRenderer] Cleanup started');
    this.isMounting = false;
    // NOTE: Do NOT dispose stateUnsubscribe here — it is the Solid.js reactive root
    // created by effectSafe (createRoot). Disposing it would destroy the reactive
    // effect that watches gallerySignals.isOpen, making re-opening impossible.
    // stateUnsubscribe is only disposed in destroy() (permanent teardown).
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
