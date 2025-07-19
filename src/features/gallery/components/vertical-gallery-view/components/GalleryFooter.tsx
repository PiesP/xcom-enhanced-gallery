/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Gallery Footer Component
 * VerticalGalleryView에서 분리된 푸터 영역
 */

import type { MediaInfo } from '@core/types/media.types';
import { getPreactHooks } from '@core/external/vendors';
import styles from '../VerticalGalleryView.module.css';

export interface GalleryFooterProps {
  currentMediaItem?: MediaInfo;
  className?: string;
}

export function GalleryFooter({ currentMediaItem, className = '' }: GalleryFooterProps) {
  const { useMemo } = getPreactHooks();

  // 메모이제이션: 미디어 정보 텍스트
  const mediaInfo = useMemo(() => {
    if (!currentMediaItem) return null;

    return {
      filename: currentMediaItem.filename ?? '제목 없음',
      type: currentMediaItem.type,
      dimensions:
        currentMediaItem.width && currentMediaItem.height
          ? `${currentMediaItem.width} × ${currentMediaItem.height}`
          : null,
    };
  }, [currentMediaItem]);

  if (!mediaInfo) {
    return null;
  }

  return (
    <div className={`${styles.galleryFooter} ${className}`}>
      <div className={styles.mediaInfo}>
        <div className={styles.mediaFilename} title={mediaInfo.filename}>
          {mediaInfo.filename}
        </div>

        <div className={styles.mediaDetails}>
          <span className={styles.mediaType}>{mediaInfo.type}</span>
          {mediaInfo.dimensions && (
            <>
              <span className={styles.separator}>•</span>
              <span className={styles.mediaDimensions}>{mediaInfo.dimensions}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
