/**
 * @fileoverview 단순화된 미디어 로딩 훅
 * @description 통합 미디어 로딩 서비스를 사용하는 간소화된 훅
 */

import { useEffect, useRef, useState } from 'preact/hooks';
import {
  unifiedMediaLoader,
  type MediaLoadingOptions,
} from '@shared/services/UnifiedMediaLoadingService';

/**
 * 단순화된 미디어 로딩 훅
 * 기존 useProgressiveImage의 복잡한 로직을 통합 서비스로 대체
 */
export function useUnifiedMediaLoading(
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

    // 통합 서비스에 등록
    unifiedMediaLoader.registerMediaElement(mediaId, element, options);

    // 상태 변화 감지를 위한 폴링 (성능상 더 나은 방법이 있다면 추후 개선)
    const checkState = () => {
      const state = unifiedMediaLoader.getMediaState(mediaId);
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
      unifiedMediaLoader.unregisterMediaElement(mediaId);
    };
  }, [elementRef, options]);

  /**
   * 강제 로딩 트리거
   */
  const forceLoad = () => {
    if (mediaIdRef.current) {
      unifiedMediaLoader.forceLoad(mediaIdRef.current);
    }
  };

  return {
    isLoading,
    hasError,
    loadedUrl,
    forceLoad,
  };
}
