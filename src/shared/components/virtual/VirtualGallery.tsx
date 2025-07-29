/**
 * VirtualGallery Component
 *
 * High-performance virtual scrolling gallery component for large media lists.
 * Uses TanStack Virtual for efficient rendering with fallback compatibility.
 */

import { getPreact, getPreactHooks } from '@shared/external/vendors';
import type { MediaItem } from '@shared/types';

// Preact ComponentChildren 타입 정의 (any 대신 구체적 유니온 타입 사용)
type ComponentChildren = string | number | boolean | null | undefined | object;

export interface VirtualGalleryProps {
  mediaItems: MediaItem[];
  itemHeight: number;
  containerHeight?: number;
  onItemClick?: (item: MediaItem, index: number) => void;
  renderItem?: (item: MediaItem, index: number) => ComponentChildren;
  className?: string;
  // 성능 최적화 옵션
  overscan?: number; // 뷰포트 외부에 미리 렌더링할 아이템 수
  enableVirtualization?: boolean; // 가상화 강제 활성화
}

/**
 * VirtualGallery component with TanStack Virtual integration
 *
 * @param props - VirtualGallery properties
 * @returns Preact VNode or fallback HTML string
 */
export function VirtualGallery(props: VirtualGalleryProps) {
  const {
    mediaItems = [],
    itemHeight,
    containerHeight = 400,
    onItemClick,
    renderItem,
    className = '',
    overscan = 5,
    enableVirtualization = false,
  } = props;

  // Safe handling for invalid props
  if (!Array.isArray(mediaItems) || itemHeight <= 0) {
    return createFallbackContent('Invalid props provided');
  }

  // Empty list handling
  if (mediaItems.length === 0) {
    return createFallbackContent('No media items');
  }

  // 가상화 임계값: 50개 이상 또는 강제 활성화
  const shouldUseVirtualization = mediaItems.length >= 50 || enableVirtualization;

  // For small lists (< 50 items and not forced), use simple rendering
  if (!shouldUseVirtualization) {
    return createSimpleList(mediaItems, itemHeight, onItemClick, renderItem, className);
  }

  // For larger lists, use virtual scrolling
  return createVirtualizedList(
    mediaItems,
    itemHeight,
    containerHeight,
    onItemClick,
    renderItem,
    className,
    overscan
  );
}

/**
 * Create virtualized list using manual virtual scrolling
 * (TanStack Virtual is React-specific, so we implement core functionality)
 */
function createVirtualizedList(
  items: MediaItem[],
  itemHeight: number,
  containerHeight: number,
  onItemClick?: (item: MediaItem, index: number) => void,
  renderItem?: (item: MediaItem, index: number) => ComponentChildren,
  className = '',
  overscan = 5
) {
  try {
    const { h } = getPreact();

    // Manual virtual scrolling implementation
    const componentProps: {
      items: MediaItem[];
      itemHeight: number;
      containerHeight: number;
      className: string;
      overscan: number;
      onItemClick?: (item: MediaItem, index: number) => void;
      renderItem?: (item: MediaItem, index: number) => ComponentChildren;
    } = {
      items,
      itemHeight,
      containerHeight,
      className,
      overscan,
    };

    if (onItemClick) {
      componentProps.onItemClick = onItemClick;
    }

    if (renderItem) {
      componentProps.renderItem = renderItem;
    }

    return h(ManualVirtualizedComponent, componentProps);
  } catch (error) {
    console.warn('[VirtualGallery] Virtualization failed, using fallback:', error);
    return createFallbackList(
      items,
      itemHeight,
      containerHeight,
      onItemClick,
      renderItem,
      className
    );
  }
}

/**
 * Manual Virtualized List Component
 */
