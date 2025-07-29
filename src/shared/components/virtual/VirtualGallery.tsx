/**
 * TanStack Virtual을 활용한 가상화 갤러리 컴포넌트
 *
 * @description 대용량 미디어 리스트의 성능을 최적화하여 수백 개의 아이템도 부드럽게 스크롤
 */

import { getPreact, getPreactHooks, getTanStackVirtual } from '@shared/external/vendors';
import { logger } from '@shared/logging';
import type { MediaItem } from '@shared/types/core/media.types';

export interface VirtualGalleryProps {
  mediaItems: MediaItem[];
  itemHeight?: number;
  containerHeight?: number;
  onItemClick?: (item: MediaItem, index: number) => void;
  renderItem?: (item: MediaItem, index: number) => unknown;
  className?: string;
}

/**
 * TanStack Virtual을 사용한 가상화 갤러리 컴포넌트
 */
export function VirtualGallery({
  mediaItems,
  itemHeight = 120,
  containerHeight = 400,
  onItemClick,
  renderItem,
  className = '',
}: VirtualGalleryProps): unknown {
  try {
    const preact = getPreact();
    const preactHooks = getPreactHooks();
    const { h } = preact;
    const { useRef } = preactHooks;

    const parentRef = useRef<HTMLDivElement>(null);

    // TanStack Virtual 사용 시도
    const virtual = getTanStackVirtual();
    if (virtual?.useVirtualizer) {
      try {
        const virtualizer = virtual.useVirtualizer({
          count: mediaItems.length,
          getScrollElement: () => parentRef.current,
          estimateSize: () => itemHeight,
          overscan: 5,
        });

        const defaultRenderItem = (item: MediaItem, index: number) => {
          return h(
            'div',
            {
              key: `${item.type}-${index}`,
              className: 'virtual-gallery-item',
              style: {
                padding: '8px',
                border: '1px solid #e1e8ed',
                borderRadius: '8px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              },
              onClick: () => onItemClick?.(item, index),
            },
            [
              h('div', { style: { fontWeight: 'bold', marginBottom: '4px' } }, item.type),
              h(
                'div',
                { style: { fontSize: '12px', color: '#657786' } },
                (item as MediaItem & { url?: string }).url
                  ? `${(item as MediaItem & { url?: string }).url!.substring(0, 50)}...`
                  : 'No source'
              ),
            ]
          );
        };

        const items = virtualizer.getVirtualItems();

        return h(
          'div',
          {
            ref: parentRef,
            className: `virtual-gallery ${className}`,
            style: {
              height: `${containerHeight}px`,
              overflow: 'auto',
              border: '1px solid #e1e8ed',
              borderRadius: '8px',
            },
          },
          [
            h(
              'div',
              {
                style: {
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                },
              },
              items.map(virtualItem => {
                const item = mediaItems[virtualItem.index];
                if (!item) return null;

                const renderer = renderItem || defaultRenderItem;

                return h(
                  'div',
                  {
                    key: String(virtualItem.key),
                    style: {
                      position: 'absolute',
                      top: `${virtualItem.start}px`,
                      left: '0',
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(0px)`,
                    },
                  },
                  renderer(item, virtualItem.index) as string | null
                );
              })
            ),
          ]
        );
      } catch (virtualError) {
        logger.warn('VirtualGallery', 'TanStack Virtual error, falling back:', virtualError);
      }
    }

    // 폴백: TanStack Virtual이 없는 경우 기본 렌더링
    logger.warn('VirtualGallery', 'TanStack Virtual not available, using fallback rendering');

    const defaultRenderItem = (item: MediaItem, index: number) => {
      return h(
        'div',
        {
          key: `${item.type}-${index}`,
          className: 'virtual-gallery-item',
          style: {
            padding: '8px',
            margin: '4px 0',
            border: '1px solid #e1e8ed',
            borderRadius: '8px',
            backgroundColor: '#fff',
            cursor: 'pointer',
          },
          onClick: () => onItemClick?.(item, index),
        },
        [
          h('div', { style: { fontWeight: 'bold' } }, item.type),
          h(
            'div',
            { style: { fontSize: '12px', color: '#657786' } },
            (item as MediaItem & { url?: string }).url
              ? `${(item as MediaItem & { url?: string }).url!.substring(0, 50)}...`
              : 'No source'
          ),
        ]
      );
    };

    return h(
      'div',
      {
        className: `virtual-gallery-fallback ${className}`,
        style: {
          height: `${containerHeight}px`,
          overflow: 'auto',
          border: '1px solid #e1e8ed',
          borderRadius: '8px',
          padding: '8px',
        },
      },
      mediaItems.map((item, index) => {
        const renderer = renderItem || defaultRenderItem;
        return renderer(item, index);
      })
    );
  } catch (error) {
    logger.error('VirtualGallery', 'Error in virtual gallery:', error);

    // 최종 폴백: 에러 발생 시 간단한 메시지
    const { h } = getPreact();
    return h(
      'div',
      {
        className: `virtual-gallery-error ${className}`,
        style: {
          padding: '20px',
          textAlign: 'center',
          color: '#657786',
        },
      },
      'Virtual gallery temporarily unavailable'
    );
  }
}

/**
 * 메모이제이션된 VirtualGallery 컴포넌트
 */
export function MemoizedVirtualGallery(props: VirtualGalleryProps): unknown {
  // 현재 memo가 사용 불가능하므로 일반 컴포넌트 반환
  logger.debug('MemoizedVirtualGallery', 'Using regular component (memo not available)');
  return VirtualGallery(props);
}
