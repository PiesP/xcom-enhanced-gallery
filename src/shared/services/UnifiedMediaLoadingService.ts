/**
 * @fileoverview 통합 미디어 로딩 서비스
 * @description 분산된 이미지/비디오 로딩 로직을 통합하여 단순화
 */

import { getPreactSignals } from '@shared/external/vendors';

// getPreactSignals를 사용하여 동적 Signal 생성을 위해 import
const { computed: _computedFactory } = getPreactSignals();

/**
 * 미디어 로딩 상태 정의
 */
export interface MediaLoadingState {
  isLoading: boolean;
  isVisible: boolean;
  hasError: boolean;
  loadedUrl?: string;
  errorMessage?: string;
  retryCount: number;
}

/**
 * 미디어 로딩 옵션
 */
export interface MediaLoadingOptions {
  enableLazyLoading?: boolean;
  retryAttempts?: number;
  rootMargin?: string;
  threshold?: number;
  enableProgressiveLoading?: boolean;
}

/**
 * 통합 미디어 로딩 서비스
 * 기존의 useProgressiveImage, VerticalImageItem 등에서 분산된 로딩 로직을 통합
 */
export class UnifiedMediaLoadingService {
  private readonly observerMap = new Map<string, IntersectionObserver>();
  private readonly stateMap = new Map<string, MediaLoadingState>();
  private readonly elementMap = new Map<string, HTMLElement>();

  private readonly defaultOptions: Required<MediaLoadingOptions> = {
    enableLazyLoading: true,
    retryAttempts: 3,
    rootMargin: '50px',
    threshold: 0.1,
    enableProgressiveLoading: true,
  };

  /**
   * 미디어 요소를 등록하고 lazy loading 설정
   */
  public registerMediaElement(
    id: string,
    element: HTMLElement,
    options: MediaLoadingOptions = {}
  ): void {
    const mergedOptions = { ...this.defaultOptions, ...options };

    // 초기 상태 설정
    this.stateMap.set(id, {
      isLoading: false,
      isVisible: false,
      hasError: false,
      retryCount: 0,
    });

    this.elementMap.set(id, element);

    if (mergedOptions.enableLazyLoading) {
      this.setupIntersectionObserver(id, element, mergedOptions);
    } else {
      // 즉시 로딩
      this.loadMedia(id);
    }
  }

