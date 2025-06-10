/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * Enhanced Vertical Image Item Component for Gallery Display
 */

import { withGalleryItem, type GalleryComponentProps } from '@shared/components/hoc/GalleryMarker';
import { VideoViewer } from '@shared/components/media/VideoViewer';
import { Button } from '@shared/components/ui/Button/Button';
import type { ImageFitMode } from '@shared/types/image-fit.types';
import type { MediaInfo } from '@shared/types/media.types';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
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
  /** Whether the gallery is visible */
  isVisible?: boolean;
  /** Click handler for the item */
  onClick: () => void;
  /** Optional download handler */
  onDownload?: () => void;
  /** Image fit mode */
  fitMode?: ImageFitMode;
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
  isVisible: galleryVisible = true,
  onClick,
  onDownload,
  className = '',
  fitMode,
}: VerticalImageItemProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 비디오 타입 확인
  const isVideo = isVideoMedia(media);

  // Handle image load
  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
    setIsError(false);
  }, []);

  // Handle image error
  const handleImageError = useCallback(() => {
    setIsError(true);
    setIsLoaded(false);
  }, []);

  // Handle download click
  const handleDownloadClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      onDownload?.();
    },
    [onDownload]
  );

  // Handle key down for accessibility
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  // Intersection Observer for lazy loading
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (entry?.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [isVisible]);

  const containerClasses = [styles.container, isActive && styles.active, className]
    .filter(Boolean)
    .join(' ');

  const imageClasses = [styles.image, getFitModeClass(fitMode)].filter(Boolean).join(' ');

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role='button'
      tabIndex={0}
      aria-label={`View ${isVideo ? 'video' : 'image'} ${index + 1}: ${cleanFilename(media.filename)}`}
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
              <VideoViewer
                media={media}
                autoPlay={false}
                controls={true}
                muted={true}
                isActive={isActive}
                isVisible={galleryVisible && isVisible}
                className={`${styles.video} ${getFitModeClass(fitMode)}`}
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

            {isError && !isVideo && (
              <div className={styles.error}>
                <span className={styles.errorIcon}>⚠️</span>
                <span className={styles.errorText}>Failed to load image</span>
              </div>
            )}
          </>
        )}
      </div>

      {onDownload && (
        <Button
          variant='ghost'
          size='small'
          className={styles.downloadButton}
          onClick={handleDownloadClick}
          aria-label={`Download ${cleanFilename(media.filename)}`}
        >
          <span className={styles.downloadIcon}>⬇️</span>
        </Button>
      )}
    </div>
  );
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
