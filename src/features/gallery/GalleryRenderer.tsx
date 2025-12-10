/**
 * @fileoverview Gallery Renderer
 * @description Handles rendering and lifecycle of the gallery component
 */

import { VerticalGalleryView } from "@features/gallery/components/vertical-gallery-view/VerticalGalleryView";
import { GalleryContainer } from "@shared/components/isolation";
import { ErrorBoundary } from "@shared/components/ui/ErrorBoundary/ErrorBoundary";
import {
  getLanguageService,
  getThemeService,
} from "@shared/container/service-accessors";
import { CoreService } from "@shared/services/service-manager";
import { SERVICE_KEYS } from "@constants";
import { isGMAPIAvailable } from "@shared/external/userscript";
import type { GalleryRenderer as GalleryRendererInterface } from "@shared/interfaces";
import { logger } from "@shared/logging";
import {
  acquireDownloadLock,
  isDownloadLocked,
} from "@shared/state/signals/download.signals";
import {
  closeGallery,
  gallerySignals,
  navigateNext,
  navigatePrevious,
  openGallery,
} from "@shared/state/signals/gallery.signals";
import { setError } from "@shared/state/signals/ui.state";
import type {
  GalleryRenderOptions,
  MediaInfo,
} from "@shared/types/media.types";
import { pauseAmbientVideosForGallery } from "@shared/utils/media/ambient-video-coordinator";
import { createEffect, createSignal, onCleanup } from "solid-js";
import { render } from "solid-js/web";
import "./styles/gallery-global.css";

export class GalleryRenderer implements GalleryRendererInterface {
  private container: HTMLDivElement | null = null;
  private isRenderingFlag = false;
  private stateUnsubscribe: (() => void) | null = null;
  private onCloseCallback?: () => void;
  private disposeApp: (() => void) | null = null;

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
    if (this.isRenderingFlag || this.container) return;

    const { isOpen, mediaItems } = gallerySignals;
    if (!isOpen.value || mediaItems.value.length === 0) return;

    this.isRenderingFlag = true;
    logger.info("[GalleryRenderer] Rendering started");

    try {
      this.createContainer();
      this.renderComponent();
      logger.debug("[GalleryRenderer] Component rendering complete");
    } catch (error) {
      logger.error("[GalleryRenderer] Rendering failed:", error);
      setError("Gallery rendering failed");
    } finally {
      this.isRenderingFlag = false;
    }
  }

  private createContainer(): void {
    this.cleanupContainer();
    this.container = document.createElement("div");
    this.container.className = "xeg-gallery-renderer";
    this.container.setAttribute("data-renderer", "gallery");
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

    const handleDownload = (type: "current" | "all") =>
      this.handleDownload(type);

    const Root = () => {
      const [currentTheme, setCurrentTheme] = createSignal(
        themeService.getCurrentTheme(),
      );
      const [currentLanguage, setCurrentLanguage] = createSignal(
        languageService.getCurrentLanguage(),
      );

      createEffect(() => {
        const unbindTheme = themeService.onThemeChange((_, setting) =>
          setCurrentTheme(setting)
        );
        const unbindLanguage = languageService.onLanguageChange((lang) =>
          setCurrentLanguage(lang)
        );

        onCleanup(() => {
          unbindTheme();
          unbindLanguage();
        });
      });

      return (
        <GalleryContainer
          onClose={handleClose}
          className="xeg-gallery-renderer xeg-gallery-root xeg-theme-scope"
          data-theme={currentTheme()}
          data-language={currentLanguage()}
        >
          <ErrorBoundary>
            <VerticalGalleryView
              onClose={handleClose}
              onPrevious={() => navigatePrevious("button")}
              onNext={() => navigateNext("button")}
              onDownloadCurrent={() => handleDownload("current")}
              onDownloadAll={() => handleDownload("all")}
              className="xeg-vertical-gallery"
            />
          </ErrorBoundary>
        </GalleryContainer>
      );
    };

    this.disposeApp = render(() => <Root />, this.container);
    logger.info("[GalleryRenderer] Gallery mounted");
  }

  async handleDownload(type: "current" | "all"): Promise<void> {
    logger.info(`[GalleryRenderer] handleDownload called with type: ${type}`);
    if (!isGMAPIAvailable("download")) {
      logger.warn("[GalleryRenderer] GM_download unavailable");
      setError("Tampermonkey required for downloads.");
      return;
    }

    if (isDownloadLocked()) return;

    const releaseLock = acquireDownloadLock();

    try {
      const mediaItems = gallerySignals.mediaItems.value;
      // Lazy load download service on first use
      const downloadService = await this.getDownloadService();

      if (type === "current") {
        const currentMedia = mediaItems[gallerySignals.currentIndex.value];
        if (currentMedia) {
          const result = await downloadService.downloadSingle(currentMedia);
          if (!result.success) {
            setError(result.error || "Download failed.");
          }
        }
      } else {
        const result = await downloadService.downloadBulk([...mediaItems]);
        if (!result.success) {
          setError(result.error || "Download failed.");
        }
      }
    } catch (error) {
      logger.error(`[GalleryRenderer] ${type} download failed:`, error);
      setError("Download failed.");
    } finally {
      releaseLock();
    }
  }

  /**
   * Lazy load download service on first use.
   * This enables code splitting - download code is only loaded when user initiates a download.
   */
  private async getDownloadService() {
    // Prefer already registered service in CoreService for testability
    const serviceManager = CoreService.getInstance();
    const preRegistered = serviceManager.tryGet(SERVICE_KEYS.GALLERY_DOWNLOAD);
    if (preRegistered) return preRegistered as any;

    const { ensureDownloadServiceRegistered } = await import(
      "@shared/services/lazy-services"
    );
    await ensureDownloadServiceRegistered();
    const { DownloadOrchestrator } = await import(
      "@shared/services/download/download-orchestrator"
    );
    return DownloadOrchestrator.getInstance();
  }

  private cleanupGallery(): void {
    logger.debug("[GalleryRenderer] Cleanup started");
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
        logger.warn("[GalleryRenderer] Container cleanup failed:", error);
      }
      this.container = null;
    }
  }

  async render(
    mediaItems: readonly MediaInfo[],
    renderOptions?: GalleryRenderOptions,
  ): Promise<void> {
    const pauseContext = renderOptions?.pauseContext ??
      { reason: "programmatic" };

    try {
      pauseAmbientVideosForGallery(pauseContext);
    } catch (error) {
      logger.warn("[GalleryRenderer] Ambient video pause failed", { error });
    }

    openGallery(mediaItems, renderOptions?.startIndex ?? 0);
  }

  close(): void {
    closeGallery();
  }

  isRendering(): boolean {
    return this.isRenderingFlag;
  }

  destroy(): void {
    logger.info("[GalleryRenderer] Full cleanup started");
    this.stateUnsubscribe?.();
    this.cleanupGallery();
  }
}