  /**
   * Intersection Observer 설정
   */
  private setupIntersectionObserver(
    id: string,
    element: HTMLElement,
    options: Required<MediaLoadingOptions>
  ): void {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.updateState(id, { isVisible: true });
            this.loadMedia(id);
            // 로딩 완료 후 observer 해제
            observer.unobserve(element);
            this.observerMap.delete(id);
          }
        });
      },
      {
        rootMargin: options.rootMargin,
        threshold: options.threshold,
      }
    );

    observer.observe(element);
    this.observerMap.set(id, observer);
  }

  /**
   * 미디어 로딩 실행
   */
  private async loadMedia(id: string): Promise<void> {
    const state = this.stateMap.get(id);
    const element = this.elementMap.get(id);

    if (!state || !element) return;

    this.updateState(id, { isLoading: true, hasError: false });

    try {
      // 이미지 또는 비디오 타입에 따른 로딩 처리
      if (element instanceof HTMLImageElement) {
        await this.loadImage(id, element);
      } else if (element instanceof HTMLVideoElement) {
        await this.loadVideo(id, element);
      }
    } catch (error) {
      this.handleLoadError(id, error as Error);
    }
  }

  /**
   * 이미지 로딩 처리
   */
  private async loadImage(id: string, imgElement: HTMLImageElement): Promise<void> {
    return new Promise((resolve, reject) => {
      const tempImg = new Image();

      tempImg.onload = () => {
        imgElement.src = tempImg.src;
        this.updateState(id, {
          isLoading: false,
          loadedUrl: tempImg.src,
        });
        resolve();
      };

      tempImg.onerror = () => {
        reject(new Error(`이미지 로딩 실패: ${tempImg.src}`));
      };

      // data-src 또는 src 속성에서 URL 가져오기
      const url = imgElement.dataset.src || imgElement.src;
      if (url) {
        tempImg.src = url;
      }
    });
  }

  /**
   * 비디오 로딩 처리
   */
  private async loadVideo(id: string, videoElement: HTMLVideoElement): Promise<void> {
    return new Promise((resolve, reject) => {
      const handleLoadedData = () => {
        this.updateState(id, {
          isLoading: false,
          loadedUrl: videoElement.src,
        });
        videoElement.removeEventListener('loadeddata', handleLoadedData);
        videoElement.removeEventListener('error', handleError);
        resolve();
      };

      const handleError = () => {
        videoElement.removeEventListener('loadeddata', handleLoadedData);
        videoElement.removeEventListener('error', handleError);
        reject(new Error(`비디오 로딩 실패: ${videoElement.src}`));
      };

      videoElement.addEventListener('loadeddata', handleLoadedData);
      videoElement.addEventListener('error', handleError);

      // data-src 또는 src 속성에서 URL 가져오기
      const url = videoElement.dataset.src || videoElement.src;
      if (url && !videoElement.src) {
        videoElement.src = url;
      }

      videoElement.load();
    });
  }

  /**
   * 로딩 에러 처리
   */
  private handleLoadError(id: string, error: Error): void {
    const state = this.stateMap.get(id);
    if (!state) return;

    const newRetryCount = state.retryCount + 1;

    if (newRetryCount < this.defaultOptions.retryAttempts) {
      // 재시도
      this.updateState(id, {
        retryCount: newRetryCount,
        isLoading: false,
      });

      // 1초 후 재시도
      setTimeout(() => {
        this.loadMedia(id);
      }, 1000);
    } else {
      // 최대 재시도 횟수 초과
      this.updateState(id, {
        isLoading: false,
        hasError: true,
        errorMessage: error.message,
      });
    }
  }

  /**
   * 상태 업데이트
   */
  private updateState(id: string, updates: Partial<MediaLoadingState>): void {
    const currentState = this.stateMap.get(id);
    if (currentState) {
      this.stateMap.set(id, { ...currentState, ...updates });
    }
  }

  /**
   * 미디어 상태 조회
   */
  public getMediaState(id: string): MediaLoadingState | undefined {
    return this.stateMap.get(id);
  }

  /**
   * 미디어 요소 등록 해제
   */
  public unregisterMediaElement(id: string): void {
    // Observer 정리
    const observer = this.observerMap.get(id);
    if (observer) {
      observer.disconnect();
      this.observerMap.delete(id);
    }

    // 상태 및 요소 정리
    this.stateMap.delete(id);
    this.elementMap.delete(id);
  }

  /**
   * 모든 등록된 미디어 정리
   */
  public cleanup(): void {
    this.observerMap.forEach(observer => observer.disconnect());
    this.observerMap.clear();
    this.stateMap.clear();
    this.elementMap.clear();
  }

  /**
   * 강제 로딩 (lazy loading 무시)
   */
  public forceLoad(id: string): void {
    this.loadMedia(id);
  }

  /**
   * 로딩 상태 감시를 위한 Signal 생성
   */
  public createLoadingSignal(id: string) {
    const { computed } = getPreactSignals();
    return computed(() => {
      const state = this.stateMap.get(id);
      return state?.isLoading ?? false;
    });
  }

  /**
   * 에러 상태 감시를 위한 Signal 생성
   */
  public createErrorSignal(id: string) {
    const { computed } = getPreactSignals();
    return computed(() => {
      const state = this.stateMap.get(id);
      return state?.hasError ?? false;
    });
  }
}

/**
 * 전역 통합 미디어 로딩 서비스 인스턴스
 */
export const unifiedMediaLoader = new UnifiedMediaLoadingService();
