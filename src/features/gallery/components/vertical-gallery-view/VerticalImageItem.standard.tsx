/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Simplified Vertical Image Item Component (Phase 9)
 * @version 4.0.0 - 통합 미디어 로딩 서비스 적용
 * @description 통합 미디어 로딩 서비스를 사용하는 단순화된 수직 이미지 아이템 컴포넌트
 */

import { withGalleryItem, type GalleryComponentProps } from '@shared/components/hoc/GalleryMarker';
import { Button } from '@shared/components/ui/Button/Button';
import { ComponentStandards } from '@shared/components/ui/StandardProps';
import { useMediaLoading } from '@shared/hooks';
import type { ImageFitMode } from '@shared/types';
import type { MediaInfo } from '@shared/types/media.types';
import type { VNode } from '@shared/types/app.types';
import { getPreactHooks, getPreactCompat } from '@shared/external/vendors';
import styles from './VerticalImageItem.module.css';

const { useRef, useCallback, useMemo } = getPreactHooks();
const { memo } = getPreactCompat();

/**
 * Clean up filename by removing verbose path information
 */
function cleanFilename(filename?: string): string {
  if (!filename) {
    return 'Untitled';
  }

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

  if (videoExtensions.some(ext => urlLowerCase.includes(ext))) {
    return true;
  }

  if (media.filename) {
    const filenameLowerCase = media.filename.toLowerCase();
    if (videoExtensions.some(ext => filenameLowerCase.endsWith(ext))) {
      return true;
    }
  }

  if (urlLowerCase.includes('video.twimg.com') || urlLowerCase.includes('/video/')) {
    return true;
  }

  return false;
}

/**
 * Props for the VerticalImageItem component
 */
interface VerticalImageItemProps extends GalleryComponentProps {
  media: MediaInfo;
  index: number;
  isActive: boolean;
  isFocused?: boolean;
  isVisible?: boolean;
  forceVisible?: boolean;
  onClick: () => void;
  onDownload?: () => void;
  fitMode?: ImageFitMode;
  onMediaLoad?: (mediaId: string, index: number) => void;
  className?: string;
  'data-testid'?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  role?: string;
  tabIndex?: number;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
}

/**
 * Get CSS class for fit mode
 */
function getFitModeClass(fitMode?: ImageFitMode): string {
  if (!fitMode) return '';

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
 * Simplified Vertical Image Item Component using UnifiedMediaLoadingService
 */
function BaseVerticalImageItemCore({
  media,
  index,
  isActive,
  isFocused = false,
  forceVisible = false,
  onClick,
  onDownload,
  fitMode,
  onMediaLoad,
  className = '',
  'data-testid': testId,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  role = 'button',
  tabIndex = 0,
  onFocus,
  onBlur,
  onKeyDown,
}: VerticalImageItemProps): VNode {
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement>(null);

  const isVideo = useMemo(() => isVideoMedia(media), [media]);
  const cleanedFilename = useMemo(() => cleanFilename(media.filename), [media.filename]);

  // 통합 미디어 로딩 서비스 사용
  const { isLoading, hasError, forceLoad } = useMediaLoading(mediaRef, {
    enableLazyLoading: !forceVisible,
    retryAttempts: 3,
    rootMargin: '100px',
    threshold: 0.1,
  });

  // 미디어 로드 완료 콜백
  const handleMediaLoaded = useCallback(() => {
    if (onMediaLoad) {
      onMediaLoad(media.url, index);
    }
  }, [onMediaLoad, media.url, index]);

  // 클릭 핸들러
  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);

  // 다운로드 핸들러
  const handleDownload = useCallback(
    (event?: Event) => {
      if (event) {
        event.stopPropagation();
      }
      if (onDownload) {
        onDownload();
      }
    },
    [onDownload]
  );

  // 키보드 이벤트 핸들러
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick();
      }
      if (onKeyDown) {
        onKeyDown(event);
      }
    },
    [onClick, onKeyDown]
  );

  // 강제 로딩 (forceVisible 변경 시)
  const handleForceVisible = useCallback(() => {
    if (forceVisible) {
      forceLoad();
    }
  }, [forceVisible, forceLoad]);

  // forceVisible 변경 감지
  const { useEffect } = getPreactHooks();
  useEffect(() => {
    handleForceVisible();
  }, [handleForceVisible]);

  const containerClasses = ComponentStandards.createClassName(
    styles.container,
    isActive ? styles.active : undefined,
    isFocused ? styles.focused : undefined,
    className
  );

  const mediaClasses = ComponentStandards.createClassName(
    styles.media,
    getFitModeClass(fitMode),
    isLoading ? styles.loading : undefined,
    hasError ? styles.error : undefined
  );

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      data-testid={testId}
      aria-label={ariaLabel || `Media ${index + 1}: ${cleanedFilename}`}
      aria-describedby={ariaDescribedBy}
      role={role as 'button'}
      tabIndex={tabIndex}
    >
      {/* 미디어 영역 */}
      <div className={styles.mediaContainer}>
        {isVideo ? (
          <video
            ref={mediaRef as { current: HTMLVideoElement | null }}
            className={mediaClasses}
            controls
            muted
            preload='metadata'
            data-src={media.url}
            onLoadedData={handleMediaLoaded}
            aria-label={`Video: ${cleanedFilename}`}
          >
            <source src={media.url} type='video/mp4' />
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            ref={mediaRef as { current: HTMLImageElement | null }}
            className={mediaClasses}
            data-src={media.url}
            alt={cleanedFilename}
            onLoad={handleMediaLoaded}
            loading='lazy'
          />
        )}

        {/* 로딩 오버레이 */}
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingSpinner} />
          </div>
        )}

        {/* 에러 오버레이 */}
        {hasError && (
          <div className={styles.errorOverlay}>
            <div className={styles.errorMessage}>Failed to load media</div>
            <Button onClick={forceLoad} variant='secondary' size='sm'>
              Retry
            </Button>
          </div>
        )}
      </div>

      {/* 컨트롤 영역 */}
      <div className={styles.controls}>
        <div className={styles.filename} title={media.filename || 'Unknown'}>
          {cleanedFilename}
        </div>
        {onDownload && (
          <Button
            onClick={handleDownload}
            variant='secondary'
            size='sm'
            aria-label={`Download ${cleanedFilename}`}
          >
            Download
          </Button>
        )}
      </div>

      {/* 활성 상태 표시 */}
      {isActive && <div className={styles.activeIndicator} />}
    </div>
  );
}

/**
 * Memoized version of VerticalImageItem for performance
 */
const VerticalImageItem = memo(BaseVerticalImageItemCore, (prevProps, nextProps) => {
  // 성능 최적화를 위한 얕은 비교
  return (
    prevProps.media.url === nextProps.media.url &&
    prevProps.index === nextProps.index &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isFocused === nextProps.isFocused &&
    prevProps.forceVisible === nextProps.forceVisible &&
    prevProps.fitMode === nextProps.fitMode
  );
});

export default withGalleryItem(VerticalImageItem);
export { BaseVerticalImageItemCore };
export type { VerticalImageItemProps };
