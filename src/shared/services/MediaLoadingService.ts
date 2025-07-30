/**
 * @fileoverview 간소화된 미디어 로딩 서비스
 * @description 유저스크립트에 적합한 기본 미디어 로딩 기능
 * @version 3.0.0 - Phase B: 간소화
 */

/**
 * 미디어 로딩 상태
 */
export interface MediaLoadingState {
  isLoading: boolean;
  hasError: boolean;
  loadedUrl?: string;
  errorMessage?: string;
}

/**
 * 미디어 로딩 옵션 (하위 호환성을 위해 유지)
 */
export interface MediaLoadingOptions {
  src?: string;
  enableLazyLoading?: boolean;
}

/**
 * 간소화된 미디어 로딩 서비스
 *
 * 주요 기능:
 * - 기본 이미지/비디오 로딩
 * - 간단한 에러 처리
 * - 유저스크립트 최적화
 */
export class MediaLoadingService {
  private readonly stateMap = new Map<string, MediaLoadingState>();

  /**
   * 미디어 요소 등록 및 로딩
   */
  public registerMediaElement(
    id: string,
    element: HTMLElement,
    options: { src: string } = { src: '' }
  ): void {
    this.stateMap.set(id, {
      isLoading: true,
      hasError: false,
    });

    this.loadMedia(id, element, options.src);
  }

  /**
   * 미디어 요소 등록 해제
   */
  public unregisterMediaElement(id: string): void {
    this.stateMap.delete(id);
  }

  /**
   * 로딩 상태 조회
   */
  public getLoadingState(id: string): MediaLoadingState | undefined {
    return this.stateMap.get(id);
  }

  /**
   * 미디어 상태 조회 (별칭)
   */
  public getMediaState(id: string): MediaLoadingState | undefined {
    return this.getLoadingState(id);
  }

  /**
   * 강제 로딩
   */
  public forceLoad(_id: string): void {
    // 간소화된 버전에서는 기본 로딩과 동일
  }

  /**
   * 미디어 로딩 (공개 메서드로 변경)
   */
  public loadMedia(id: string, element: HTMLElement, src: string): void {
    if (element instanceof HTMLImageElement) {
      this.loadImage(id, element, src);
    } else if (element instanceof HTMLVideoElement) {
      this.loadVideo(id, element, src);
    }
  }

  /**
   * 재시도
   */
  public retryLoad(id: string): void {
    const state = this.stateMap.get(id);
    if (state) {
      state.isLoading = true;
      state.hasError = false;
      delete state.errorMessage;
    }
  }

  /**
   * 정리
   */
  public cleanup(): void {
    this.stateMap.clear();
  }

  /**
   * 이미지 로딩
   */
  private loadImage(id: string, img: HTMLImageElement, src: string): void {
    const state = this.stateMap.get(id);
    if (!state) return;

    img.onload = () => {
      const currentState = this.stateMap.get(id);
      if (currentState) {
        currentState.isLoading = false;
        currentState.hasError = false;
        currentState.loadedUrl = src;
      }
    };

    img.onerror = () => {
      const currentState = this.stateMap.get(id);
      if (currentState) {
        currentState.isLoading = false;
        currentState.hasError = true;
        currentState.errorMessage = 'Image load failed';
      }
    };

    img.src = src;
  }

  /**
   * 비디오 로딩
   */
  private loadVideo(id: string, video: HTMLVideoElement, src: string): void {
    const state = this.stateMap.get(id);
    if (!state) return;

    video.onloadeddata = () => {
      const currentState = this.stateMap.get(id);
      if (currentState) {
        currentState.isLoading = false;
        currentState.hasError = false;
        currentState.loadedUrl = src;
      }
    };

    video.onerror = () => {
      const currentState = this.stateMap.get(id);
      if (currentState) {
        currentState.isLoading = false;
        currentState.hasError = true;
        currentState.errorMessage = 'Video load failed';
      }
    };

    video.src = src;
  }
}
