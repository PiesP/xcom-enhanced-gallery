/**
 * Enhanced Gallery Component
 * @version 3.0.0 - Modern Gallery with State Management
 */

import { getPreactHooks, getPreactSignals } from '@core/external/vendors';
import { Button } from '../../../shared/components/ui/Button/Button';
import {
  useKeyboardNavigation,
  useFocusTrap,
  useLiveRegion,
} from '../../../shared/hooks/useAccessibility';
import {
  isGalleryOpen,
  currentMediaItems,
  currentIndex,
  currentMediaItem,
  hasMultipleItems,
  closeGallery,
  navigateNext,
  navigatePrevious,
  navigateToIndex,
} from '../../../core/state/galleryState';
import { MediaItem } from '../../../shared/types/common';
import styles from './Gallery.module.css';
import { IsolatedGalleryRoot } from '@shared/components/isolation/IsolatedGalleryRoot';

interface GalleryProps {
  onDownload?: (item: MediaItem) => void;
}

export function Gallery({ onDownload }: GalleryProps) {
  const { useEffect } = getPreactHooks();
  const signals = getPreactSignals();

  const containerRef = useFocusTrap(isGalleryOpen.value);
  const announcement = signals.signal('');

  useKeyboardNavigation({
    onEscape: closeGallery,
  });

  // 스크린 리더 알림
  const announce = useLiveRegion();

  // 알림 메시지가 변경될 때 스크린 리더에 알림
  useEffect(() => {
    if (announcement.value) {
      announce(announcement.value);
    }
  }, [announcement.value, announce]);

  if (!isGalleryOpen.value) return null;

  const items = currentMediaItems.value;
  const activeIndex = currentIndex.value;
  const currentItem = currentMediaItem.value;

  if (!currentItem) return null;

  return (
    <IsolatedGalleryRoot
      onKeyDown={(event: KeyboardEvent) => {
        // 갤러리 키보드 동작은 useGalleryKeyboard 훅에서 처리됨 (Esc 키만)
        if (event.key === 'Escape') {
          event.preventDefault();
          closeGallery();
        }
      }}
      data-testid='gallery-isolated-root'
    >
      <div className={styles.overlay} onClick={closeGallery}>
        <div
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={containerRef as any}
          className={styles.container}
          onClick={e => e.stopPropagation()}
          role='dialog'
          aria-label='미디어 갤러리'
          aria-modal='true'
        >
          {/* Header */}
          <header className={styles.header}>
            <div className={styles.counter}>
              {activeIndex + 1} / {items.length}
            </div>
            <div className={styles.actions}>
              {onDownload && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    onDownload(currentItem);
                    announcement.value = `${currentItem.title || '미디어'} 다운로드 시작`;
                  }}
                  aria-label='현재 미디어 다운로드'
                >
                  다운로드
                </Button>
              )}
              <Button variant='ghost' size='sm' onClick={closeGallery} aria-label='갤러리 닫기'>
                ✕
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className={styles.content}>
            {hasMultipleItems.value && (
              <Button
                variant='ghost'
                className={styles.navButton || ''}
                onClick={() => {
                  navigatePrevious();
                  announcement.value = `미디어 ${currentIndex.value + 1} / ${items.length}`;
                }}
                aria-label='이전 미디어'
              >
                ‹
              </Button>
            )}

            <div className={styles.mediaContainer}>
              {currentItem.type === 'image' ? (
                <img
                  src={currentItem.url}
                  alt={currentItem.title || `미디어 ${activeIndex + 1}`}
                  className={styles.media}
                  loading='lazy'
                />
              ) : (
                <video
                  src={currentItem.url}
                  className={styles.media}
                  controls
                  preload='metadata'
                  aria-label={currentItem.title || `비디오 ${activeIndex + 1}`}
                />
              )}
            </div>

            {hasMultipleItems.value && (
              <Button
                variant='ghost'
                className={styles.navButton || ''}
                onClick={() => {
                  navigateNext();
                  announcement.value = `미디어 ${currentIndex.value + 1} / ${items.length}`;
                }}
                aria-label='다음 미디어'
              >
                ›
              </Button>
            )}
          </main>

          {/* Thumbnails */}
          {hasMultipleItems.value && (
            <footer className={styles.thumbnails}>
              {items.map((item, index) => (
                <button
                  key={item.id}
                  className={`xeg-focus-ring ${styles.thumbnail} ${index === activeIndex ? styles.active : ''}`}
                  onClick={() => {
                    navigateToIndex(index);
                    announcement.value = `미디어 ${index + 1} / ${items.length}로 이동`;
                  }}
                  aria-label={`미디어 ${index + 1}로 이동`}
                >
                  <img src={item.thumbnail || item.url} alt='' loading='lazy' />
                </button>
              ))}
            </footer>
          )}
        </div>
      </div>
    </IsolatedGalleryRoot>
  );
}