function ManualVirtualizedComponent(props: {
  items: MediaItem[];
  itemHeight: number;
  containerHeight: number;
  onItemClick?: (item: MediaItem, index: number) => void;
  renderItem?: (item: MediaItem, index: number) => ComponentChildren;
  className: string;
  overscan: number;
}) {
  const { h } = getPreact();
  const { useRef, useState, useEffect } = getPreactHooks();
  const { items, itemHeight, containerHeight, onItemClick, renderItem, className, overscan } =
    props;

  const containerRef = useRef<HTMLElement>();
  const [scrollTop, setScrollTop] = useState(0);

  // 스크롤 이벤트 핸들러
  const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement;
    setScrollTop(target.scrollTop);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 가상화 계산
  const totalHeight = items.length * itemHeight;
  const visibleItemsCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length - 1, startIndex + visibleItemsCount + overscan * 2);
  const visibleItems = items.slice(startIndex, endIndex + 1);

  return h(
    'div',
    {
      ref: containerRef,
      className: `virtual-gallery virtualized ${className}`,
      style: {
        height: `${containerHeight}px`,
        overflow: 'auto',
      },
      'data-total-items': items.length,
      'data-visible-items': `${startIndex}-${endIndex}`,
    },
    h(
      'div',
      {
        className: 'virtual-gallery-spacer',
        style: {
          height: `${totalHeight}px`,
          position: 'relative',
        },
      },
      visibleItems.map((item, index) => {
        const actualIndex = startIndex + index;
        const offsetY = actualIndex * itemHeight;

        return h(
          'div',
          {
            key: item.id || actualIndex,
            className: 'virtual-gallery-item',
            style: {
              position: 'absolute',
              top: `${offsetY}px`,
              width: '100%',
              height: `${itemHeight}px`,
            },
            onClick: onItemClick ? () => onItemClick(item, actualIndex) : undefined,
          },
          renderItem ? renderItem(item, actualIndex) : defaultItemRenderer(item, actualIndex)
        );
      })
    )
  );
}

/**
 * Create fallback list for virtualization failures
 */
function createFallbackList(
  items: MediaItem[],
  itemHeight: number,
  containerHeight: number,
  onItemClick?: (item: MediaItem, index: number) => void,
  renderItem?: (item: MediaItem, index: number) => ComponentChildren,
  className = ''
) {
  try {
    const { h } = getPreact();

    return h(
      'div',
      {
        className: `virtual-gallery fallback ${className}`,
        style: { height: `${containerHeight}px`, overflow: 'auto' },
      },
      items.map((item, index) =>
        h(
          'div',
          {
            key: item.id || index,
            className: 'virtual-gallery-item',
            style: { height: `${itemHeight}px` },
            onClick: onItemClick ? () => onItemClick(item, index) : undefined,
          },
          renderItem ? renderItem(item, index) : defaultItemRenderer(item, index)
        )
      )
    );
  } catch (error) {
    console.warn('[VirtualGallery] Fallback rendering failed:', error);
    return createFallbackContent('Rendering failed');
  }
}

/**
 * Create fallback content for error cases
 */
function createFallbackContent(message: string): string {
  return `<div class="virtual-gallery-fallback">
    <p>Virtual Gallery: ${message}</p>
  </div>`;
}

/**
 * Create simple list for small item counts (< 50 items)
 */
function createSimpleList(
  items: MediaItem[],
  itemHeight: number,
  onItemClick?: (item: MediaItem, index: number) => void,
  renderItem?: (item: MediaItem, index: number) => ComponentChildren,
  className = ''
) {
  try {
    const { h } = getPreact();

    return h(
      'div',
      {
        className: `virtual-gallery simple ${className}`,
        'data-items-count': items.length,
      },
      items.map((item, index) =>
        h(
          'div',
          {
            key: item.id || index,
            className: 'virtual-gallery-item',
            style: { height: `${itemHeight}px` },
            onClick: onItemClick ? () => onItemClick(item, index) : undefined,
          },
          renderItem ? renderItem(item, index) : defaultItemRenderer(item, index)
        )
      )
    );
  } catch (error) {
    console.warn('[VirtualGallery] Simple list rendering failed:', error);
    return createFallbackContent('Simple rendering failed');
  }
}

/**
 * Default item renderer
 */
function defaultItemRenderer(item: MediaItem, index: number) {
  const { h } = getPreact();

  return h(
    'div',
    { className: 'virtual-gallery-item-content' },
    h('span', {}, `Item ${index}: ${item.id || 'Unknown'}`)
  );
}

export default VirtualGallery;
