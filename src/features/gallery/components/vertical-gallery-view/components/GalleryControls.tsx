/**
 * @fileoverview Gallery Controls Component
 * @description 갤러리 제어 버튼들을 담당하는 컴포넌트
 */

import { Button } from '@shared/components/ui/Button/Button';
import type { VNode } from '@shared/types/global.types';
import { stringWithDefault } from '../../../../../infrastructure/utils/type-safety-helpers';
import { getPreactHooks } from '@infrastructure/external/vendors';
import styles from '../VerticalGalleryView.module.css';

export interface GalleryControlsProps {
  currentIndex: number;
  totalItems: number;
  isDownloading: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  onDownloadCurrent?: () => void;
  onDownloadAll?: () => void;
  onClose?: () => void;
}

export function GalleryControls({
  currentIndex,
  totalItems,
  isDownloading,
  onPrevious,
  onNext,
  onDownloadCurrent,
  onDownloadAll,
  onClose,
}: GalleryControlsProps): VNode | null {
  const { useMemo } = getPreactHooks();

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < totalItems - 1;

  const navigationInfo = useMemo(
    () => `${currentIndex + 1} / ${totalItems}`,
    [currentIndex, totalItems]
  );

  return (
    <div className={styles.controls}>
      {/* 네비게이션 버튼들 */}
      <div className={styles.navigationButtons}>
        <Button
          onClick={onPrevious}
          disabled={!hasPrevious || isDownloading}
          className={stringWithDefault(styles.navButton, '')}
          aria-label='이전 미디어'
        >
          ←
        </Button>

        <span className={styles.navigationInfo}>{navigationInfo}</span>

        <Button
          onClick={onNext}
          disabled={!hasNext || isDownloading}
          className={stringWithDefault(styles.navButton, '')}
          aria-label='다음 미디어'
        >
          →
        </Button>
      </div>

      {/* 다운로드 버튼들 */}
      <div className={styles.downloadButtons}>
        <Button
          onClick={onDownloadCurrent}
          disabled={isDownloading}
          className={stringWithDefault(styles.downloadButton, '')}
          aria-label='현재 미디어 다운로드'
        >
          {isDownloading ? '다운로드 중...' : '현재 다운로드'}
        </Button>

        <Button
          onClick={onDownloadAll}
          disabled={isDownloading || totalItems === 0}
          className={stringWithDefault(styles.downloadAllButton, '')}
          aria-label='모든 미디어 다운로드'
        >
          모두 다운로드 ({totalItems}개)
        </Button>
      </div>

      {/* 닫기 버튼 */}
      <Button
        onClick={onClose}
        className={stringWithDefault(styles.closeButton, '')}
        aria-label='갤러리 닫기'
      >
        ✕
      </Button>
    </div>
  ) as unknown as VNode;
}
