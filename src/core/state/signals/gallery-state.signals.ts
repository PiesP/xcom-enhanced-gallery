/**
 * @fileoverview Gallery State Signals for X.com Enhanced Gallery
 * @license MIT
 * @version 3.1.0 - Simplified scroll management with ScrollLockService
 * @author X.com Enhanced Gallery Team
 * @since 1.0.0
 *
 * @description
 * 갤러리 상태 관리를 위한 Preact Signals 기반 매니저.
 * 갤러리 닫기 시 완전한 상태 초기화로 이전 미디어 표시 문제를 해결합니다.
 */

import { ScrollLockService } from '@infrastructure/dom/ScrollLockService';

// ScrollLockService 인스턴스
const scrollLockService = ScrollLockService.getInstance();
import type { MediaInfo } from '@core/types/media.types';
import { logger } from '@infrastructure/logging/logger';
import { getPreactSignals } from '@infrastructure/external/vendors';
import { VideoService } from '@shared/utils/media';

// 지연 초기화를 위한 변수들
let preactSignals: ReturnType<typeof getPreactSignals> | null = null;
let isSignalsInitialized = false;

/**
 * Preact Signals 지연 초기화
 */
function ensureSignalsInitialized(): void {
  if (isSignalsInitialized && preactSignals) {
    return;
  }

  try {
    preactSignals = getPreactSignals();
    isSignalsInitialized = true;
    logger.debug('Gallery State: Preact Signals initialized');
  } catch (error) {
    logger.error('Gallery State: Failed to initialize Preact Signals:', error);
    throw new Error(
      'Preact Signals가 초기화되지 않았습니다. initializeVendors()를 먼저 호출하세요.'
    );
  }
}

/**
 * 뷰 모드 타입 정의 (core 계층에서 정의)
 */
import type { ViewMode } from '@core/types/view-mode.types';

/**
 * Preact Signal 타입 정의
 */
interface PreactSignal<T> {
  value: T;
  peek?: () => T;
  subscribe?: (fn: (value: T) => void) => () => void;
}

interface PreactComputed<T> {
  readonly value: T;
}

/**
 * 갤러리 상태 관리자
 *
 * Phase 1.2: 갤러리 상태 관리 재설계 완료 (지연 초기화 적용)
 * Phase 2: 수직 갤러리 뷰를 위한 currentTweetMediaItems 추가
 *
 * 인스턴스별 갤러리 상태 관리 - 지연 초기화로 안전한 시작
 */
export class GalleryStateManager {
  private static readonly instances = new Map<string, GalleryStateManager>();
  private readonly videoService: VideoService;

  // 초기화 상태
  private initialized = false;

  // Signals - 지연 초기화됨 (타입 안전성 개선)
  public isOpen: PreactSignal<boolean> | null = null;
  public mediaItems: PreactSignal<readonly MediaInfo[]> | null = null;
  public currentIndex: PreactSignal<number> | null = null;
  public isLoading: PreactSignal<boolean> | null = null;
  public error: PreactSignal<string | null> | null = null;
  public viewMode: PreactSignal<ViewMode> | null = null;
  public currentTweetMediaItems: PreactSignal<readonly MediaInfo[]> | null = null;
  public currentMedia: PreactComputed<MediaInfo | null> | null = null;
  public navigation: PreactComputed<{
    readonly current: number;
    readonly total: number;
    readonly canPrev: boolean;
    readonly canNext: boolean;
    readonly hasMultiple: boolean;
  }> | null = null;
  public galleryInfo: PreactComputed<{
    readonly totalImages: number;
    readonly totalVideos: number;
    readonly totalSize: number;
  }> | null = null;

  /**
   * 비공개 생성자 - 싱글톤 패턴
   */
  private constructor(private readonly instanceId: string) {
    this.videoService = VideoService.getInstance();
  }

