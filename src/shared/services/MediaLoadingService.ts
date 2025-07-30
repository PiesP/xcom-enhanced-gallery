/**
 * @fileoverview 미디어 로딩 서비스
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
 * 미디어 로딩 서비스
 * 기존의 useProgressiveImage, VerticalImageItem 등에서 분산된 로딩 로직을 통합
 */
export class MediaLoadingService {
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
   * 미디어 요소 등록 해제
   */
  public unregisterMediaElement(id: string): void {
    const observer = this.observerMap.get(id);
    if (observer) {
      observer.disconnect();
      this.observerMap.delete(id);
    }

    this.stateMap.delete(id);
    this.elementMap.delete(id);
  }

  /**
   * 미디어 로딩 상태 가져오기
   */
  public getLoadingState(id: string): MediaLoadingState | undefined {
    return this.stateMap.get(id);
  }

  /**
   * 미디어 로딩 상태 가져오기 (하위 호환성 별칭)
   */
  public getMediaState(id: string): MediaLoadingState | undefined {
    return this.getLoadingState(id);
  }

  /**
   * 미디어 강제 로딩 (하위 호환성 별칭)
   */
  public forceLoad(id: string): void {
    this.loadMedia(id);
  }

  /**
   * 미디어 강제 로딩
   */
  public loadMedia(id: string): void {
    const element = this.elementMap.get(id);
    const state = this.stateMap.get(id);

    if (!element || !state) {
      console.warn(`[MediaLoadingService] Element or state not found for id: ${id}`);
      return;
    }

    if (state.isLoading) {
      return; // 이미 로딩 중
    }

    this.updateState(id, { isLoading: true, hasError: false });

    this.performMediaLoad(id, element);
  }

  /**
   * 미디어 다시 로딩 (재시도)
   */
  public retryLoad(id: string): void {
    const state = this.stateMap.get(id);
    if (!state) return;

    const newRetryCount = state.retryCount + 1;
    const maxRetries = this.defaultOptions.retryAttempts;

    if (newRetryCount > maxRetries) {
      this.updateState(id, {
        hasError: true,
        errorMessage: `최대 재시도 횟수(${maxRetries})를 초과했습니다.`,
      });
      return;
    }

    this.updateState(id, { retryCount: newRetryCount });
    this.loadMedia(id);
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

            // 한 번 로딩되면 observer 해제
            observer.unobserve(element);
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
   * 실제 미디어 로딩 수행
   */
  private performMediaLoad(id: string, element: HTMLElement): void {
    if (element.tagName === 'IMG') {
      this.loadImage(id, element as HTMLImageElement);
    } else if (element.tagName === 'VIDEO') {
      this.loadVideo(id, element as HTMLVideoElement);
    } else {
      this.loadGenericMedia(id, element);
    }
  }

  /**
   * 이미지 로딩
   */
  private loadImage(id: string, img: HTMLImageElement): void {
    const dataSrc = img.getAttribute('data-src') || img.src;

    if (!dataSrc) {
      this.updateState(id, {
        isLoading: false,
        hasError: true,
        errorMessage: 'data-src 또는 src 속성이 없습니다.',
      });
      return;
    }

    const tempImg = new Image();

    tempImg.onload = () => {
      img.src = dataSrc;
      img.removeAttribute('data-src');
      this.updateState(id, {
        isLoading: false,
        hasError: false,
        loadedUrl: dataSrc,
      });
    };

    tempImg.onerror = () => {
      this.updateState(id, {
        isLoading: false,
        hasError: true,
        errorMessage: '이미지 로딩에 실패했습니다.',
      });
    };

    tempImg.src = dataSrc;
  }

  /**
   * 비디오 로딩
   */
  private loadVideo(id: string, video: HTMLVideoElement): void {
    const dataSrc = video.getAttribute('data-src') || video.src;

    if (!dataSrc) {
      this.updateState(id, {
        isLoading: false,
        hasError: true,
        errorMessage: 'data-src 또는 src 속성이 없습니다.',
      });
      return;
    }

    video.addEventListener('loadeddata', () => {
      this.updateState(id, {
        isLoading: false,
        hasError: false,
        loadedUrl: dataSrc,
      });
    });

    video.addEventListener('error', () => {
      this.updateState(id, {
        isLoading: false,
        hasError: true,
        errorMessage: '비디오 로딩에 실패했습니다.',
      });
    });

    video.src = dataSrc;
    video.removeAttribute('data-src');
  }

  /**
   * 일반적인 미디어 요소 로딩
   */
  private loadGenericMedia(id: string, element: HTMLElement): void {
    const dataSrc = element.getAttribute('data-src');

    if (!dataSrc) {
      this.updateState(id, {
        isLoading: false,
        hasError: true,
        errorMessage: 'data-src 속성이 없습니다.',
      });
      return;
    }

    // 배경 이미지나 기타 미디어 처리
    if (element.style.backgroundImage || dataSrc.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      const tempImg = new Image();

      tempImg.onload = () => {
        element.style.backgroundImage = `url("${dataSrc}")`;
        element.removeAttribute('data-src');
        this.updateState(id, {
          isLoading: false,
          hasError: false,
          loadedUrl: dataSrc,
        });
      };

      tempImg.onerror = () => {
        this.updateState(id, {
          isLoading: false,
          hasError: true,
          errorMessage: '미디어 로딩에 실패했습니다.',
        });
      };

      tempImg.src = dataSrc;
    } else {
      // 기타 요소는 바로 처리
      this.updateState(id, {
        isLoading: false,
        hasError: false,
        loadedUrl: dataSrc,
      });
    }
  }

  /**
   * 상태 업데이트
   */
  private updateState(id: string, updates: Partial<MediaLoadingState>): void {
    const currentState = this.stateMap.get(id);
    if (!currentState) return;

    const newState = { ...currentState, ...updates };
    this.stateMap.set(id, newState);
  }
}

// 하위 호환성 별칭 제거됨 - 직접 MediaLoadingService 사용 권장

// 기본 export
export default MediaLoadingService;
