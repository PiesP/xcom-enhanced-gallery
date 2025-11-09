/**
 * @fileoverview Gallery Renderer
 * @version 3.0.0 - Simplified architecture
 *
 * Gallery renderer - Handles rendering and lifecycle only
 * - Renders Solid.js components
 * - Manages DOM lifecycle
 * - State changes handled via signal subscription
 */

import type { GalleryRenderer as GalleryRendererInterface } from '@shared/interfaces';
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
import { acquireDownloadLock, isDownloadLocked } from '@shared/state/signals/download.signals';
import type { GalleryRenderOptions, MediaInfo } from '@shared/types/media.types';
import { VerticalGalleryView } from './components/vertical-gallery-view/VerticalGalleryView';
import { GalleryContainer } from '../../shared/components/isolation';
import { ErrorBoundary } from '../../shared/components/ui/ErrorBoundary/ErrorBoundary';
import './styles/gallery-global.css';
import { logger } from '@shared/logging';
import { getSolid } from '../../shared/external/vendors';
import { unifiedDownloadService } from '@shared/services/unified-download-service';
import { isGMAPIAvailable } from '@shared/external/userscript';

let galleryMountCount = 0;

/**
 * Gallery renderer - DOM rendering and lifecycle management
 */
export class GalleryRenderer implements GalleryRendererInterface {
  private container: HTMLDivElement | null = null;
  private isRenderingFlag = false;
  private stateUnsubscribe: (() => void) | null = null;
  private onCloseCallback?: () => void;
  private disposeApp: (() => void) | null = null;

  constructor() {
    this.setupStateSubscription();
  }

  /**
   * Set gallery close callback
   */
  setOnCloseCallback(onClose: () => void): void {
    this.onCloseCallback = onClose;
  }

  /**
   * Setup state subscription - Signal change detection
   */
  private setupStateSubscription(): void {
    // Detect gallerySignals.isOpen changes and auto-render/cleanup
    this.stateUnsubscribe = gallerySignals.isOpen.subscribe(isOpen => {
      if (isOpen && !this.container) {
        this.renderGallery();
      } else if (!isOpen && this.container) {
        this.cleanupGallery();
      }
    });
  }

  /**
   * Render gallery - Execute once initially
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

  /**
   * Create container element
   */
  private createContainer(): void {
    this.cleanupContainer();
    this.container = document.createElement('div');
    this.container.className = 'xeg-gallery-renderer';
    this.container.setAttribute('data-renderer', 'gallery');
    document.body.appendChild(this.container);
  }

  /**
   * Render component - Solid.js component creation
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
    galleryMountCount += 1;
    logger.info('[GalleryRenderer] Gallery mounted', {
      mountCount: galleryMountCount,
    });
  }

  /**
   * Handle download action
   *
   * Phase 317: Environment guard - Check GM API availability
   * Phase 312-4: Lazy registration of BulkDownloadService
   * - First bulk download: 100-150ms delay (service loads from disk)
   * - Subsequent downloads: instant (service cached)
   */
  private async handleDownload(type: 'current' | 'all'): Promise<void> {
    // Phase 317: GM API check - if not available, only show notification
    if (!isGMAPIAvailable('download')) {
      logger.warn('[GalleryRenderer] GM_download not available');
      setError(
        'Tampermonkey or similar userscript manager is required. Download functionality is not available.'
      );
      return;
    }

    if (isDownloadLocked()) {
      logger.debug('[GalleryRenderer] Download request ignored: operation already in progress');
      return;
    }

    const releaseDownloadLock = acquireDownloadLock();
    setLoading(true);

    try {
      // Phase 312: UnifiedDownloadService usage (Singleton)
      const mediaItems = gallerySignals.mediaItems.value;
      const currentIndex = gallerySignals.currentIndex.value;

      if (type === 'current') {
        const currentMedia = mediaItems[currentIndex];
        if (currentMedia) {
          const result = await unifiedDownloadService.downloadSingle(currentMedia);
          if (!result.success) {
            setError(result.error || 'Download failed.');
          }
        }
      } else {
        // Phase 312-4: Ensure UnifiedDownloadService is registered (lazy loading)
        // This delays first bulk download by 100-150ms, but removes 15-20 KB from initial bundle
        try {
          const { ensureUnifiedDownloadServiceRegistered } = await import(
            '@shared/services/lazy-service-registration'
          );
          await ensureUnifiedDownloadServiceRegistered();
          logger.debug('[GalleryRenderer] UnifiedDownloadService lazy registration completed');
        } catch (error) {
          logger.warn('[GalleryRenderer] UnifiedDownloadService lazy registration failed:', error);
          // Continue with download anyway - service might already be registered
        }

        // Convert readonly array to mutable
        const mutableMediaItems = Array.from(mediaItems);
        const result = await unifiedDownloadService.downloadBulk(mutableMediaItems);
        if (!result.success) {
          setError(result.error || 'Download failed.');
        }
      }
    } catch (error) {
      logger.error(`[GalleryRenderer] ${type} download failed:`, error);
      setError('Download failed.');
    } finally {
      setLoading(false);
      releaseDownloadLock();
    }
  }

  /**
   * Cleanup gallery - Reset state and remove DOM
   */
  private cleanupGallery(): void {
    logger.debug('[GalleryRenderer] Cleanup started');
    this.isRenderingFlag = false;
    this.cleanupContainer();
  }

  /**
   * Cleanup container - Dispose components and remove DOM
   */
  private cleanupContainer(): void {
    if (this.container) {
      try {
        // Cleanup gallery app
        this.disposeApp?.();
        this.disposeApp = null;

        // Remove from DOM
        if (document.contains(this.container)) {
          this.container.remove();
        }
      } catch (error) {
        logger.warn('[GalleryRenderer] Container cleanup failed:', error);
      }
      this.container = null;
    }
  }

  // =============================================================================
  // GalleryRendererInterface Implementation
  // =============================================================================

  /**
   * Render gallery with media items
   */
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

  /**
   * Close gallery
   */
  close(): void {
    closeGallery();
  }

  /**
   * Check if gallery is rendering
   */
  isRendering(): boolean {
    return this.isRenderingFlag;
  }

  /**
   * Complete cleanup - Dispose state subscription and remove DOM
   */
  destroy(): void {
    logger.info('[GalleryRenderer] Full cleanup started');
    this.stateUnsubscribe?.();
    this.cleanupGallery();
    logger.debug('[GalleryRenderer] Full cleanup complete');
  }
}

// Export singleton instance
export const galleryRenderer = new GalleryRenderer();
