/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Gallery Header Component
 * VerticalGalleryView에서 분리된 헤더 영역
 */

import { Button } from '@shared/components/ui/Button/Button';
import { getPreactHooks } from '@infrastructure/external/vendors';
import { stringWithDefault } from '@core/utils/type-safety-helpers';
import styles from '../VerticalGalleryView.module.css';

export interface GalleryHeaderProps {
  currentIndex: number;
  totalItems: number;
  onClose?: () => void;
  className?: string;
}

export function GalleryHeader({
  currentIndex,
  totalItems,
  onClose,
  className = '',
}: GalleryHeaderProps) {
  const { useMemo } = getPreactHooks();

  // 메모이제이션: 헤더 정보 텍스트
  const headerInfo = useMemo(() => {
    if (totalItems === 0) return '미디어 없음';
    return `${currentIndex + 1} / ${totalItems}`;
  }, [currentIndex, totalItems]);

  return (
    <div className={`${styles.galleryHeader} ${className}`}>
      <div className={styles.headerInfo}>
        <span className={styles.mediaCounter}>{headerInfo}</span>
      </div>

      <div className={styles.headerControls}>
        {onClose && (
          <Button
            variant='ghost'
            size='sm'
            onClick={onClose}
            className={stringWithDefault(styles.closeButton, '')}
            aria-label='갤러리 닫기'
          >
            ✕
          </Button>
        )}
      </div>
    </div>
  );
}