  /**
   * Signal 안전 접근 도우미
   */
  private safeSignalAccess(): {
    isOpen: PreactSignal<boolean>;
    mediaItems: PreactSignal<readonly MediaInfo[]>;
    currentIndex: PreactSignal<number>;
    isLoading: PreactSignal<boolean>;
    error: PreactSignal<string | null>;
    viewMode: PreactSignal<ViewMode>;
    currentTweetMediaItems: PreactSignal<readonly MediaInfo[]>;
    currentMedia: PreactComputed<MediaInfo | null>;
    navigation: PreactComputed<{
      readonly current: number;
      readonly total: number;
      readonly canPrev: boolean;
      readonly canNext: boolean;
      readonly hasMultiple: boolean;
    }>;
    galleryInfo: PreactComputed<{
      readonly totalImages: number;
      readonly totalVideos: number;
      readonly totalSize: number;
    }>;
  } {
    this.ensureInitialized();

    // 초기화 후에는 모든 signal이 존재함을 보장
    if (
      !this.isOpen ||
      !this.mediaItems ||
      !this.currentIndex ||
      !this.isLoading ||
      !this.error ||
      !this.viewMode ||
      !this.currentTweetMediaItems ||
      !this.currentMedia ||
      !this.navigation ||
      !this.galleryInfo
    ) {
      throw new Error('Signals not properly initialized');
    }

    return {
      isOpen: this.isOpen,
      mediaItems: this.mediaItems,
      currentIndex: this.currentIndex,
      isLoading: this.isLoading,
      error: this.error,
      viewMode: this.viewMode,
      currentTweetMediaItems: this.currentTweetMediaItems,
      currentMedia: this.currentMedia,
      navigation: this.navigation,
      galleryInfo: this.galleryInfo,
    };
  }

  /**
   * 외부 컴포넌트를 위한 안전한 signal 접근자
   * 항상 초기화된 signals를 반환하도록 보장
   */
  public getSignals(): {
    isOpen: PreactSignal<boolean>;
    mediaItems: PreactSignal<readonly MediaInfo[]>;
    currentIndex: PreactSignal<number>;
    isLoading: PreactSignal<boolean>;
    error: PreactSignal<string | null>;
    viewMode: PreactSignal<ViewMode>;
    currentTweetMediaItems: PreactSignal<readonly MediaInfo[]>;
    currentMedia: PreactComputed<MediaInfo | null>;
    navigation: PreactComputed<{
      readonly current: number;
      readonly total: number;
      readonly canPrev: boolean;
      readonly canNext: boolean;
      readonly hasMultiple: boolean;
    }>;
    galleryInfo: PreactComputed<{
      readonly totalImages: number;
      readonly totalVideos: number;
      readonly totalSize: number;
    }>;
  } {
    // 항상 초기화를 보장
    this.ensureInitialized();

    // 초기화 후에는 안전한 접근자를 사용
    return this.safeSignalAccess();
  }

