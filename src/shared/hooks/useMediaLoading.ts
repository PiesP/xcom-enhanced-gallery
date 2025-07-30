/**
 * @fileoverview 미디어 로딩 훅
 * @description MediaLoadingService를 사용하는 간소화된 훅 (Phase 3 명명 개선)
 * @version 3.0.0
 */

import { useEffect, useRef, useState } from 'preact/hooks';
import {
  MediaLoadingService,
  type MediaLoadingOptions,
} from '@shared/services/MediaLoadingService';

// 글로벌 서비스 인스턴스
const mediaLoadingService = new MediaLoadingService();

/**
 * 미디어 로딩 훅
 * 기존 useUnifiedMediaLoading의 명명을 단순화한 버전
 */
export function useMediaLoading(
  elementRef: { current: HTMLImageElement | HTMLVideoElement | null },
  options: MediaLoadingOptions = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [loadedUrl, setLoadedUrl] = useState<string | undefined>();
  const mediaIdRef = useRef<string>();

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // 고유 ID 생성
    const mediaId = `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    mediaIdRef.current = mediaId;

    // 미디어 요소 등록
    mediaLoadingService.registerMediaElement(mediaId, element, options);

    // 상태 변화 감지를 위한 폴링 (성능상 더 나은 방법이 있다면 추후 개선)
    const checkState = () => {
      const state = mediaLoadingService.getLoadingState(mediaId);
      if (state) {
        setIsLoading(state.isLoading);
        setHasError(state.hasError);
        setLoadedUrl(state.loadedUrl);
      }
    };

    // 초기 상태 확인 및 주기적 상태 확인
    checkState();
    const interval = setInterval(checkState, 100);

    return () => {
      clearInterval(interval);
      mediaLoadingService.unregisterMediaElement(mediaId);
    };
  }, [elementRef, options]);

  /**
   * 강제 로딩 트리거
   */
  const forceLoad = () => {
    if (mediaIdRef.current) {
      mediaLoadingService.loadMedia(mediaIdRef.current);
    }
  };

  return {
    isLoading,
    hasError,
    loadedUrl,
    forceLoad,
  };
}
