/**
 * @fileoverview Gallery State Signals for X.com Enhanced Gallery
 * @license MIT
 * @version 3.0.0 - Simplified event-free direct state management
 * @author X.com Enhanced Gallery Team
 * @since 1.0.0
 *
 * @description
 * 갤러리 상태 관리를 위한 Preact Signals 기반 매니저.
 * 이벤트 시스템 없이 직접 상태를 관리하여 단순성과 안정성을 보장합니다.
 */

import type { MediaInfo } from '@core/types/media.types';
import { logger } from '@infrastructure/logging/logger';
import { getPageScrollLockManager } from '@shared/utils/core';
import { VideoControlUtil } from '@shared/utils/media/video-control.util';
import { VideoStateManager } from '@shared/utils/media/video-state-manager';
import { getPreactSignals } from '@shared/utils/external';

const { batch, computed, effect, signal } = getPreactSignals();

/**
 * 뷰 모드 타입 정의 (core 계층에서 정의)
 */
import type { ViewMode } from '@core/types/view-mode.types';

/**
 * 갤러리 상태 관리자
 *
 * Phase 1.2: 갤러리 상태 관리 재설계 완료
 * Phase 2: 수직 갤러리 뷰를 위한 currentTweetMediaItems 추가
 *
 * 인스턴스별 갤러리 상태 관리
 */
export class GalleryStateManager {
  private static readonly instances = new Map<string, GalleryStateManager>();
  private readonly videoControlUtil: VideoControlUtil;

  // 기본 상태 signals - 불변성 보장
  public readonly isOpen = signal<boolean>(false);
  public readonly mediaItems = signal<readonly MediaInfo[]>(Object.freeze([]));
  public readonly currentIndex = signal<number>(0);
  public readonly isLoading = signal<boolean>(false);
  public readonly error = signal<string | null>(null);

  // 새로운 뷰 모드 상태 - Phase 1 개선사항 (기본값을 verticalList로 변경)
  public readonly viewMode = signal<ViewMode>('verticalList');

  // Phase 2: 현재 트윗의 전체 미디어 목록 - 수직 갤러리 뷰를 위한 상태
  public readonly currentTweetMediaItems = signal<readonly MediaInfo[]>(Object.freeze([]));

  // 계산된 상태들
  public readonly currentMedia = computed(() => {
    const items = this.mediaItems.value;
    const index = this.currentIndex.value;
    return items.length > 0 && index >= 0 && index < items.length ? items[index] : null;
  });

  public readonly navigation = computed(() => {
    const total = this.mediaItems.value.length;
    const current = this.currentIndex.value;

    return Object.freeze({
      current: current + 1,
      total,
      canPrev: current > 0,
      canNext: current < total - 1,
      hasMultiple: total > 1,
    } as const);
  });

  public readonly galleryInfo = computed(() => {
    const items = this.mediaItems.value;
    return Object.freeze({
      totalImages: items.filter(item => item.type === 'image').length,
      totalVideos: items.filter(item => item.type === 'video').length,
      totalSize: items.length,
    } as const);
  });

  private constructor(private readonly instanceId: string) {
    this.videoControlUtil = VideoControlUtil.getInstance();
    this.setupEffects();
  }