  /**
   * 인스턴스 팩토리 메서드
   */
  public static getInstance(instanceId: string = 'default'): GalleryStateManager {
    if (!GalleryStateManager.instances.has(instanceId)) {
      const instance = new GalleryStateManager(instanceId);
      GalleryStateManager.instances.set(instanceId, instance);
    }
    const instance = GalleryStateManager.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Failed to get instance for ${instanceId}`);
    }
    return instance;
  }

  /**
   * 지연 초기화 실행
   */
  private ensureInitialized(): void {
    if (this.initialized) {
      return;
    }

    try {
      ensureSignalsInitialized();
      this.initializeSignals();
      this.setupEffects();
      this.initialized = true;
      logger.debug(`Gallery State Manager initialized for instance: ${this.instanceId}`);
    } catch (error) {
      logger.error(
        `Failed to initialize Gallery State Manager for instance ${this.instanceId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Signals 초기화
   */
  private initializeSignals(): void {
    if (!preactSignals) throw new Error('Preact Signals not available');

    // 기본 상태 signals - 불변성 보장
    this.isOpen = preactSignals.signal<boolean>(false);
    this.mediaItems = preactSignals.signal<readonly MediaInfo[]>(Object.freeze([]));
    this.currentIndex = preactSignals.signal<number>(0);
    this.isLoading = preactSignals.signal<boolean>(false);
    this.error = preactSignals.signal<string | null>(null);

    // 뷰 모드 상태 - Phase 1 개선사항 (기본값을 verticalList로 변경)
    this.viewMode = preactSignals.signal<ViewMode>('verticalList');

    // Phase 2: 현재 트윗의 전체 미디어 목록 - 수직 갤러리 뷰를 위한 상태
    this.currentTweetMediaItems = preactSignals.signal<readonly MediaInfo[]>(Object.freeze([]));

    // Computed properties (안전한 접근)
    this.currentMedia = preactSignals.computed((): MediaInfo | null => {
      const items = this.mediaItems?.value;
      const index = this.currentIndex?.value;
      if (!items || typeof index !== 'number') return null;
      return items.length > 0 && index >= 0 && index < items.length ? (items[index] ?? null) : null;
    });

    this.navigation = preactSignals.computed(() => {
      const total = this.mediaItems?.value?.length ?? 0;
      const current = this.currentIndex?.value ?? 0;

      return Object.freeze({
        current: current + 1,
        total,
        canPrev: current > 0,
        canNext: current < total - 1,
        hasMultiple: total > 1,
      } as const);
    });

    this.galleryInfo = preactSignals.computed(() => {
      const items = this.mediaItems?.value ?? [];
      return Object.freeze({
        totalImages: items.filter((item: MediaInfo) => item.type === 'image').length,
        totalVideos: items.filter((item: MediaInfo) => item.type === 'video').length,
        totalSize: items.length,
      } as const);
    });
  }

  /**
   * 모든 인스턴스 리셋 (테스트용)
   */
  static resetAllInstances(): void {
    for (const instance of GalleryStateManager.instances.values()) {
      instance.destroy();
    }
    GalleryStateManager.instances.clear();
  }

  /**
   * 특정 인스턴스 제거 (테스트용)
   */
  static removeInstance(instanceId: string): void {
    const instance = GalleryStateManager.instances.get(instanceId);
    if (instance) {
      instance.destroy();
    }
  }

  /**
   * 스크롤 관리 처리 - 간소화된 통합 스크롤 관리
   */
  private handleScrollManagement(): void {
    if (this.isOpen?.value) {
      // 갤러리 열릴 때: 스크롤 잠금
      document.body.classList.add('xeg-gallery-open');
      scrollLockService.lockPageScroll();
    } else {
      // 갤러리 닫힐 때: 스크롤 잠금 해제
      document.body.classList.remove('xeg-gallery-open');
      scrollLockService.unlockPageScroll();
    }
  }

  /**
   * 부작용 설정
   */
  private setupEffects(): void {
    if (!preactSignals) return;

    // 갤러리 열림/닫힘 시 스크롤 보존 시스템 사용
    preactSignals.effect(() => {
      this.handleScrollManagement();
    });

    // 에러 상태 자동 정리
    preactSignals.effect(() => {
      if (this.error?.value) {
        const errorMsg = this.error.value;
        setTimeout(() => {
          if (this.error?.value === errorMsg) {
            this.error.value = null;
          }
        }, 5000);
      }
    });

    // 미디어 아이템 변경 시 인덱스 유효성 검사
    preactSignals.effect(() => {
      const items = this.mediaItems?.value;
      const currentIdx = this.currentIndex?.value;

      if (!items || !this.currentIndex) return;

      if (items.length === 0) {
        this.currentIndex.value = 0;
      } else if (typeof currentIdx === 'number' && currentIdx >= items.length) {
        this.currentIndex.value = Math.max(0, items.length - 1);
      } else if (typeof currentIdx === 'number' && currentIdx < 0) {
        this.currentIndex.value = 0;
      }
    });
  }

  /**
   * 갤러리를 열고 미디어 아이템을 설정합니다.
   *
   * @param items - 표시할 미디어 아이템 배열
   * @param startIndex - 시작할 인덱스 (기본값: 0)
   *
   * @example
   * ```typescript
   * const mediaItems = [
   *   { id: '1', type: 'image', url: 'https://...', filename: 'image1.jpg' }
   * ];
   * galleryState.openGallery(mediaItems, 0);
   * ```
   */
  openGallery(items: readonly MediaInfo[], startIndex: number = 0): void {
    // null/undefined 배열 체크를 가장 먼저 수행
    if (!items || !Array.isArray(items)) {
      logger.warn('Cannot open gallery with invalid items array');
      return;
    }

    logger.info(`🔄 갤러리 열기 요청: ${items.length}개 아이템, 시작 인덱스: ${startIndex}`);

    // 강제 초기화 보장
    this.ensureInitialized();

    // undefined/null 아이템 필터링
    const validItems = items.filter(
      (item): item is MediaInfo =>
        item != null && typeof item === 'object' && 'id' in item && 'type' in item && 'url' in item
    );

    if (validItems.length === 0) {
      logger.warn('Cannot open gallery with empty items array');
      return;
    }

    const validStartIndex = Math.max(0, Math.min(startIndex, validItems.length - 1));

    // 갤러리 열기 전 모든 동영상 일시정지
    this.videoService.pauseAllVideos();

    if (!preactSignals) return;

    const signals = this.safeSignalAccess();

    // 상태 변경 로깅
    logger.debug('갤러리 상태 변경 전:', {
      isOpen: signals.isOpen.value,
      mediaCount: signals.mediaItems.value.length,
    });

    preactSignals.batch(() => {
      signals.mediaItems.value = Object.freeze([...validItems]);
      signals.currentIndex.value = validStartIndex;
      signals.isOpen.value = true;
      signals.error.value = null;
    });

    // 상태 변경 후 로깅
    logger.info('✅ 갤러리 상태 변경 완료:', {
      isOpen: signals.isOpen.value,
      mediaCount: signals.mediaItems.value.length,
      currentIndex: signals.currentIndex.value,
    });

    // 갤러리 오픈 이벤트 발송 (무한 루프 방지를 위해 조건부 발송)
    try {
      // 실제 갤러리가 열릴 때만 이벤트 발송
      if (signals.isOpen.value) {
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
      `🎬 갤러리 열기 완료: ${items.length}개 아이템, 시작 인덱스 ${validStartIndex}, 인스턴스: ${this.instanceId}`
    );
  }

  /**
   * 갤러리를 닫습니다.
   * 완전한 상태 초기화로 재열기 문제를 방지합니다.
   */
  closeGallery(): void {
    this.ensureInitialized();
    const signals = this.safeSignalAccess();

    if (!signals.isOpen.value) {
      logger.debug('Gallery is already closed, skipping close process');
      return;
    }

    logger.debug(`Closing gallery for instance: ${this.instanceId}`);

    if (!preactSignals) return;

    // 완전한 상태 초기화로 재열기 문제 해결
    preactSignals.batch(() => {
      signals.isOpen.value = false;
      signals.isLoading.value = false;
      signals.error.value = null;
      signals.mediaItems.value = Object.freeze([]);
      signals.currentIndex.value = 0;
      signals.currentTweetMediaItems.value = Object.freeze([]);
    });

    // 캐시 정리: VideoService의 캐시도 함께 정리
    try {
      const videoService = VideoService.getInstance();
      videoService.clearAllCache();
      logger.debug('Gallery close: media cache cleared');
    } catch (error) {
      logger.warn('Failed to clear media cache during gallery close:', error);
    }

    // DOM 상태 정리 및 포커스 복원
    requestAnimationFrame(() => {
      try {
        if (document.activeElement && document.activeElement !== document.body) {
          document.body.focus({ preventScroll: true });
          logger.debug('Focus restored to body after gallery close');
        }

        const closeEvent = new CustomEvent('xeg:galleryStateChanged', {
          detail: {
            isOpen: false,
            mediaCount: 0,
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
    this.ensureInitialized();
    const signals = this.safeSignalAccess();

    const items = signals.mediaItems.value;
    const current = signals.currentIndex.value;
    const nextIndex = current + 1;

    // 중복 업데이트 방지: 다음 인덱스가 유효한 범위이고 현재와 다를 때만 업데이트
    if (nextIndex < items.length && current !== nextIndex) {
      signals.currentIndex.value = nextIndex;
    }
  }

  goToPrevious(): void {
    this.ensureInitialized();
    const signals = this.safeSignalAccess();

    const current = signals.currentIndex.value;
    const prevIndex = current - 1;

    // 중복 업데이트 방지: 이전 인덱스가 유효한 범위이고 현재와 다를 때만 업데이트
    if (prevIndex >= 0 && current !== prevIndex) {
      signals.currentIndex.value = prevIndex;
    }
  }

  goToIndex(index: number): void {
    this.ensureInitialized();
    const signals = this.safeSignalAccess();

    const items = signals.mediaItems.value;
    const current = signals.currentIndex.value;

    // 중복 업데이트 방지: 인덱스가 유효한 범위이고 현재와 다를 때만 업데이트
    if (index >= 0 && index < items.length && current !== index) {
      signals.currentIndex.value = index;
    }
  }

  goToFirst(): void {
    this.ensureInitialized();
    const signals = this.safeSignalAccess();

    // 중복 업데이트 방지: 이미 첫 번째 인덱스가 아닐 때만 업데이트
    if (signals.currentIndex.value !== 0) {
      signals.currentIndex.value = 0;
    }
  }

  goToLast(): void {
    this.ensureInitialized();
    const signals = this.safeSignalAccess();
    const items = signals.mediaItems.value;

    if (items.length > 0) {
      const lastIndex = items.length - 1;
      // 중복 업데이트 방지: 이미 마지막 인덱스가 아닐 때만 업데이트
      if (signals.currentIndex.value !== lastIndex) {
        signals.currentIndex.value = lastIndex;
      }
    }
  }

  setLoading(loading: boolean): void {
    this.ensureInitialized();
    const signals = this.safeSignalAccess();

    // 중복 업데이트 방지
    if (signals.isLoading.value !== loading) {
      signals.isLoading.value = loading;
    }
  }

  setError(error: string | null): void {
    this.ensureInitialized();
    const signals = this.safeSignalAccess();

    // 중복 업데이트 방지
    if (signals.error.value !== error) {
      signals.error.value = error;
    }
  }

  /**
   * 갤러리 뷰 모드를 변경합니다 (수직 갤러리만 지원)
   * @param mode - 새로운 뷰 모드 (항상 'verticalList')
   */
  setViewMode(mode: ViewMode): void {
    this.ensureInitialized();
    const signals = this.safeSignalAccess();
    // 수직 갤러리만 지원하므로 항상 verticalList로 설정
    signals.viewMode.value = 'verticalList';
    logger.debug(`Gallery view mode set to: verticalList (requested: ${mode})`);
  }

  /**
   * Phase 2: 현재 트윗의 미디어 아이템들을 설정합니다
   * @param mediaItems - 현재 트윗에서 추출된 미디어 아이템들
   */
  setCurrentTweetMediaItems(mediaItems: readonly MediaInfo[]): void {
    this.ensureInitialized();
    const signals = this.safeSignalAccess();

    // 중복 업데이트 방지: 같은 내용이면 업데이트하지 않음
    const currentItems = signals.currentTweetMediaItems.value;
    if (
      currentItems.length === mediaItems.length &&
      currentItems.every((item, index) => item.id === mediaItems[index]?.id)
    ) {
      return;
    }

    signals.currentTweetMediaItems.value = Object.freeze([...mediaItems]);
    logger.debug(`Current tweet media items updated: ${mediaItems.length} items`);
  }

  /**
   * Phase 2: 현재 트윗의 미디어 아이템들을 클리어합니다
   */
  clearCurrentTweetMediaItems(): void {
    this.ensureInitialized();
    const signals = this.safeSignalAccess();

    // 중복 업데이트 방지: 이미 비어있으면 업데이트하지 않음
    if (signals.currentTweetMediaItems.value.length === 0) {
      return;
    }

    signals.currentTweetMediaItems.value = Object.freeze([]);
  }

  addMediaItems(newItems: readonly MediaInfo[]): void {
    this.ensureInitialized();

    if (newItems.length === 0) {
      return;
    }

    const signals = this.safeSignalAccess();
    const currentItems = signals.mediaItems.value;
    const uniqueNewItems = newItems.filter(
      (newItem: MediaInfo) =>
        !currentItems.some((existing: MediaInfo) => existing.id === newItem.id)
    );

    if (uniqueNewItems.length > 0) {
      signals.mediaItems.value = Object.freeze([...currentItems, ...uniqueNewItems]);
    }
  }

  removeMediaItem(itemId: string): void {
    this.ensureInitialized();
    const signals = this.safeSignalAccess();

    const items = signals.mediaItems.value;
    const newItems = items.filter((item: MediaInfo) => item.id !== itemId);

    if (newItems.length !== items.length) {
      signals.mediaItems.value = newItems;
    }
  }

  /**
   * 갤러리를 다시 활성화합니다.
   * 완전한 상태 초기화로 인해 재활성화는 불가능합니다.
   *
   * @deprecated 완전한 상태 초기화로 인해 사용 불가능
   * @returns 항상 false 반환
   */
  reactivateGallery(): boolean {
    logger.warn('Gallery reactivation is not available due to complete state reset on close');
    return false;
  }

  /**
   * 갤러리가 재활성화 가능한 상태인지 확인합니다.
   * 완전한 상태 초기화로 인해 재활성화는 불가능합니다.
   */
  canReactivate(): boolean {
    return false; // 완전한 상태 초기화로 인해 재활성화 불가
  }

  /**
   * 상태 초기화
   * 정상적인 갤러리 닫기 시 사용되는 메서드
   */
  reset(): void {
    this.ensureInitialized();
    const signals = this.safeSignalAccess();

    if (!preactSignals) return;

    preactSignals.batch(() => {
      signals.isOpen.value = false;
      signals.mediaItems.value = Object.freeze([]);
      signals.currentIndex.value = 0;
      signals.isLoading.value = false;
      signals.error.value = null;
      signals.currentTweetMediaItems.value = Object.freeze([]);
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
    this.ensureInitialized();
    const signals = this.safeSignalAccess();

    logger.warn(`🔄 Force reset initiated for instance: ${this.instanceId}`);

    // 1. Signals 상태 완전 초기화
    if (preactSignals) {
      preactSignals.batch(() => {
        signals.isOpen.value = false;
        signals.mediaItems.value = Object.freeze([]);
        signals.currentIndex.value = 0;
        signals.isLoading.value = false;
        signals.error.value = null;
        signals.currentTweetMediaItems.value = Object.freeze([]);
        signals.viewMode.value = 'verticalList'; // 기본 뷰 모드로 리셋
      });
    }

    // 2. DOM 강제 정리 및 스크롤 잠금 해제
    try {
      // 스크롤 잠금 강제 해제
      scrollLockService.forceUnlock();

      // Body 클래스 정리
      document.body.classList.remove('xeg-gallery-open');

      // 기타 정리
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('position');
      document.body.style.removeProperty('top');
      document.body.style.removeProperty('left');
      document.body.style.removeProperty('width');
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
    this.ensureInitialized();
    const signals = this.safeSignalAccess();
    return {
      isOpen: signals.isOpen.value,
      mediaCount: signals.mediaItems.value.length,
      currentIndex: signals.currentIndex.value,
      isLoading: signals.isLoading.value,
      error: signals.error.value,
    };
  }

  /**
   * 인스턴스 정리
   */
  destroy(): void {
    if (this.initialized) {
      this.reset();
    }
    GalleryStateManager.instances.delete(this.instanceId);
  }

  /**
   * 갤러리가 열려있고 미디어가 있는 경우 추출을 건너뛸지 확인
   */
  shouldSkipExtraction(): boolean {
    this.ensureInitialized();
    const signals = this.safeSignalAccess();

    return signals.isOpen.value && signals.mediaItems.value.length > 0;
  }
}

// 기본 인스턴스 내보내기
export const galleryState = GalleryStateManager.getInstance();
