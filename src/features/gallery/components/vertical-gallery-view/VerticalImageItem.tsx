/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Vertical Image Item Component
 * @version 3.0.0 - Phase 4 StandardProps 시스템 적용
 * @description 통합된 수직 이미지 아이템 컴포넌트 - StandardProps 표준화 완료
 */

import { withGallery, type GalleryComponentProps } from '../../../../shared/components/hoc';
import { Button } from '../../../../shared/components/ui/Button/Button';
import { ComponentStandards } from '../../../../shared/components/ui/StandardProps';
import type { ImageFitMode } from '@shared/types';
import type { MediaInfo } from '@shared/types/media.types';
import type { VNode } from '@shared/types/app.types';
import { getPreactHooks, getPreactCompat } from '../../../../shared/external/vendors';
import styles from './VerticalImageItem.module.css';
import { languageService } from '../../../../shared/services/LanguageService';

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
 * Props for the VerticalImageItem component - StandardProps 통합
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
  /** Optional image context menu handler */
  onImageContextMenu?: (event: MouseEvent, media: MediaInfo) => void;
  /** 추가 클래스명 */
  className?: string;
  /** 테스트 ID */
  'data-testid'?: string;
  /** 접근성 레이블 */
  'aria-label'?: string;
  /** ARIA 속성들 */
  'aria-describedby'?: string;
  /** 접근성 역할 */
  role?: string;
  /** 탭 인덱스 */
  tabIndex?: number;
  /** 포커스 이벤트 핸들러 */
  onFocus?: (event: FocusEvent) => void;
  /** 블러 이벤트 핸들러 */
  onBlur?: (event: FocusEvent) => void;
  /** 키보드 이벤트 핸들러 */
  onKeyDown?: (event: KeyboardEvent) => void;
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
 * and download functionality - StandardProps 시스템 적용
 */
function BaseVerticalImageItemCore({
  media,
  index,
  isActive,
  isFocused = false,
  isVisible: _galleryVisible = true,
  forceVisible = false,
  onClick,
  onDownload,
  onImageContextMenu,
  className = '',
  fitMode,
  onMediaLoad,
  'data-testid': testId,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  role,
  tabIndex,
  onFocus,
  onBlur,
  onKeyDown,
}: VerticalImageItemProps): VNode | null {
  const { useCallback, useEffect, useRef, useState } = getPreactHooks();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wasPlayingBeforeHiddenRef = useRef(false);
  const wasMutedBeforeHiddenRef = useRef<boolean | null>(null);

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

  // Handle image context menu
  const handleImageContextMenu = useCallback(
    (event: MouseEvent) => {
      // 브라우저 기본 컨텍스트 메뉴 허용 (preventDefault 호출하지 않음)
      if (onImageContextMenu) {
        onImageContextMenu(event, media);
      }
    },
    [onImageContextMenu, media]
  );

  // Handle image drag start (드래그 방지)
  const handleImageDragStart = useCallback((event: DragEvent) => {
    // 드래그는 방지
    event.preventDefault();
  }, []);

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
      // no-op cleanup; observer is disconnected above when visible
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

  // N3 — 비디오 가시성 제어: 화면에서 벗어나면 자동 일시정지(음소거 유지)
  useEffect(() => {
    if (!isVideo) return;
    const container = containerRef.current;
    const videoEl = (videoRef.current ||
      (container?.querySelector('video') as HTMLVideoElement | null)) as HTMLVideoElement | null;
    if (!container || !videoEl || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (!entry) return;
        if (!entry.isIntersecting) {
          try {
            // 현재 상태를 보관
            wasPlayingBeforeHiddenRef.current = !videoEl.paused;
            wasMutedBeforeHiddenRef.current = videoEl.muted;
            // 소음 방지를 위해 숨김 시에는 항상 음소거 + 일시정지
            videoEl.muted = true;
            if (!videoEl.paused) videoEl.pause();
          } catch {
            /* ignore */
          }
        } else {
          // 보이는 경우: 이전에 재생 중이었던 경우에만 재생 복원, 음소거 상태는 이전 상태로 복원
          try {
            if (wasMutedBeforeHiddenRef.current !== null) {
              videoEl.muted = wasMutedBeforeHiddenRef.current;
            }
            if (wasPlayingBeforeHiddenRef.current) {
              void videoEl.play?.();
            }
          } catch {
            /* ignore */
          } finally {
            // 플래그 초기화
            wasPlayingBeforeHiddenRef.current = false;
            wasMutedBeforeHiddenRef.current = null;
          }
        }
      },
      { threshold: 0.0, rootMargin: '0px' }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [isVideo]);

  // 비디오 초기 마운트 시 기본 음소거만 1회 설정(제어 컴포넌트가 되지 않도록)
  useEffect(() => {
    if (!isVideo) return;
    const v = videoRef.current;
    if (v) {
      try {
        if (typeof v.muted === 'boolean') v.muted = true;
      } catch {
        /* noop */
      }
    }
  }, [isVideo]);

  const containerClasses = ComponentStandards.createClassName(
    styles.container,
    isActive ? styles.active : undefined,
    isFocused ? styles.focused : undefined,
    className
  );

  const imageClasses = ComponentStandards.createClassName(styles.image, getFitModeClass(fitMode));

  // 표준화된 ARIA 속성 생성
  const ariaProps = ComponentStandards.createAriaProps({
    'aria-label': ariaLabel || `미디어 ${index + 1}: ${cleanFilename(media.filename)}`,
    'aria-describedby': ariaDescribedBy,
    role: role || 'button',
    tabIndex: tabIndex ?? 0,
  } as Record<string, string | number | boolean | undefined>);

  // 표준화된 테스트 속성 생성
  const testProps = ComponentStandards.createTestProps(testId);

  return (
    <div
      ref={containerRef}
      className={ComponentStandards.createClassName(
        containerClasses,
        styles.imageWrapper // imageWrapper 스타일을 container에 병합
      )}
      data-index={index}
      onClick={handleClick}
      onFocus={onFocus as (event: FocusEvent) => void}
      onBlur={onBlur as (event: FocusEvent) => void}
      onKeyDown={onKeyDown as (event: KeyboardEvent) => void}
      {...ariaProps}
      {...testProps}
    >
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
              ref={videoRef}
              className={ComponentStandards.createClassName(
                styles.video,
                getFitModeClass(fitMode),
                isLoaded ? styles.loaded : styles.loading
              )}
              onLoadedMetadata={handleVideoLoadedMetadata}
              onLoadedData={handleVideoLoaded}
              onCanPlay={handleVideoLoaded}
              onError={handleVideoError}
              onContextMenu={handleImageContextMenu}
              onDragStart={handleImageDragStart}
            />
          ) : (
            /* 이미지 렌더링 */
            <img
              ref={imgRef}
              src={media.url}
              alt={
                cleanFilename(media.filename) ||
                languageService.getFormattedString('messages.gallery.failedToLoadImage', {
                  type: 'image',
                })
              }
              loading='lazy'
              decoding='async'
              className={ComponentStandards.createClassName(
                imageClasses,
                isLoaded ? styles.loaded : styles.loading
              )}
              onLoad={handleImageLoad}
              onError={handleImageError}
              onContextMenu={handleImageContextMenu}
              onDragStart={handleImageDragStart}
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
                {languageService.getFormattedString('messages.gallery.failedToLoadImage', {
                  type: isVideo ? 'video' : 'image',
                })}
              </span>
            </div>
          )}
        </>
      )}

      {onDownload && (
        <Button
          variant='ghost'
          size='sm'
          className={styles.downloadButton || ''}
          onClick={handleDownloadClick}
          aria-label={languageService.getString('toolbar.download')}
        >
          <span className={styles.downloadIcon}>⬇️</span>
        </Button>
      )}
    </div>
  ) as unknown as VNode;
}