  /**
   * 인스턴스 팩토리 메서드
   */
  static getInstance(instanceId: string = 'default'): GalleryStateManager {
    if (!GalleryStateManager.instances.has(instanceId)) {
      GalleryStateManager.instances.set(instanceId, new GalleryStateManager(instanceId));
    }
    const instance = GalleryStateManager.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Gallery state manager instance '${instanceId}' not found`);
    }
    return instance;
  }

  /**
   * 부작용 설정
   */
  private setupEffects(): void {
    // 갤러리 열림/닫힘 시 스크롤 보존 시스템 사용
    effect(() => {
      const scrollManager = getPageScrollLockManager();

      if (this.isOpen.value) {
        // 갤러리 열릴 때: 스크롤 위치 보존 및 잠금
        try {
          scrollManager.lock();
          logger.debug(`Gallery scroll preserved and locked for instance: ${this.instanceId}`);
        } catch (error) {
          logger.warn('Failed to preserve scroll during gallery open:', error);
        }
      } else {
        // 갤러리 닫힐 때: 스크롤 복원 및 잠금 해제
        try {
          scrollManager.unlock();
          logger.debug(`Gallery scroll restored and unlocked for instance: ${this.instanceId}`);
        } catch (error) {
          logger.warn('Failed to restore scroll during gallery close:', error);
        }
      }
    });

    // 에러 상태 자동 정리
    effect(() => {
      if (this.error.value) {
        const errorMsg = this.error.value;
        setTimeout(() => {
          if (this.error.value === errorMsg) {
            this.error.value = null;
          }
        }, 5000);
      }
    });

    // 미디어 아이템 변경 시 인덱스 유효성 검사
    effect(() => {
      const items = this.mediaItems.value;
      const currentIdx = this.currentIndex.value;

      if (items.length === 0) {
        this.currentIndex.value = 0;
      } else if (currentIdx >= items.length) {
        this.currentIndex.value = Math.max(0, items.length - 1);
      } else if (currentIdx < 0) {
        this.currentIndex.value = 0;
      }
    });
  }

  /**
   * 액션 메서드들
   */
  openGallery(items: readonly MediaInfo[], startIndex: number = 0): void {
    if (items.length === 0) {
      logger.warn('Cannot open gallery with empty items array');
      return;
    }

    const validStartIndex = Math.max(0, Math.min(startIndex, items.length - 1));

    // 갤러리 열기 전 모든 동영상 일시정지
    this.videoControlUtil.pauseAllVideos();

    batch(() => {
      this.mediaItems.value = Object.freeze([...items]);
      this.currentIndex.value = validStartIndex;
      this.isOpen.value = true;
      this.error.value = null;
    });

    // 갤러리 오픈 이벤트 발송 (무한 루프 방지를 위해 조건부 발송)
    try {
      // 실제 갤러리가 열릴 때만 이벤트 발송
      if (this.isOpen.value) {
        const openEvent = new CustomEvent('xeg:galleryStateChanged', {
          detail: {
            isOpen: true,
            mediaCount: items.length,
            startIndex: validStartIndex,
            instanceId: this.instanceId,
          },
        });
        document.dispatchEvent(openEvent);
        logger.debug(`Gallery state change event dispatched for instance: ${this.instanceId}`);
      }
    } catch (error) {
      logger.warn('Failed to dispatch gallery open event:', error);
    }

    logger.info(
      `Gallery opened with ${items.length} items, starting at index ${validStartIndex} for instance: ${this.instanceId}`
    );
  }

  /**
   * 갤러리를 닫습니다.
   * 정상적인 갤러리 닫기 프로세스를 수행하며, 완전한 상태 초기화로 재열기 문제를 방지합니다.
   * 동영상은 정지 상태를 유지합니다.
   */
  closeGallery(): void {
    if (!this.isOpen.value) {
      logger.debug('Gallery is already closed, skipping close process');
      return;
    }

    logger.debug(`Closing gallery for instance: ${this.instanceId}`);

    batch(() => {
      this.isOpen.value = false;
      this.isLoading.value = false;
      this.error.value = null;
      // 재열기 문제 방지를 위해 완전한 상태 초기화
      this.mediaItems.value = Object.freeze([]);
      this.currentIndex.value = 0;
      this.currentTweetMediaItems.value = Object.freeze([]);
    });

    // 갤러리 닫기 후 동영상은 정지 상태를 유지 (resumePausedVideos 호출 제거)
    // 사용자가 트위터에서 동영상 제어를 할 수 있도록 정지 상태 유지

    // 캐시 정리: VideoStateManager의 캐시도 함께 정리
    try {
      const videoStateManager = VideoStateManager.getInstance();
      videoStateManager.clearAllCache();
      logger.debug('Gallery close: media cache cleared');
    } catch (error) {
      logger.warn('Failed to clear media cache during gallery close:', error);
    }

    // DOM 상태 정리 및 포커스 복원은 다음 프레임에서 수행 (타이밍 최적화)
    requestAnimationFrame(() => {
      try {
        // 포커스를 body로 복원하여 키보드 이벤트가 다시 정상 작동하도록 함
        if (document.activeElement && document.activeElement !== document.body) {
          document.body.focus();
          logger.debug('Focus restored to body after gallery close');
        }

        // 갤러리 상태 변경 이벤트 발송 (무한 루프 방지를 위해 조건부 발송)
        const closeEvent = new CustomEvent('xeg:galleryStateChanged', {
          detail: {
            isOpen: false,
            mediaCount: this.mediaItems.value.length,
            instanceId: this.instanceId,
          },
        });
        document.dispatchEvent(closeEvent);
        logger.debug(`Gallery close event dispatched for instance: ${this.instanceId}`);
      } catch (error) {
        logger.warn('DOM cleanup during close failed:', error);
      }
    });

    logger.debug(`Gallery closed successfully for instance: ${this.instanceId}`);
  }

  goToNext(): void {
    const items = this.mediaItems.value;
    const current = this.currentIndex.value;

    if (current < items.length - 1) {
      this.currentIndex.value = current + 1;
    }
  }

  goToPrevious(): void {
    const current = this.currentIndex.value;

    if (current > 0) {
      this.currentIndex.value = current - 1;
    }
  }

  goToIndex(index: number): void {
    const items = this.mediaItems.value;

    if (index >= 0 && index < items.length) {
      this.currentIndex.value = index;
    }
  }

  goToFirst(): void {
    this.currentIndex.value = 0;
  }

  goToLast(): void {
    const items = this.mediaItems.value;
    if (items.length > 0) {
      this.currentIndex.value = items.length - 1;
    }
  }

  setLoading(loading: boolean): void {
    this.isLoading.value = loading;
  }

  setError(error: string | null): void {
    this.error.value = error;
  }

  /**
   * 갤러리 뷰 모드를 변경합니다 (수직 갤러리만 지원)
   * @param mode - 새로운 뷰 모드 (항상 'verticalList')
   */
  setViewMode(mode: ViewMode): void {
    // 수직 갤러리만 지원하므로 항상 verticalList로 설정
    this.viewMode.value = 'verticalList';
    logger.debug(`Gallery view mode set to: verticalList (requested: ${mode})`);
  }

  /**
   * Phase 2: 현재 트윗의 미디어 아이템들을 설정합니다
   * @param mediaItems - 현재 트윗에서 추출된 미디어 아이템들
   */
  setCurrentTweetMediaItems(mediaItems: readonly MediaInfo[]): void {
    this.currentTweetMediaItems.value = Object.freeze([...mediaItems]);
    logger.debug(`Current tweet media items updated: ${mediaItems.length} items`);
  }

  /**
   * Phase 2: 현재 트윗의 미디어 아이템들을 클리어합니다
   */
  clearCurrentTweetMediaItems(): void {
    this.currentTweetMediaItems.value = Object.freeze([]);
  }

  addMediaItems(newItems: readonly MediaInfo[]): void {
    if (newItems.length === 0) {
      return;
    }

    const currentItems = this.mediaItems.value;
    const uniqueNewItems = newItems.filter(
      newItem => !currentItems.some(existing => existing.id === newItem.id)
    );

    if (uniqueNewItems.length > 0) {
      this.mediaItems.value = Object.freeze([...currentItems, ...uniqueNewItems]);
    }
  }

  removeMediaItem(itemId: string): void {
    const items = this.mediaItems.value;
    const newItems = items.filter(item => item.id !== itemId);

    if (newItems.length !== items.length) {
      this.mediaItems.value = newItems;
    }
  }

  /**
   * 갤러리를 다시 활성화합니다.
   * 이전에 열렸던 미디어 목록이 있는 경우 같은 상태로 재열기합니다.
   *
   * @param startIndex - 시작할 인덱스 (기본값: 현재 인덱스 유지)
   * @returns 성공적으로 재활성화되었는지 여부
   */
  reactivateGallery(startIndex?: number): boolean {
    const items = this.mediaItems.value;

    if (items.length === 0) {
      logger.warn('Cannot reactivate gallery: no media items available');
      return false;
    }

    const targetIndex = startIndex ?? this.currentIndex.value;
    const validIndex = Math.max(0, Math.min(targetIndex, items.length - 1));

    batch(() => {
      this.currentIndex.value = validIndex;
      this.isOpen.value = true;
      this.isLoading.value = false;
      this.error.value = null;
    });

    logger.info(`Gallery reactivated at index ${validIndex} for instance: ${this.instanceId}`);
    return true;
  }

  /**
   * 갤러리가 재활성화 가능한 상태인지 확인합니다.
   */
  canReactivate(): boolean {
    return !this.isOpen.value && this.mediaItems.value.length > 0;
  }

  /**
   * 상태 초기화
   * 정상적인 갤러리 닫기 시 사용되는 메서드
   */
  reset(): void {
    batch(() => {
      this.isOpen.value = false;
      this.mediaItems.value = Object.freeze([]);
      this.currentIndex.value = 0;
      this.isLoading.value = false;
      this.error.value = null;
      this.currentTweetMediaItems.value = Object.freeze([]);
    });

    logger.debug(`Gallery state reset for instance: ${this.instanceId}`);
  }

  /**
   * 모든 갤러리 상태를 강제로 리셋합니다.
   * 상태 불일치 문제 발생 시 사용하는 긴급 복구 메서드입니다.
   *
   * 갤러리 재열기 문제 해결을 위한 완전한 상태 정리 수행:
   * 1. 모든 signals 초기화
   * 2. DOM 상태 정리
   * 3. 이벤트 리스너 정리
   * 4. 메모리 누수 방지
   */
  forceResetAll(): void {
    logger.warn(`🔄 Force reset initiated for instance: ${this.instanceId}`);

    // 1. Signals 상태 완전 초기화
    batch(() => {
      this.isOpen.value = false;
      this.mediaItems.value = Object.freeze([]);
      this.currentIndex.value = 0;
      this.isLoading.value = false;
      this.error.value = null;
      this.currentTweetMediaItems.value = Object.freeze([]);
      this.viewMode.value = 'verticalList'; // 기본 뷰 모드로 리셋
    });

    // 2. DOM 강제 정리 및 스크롤 서비스 강제 해제
    try {
      // 스크롤 매니저 강제 해제 (우선 순위 높음)
      const scrollManager = getPageScrollLockManager();
      if (scrollManager.isScrollLocked()) {
        scrollManager.forceUnlock();
        logger.debug('ScrollManager force unlocked during gallery force reset');
      }

      // Body 클래스 정리
      document.body.classList.remove('xeg-gallery-open');

      // 스타일 속성 정리 (ScrollManager가 처리하지 못한 경우를 위한 폴백)
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('position');
      document.body.style.removeProperty('top');
      document.body.style.removeProperty('left');
      document.body.style.removeProperty('width');
      document.body.style.removeProperty('padding-right');
      document.documentElement.style.removeProperty('overflow');

      // 모든 갤러리 오버레이 제거
      const overlays = document.querySelectorAll('[data-gallery-element="overlay"]');
      overlays.forEach(overlay => {
        try {
          overlay.remove();
        } catch (removeError) {
          logger.warn('Failed to remove overlay:', removeError);
        }
      });

      // 트위터 상호작용 복원
      const twitterRoot = document.querySelector('#react-root');
      if (twitterRoot instanceof HTMLElement) {
        twitterRoot.style.removeProperty('pointer-events');
        twitterRoot.style.removeProperty('user-select');
      }

      // 모든 갤러리 관련 요소 정리
      const galleryElements = document.querySelectorAll('[data-xeg-gallery]');
      galleryElements.forEach(element => {
        try {
          element.remove();
        } catch (removeError) {
          logger.warn('Failed to remove gallery element:', removeError);
        }
      });

      logger.debug('✅ DOM force cleanup completed');
    } catch (error) {
      logger.warn('DOM force cleanup failed:', error);
    }

    // 3. 커스텀 이벤트 발송 (다른 컴포넌트에 상태 변경 알림)
    try {
      const resetEvent = new CustomEvent('xeg:galleryForceReset', {
        detail: {
          instanceId: this.instanceId,
          timestamp: Date.now(),
        },
      });
      document.dispatchEvent(resetEvent);
    } catch (eventError) {
      logger.warn('Failed to dispatch force reset event:', eventError);
    }

    // 4. 메모리 정리를 위한 가비지 컬렉션 유도 (선택적)
    setTimeout(() => {
      if (typeof window !== 'undefined' && 'gc' in window) {
        try {
          // 개발 환경에서 가비지 컬렉션 수동 실행
          (window as unknown as { gc?: () => void }).gc?.();
        } catch {
          // 무시 - 프로덕션에서는 사용할 수 없음
        }
      }
    }, 100);

    logger.info(`🔄 Gallery state force reset completed for instance: ${this.instanceId}`);
  }

  /**
   * 현재 상태 스냅샷
   */
  getSnapshot(): {
    isOpen: boolean;
    mediaCount: number;
    currentIndex: number;
    isLoading: boolean;
    error: string | null;
  } {
    return {
      isOpen: this.isOpen.value,
      mediaCount: this.mediaItems.value.length,
      currentIndex: this.currentIndex.value,
      isLoading: this.isLoading.value,
      error: this.error.value,
    };
  }

  /**
   * 인스턴스 정리
   */
  destroy(): void {
    this.reset();
    GalleryStateManager.instances.delete(this.instanceId);
  }
}

// 기본 인스턴스 내보내기
export const galleryState = GalleryStateManager.getInstance();
