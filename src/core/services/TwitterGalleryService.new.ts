/**
 * @fileoverview Twitter Gallery Service
 * @version 4.0.0 - Clean Architecture Compliant with New Signals
 *
 * 트위터 클릭 이벤트에서 수직 갤러리 뷰와 툴바를 통합하여 완전한 갤러리 경험을 제공
 * Clean Architecture 원칙을 준수하여 features 레이어에 직접 의존하지 않음
 */

import type { GalleryRenderer } from '../interfaces/gallery.interfaces';
import {
  closeGallery,
  galleryState,
  getCurrentMedia as getCurrentMediaItem,
  getGalleryInfo,
  openGallery,
} from '../state/signals/unified-gallery.signals';
import type { MediaInfo } from '../types/media.types';
import { logger } from '../../infrastructure/logging/logger';

export interface GalleryOpenOptions {
  mediaItems: MediaInfo[];
  startIndex?: number;
  autoPlay?: boolean;
}

export interface TwitterGalleryServiceInterface {
  openGallery(options: GalleryOpenOptions): Promise<void>;
  closeGallery(): void;
  isOpen(): boolean;
  getCurrentMediaItem(): MediaInfo | null;
  getMediaItems(): MediaInfo[];
  setRenderer(renderer: GalleryRenderer): void;
}

/**
 * Twitter Gallery Service
 *
 * 트위터 클릭 이벤트에서 수직 갤러리 뷰와 툴바를 통합하여
 * 완전한 갤러리 경험을 제공하는 서비스
 * Clean Architecture 원칙을 준수하여 GalleryRenderer 인터페이스에 의존
 */
export class TwitterGalleryService implements TwitterGalleryServiceInterface {
  private static instance: TwitterGalleryService | null = null;
  private galleryRenderer: GalleryRenderer | null = null;
  private isInitialized = false;

  private constructor(galleryRenderer?: GalleryRenderer) {
    this.galleryRenderer = galleryRenderer ?? null;
  }

  public static getInstance(galleryRenderer?: GalleryRenderer): TwitterGalleryService {
    TwitterGalleryService.instance ??= new TwitterGalleryService(galleryRenderer);
    return TwitterGalleryService.instance;
  }

  /**
   * 갤러리 렌더러 설정 (의존성 주입)
   */
  public setRenderer(renderer: GalleryRenderer): void {
    this.galleryRenderer = renderer;
    this.isInitialized = true;
    logger.debug('🎨 Gallery renderer injected');
  }

  /**
   * 갤러리 열기
   * 수직 갤러리 뷰와 툴바를 포함한 완전한 갤러리 UI를 렌더링합니다.
   */
  public async openGallery(options: GalleryOpenOptions): Promise<void> {
    try {
      logger.info('🖼️ Opening Twitter gallery:', {
        mediaCount: options.mediaItems.length,
        startIndex: options.startIndex ?? 0,
        autoPlay: options.autoPlay ?? false,
      });

      if (!this.galleryRenderer) {
        throw new Error(
          'Gallery renderer not initialized. Please set renderer before opening gallery.'
        );
      }

      // 새로운 signals를 통한 갤러리 상태 업데이트
      openGallery(options.mediaItems, options.startIndex ?? 0);

      // 상태 확인 (디버깅용)
      const info = getGalleryInfo();
      logger.debug('🔍 TwitterGalleryService 상태 확인:', info);

      // 갤러리 렌더링
      await this.galleryRenderer.render(options.mediaItems, {
        startIndex: options.startIndex,
      });

      logger.info('✅ Twitter gallery opened successfully');
    } catch (error) {
      logger.error('❌ Failed to open Twitter gallery:', error);
      throw error;
    }
  }

  /**
   * 갤러리 닫기
   */
  public closeGallery(): void {
    try {
      logger.info('🔒 Closing Twitter gallery');

      // 새로운 signals를 통한 갤러리 닫기
      closeGallery();

      logger.info('✅ Twitter gallery closed successfully');
    } catch (error) {
      logger.error('❌ Failed to close Twitter gallery:', error);
    }
  }

  /**
   * 갤러리 열림 상태 확인
   */
  public isOpen(): boolean {
    return galleryState.value.isOpen;
  }

  /**
   * 현재 미디어 아이템 반환
   */
  public getCurrentMediaItem(): MediaInfo | null {
    return getCurrentMediaItem();
  }

  /**
   * 모든 미디어 아이템 반환
   */
  public getMediaItems(): MediaInfo[] {
    return Array.from(galleryState.value.mediaItems);
  }

  /**
   * 서비스 완전 정리
   */
  public destroy(): void {
    logger.info('🧹 Destroying TwitterGalleryService');

    // 갤러리 닫기
    this.closeGallery();

    // 렌더러 정리
    if (this.galleryRenderer) {
      this.galleryRenderer.destroy();
      this.galleryRenderer = null;
    }

    // 인스턴스 정리
    this.isInitialized = false;
    TwitterGalleryService.instance = null;

    logger.info('✅ TwitterGalleryService destroyed');
  }

  /**
   * 디버깅 정보
   */
  public getDiagnostics() {
    const info = getGalleryInfo();
    return {
      isInitialized: this.isInitialized,
      hasRenderer: !!this.galleryRenderer,
      isOpen: info.isOpen,
      mediaCount: info.mediaCount,
      totalItems: info.totalItems,
      currentIndex: info.currentIndex,
      currentMediaItem: this.getCurrentMediaItem()?.id ?? null,
    };
  }
}
