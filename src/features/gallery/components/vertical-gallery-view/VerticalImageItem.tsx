import { getSolid } from '@shared/external/vendors';
const { createSignal, createEffect, onCleanup, mergeProps } = getSolid();
import type { JSX } from '@shared/external/vendors';

/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Vertical Image Item Component (Solid.js)
 * @version 4.0.0 - Phase 5.1 Solid.js 전환
 * @description 수직 이미지 아이템 컴포넌트 - Solid.js 네이티브 반응성 활용
 */

import type { ImageFitMode } from '@shared/types';
import type { MediaInfo } from '@shared/types/media.types';
import { languageService } from '../../../../shared/services/LanguageService';
import { ComponentStandards } from '../../../../shared/components/ui/StandardProps';
import { Button } from '../../../../shared/components/ui/Button/Button';
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
 * Props for the VerticalImageItem component - Solid.js 버전
 */
export interface VerticalImageItemProps {
  /** Media information for the image */
  media: MediaInfo;
  /** Index of the item in the list */
  index: number;
  /** Total count of items (for ARIA labels) */
  totalCount?: number;
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
 * A vertical image item component that displays media with lazy loading
 * and download functionality - Solid.js 버전
 */
export function VerticalImageItem(props: VerticalImageItemProps): JSX.Element {
  // Props with defaults
  const merged = mergeProps(
    {
      isFocused: false,
      isVisible: true,
      forceVisible: false,
      className: '',
      role: 'button',
      tabIndex: 0,
    },
    props
  );

  // Local state (Solid signals)
  const [isLoaded, setIsLoaded] = createSignal(false);
  const [isError, setIsError] = createSignal(false);
  const [isVisible, setIsVisible] = createSignal(false);

  // Refs
  let imgRef: HTMLImageElement | undefined;
  let containerRef: HTMLDivElement | undefined;
  let videoRef: HTMLVideoElement | undefined;

  // 비디오 상태 추적용 refs (reactive하지 않아도 됨)
  let wasPlayingBeforeHidden = false;
  let wasMutedBeforeHidden: boolean | null = null;

  // 비디오 타입 확인 (computed)
  const isVideo = () => isVideoMedia(merged.media);

  // 클릭 핸들러 - 포커스 이동 포함
  const handleClick = (event: MouseEvent) => {
    // 다운로드 버튼 클릭은 제외
    if ((event.target as HTMLElement).closest(`.${styles.downloadButton}`)) {
      return;
    }

    // 컨테이너에 포커스 설정
    if (containerRef) {
      containerRef.focus({ preventScroll: true });
    }

    // 부모 onClick 호출
    merged.onClick?.();
  };

  // Handle image load
  const handleImageLoad = () => {
    if (!isLoaded()) {
      setIsLoaded(true);
      setIsError(false);
      // 미디어 로드 완료를 부모 컴포넌트에 알림
      merged.onMediaLoad?.(merged.media.url, merged.index);
    }
  };

  // Handle image error
  const handleImageError = () => {
    setIsError(true);
    setIsLoaded(false);
  };

  // Handle download click
  const handleDownloadClick = (e?: Event) => {
    e?.preventDefault();
    (e as MouseEvent)?.stopPropagation();
    merged.onDownload?.();
  };

  // Handle video metadata load
  const handleVideoLoadedMetadata = () => {
    setIsLoaded(true);
    setIsError(false);
    merged.onMediaLoad?.(merged.media.url, merged.index);
  };

  // Handle video error
  const handleVideoError = () => {
    setIsError(true);
    setIsLoaded(false);
  };

  // Handle video loaded
  const handleVideoLoaded = () => {
    if (!isLoaded()) {
      setIsLoaded(true);
      setIsError(false);
      merged.onMediaLoad?.(merged.media.url, merged.index);
    }
  };

  // Handle image context menu
  const handleImageContextMenu = (event: MouseEvent) => {
    // 브라우저 기본 컨텍스트 메뉴 허용
    if (merged.onImageContextMenu) {
      merged.onImageContextMenu(event, merged.media);
    }
  };

  // Handle image drag start (드래그 방지)
  const handleImageDragStart = (event: DragEvent) => {
    event.preventDefault();
  };

  // Intersection Observer for lazy loading (Solid createEffect)
  createEffect(() => {
    const container = containerRef;
    if (!container || isVisible() || merged.forceVisible) {
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

    onCleanup(() => {
      observer.disconnect();
    });
  });

  // forceVisible이 true이면 즉시 visible 상태로 설정
  createEffect(() => {
    if (merged.forceVisible && !isVisible()) {
      setIsVisible(true);
    }
  });

  // 캐시된 미디어나 이미 로드된 미디어 감지
  createEffect(() => {
    if (!isVisible() || isLoaded()) return;

    if (isVideo()) {
      // 비디오의 경우 readyState를 체크
      const videoElement = containerRef?.querySelector('video') as HTMLVideoElement;
      if (videoElement && videoElement.readyState >= 1) {
        handleVideoLoaded();
      }
    } else {
      // 이미지의 경우 complete 상태를 체크
      if (imgRef?.complete) {
        handleImageLoad();
      }
    }
  });

  // 비디오 가시성 제어: 화면에서 벗어나면 자동 일시정지(음소거 유지)
  createEffect(() => {
    if (!isVideo()) return;

    const container = containerRef;
    const videoEl = (videoRef ||
      (container?.querySelector('video') as HTMLVideoElement)) as HTMLVideoElement | null;
    if (!container || !videoEl || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (!entry) return;

        if (!entry.isIntersecting) {
          try {
            // 현재 상태 보관
            wasPlayingBeforeHidden = !videoEl.paused;
            wasMutedBeforeHidden = videoEl.muted;
            // 소음 방지를 위해 숨김 시에는 항상 음소거 + 일시정지
            videoEl.muted = true;
            if (!videoEl.paused) videoEl.pause();
          } catch {
            /* ignore */
          }
        } else {
          // 보이는 경우: 이전 상태 복원
          try {
            if (wasMutedBeforeHidden !== null) {
              videoEl.muted = wasMutedBeforeHidden;
            }
            if (wasPlayingBeforeHidden) {
              void videoEl.play?.();
            }
          } catch {
            /* ignore */
          } finally {
            // 플래그 초기화
            wasPlayingBeforeHidden = false;
            wasMutedBeforeHidden = null;
          }
        }
      },
      { threshold: 0.0, rootMargin: '0px' }
    );

    observer.observe(container);

    onCleanup(() => {
      observer.disconnect();
    });
  });

  // 비디오 초기 마운트 시 기본 음소거 설정
  createEffect(() => {
    if (!isVideo()) return;

    const v = videoRef;
    if (v) {
      try {
        if (typeof v.muted === 'boolean') v.muted = true;
      } catch {
        /* noop */
      }
    }
  });

  // 클래스명 생성
  const containerClasses = () =>
    ComponentStandards.createClassName(
      styles.container,
      merged.isActive ? styles.active : undefined,
      merged.isFocused ? styles.focused : undefined,
      merged.className
    );

  const imageClasses = () =>
    ComponentStandards.createClassName(styles.image, getFitModeClass(merged.fitMode));

  // 표준화된 ARIA 속성 생성
  const ariaProps = () => {
    // 위치 정보를 포함한 ARIA 레이블 생성
    const positionInfo = merged.totalCount ? ` (${merged.index + 1} / ${merged.totalCount})` : '';

    return ComponentStandards.createAriaProps({
      'aria-label':
        merged['aria-label'] ||
        `미디어 ${merged.index + 1}${positionInfo}: ${cleanFilename(merged.media.filename)}`,
      'aria-describedby': merged['aria-describedby'],
      'aria-current': merged.isActive ? 'true' : undefined,
      role: merged.role,
      tabIndex: merged.tabIndex,
    } as Record<string, string | number | boolean | undefined>);
  };

  // 표준화된 테스트 속성 생성
  const testProps = () => ComponentStandards.createTestProps(merged['data-testid']);

  // Gallery 마킹 속성 (withGallery HOC 대체)
  const galleryMarkerAttributes = {
    'data-xeg-gallery': 'true',
    'data-xeg-gallery-type': 'item',
    'data-xeg-gallery-version': '2.0',
    'data-xeg-gallery-component': 'vertical-image-item',
    'data-xeg-gallery-role': 'gallery-item',
  };

  return (
    <div
      ref={containerRef}
      class={ComponentStandards.createClassName(containerClasses(), styles.imageWrapper)}
      data-index={merged.index}
      onClick={handleClick}
      onFocus={merged.onFocus as (event: FocusEvent) => void}
      onBlur={merged.onBlur as (event: FocusEvent) => void}
      onKeyDown={merged.onKeyDown as (event: KeyboardEvent) => void}
      {...ariaProps()}
      {...testProps()}
      {...galleryMarkerAttributes}
    >
      {isVisible() && (
        <>
          {!isLoaded() && !isError() && !isVideo() && (
            <div class={styles.placeholder}>
              <div class={styles.loadingSpinner} />
            </div>
          )}

          {/* 비디오 렌더링 */}
          {isVideo() ? (
            <video
              src={merged.media.url}
              autoplay={false}
              controls={true}
              ref={videoRef}
              class={ComponentStandards.createClassName(
                styles.video,
                getFitModeClass(merged.fitMode),
                isLoaded() ? styles.loaded : styles.loading
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
              src={merged.media.url}
              alt={
                cleanFilename(merged.media.filename) ||
                languageService.getFormattedString('messages.gallery.failedToLoadImage', {
                  type: 'image',
                })
              }
              loading='lazy'
              decoding='async'
              class={ComponentStandards.createClassName(
                imageClasses(),
                isLoaded() ? styles.loaded : styles.loading
              )}
              onLoad={handleImageLoad}
              onError={handleImageError}
              onContextMenu={handleImageContextMenu}
              onDragStart={handleImageDragStart}
            />
          )}

          {isError() && (
            <div class={styles.error}>
              <span class={styles.errorIcon}>⚠️</span>
              <span class={styles.errorText}>
                {languageService.getFormattedString('messages.gallery.failedToLoadImage', {
                  type: isVideo() ? 'video' : 'image',
                })}
              </span>
            </div>
          )}
        </>
      )}

      {merged.onDownload && (
        <Button
          variant='ghost'
          size='sm'
          className={styles.downloadButton || ''}
          onClick={handleDownloadClick}
          aria-label={languageService.getString('toolbar.download')}
        >
          <span class={styles.downloadIcon}>⬇️</span>
        </Button>
      )}
    </div>
  );
}
