// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/** Handles rendering and lifecycle of the gallery component. */

import { CSS } from '@constants/css';
import { VerticalGalleryView } from '@features/gallery/components/vertical-gallery-view/VerticalGalleryView';
import { createDownloadHandler } from '@features/gallery/hooks/use-gallery-download';
import {
  GalleryContainer,
  mountGallery,
  unmountGallery,
} from '@shared/components/isolation/GalleryContainer';
import { ErrorBoundary } from '@shared/components/ui/ErrorBoundary/ErrorBoundary';
import { getLanguageService, getThemeService } from '@shared/container/container';
import { normalizeErrorMessage } from '@shared/error/app-error-reporter';
import { logger } from '@shared/logging/logger';
import {
  closeGallery,
  gallerySignals,
  navigateNext,
  navigatePrevious,
  openGallery,
  setError,
} from '@shared/state/signals/gallery.signals';
import type { GalleryRenderOptions, MediaInfo } from '@shared/types/media.types';
import { createEffectRoot } from '@shared/utils/solid/accessor-utils';
import type { JSX } from 'solid-js';
import { createSignal, onCleanup } from 'solid-js';

import './styles/gallery-global.css';

interface GalleryRootProps {
  readonly onClose: () => void;
  readonly onDownloadCurrent: () => void;
  readonly onDownloadAll: () => void;
}

function GalleryRoot(props: GalleryRootProps): JSX.Element {
  const themeService = getThemeService();
  const languageService = getLanguageService();

  const [currentTheme, setCurrentTheme] = createSignal(themeService.getCurrentTheme());
  const [currentLanguage, setCurrentLanguage] = createSignal(languageService.getCurrentLanguage());

  const unbindTheme = themeService.onThemeChange((_, setting) => setCurrentTheme(setting));
  const unbindLanguage = languageService.onLanguageChange((lang) => setCurrentLanguage(lang));

  onCleanup(() => {
    unbindTheme();
    unbindLanguage();
  });

  return (
    <ErrorBoundary>
      <GalleryContainer
        className={`${CSS.CLASSES.RENDERER} ${CSS.CLASSES.ROOT} xeg-theme-scope`}
        data-theme={currentTheme()}
        data-language={currentLanguage()}
        lang={currentLanguage()}
      >
        <VerticalGalleryView
          onClose={props.onClose}
          onPrevious={() => navigatePrevious('button')}
          onNext={() => navigateNext('button')}
          onDownloadCurrent={() => props.onDownloadCurrent()}
          onDownloadAll={() => props.onDownloadAll()}
          className={CSS.CLASSES.VERTICAL_VIEW}
        />
      </GalleryContainer>
    </ErrorBoundary>
  );
}

export class GalleryRenderer {
  private container: HTMLDivElement | null = null;
  private isMounting = false;
  private destroyed = false;
  private stateUnsubscribe: (() => void) | null = null;
  private readonly downloadHandler: ReturnType<typeof createDownloadHandler>;

  constructor() {
    this.downloadHandler = createDownloadHandler();
    this.setupStateSubscription();
  }

  private setupStateSubscription(): void {
    this.stateUnsubscribe = createEffectRoot(() => {
      if (this.destroyed) return;
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
    document.body.inert = true;
    document.body.appendChild(this.container);
  }

  private renderComponent(): void {
    if (!this.container) return;

    const handleClose = () => {
      closeGallery();
    };

    mountGallery(this.container, () => (
      <GalleryRoot
        onClose={handleClose}
        onDownloadCurrent={() => this.downloadHandler.handleDownload('current')}
        onDownloadAll={() => this.downloadHandler.handleDownload('all')}
      />
    ));
    __DEV__ && logger.info('[GalleryRenderer] Gallery mounted');
  }

  private cleanupGallery(): void {
    __DEV__ && logger.debug('[GalleryRenderer] Cleanup started');
    this.isMounting = false;
    // Cancel any in-progress downloads when the gallery is closed.
    this.downloadHandler.cancelDownloads();
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
        document.body.inert = false;
        this.container = null;
      }
    }
  }

  render(mediaItems: readonly MediaInfo[], renderOptions?: GalleryRenderOptions): void {
    openGallery(mediaItems, renderOptions?.startIndex ?? 0);
  }

  close(): void {
    if (!gallerySignals.isOpen) {
      return;
    }

    closeGallery();
  }

  isRendering(): boolean {
    return !!(this.container && gallerySignals.isOpen);
  }

  destroy(): void {
    __DEV__ && logger.info('[GalleryRenderer] Full cleanup started');
    this.destroyed = true;
    this.stateUnsubscribe?.();
    this.stateUnsubscribe = null;
    this.cleanupGallery();
  }
}
