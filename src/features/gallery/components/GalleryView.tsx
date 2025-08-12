import { getPreactHooks } from '@shared/external/vendors';
import { MediaItem } from '@shared/types';
import { SIZE_CONSTANTS, PERCENTAGE } from '@/constants';
import styles from './GalleryView.module.css';

export type GalleryLayout = 'vertical' | 'horizontal';

export interface GalleryViewProps {
  mediaItems: MediaItem[];
  currentIndex: number;
  layout: GalleryLayout;
  onClose: () => void;
  onMediaSelect: (index: number) => void;
  showToolbar?: boolean;
  enableVirtualization?: boolean;
  className?: string;
}

export function GalleryView({
  mediaItems,
  currentIndex,
  layout,
  onClose,
  onMediaSelect,
  showToolbar = true,
  enableVirtualization = true,
  className,
}: GalleryViewProps) {
  const { useMemo } = getPreactHooks();

  // 가상화 로직
  const visibleItems = useMemo(() => {
    if (!enableVirtualization || mediaItems.length <= PERCENTAGE.HALF) {
      return mediaItems;
    }

    // 현재 인덱스 주변의 아이템들만 렌더링
    const start = Math.max(0, currentIndex - SIZE_CONSTANTS.FIVE);
    const end = Math.min(mediaItems.length, currentIndex + SIZE_CONSTANTS.SIX);
    return mediaItems.slice(start, end);
  }, [mediaItems, currentIndex, enableVirtualization]);

  const containerClasses = [styles.container, styles[layout], className].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} data-testid='gallery-view' data-layout={layout}>
      {/* 닫기 버튼 */}
      <button className={styles.closeButton} onClick={onClose} aria-label='Close Gallery'>
        Close
      </button>

      {/* 툴바 */}
      {showToolbar && (
        <div className={styles.toolbar}>
          <span className={styles.counter}>
            {currentIndex + 1} / {mediaItems.length}
          </span>
        </div>
      )}

      {/* 미디어 아이템 컨테이너 */}
      <div className={styles.mediaContainer}>
        {visibleItems.map((item, index) => {
          const actualIndex =
            enableVirtualization && mediaItems.length > PERCENTAGE.HALF
              ? Math.max(0, currentIndex - SIZE_CONSTANTS.FIVE) + index
              : index;

          return (
            <div
              key={item.id || actualIndex}
              className={styles.mediaItem}
              data-testid={`media-${actualIndex + 1}`}
              onClick={() => onMediaSelect(actualIndex)}
            >
              {item.type === 'image' && (
                <img
                  src={item.url}
                  alt={item.alt || `Media ${actualIndex + 1}`}
                  className={styles.media}
                />
              )}
              {item.type === 'video' && <video src={item.url} className={styles.media} controls />}
            </div>
          );
        })}
      </div>

      {/* 빈 상태 메시지 */}
      {mediaItems.length === 0 && (
        <div className={styles.emptyState}>No media items to display</div>
      )}
    </div>
  );
}
