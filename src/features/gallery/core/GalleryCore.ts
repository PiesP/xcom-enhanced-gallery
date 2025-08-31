/**
 * 갤러리 핵심 비즈니스 로직
 *
 * 책임:
 * - 갤러리 상태 관리
 * - 미디어 리스트 관리
 * - 네비게이션 로직
 * - 갤러리 생명주기 관리
 */

import { logger } from '@shared/logging/logger';
import { galleryState, openGallery, closeGallery } from '@shared/state/signals/gallery.signals';
import type { MediaInfo } from '@shared/types/media.types';
import { MEDIA_TYPES } from '@shared/constants/media.constants';

/**
 * 네비게이션 결과
 */
export interface NavigationResult {
  /** 네비게이션 성공 여부 */
  success: boolean;
  /** 이전 인덱스 */
  previousIndex: number;
  /** 새로운 인덱스 */
  newIndex: number;
  /** 현재 미디어 정보 */
  currentMedia: MediaInfo | null;
}

/**
 * 갤러리 핵심 비즈니스 로직
 */
export class GalleryCore {
  private mediaItems: MediaInfo[] = [];
  private currentIndex = 0;
  private initState = false;

  constructor() {
    logger.debug('[GalleryCore] 인스턴스 생성');
  }

  /**
   * 갤러리 코어 초기화
   */
  initialize(mediaItems: MediaInfo[]): void {
    if (!mediaItems || mediaItems.length === 0) {
      throw new Error('Media list cannot be empty');
    }

    try {
      logger.info('[GalleryCore] 초기화 시작');

      // 미디어 아이템 설정
      this.mediaItems = [...mediaItems];
      this.currentIndex = 0;
      this.initState = true;

      logger.info(`[GalleryCore] 초기화 완료: ${mediaItems.length}개 미디어`);
    } catch (error) {
      logger.error('[GalleryCore] 초기화 실패:', error);
      throw new Error(
        `GalleryCore 초기화 실패: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 미디어 개수 반환
   */
  getMediaCount(): number {
    this.ensureInitialized();
    return this.mediaItems.length;
  }

  /**
   * 미디어 아이템 목록 반환
   */
  getMediaItems(): MediaInfo[] {
    this.ensureInitialized();
    return [...this.mediaItems];
  }

  /**
   * 현재 인덱스 반환
   */
  getCurrentIndex(): number {
    this.ensureInitialized();
    return this.currentIndex;
  }

  /**
   * 현재 미디어 아이템 반환
   */
  getCurrentMediaItem(): MediaInfo | null {
    this.ensureInitialized();
    return this.mediaItems[this.currentIndex] || null;
  }

  /**
   * 현재 인덱스 설정
   */
  setCurrentIndex(index: number): void {
    this.ensureInitialized();

    // 인덱스 범위 조정
    const validIndex = Math.max(0, Math.min(index, this.mediaItems.length - 1));
    this.currentIndex = validIndex;

    logger.debug(`[GalleryCore] 인덱스 설정: ${index} -> ${validIndex}`);
  }

  /**
   * 다음 미디어로 이동
   */
  navigateNext(): boolean {
    this.ensureInitialized();

    const previousIndex = this.currentIndex;
    const newIndex = Math.min(previousIndex + 1, this.mediaItems.length - 1);
    const success = newIndex !== previousIndex;

    if (success) {
      this.currentIndex = newIndex;
      logger.debug(`[GalleryCore] 다음으로 이동: ${previousIndex} -> ${newIndex}`);
    }

    return success;
  }

  /**
   * 이전 미디어로 이동
   */
  navigatePrevious(): boolean {
    this.ensureInitialized();

    const previousIndex = this.currentIndex;
    const newIndex = Math.max(previousIndex - 1, 0);
    const success = newIndex !== previousIndex;

    if (success) {
      this.currentIndex = newIndex;
      logger.debug(`[GalleryCore] 이전으로 이동: ${previousIndex} -> ${newIndex}`);
    }

    return success;
  }

  /**
   * 특정 인덱스로 이동
   */
  navigateToIndex(targetIndex: number): NavigationResult {
    this.ensureInitialized();

    const previousIndex = this.currentIndex;
    const newIndex = Math.max(0, Math.min(targetIndex, this.mediaItems.length - 1));
    const success = newIndex !== previousIndex;

    if (success) {
      this.currentIndex = newIndex;
      logger.debug(`[GalleryCore] 인덱스로 이동: ${previousIndex} -> ${newIndex}`);
    }

    return {
      success,
      previousIndex,
      newIndex,
      currentMedia: this.getCurrentMediaItem(),
    };
  }

  /**
   * 갤러리 열기 (상태 동기화)
   */
  openGallery(): void {
    this.ensureInitialized();

    try {
      logger.info('[GalleryCore] 갤러리 열기');
      openGallery(this.mediaItems, this.currentIndex);
      logger.info(`[GalleryCore] 갤러리 열기 성공`);
    } catch (error) {
      logger.error('[GalleryCore] 갤러리 열기 실패:', error);
      throw error;
    }
  }

  /**
   * 갤러리 닫기
   */
  closeGallery(): void {
    try {
      if (galleryState.value.isOpen) {
        closeGallery();
        logger.info('[GalleryCore] 갤러리 닫기 완료');
      }
    } catch (error) {
      logger.error('[GalleryCore] 갤러리 닫기 실패:', error);
      throw error;
    }
  }

  /**
   * 갤러리가 열려있는지 확인
   */
  isOpen(): boolean {
    return galleryState.value.isOpen;
  }

  /**
   * 초기화 상태 확인
   */
  isInitialized(): boolean {
    return this.initState;
  }

  /**
   * 초기화 상태 확인 (별칭)
   */
  isInitializedState(): boolean {
    return this.initState;
  }

  /**
   * 진단 정보 반환
   */
  getDiagnostics() {
    return {
      isInitialized: this.initState,
      mediaCount: this.mediaItems.length,
      currentIndex: this.currentIndex,
      currentMedia: this.getCurrentMediaItem(),
      galleryState: {
        isOpen: galleryState.value.isOpen,
        stateMediaCount: galleryState.value.mediaItems.length,
        stateCurrentIndex: galleryState.value.currentIndex,
      },
    };
  }

  /**
   * 미디어 타입 검증
   */
  validateMediaTypes(): boolean {
    this.ensureInitialized();

    return this.mediaItems.every(item => {
      return (
        typeof item.url === 'string' &&
        typeof item.type === 'string' &&
        Object.values(MEDIA_TYPES).includes(
          item.type as (typeof MEDIA_TYPES)[keyof typeof MEDIA_TYPES]
        ) &&
        typeof item.originalUrl === 'string'
      );
    });
  }

  /**
   * 상수 사용 검증
   */
  usesConstants(): boolean {
    this.ensureInitialized();

    const currentMedia = this.getCurrentMediaItem();
    if (!currentMedia) return false;

    // MEDIA_TYPES 상수가 올바르게 사용되는지 확인
    return Object.values(MEDIA_TYPES).includes(
      currentMedia.type as (typeof MEDIA_TYPES)[keyof typeof MEDIA_TYPES]
    );
  }

  /**
   * 정리
   */
  cleanup(): void {
    try {
      logger.info('[GalleryCore] 정리 시작');

      // 갤러리가 열려있다면 닫기
      if (this.isOpen()) {
        this.closeGallery();
      }

      // 상태 초기화
      this.mediaItems = [];
      this.currentIndex = 0;
      this.initState = false;

      logger.info('[GalleryCore] 정리 완료');
    } catch (error) {
      logger.error('[GalleryCore] 정리 실패:', error);
    }
  }

  /**
   * 초기화 상태 확인
   */
  private ensureInitialized(): void {
    if (!this.initState) {
      throw new Error('Gallery not initialized');
    }
  }
}
