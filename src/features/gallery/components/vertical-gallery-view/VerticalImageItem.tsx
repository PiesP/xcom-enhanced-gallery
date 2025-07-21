/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Vertical Image Item Component
 * @version 2.0.0 - Standard implementation
 * @description 통합된 수직 이미지 아이템 컴포넌트
 */

import { withGalleryItem, type GalleryComponentProps } from '@shared/components/hoc/GalleryMarker';
import { Button } from '@shared/components/ui/Button/Button';
import type { ImageFitMode } from '@shared/types/image-fit.types';
import type { MediaInfo } from '@core/types/media.types';
import type { VNode } from '@shared/types/global.types';
import { getPreactHooks } from '@core/external/vendors';
import styles from './VerticalImageItem.module.css';

/**
 * Clean up filename by removing verbose path information
 */
function cleanFilename(filename?: string): string {
  if (!filename) {
    return 'Untitled';
  }

  // Remove twitter_media prefix and path
  let cleaned = filename
    .replace(/^twitter_media_\d{8}T\d{6}_\d+\./, '') // Remove twitter_media_YYYYMMDDTHHMMSS_N.
    .replace(/^\/media\//, '') // Remove /media/ prefix
    .replace(/^\.\//g, '') // Remove ./ prefix
    .replace(/[/\\]/g, '_'); // Replace path separators with underscore

  // If still too long or empty, show just the image ID
  if (cleaned.length > 40 || !cleaned) {
    const match = filename.match(/([a-zA-Z0-9_-]+)$/);
    cleaned = match?.[1] ?? 'Image';
  }

  return cleaned;
}

/**
 * 미디어 타입 감지 (비디오인지 이미지인지)
 */
function isVideoMedia(media: MediaInfo): boolean {
  // URL에서 비디오 확장자 확인
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi'];
  const urlLowerCase = media.url.toLowerCase();

  if (videoExtensions.some(ext => urlLowerCase.includes(ext))) {
    return true;
  }

  // 파일명에서 비디오 확장자 확인
  if (media.filename) {
    const filenameLowerCase = media.filename.toLowerCase();
    if (videoExtensions.some(ext => filenameLowerCase.endsWith(ext))) {
      return true;
    }
  }

  // Twitter 비디오 URL 패턴 확인
  if (urlLowerCase.includes('video.twimg.com') || urlLowerCase.includes('/video/')) {
    return true;
  }

  return false;
}

/**
 * Props for the VerticalImageItem component
 */
interface VerticalImageItemProps extends GalleryComponentProps {
  /** Media information for the image */
  media: MediaInfo;
  /** Index of the item in the list */
  index: number;
  /** Whether this item is currently active/selected */
  isActive: boolean;
  /** Whether this item is focused for scrolling */
  isFocused?: boolean;
  /** Whether the gallery is visible */
  isVisible?: boolean;
  /** Force render media elements bypassing lazy loading */
  forceVisible?: boolean;
  /** Click handler for the item */
  onClick: () => void;
  /** Optional download handler */
  onDownload?: () => void;
  /** Image fit mode */
  fitMode?: ImageFitMode;
  /** Callback when media load completes */
  onMediaLoad?: (mediaId: string, index: number) => void;
}

/**
 * Get CSS class for fit mode
 */
function getFitModeClass(fitMode?: ImageFitMode): string {
  if (!fitMode) {
    return '';
  }

  switch (fitMode) {
    case 'original':
      return styles.fitOriginal ?? '';
    case 'fitHeight':
      return styles.fitHeight ?? '';
    case 'fitWidth':
      return styles.fitWidth ?? '';
    case 'fitContainer':
      return styles.fitContainer ?? '';
    default:
      return '';
  }
}

/**
 * A vertical image item component that displays media with lazy loading
 * and download functionality
 */
function BaseVerticalImageItem({
  media,
  index,
  isActive,
  isFocused = false,
  isVisible: _galleryVisible = true,
  forceVisible = false,
  onClick,
  onDownload,
  className = '',
  fitMode,
  onMediaLoad,
}: VerticalImageItemProps): VNode | null {
  const { useCallback, useEffect, useRef, useState } = getPreactHooks();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 비디오 타입 확인
  const isVideo = isVideoMedia(media);

  // 클릭 핸들러 - 포커스 이동 포함
  const handleClick = useCallback(
    (event: MouseEvent) => {
      // 다운로드 버튼 클릭은 제외
      if ((event.target as HTMLElement).closest(`.${styles.downloadButton}`)) {
        return;
      }

      // 컨테이너에 포커스 설정
      if (containerRef.current) {
        containerRef.current.focus({ preventScroll: true });
      }

      // 부모 onClick 호출
      onClick?.();
    },
    [onClick]
  );

  // Handle image load
  const handleImageLoad = useCallback(() => {
    if (!isLoaded) {
      setIsLoaded(true);
      setIsError(false);
      // 미디어 로드 완료를 부모 컴포넌트에 알림
      onMediaLoad?.(media.url, index);
    }
  }, [isLoaded, media.url, index, onMediaLoad]);

  // Handle image error
  const handleImageError = useCallback(() => {
    setIsError(true);
    setIsLoaded(false);
  }, []);

  // Handle download click
  const handleDownloadClick = useCallback(
    (e?: Event) => {
      e?.preventDefault();
      (e as MouseEvent)?.stopPropagation();
      onDownload?.();
    },
    [onDownload]
  );

  // Handle video metadata load (비디오 메타데이터 로드 시)
  const handleVideoLoadedMetadata = useCallback(() => {
    setIsLoaded(true);
    setIsError(false);
    // 비디오 메타데이터 로드 완료를 부모 컴포넌트에 알림
    onMediaLoad?.(media.url, index);
  }, [media.url, index, onMediaLoad]);

  // Handle video error
  const handleVideoError = useCallback(() => {
    setIsError(true);
    setIsLoaded(false);
  }, []);

  // Handle video loaded (비디오 로드 완료 시 - readyState 기반)
  const handleVideoLoaded = useCallback(() => {
    if (!isLoaded) {
      setIsLoaded(true);
      setIsError(false);
      onMediaLoad?.(media.url, index);
    }
  }, [isLoaded, media.url, index, onMediaLoad]);

  // Intersection Observer for lazy loading (최적화)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isVisible || forceVisible) {
      return; // 이미 visible 상태이거나 강제 렌더링 모드면 observer 설정하지 않음
    }

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // 한 번 visible되면 observer 해제
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px', // 미리 로딩 거리 증가
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [isVisible, forceVisible]); // forceVisible 의존성 추가

  // forceVisible이 true이면 즉시 visible 상태로 설정
  useEffect(() => {
    if (forceVisible && !isVisible) {
      setIsVisible(true);
    }
  }, [forceVisible, isVisible]);

  // 캐시된 미디어나 이미 로드된 미디어 감지
  useEffect(() => {
    if (!isVisible || isLoaded) return;

    if (isVideo) {
      // 비디오의 경우 readyState를 체크해서 이미 로드되었는지 확인
      const videoElement = containerRef.current?.querySelector('video') as HTMLVideoElement;
      if (videoElement && videoElement.readyState >= 1) {
        handleVideoLoaded();
      }
    } else {
      // 이미지의 경우 complete 상태를 체크해서 이미 로드되었는지 확인
      if (imgRef.current?.complete) {
        handleImageLoad();
      }
    }
  }, [isVisible, isLoaded, isVideo, handleVideoLoaded, handleImageLoad]);

  const containerClasses = [
    styles.container,
    isActive && styles.active,
    isFocused && styles.focused,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const imageClasses = [styles.image, getFitModeClass(fitMode)].filter(Boolean).join(' ');

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      data-index={index}
      onClick={handleClick}
      aria-label={`미디어 ${index + 1}: ${cleanFilename(media.filename)}`}
    >
      <div className={styles.imageWrapper}>
        {isVisible && (
          <>
            {!isLoaded && !isError && !isVideo && (
              <div className={styles.placeholder}>
                <div className={styles.loadingSpinner} />
              </div>
            )}

            {/* 비디오 렌더링 */}
            {isVideo ? (
              <video
                src={media.url}
                autoPlay={false}
                controls={true}
                muted={true}
                className={`${styles.video} ${getFitModeClass(fitMode)}`}
                onLoadedMetadata={handleVideoLoadedMetadata}
                onLoadedData={handleVideoLoaded}
                onCanPlay={handleVideoLoaded}
                onError={handleVideoError}
                style={{
                  opacity: isLoaded ? 1 : 0,
                  transition: 'opacity 0.2s ease-in-out',
                }}
              />
            ) : (
              /* 이미지 렌더링 */
              <img
                ref={imgRef}
                src={media.url}
                alt={cleanFilename(media.filename) || `Image ${index + 1}`}
                className={imageClasses}
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={{
                  opacity: isLoaded ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                }}
              />
            )}

            {/* 로드 완료 확인 및 자동 로드 콜백 (이미지의 경우) */}
            {!isVideo &&
              imgRef.current?.complete &&
              !isLoaded &&
              (() => {
                // 이미지가 이미 캐시되어 있는 경우 즉시 로드 처리
                handleImageLoad();
                return null;
              })()}

            {isError && (
              <div className={styles.error}>
                <span className={styles.errorIcon}>⚠️</span>
                <span className={styles.errorText}>
                  Failed to load {isVideo ? 'video' : 'image'}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {onDownload && (
        <Button
          variant='ghost'
          size='sm'
          className={styles.downloadButton}
          onClick={handleDownloadClick}
          aria-label={`Download ${cleanFilename(media.filename)}`}
        >
          <span className={styles.downloadIcon}>⬇️</span>
        </Button>
      )}
    </div>
  ) as unknown as VNode;
}

// Gallery Marker HOC를 적용한 VerticalImageItem
export const VerticalImageItem = withGalleryItem(BaseVerticalImageItem, {
  className: 'vertical-item',
  preventClick: false, // 클릭 이벤트는 허용 (갤러리 아이템 선택을 위해)
  customData: {
    component: 'vertical-image-item',
    role: 'gallery-item',
  },
});
