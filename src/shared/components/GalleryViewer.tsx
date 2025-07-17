/**
 * @fileoverview Gallery Viewer Component
 * @version 2.0.0 - Simplified Gallery Viewer
 *
 * 새로운 signals 기반 갤러리 뷰어 컴포넌트
 * - 기존 VerticalGalleryView 기반
 * - 단순화된 구조
 */

import type { MediaInfo } from '../types/media.types';
import { logger } from '../../infrastructure/logging/logger';
import { getPreactHooks } from '@infrastructure/external/vendors';
import type { VNode } from '@infrastructure/external/vendors';
import styles from './GalleryViewer.module.css';

export interface GalleryViewerProps {
  mediaItems: readonly MediaInfo[];
  currentIndex: number;
  isVisible: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onIndexChange?: (index: number) => void;
}

/**
 * 갤러리 뷰어 컴포넌트
 * 현재는 VerticalGalleryView를 참조하는 단순한 래퍼
 */
export function GalleryViewer({
  mediaItems,
  currentIndex,
  isVisible,
  onClose,
  onNext,
  onPrevious,
  onIndexChange,
}: GalleryViewerProps): VNode {
  const { useState, useCallback, useEffect } = getPreactHooks();
  const [, setIsLoading] = useState(false);

  useEffect(() => {
    logger.debug('[GalleryViewer] 렌더링됨', {
      mediaCount: mediaItems.length,
      currentIndex,
      isVisible,
    });
  }, [mediaItems.length, currentIndex, isVisible]);

  const handleClose = useCallback(
    (event?: Event) => {
      if (event) {
        event.stopPropagation();
      }
      logger.debug('[GalleryViewer] 닫기 요청');
      onClose();
    },
    [onClose]
  );

  const handleNext = useCallback(
    (event?: Event) => {
      if (event) {
        event.stopPropagation();
      }
      if (currentIndex < mediaItems.length - 1) {
        logger.debug('[GalleryViewer] 다음 미디어로 이동');
        onNext();
        if (onIndexChange) {
          onIndexChange(currentIndex + 1);
        }
      }
    },
    [currentIndex, mediaItems.length, onNext, onIndexChange]
  );

  const handlePrevious = useCallback(
    (event?: Event) => {
      if (event) {
        event.stopPropagation();
      }
      if (currentIndex > 0) {
        logger.debug('[GalleryViewer] 이전 미디어로 이동');
        onPrevious();
        if (onIndexChange) {
          onIndexChange(currentIndex - 1);
        }
      }
    },
    [currentIndex, onPrevious, onIndexChange]
  );

  if (!isVisible || !mediaItems.length) {
    return null as unknown as VNode;
  }

  const currentMedia = mediaItems[currentIndex];
  if (!currentMedia) {
    return null as unknown as VNode;
  }

  return (
    <div className={`${styles.container} ${isVisible ? styles.visible : ''}`}>
      {' '}
      <div
        className={styles.overlay}
        onClick={handleClose}
        onKeyDown={e => {
          if (e.key === 'Escape') {
            handleClose();
          }
        }}
        role='button'
        tabIndex={0}
        aria-label='갤러리 닫기'
      />
      <div className={styles.content}>
        {/* Media Display */}
        <div className={styles.mediaContainer}>
          {currentMedia.type === 'image' ? (
            <img
              src={currentMedia.url}
              alt={currentMedia.alt ?? '이미지'}
              className={styles.media}
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            />
          ) : (
            <video
              src={currentMedia.url}
              controls
              className={styles.media}
              onLoadedData={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            />
          )}
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={styles.navButton}
          >
            이전
          </button>

          <span className={styles.counter}>
            {currentIndex + 1} / {mediaItems.length}
          </span>

          <button
            onClick={handleNext}
            disabled={currentIndex === mediaItems.length - 1}
            className={styles.navButton}
          >
            다음
          </button>

          <button onClick={handleClose} className={styles.closeButton}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
