/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Enhanced Vertical Image Item Component
 * @version 2.0.0 - Improved performance and user experience
 *
 * @description
 * 개선된 수직 이미지 아이템 컴포넌트입니다. 더 나은 성능, 접근성,
 * 사용자 경험을 제공하도록 리팩토링되었습니다.
 *
 * @features
 * - 향상된 lazy loading
 * - 개선된 오류 처리 및 재시도 로직
 * - 더 나은 접근성 지원
 * - 향상된 이미지/비디오 렌더링
 * - 성능 최적화된 메모이제이션
 */

import { logger } from '@infrastructure/logging/logger';
import { withGalleryItem, type GalleryComponentProps } from '@shared/components/hoc/GalleryMarker';
import { Button } from '@shared/components/ui/Button/Button';
import type { ImageFitMode } from '@shared/types/image-fit.types';
import type { MediaInfo } from '@shared/types/media.types';
import { getPreactHooks } from '@infrastructure/external/vendors';
import styles from './VerticalImageItem.module.css';

const { useCallback, useEffect, useRef, useState, useMemo } = getPreactHooks();

/**
 * 파일명 정리 유틸리티
 */
function cleanFilename(filename?: string): string {
  if (!filename) return 'Untitled';

  let cleaned = filename
    .replace(/^twitter_media_\d{8}T\d{6}_\d+\./, '')
    .replace(/^\/media\//, '')
    .replace(/^\.\//g, '')
    .replace(/[/\\]/g, '_');

  if (cleaned.length > 40 || !cleaned) {
    const match = filename.match(/([a-zA-Z0-9_-]+)$/);
    cleaned = match?.[1] ?? 'Image';
  }

  return cleaned;
}

/**
 * 미디어 타입 감지
 */
function isVideoMedia(media: MediaInfo): boolean {
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi'];
  const urlLowerCase = media.url.toLowerCase();

  if (videoExtensions.some(ext => urlLowerCase.includes(ext))) return true;
  if (media.filename && videoExtensions.some(ext => media.filename?.toLowerCase().endsWith(ext))) {
    return true;
  }
  if (urlLowerCase.includes('video.twimg.com') || urlLowerCase.includes('/video/')) return true;

  return false;
}

/**
 * 핏 모드 CSS 클래스 반환
 */
function getFitModeClass(fitMode?: ImageFitMode): string {
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
 * Props for the VerticalImageItem component
 */
interface VerticalImageItemProps extends GalleryComponentProps {
  media: MediaInfo;
  index: number;
  isActive: boolean;
  isVisible?: boolean;
  onClick: () => void;
  onDownload?: () => void;
  onLoad?: () => void;
  fitMode?: ImageFitMode;
}

/**
 * Enhanced Vertical Image Item Component
 */
function BaseVerticalImageItem({
  media,
  index,
  isActive,
  isVisible: _galleryVisible = true,
  onClick,
  onDownload,
  onLoad,
  className = '',
  fitMode,
}: VerticalImageItemProps) {
  // 상태 관리
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // 참조
  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 메모이제이션된 값들
  const isVideo = useMemo(() => isVideoMedia(media), [media]);
  const displayName = useMemo(() => cleanFilename(media.filename), [media.filename]);
  const mediaElement = isVideo ? videoRef.current : imgRef.current;

  // 로딩 성공 핸들러
  const handleLoadSuccess = useCallback(() => {
    setIsLoaded(true);
    setIsError(false);
    setLoadingProgress(100);
    onLoad?.();
    logger.debug(`Media loaded successfully: ${displayName}`);
  }, [onLoad, displayName]);

  // 로딩 오류 핸들러 (재시도 로직 포함)
  const handleLoadError = useCallback(() => {
    if (retryCount < 3) {
      // 최대 3번 재시도
      setTimeout(
        () => {
          setRetryCount(prev => prev + 1);
          setIsError(false);
          logger.debug(`Retrying media load (${retryCount + 1}/3): ${displayName}`);
        },
        1000 * (retryCount + 1)
      );
    } else {
      setIsError(true);
      setIsLoaded(false);
      setLoadingProgress(0);
      logger.warn(`Failed to load media after 3 retries: ${displayName}`);
    }
  }, [retryCount, displayName]);

  // 다운로드 핸들러
  const handleDownloadClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onDownload?.();
      logger.debug(`Download requested: ${displayName}`);
    },
    [onDownload, displayName]
  );

  // 키보드 접근성
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  // 수동 재시도
  const handleRetry = useCallback(() => {
    setIsError(false);
    setRetryCount(0);
    setLoadingProgress(0);
    logger.debug(`Manual retry requested: ${displayName}`);
  }, [displayName]);

  // Intersection Observer 설정
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isVisible) return;

    observerRef.current = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observerRef.current?.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '200px', // 미리 로딩
      }
    );

    observerRef.current.observe(container);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [isVisible]);

  // 재시도 시 미디어 다시 로드
  useEffect(() => {
    if (retryCount > 0 && mediaElement) {
      if (isVideo && videoRef.current) {
        videoRef.current.load();
      } else if (!isVideo && imgRef.current) {
        imgRef.current.src = media.url;
      }
    }
  }, [retryCount, mediaElement, isVideo, media.url]);

  // CSS 클래스 조합
  const containerClasses = [
    styles.container,
    isActive && styles.active,
    isLoaded && styles.loaded,
    isError && styles.error,
    getFitModeClass(fitMode) && `${styles.container}_${getFitModeClass(fitMode)}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const mediaClasses = [isVideo ? styles.video : styles.image, getFitModeClass(fitMode)]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role='button'
      tabIndex={0}
      aria-label={`${isVideo ? 'Video' : 'Image'} ${index + 1}: ${displayName}`}
      data-gallery-item={index}
      data-media-type={isVideo ? 'video' : 'image'}
    >
      <div className={styles.imageWrapper}>
        {/* 로딩 상태 */}
        {!isLoaded && !isError && isVisible && (
          <div className={styles.placeholder}>
            <div className={styles.loadingSpinner} />
            {loadingProgress > 0 && (
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${loadingProgress}%` }} />
              </div>
            )}
            <div className={styles.loadingText}>
              {loadingProgress > 0 ? `${Math.round(loadingProgress)}%` : '로딩 중...'}
            </div>
          </div>
        )}

        {/* 미디어 렌더링 */}
        {isVisible &&
          (isVideo ? (
            <video
              ref={videoRef}
              src={media.url}
              autoPlay={false}
              controls={true}
              muted={true}
              preload='metadata'
              className={mediaClasses}
              onLoadedData={handleLoadSuccess}
              onError={handleLoadError}
              style={{
                opacity: isLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease-in-out',
              }}
              aria-label={`Video: ${displayName}`}
            />
          ) : (
            <img
              ref={imgRef}
              src={media.url}
              alt={displayName}
              className={mediaClasses}
              onLoad={handleLoadSuccess}
              onError={handleLoadError}
              style={{
                opacity: isLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
              loading='lazy'
              decoding='async'
            />
          ))}

        {/* 오류 상태 */}
        {isError && (
          <div className={styles.errorState}>
            <span className={styles.errorIcon}>⚠️</span>
            <span className={styles.errorText}>
              {isVideo ? '비디오를 로드할 수 없습니다' : '이미지를 로드할 수 없습니다'}
            </span>
            <Button
              variant='secondary'
              size='small'
              onClick={handleRetry}
              className={styles.retryButton}
            >
              다시 시도
            </Button>
          </div>
        )}

        {/* 미디어 정보 오버레이 */}
        {isLoaded && (
          <div className={styles.overlay}>
            <div className={styles.mediaInfo}>
              <div className={styles.filename} title={displayName}>
                {displayName}
              </div>
              {media.width && media.height && (
                <div className={styles.dimensions}>
                  {media.width} × {media.height}
                </div>
              )}
            </div>

            {/* 인덱스 배지 */}
            <div className={styles.indexBadge}>{index + 1}</div>
          </div>
        )}
      </div>

      {/* 다운로드 버튼 */}
      {onDownload && isLoaded && (
        <Button
          variant='ghost'
          size='small'
          className={styles.downloadButton}
          onClick={handleDownloadClick}
          aria-label={`Download ${displayName}`}
        >
          <span className={styles.downloadIcon}>⬇️</span>
        </Button>
      )}
    </div>
  );
}

// HOC 적용
export const VerticalImageItem = withGalleryItem(BaseVerticalImageItem, {
  className: 'vertical-item-enhanced',
  preventClick: false,
  customData: {
    component: 'vertical-image-item-enhanced',
    role: 'gallery-item',
    version: '2.0.0',
  },
});
