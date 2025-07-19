/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Gallery Content Component
 * VerticalGalleryView에서 분리된 메인 콘텐츠 영역
 */

import type { MediaInfo } from '@core/types/media.types';
import type { ImageFitMode } from '@shared/types/image-fit.types';
import { getPreactHooks } from '@core/external/vendors';
import styles from '../VerticalGalleryView.module.css';
import { VerticalImageItem } from '../VerticalImageItem';

export interface GalleryContentProps {
  mediaItems: readonly MediaInfo[];
  currentIndex: number;
  imageFitMode: ImageFitMode;
  onImageLoad?: (index: number) => void;
  className?: string;
}

export function GalleryContent({
  mediaItems,
  currentIndex,
  imageFitMode,
  onImageLoad,
  className = '',
}: GalleryContentProps) {
  const { useMemo } = getPreactHooks();

  // 메모이제이션: 현재 미디어 아이템
  const currentMediaItem = useMemo(() => {
    return mediaItems[currentIndex] || null;
  }, [mediaItems, currentIndex]);

  // 메모이제이션: 미디어 아이템들
  const renderableItems = useMemo(() => {
    return mediaItems.map((mediaItem, index) => ({
      mediaItem,
      index,
      isActive: index === currentIndex,
    }));
  }, [mediaItems, currentIndex]);

  if (!currentMediaItem) {
    return (
      <div className={`${styles.galleryContent} ${styles.emptyContent} ${className}`}>
        <div className={styles.emptyMessage}>표시할 미디어가 없습니다.</div>
      </div>
    );
  }

  return (
    <div className={`${styles.galleryContent} ${className}`}>
      <div className={styles.mediaContainer}>
        {renderableItems.map(({ mediaItem, index, isActive }) => (
          <div
            key={`${mediaItem.id}_${index}`}
            className={`${styles.mediaItem} ${isActive ? styles.active : styles.inactive}`}
            style={{
              display: isActive ? 'block' : 'none',
              // 성능 최적화: 비활성 항목은 DOM에서 완전히 숨김
            }}
          >
            <VerticalImageItem
              media={mediaItem}
              index={index}
              isActive={isActive}
              onClick={() => onImageLoad?.(index)}
              fitMode={imageFitMode}
              isVisible={true}
              onLoad={() => {}}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
