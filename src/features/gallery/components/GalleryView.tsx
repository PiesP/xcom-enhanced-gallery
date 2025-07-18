/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview 통합 갤러리 뷰 컴포넌트
 * @description 기존 VerticalGalleryView를 단순화하고 통합한 새로운 갤러리 컴포넌트
 * @version 1.0.0 - 통합 갤러리 뷰
 */

import type { MediaInfo } from '../../../core/types';
import type { VNode } from '../../../shared/types/global.types';
import { Button } from '../../../shared/components/ui/Button/Button';
import { getPreactHooks } from '@infrastructure/external/vendors';
import { logger } from '@infrastructure/logging';
import styles from './GalleryView.module.css';

export interface GalleryViewProps {
  mediaItems: readonly MediaInfo[];
  currentIndex: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onDownloadCurrent: () => void;
  onDownloadAll: () => void;
  isDownloading?: boolean;
}

/**
 * 갤러리 뷰 컴포넌트
 *
 * 주요 특징:
 * - 단일 책임 원칙 준수
 * - 성능 최적화와 메모리 관리
 * - 접근성 향상
 */
export function GalleryView({
  mediaItems,
  currentIndex,
  onClose,
  onPrevious,
  onNext,
  onDownloadCurrent,
  onDownloadAll,
  isDownloading = false,
}: GalleryViewProps): VNode | null {
  const { useCallback, useEffect, useRef, useState } = getPreactHooks();

  logger.debug('🎨 GalleryView: 렌더링 시작', {
    mediaCount: mediaItems.length,
    currentIndex,
    isDownloading,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const toolbarTimeoutRef = useRef<number | null>(null);

  // 툴바 가시성 상태
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);

  // 툴바 표시
  const showToolbar = useCallback(() => {
    setIsToolbarVisible(true);
    if (toolbarTimeoutRef.current) {
      clearTimeout(toolbarTimeoutRef.current);
      toolbarTimeoutRef.current = null;
    }
  }, []);

  // 툴바 숨김 (3초 후)
  const hideToolbar = useCallback(() => {
    if (toolbarTimeoutRef.current) {
      clearTimeout(toolbarTimeoutRef.current);
    }
    toolbarTimeoutRef.current = window.setTimeout(() => {
      setIsToolbarVisible(false);
    }, 3000);
  }, []);

  // 키보드 이벤트 처리
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
        case ' ':
          event.preventDefault();
          setIsToolbarVisible((prev: boolean) => !prev);
          break;
        default:
          break;
      }
    },
    [onClose, onPrevious, onNext, currentIndex, mediaItems.length]
  );

  // 현재 미디어 아이템
  const currentMediaItem = mediaItems[currentIndex] || null;
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < mediaItems.length - 1;

  // 마우스 이동 시 툴바 표시
  const handleMouseMove = useCallback(() => {
    showToolbar();
  }, [showToolbar]);

  // 컨테이너 클릭 시 갤러리 닫기
  const handleContainerClick = useCallback(
    (event: MouseEvent) => {
      if (event.target === containerRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  // 이벤트 리스너 설정
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('click', handleContainerClick);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('click', handleContainerClick);
      }
      if (toolbarTimeoutRef.current) {
        clearTimeout(toolbarTimeoutRef.current);
      }
    };
  }, [handleKeyDown, handleMouseMove, handleContainerClick]);

  // 빈 상태 처리
  if (!currentMediaItem) {
    return (
      <div className={styles.container} ref={containerRef}>
        <div className={styles.emptyState}>
          <h3>미디어를 찾을 수 없습니다</h3>
          <p>표시할 미디어가 없습니다.</p>
          <Button onClick={onClose} variant='primary' className='xeg-button xeg-button--primary'>
            닫기
          </Button>
        </div>
      </div>
    ) as unknown as VNode;
  }

  return (
    <div ref={containerRef} className={styles.container} data-testid='gallery-view'>
      {/* 통합된 툴바 */}
      <div
        className={`${styles.toolbar} ${isToolbarVisible ? styles.toolbarVisible : styles.toolbarHidden}`}
        data-testid='gallery-toolbar'
        onMouseEnter={showToolbar}
        onMouseLeave={() => {
          hideToolbar();
        }}
      >
        {/* 왼쪽 섹션: 네비게이션 */}
        <div className={styles.toolbarSection}>
          <Button
            variant='ghost'
            size='sm'
            onClick={onPrevious}
            disabled={!canGoPrevious || isDownloading}
            aria-label='이전 미디어'
            className='xeg-button xeg-button--ghost navButton'
          >
            ←
          </Button>

          <div className={styles.counter}>
            {currentIndex + 1} / {mediaItems.length}
          </div>

          <Button
            variant='ghost'
            size='sm'
            onClick={onNext}
            disabled={!canGoNext || isDownloading}
            aria-label='다음 미디어'
            className='xeg-button xeg-button--ghost navButton'
          >
            →
          </Button>
        </div>

        {/* 오른쪽 섹션: 액션 버튼들 */}
        <div className={styles.toolbarSection}>
          <Button
            variant='primary'
            size='sm'
            onClick={onDownloadCurrent}
            disabled={isDownloading}
            aria-label='현재 미디어 다운로드'
            className='xeg-button xeg-button--primary downloadCurrent'
          >
            {isDownloading ? '다운로드 중...' : '다운로드'}
          </Button>

          {mediaItems.length > 1 && (
            <Button
              variant='secondary'
              size='sm'
              onClick={onDownloadAll}
              disabled={isDownloading}
              aria-label='모든 미디어 다운로드'
              className='xeg-button xeg-button--secondary downloadAllButton'
            >
              전체 다운로드
            </Button>
          )}

          <Button
            variant='ghost'
            size='sm'
            onClick={onClose}
            aria-label='갤러리 닫기'
            className='xeg-button xeg-button--ghost closeButton'
          >
            ✕
          </Button>
        </div>
      </div>

      {/* 미디어 콘텐츠 */}
      <div className={styles.content}>
        <div className={styles.mediaContainer}>
          {currentMediaItem.type === 'image' ? (
            <img
              src={currentMediaItem.url}
              alt={currentMediaItem.alt || currentMediaItem.filename || '이미지'}
              className={`${styles.media} ${styles.image}`}
              loading='eager'
              onLoad={() => {
                logger.debug('🎨 GalleryView: 이미지 로드 완료');
              }}
              onError={() => {
                logger.warn('🎨 GalleryView: 이미지 로드 실패');
              }}
            />
          ) : currentMediaItem.type === 'video' ? (
            <video
              src={currentMediaItem.url}
              className={`${styles.media} ${styles.video}`}
              controls
              autoPlay
              muted
              playsInline
              onLoadedData={() => {
                logger.debug('🎨 GalleryView: 비디오 로드 완료');
              }}
              onError={() => {
                logger.warn('🎨 GalleryView: 비디오 로드 실패');
              }}
            />
          ) : (
            <div className={styles.unsupportedMedia}>
              <p>지원하지 않는 미디어 형식입니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* 로딩 상태 표시 */}
      {isDownloading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner} />
          <p>다운로드 중...</p>
        </div>
      )}
    </div>
  ) as unknown as VNode;
}

export default GalleryView;