// Props 비교 함수 - 성능 최적화를 위한 shallow comparison
export const compareVerticalImageItemProps = (
  prevProps: VerticalImageItemProps,
  nextProps: VerticalImageItemProps
): boolean => {
  // 중요한 props들을 우선적으로 체크
  if (prevProps.media?.url !== nextProps.media?.url) return false;
  if (prevProps.media?.filename !== nextProps.media?.filename) return false;
  if (prevProps.isActive !== nextProps.isActive) return false;
  if (prevProps.isFocused !== nextProps.isFocused) return false;
  if (prevProps.index !== nextProps.index) return false;
  if (prevProps.isVisible !== nextProps.isVisible) return false;
  if (prevProps.forceVisible !== nextProps.forceVisible) return false;
  if (prevProps.fitMode !== nextProps.fitMode) return false;

  // 함수들은 참조 비교
  if (prevProps.onClick !== nextProps.onClick) return false;
  if (prevProps.onDownload !== nextProps.onDownload) return false;
  if (prevProps.onMediaLoad !== nextProps.onMediaLoad) return false;
  if (prevProps.onFocus !== nextProps.onFocus) return false;
  if (prevProps.onBlur !== nextProps.onBlur) return false;
  if (prevProps.onKeyDown !== nextProps.onKeyDown) return false;

  // 기타 props
  if (prevProps.className !== nextProps.className) return false;
  if (prevProps['data-testid'] !== nextProps['data-testid']) return false;
  if (prevProps['aria-label'] !== nextProps['aria-label']) return false;
  if (prevProps['aria-describedby'] !== nextProps['aria-describedby']) return false;
  if (prevProps.role !== nextProps.role) return false;
  if (prevProps.tabIndex !== nextProps.tabIndex) return false;

  return true;
};

// memo를 적용한 최적화된 컴포넌트
const { memo } = getPreactCompat();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BaseVerticalImageItem = memo(BaseVerticalImageItemCore as any, compareVerticalImageItemProps);

// displayName 설정
Object.defineProperty(BaseVerticalImageItem, 'displayName', {
  value: 'memo(BaseVerticalImageItem)',
  writable: false,
  configurable: true,
});

// Gallery Marker HOC를 적용한 VerticalImageItem
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const VerticalImageItem = withGallery(BaseVerticalImageItem as any, {
  type: 'item',
  className: 'vertical-item',
  events: {
    preventClick: false, // 클릭 이벤트는 허용 (갤러리 아이템 선택을 위해)
    preventKeyboard: false,
    blockTwitterNative: true,
  },
  customData: {
    component: 'vertical-image-item',
    role: 'gallery-item',
  },
});

// VerticalImageItem displayName 설정
Object.defineProperty(VerticalImageItem, 'displayName', {
  value: 'memo(VerticalImageItem)',
  writable: false,
  configurable: true,
});
