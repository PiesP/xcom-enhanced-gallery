/**
 * @fileoverview Gallery Factory (DEPRECATED)
 * @version 1.0.0
 * @deprecated Use ServiceManager instead
 *
 * 이 팩토리는 더 이상 사용되지 않습니다.
 * 대신 @core/services/ServiceManager를 사용하세요.
 */

import type { GalleryRenderer, MediaExtractor } from '@core/interfaces/gallery.interfaces';
import { logger } from '@infrastructure/logging/logger';
import { getService, SERVICE_KEYS } from '@core/services/ServiceRegistry';

/**
 * @deprecated Use ServiceManager instead
 * 갤러리 관련 서비스들을 생성하는 팩토리 클래스
 */
export class GalleryFactory {
  private static galleryRenderer: GalleryRenderer | null = null;
  private static mediaExtractor: MediaExtractor | null = null;
  private static isInitialized = false;

  /**
   * @deprecated Use getService(SERVICE_KEYS.GALLERY_RENDERER) instead
   * 갤러리 렌더러 인스턴스를 생성하거나 반환합니다
   */
  public static async createGalleryRenderer(): Promise<GalleryRenderer> {
    logger.warn('[GalleryFactory] DEPRECATED: Use ServiceManager instead');
    return getService(SERVICE_KEYS.GALLERY_RENDERER);
  }

  /**
   * @deprecated Use getService(SERVICE_KEYS.MEDIA_EXTRACTION) instead
   * 미디어 추출기 인스턴스를 생성하거나 반환합니다
   */
  public static async createMediaExtractor(): Promise<MediaExtractor> {
    logger.warn('[GalleryFactory] DEPRECATED: Use ServiceManager instead');
    return getService(SERVICE_KEYS.MEDIA_EXTRACTION);
  }

  /**
   * @deprecated Use serviceManager.initializeAll() instead
   * 모든 서비스를 한번에 초기화합니다
   */
  public static async initializeAll(): Promise<boolean> {
    logger.warn('[GalleryFactory] DEPRECATED: Use ServiceManager instead');
    try {
      const { serviceManager } = await import('@core/services/ServiceManager');
      await serviceManager.initializeAll();
      return true;
    } catch (error) {
      logger.error('[GalleryFactory] Failed to initialize services:', error);
      return false;
    }
  }

  /**
   * @deprecated Use serviceManager.cleanup() instead
   * 모든 인스턴스를 정리합니다
   */
  public static cleanup(): void {
    logger.warn('[GalleryFactory] DEPRECATED: Use ServiceManager instead');
    // Legacy cleanup for backward compatibility
    this.galleryRenderer = null;
    this.mediaExtractor = null;
    this.isInitialized = false;
  }

  /**
   * @deprecated Use serviceManager.isInitialized() instead
   * 팩토리 초기화 상태를 확인합니다
   */
  public static isReady(): boolean {
    logger.warn('[GalleryFactory] DEPRECATED: Use ServiceManager instead');
    return this.isInitialized;
  }
}
