/**
 * @fileoverview MediaLoadingService - 미디어 로딩 전용 서비스
 * @description MediaService에서 로딩 관련 기능을 분리한 전용 서비스
 */

import { logger } from '@shared/logging/logger';
import { handleServiceError } from '@shared/utils/error-handling';

/**
 * 미디어 로딩 상태
 */
export interface MediaLoadingState {
  id: string;
  element: HTMLElement;
  src: string;
  loading: boolean;
  loaded: boolean;
  error: boolean;
  errorMessage?: string;
  loadTime?: number;
}

/**
 * 미디어 로딩 전용 서비스
 *
 * 책임:
 * - 미디어 요소 등록/해제
 * - 이미지/비디오 로딩 관리
 * - 로딩 상태 추적
 * - WebP 최적화
 */
export class MediaLoadingService {
  private static instance: MediaLoadingService | null = null;

  private readonly mediaLoadingStates = new Map<string, MediaLoadingState>();

  private constructor() {
    logger.debug('[MediaLoadingService] 초기화됨');
  }

  public static getInstance(): MediaLoadingService {
    if (!MediaLoadingService.instance) {
      MediaLoadingService.instance = new MediaLoadingService();
    }
    return MediaLoadingService.instance;
  }

  /**
   * 미디어 요소 등록
   */
  registerMediaElement(id: string, element: HTMLElement, src: string): void {
    try {
      const state: MediaLoadingState = {
        id,
        element,
        src,
        loading: false,
        loaded: false,
        error: false,
      };

      this.mediaLoadingStates.set(id, state);
      this.loadMediaElement(id, element, src);

      logger.debug(`[MediaLoadingService] 미디어 요소 등록: ${id}`);
    } catch (error) {
      const standardError = handleServiceError(error, {
        service: 'MediaLoadingService',
        operation: 'registerMediaElement',
        params: { id, src },
      });
      logger.error('Failed to register media element:', standardError.message);
    }
  }

  /**
   * 미디어 요소 해제
   */
  unregisterMediaElement(id: string): void {
    try {
      this.mediaLoadingStates.delete(id);
      logger.debug(`[MediaLoadingService] 미디어 요소 해제: ${id}`);
    } catch (error) {
      logger.warn(`Failed to unregister media element ${id}:`, error);
    }
  }

  /**
   * 로딩 상태 조회
   */
  getLoadingState(id: string): MediaLoadingState | undefined {
    return this.mediaLoadingStates.get(id);
  }

  /**
   * 모든 로딩 상태 조회
   */
  getAllLoadingStates(): Map<string, MediaLoadingState> {
    return new Map(this.mediaLoadingStates);
  }

  /**
   * 미디어 요소 로딩 (이미지/비디오 자동 감지)
   */
  private loadMediaElement(id: string, element: HTMLElement, src: string): void {
    if (element instanceof HTMLImageElement) {
      this.loadImage(id, element, src);
    } else if (element instanceof HTMLVideoElement) {
      this.loadVideo(id, element, src);
    } else {
      logger.warn(`[MediaLoadingService] 지원되지 않는 미디어 타입: ${element.tagName}`);
    }
  }

  /**
   * 이미지 로딩
   */
  private loadImage(id: string, img: HTMLImageElement, src: string): void {
    const state = this.mediaLoadingStates.get(id);
    if (!state) return;

    try {
      state.loading = true;
      const startTime = Date.now();

      const currentState = {
        onload: img.onload,
        onerror: img.onerror,
      };

      img.onload = () => {
        state.loading = false;
        state.loaded = true;
        state.loadTime = Date.now() - startTime;
        logger.debug(`[MediaLoadingService] 이미지 로딩 완료: ${id} (${state.loadTime}ms)`);

        if (currentState.onload) {
          (currentState.onload as EventListener).call(img, new Event('load'));
        }
      };

      img.onerror = event => {
        state.loading = false;
        state.error = true;
        state.errorMessage = '이미지 로딩 실패';
        logger.warn(`[MediaLoadingService] 이미지 로딩 실패: ${id}`);

        if (currentState.onerror) {
          (currentState.onerror as EventListener).call(img, event);
        }
      };

      // WebP 최적화된 URL 사용
      img.src = this.getOptimizedImageUrl(src);
    } catch (error) {
      state.loading = false;
      state.error = true;
      state.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[MediaLoadingService] 이미지 로딩 설정 실패: ${id}`, error);
    }
  }

  /**
   * 비디오 로딩
   */
  private loadVideo(id: string, video: HTMLVideoElement, src: string): void {
    const state = this.mediaLoadingStates.get(id);
    if (!state) return;

    try {
      state.loading = true;
      const startTime = Date.now();

      const currentState = {
        onloadeddata: video.onloadeddata,
        onerror: video.onerror,
      };

      video.onloadeddata = () => {
        state.loading = false;
        state.loaded = true;
        state.loadTime = Date.now() - startTime;
        logger.debug(`[MediaLoadingService] 비디오 로딩 완료: ${id} (${state.loadTime}ms)`);

        if (currentState.onloadeddata) {
          (currentState.onloadeddata as EventListener).call(video, new Event('loadeddata'));
        }
      };

      video.onerror = event => {
        state.loading = false;
        state.error = true;
        state.errorMessage = '비디오 로딩 실패';
        logger.warn(`[MediaLoadingService] 비디오 로딩 실패: ${id}`);

        if (currentState.onerror) {
          (currentState.onerror as EventListener).call(video, event);
        }
      };

      video.src = src;
      video.preload = 'metadata';
    } catch (error) {
      state.loading = false;
      state.error = true;
      state.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[MediaLoadingService] 비디오 로딩 설정 실패: ${id}`, error);
    }
  }

  /**
   * WebP 지원 여부 확인
   */
  isWebPSupported(): boolean {
    try {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return false; // 서버 사이드에서는 false
      }

      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;

      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    } catch {
      return false;
    }
  }

  /**
   * 최적화된 이미지 URL 반환 (WebP 변환 포함)
   */
  getOptimizedImageUrl(originalUrl: string): string {
    try {
      // WebP 지원 여부에 따라 URL 최적화
      if (this.isWebPSupported() && originalUrl.includes('pbs.twimg.com')) {
        // Twitter 이미지는 format=webp 파라미터로 WebP 변환 가능
        const url = new URL(originalUrl);
        url.searchParams.set('format', 'webp');
        return url.toString();
      }

      return originalUrl;
    } catch (error) {
      logger.warn('Failed to optimize image URL:', error);
      return originalUrl;
    }
  }

  /**
   * 로딩 통계 조회
   */
  getLoadingStats() {
    const states = Array.from(this.mediaLoadingStates.values());

    return {
      total: states.length,
      loading: states.filter(s => s.loading).length,
      loaded: states.filter(s => s.loaded).length,
      failed: states.filter(s => s.error).length,
      averageLoadTime: this.calculateAverageLoadTime(states),
    };
  }

  /**
   * 평균 로딩 시간 계산
   */
  private calculateAverageLoadTime(states: MediaLoadingState[]): number {
    const loadedStates = states.filter(s => s.loaded && s.loadTime);

    if (loadedStates.length === 0) return 0;

    const totalTime = loadedStates.reduce((sum, state) => sum + (state.loadTime || 0), 0);
    return Math.round(totalTime / loadedStates.length);
  }

  /**
   * 실패한 미디어 재시도
   */
  retryFailedMedia(): number {
    let retryCount = 0;

    for (const [id, state] of this.mediaLoadingStates.entries()) {
      if (state.error) {
        state.error = false;
        state.errorMessage = undefined;
        this.loadMediaElement(id, state.element, state.src);
        retryCount++;
      }
    }

    if (retryCount > 0) {
      logger.debug(`[MediaLoadingService] ${retryCount}개 미디어 재시도`);
    }

    return retryCount;
  }

  /**
   * 서비스 정리
   */
  cleanup(): void {
    try {
      this.mediaLoadingStates.clear();
      logger.debug('[MediaLoadingService] 정리됨');
    } catch (error) {
      logger.warn('Failed to cleanup MediaLoadingService:', error);
    }
  }
}

/**
 * 전역 미디어 로딩 서비스 인스턴스
 */
export const mediaLoadingService = MediaLoadingService.getInstance();
