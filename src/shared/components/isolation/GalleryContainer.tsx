/**
 * @fileoverview 갤러리 컨테이너
 * @description Light DOM 기반 갤러리 컨테이너 (Cascade Layers로 스타일 격리)
 */

import { getPreact, getPreactHooks } from '../../external/vendors';
import type { ComponentChildren } from '../../external/vendors';
import { logger } from '../../logging';
import { EventManager } from '../../services/EventManager';

/**
 * 갤러리 컨테이너 Props
 */
export interface GalleryContainerProps {
  /** 자식 컴포넌트 */
  children: ComponentChildren;
  /** 갤러리 닫기 콜백 */
  onClose?: () => void;
  /** CSS 클래스명 */
  className?: string;
}

/**
 * 갤러리 마운트 함수 - Light DOM 전용
 * @param container - 마운트할 DOM 컨테이너
 * @param element - 렌더링할 Preact 요소
 */
export function mountGallery(container: Element, element: unknown): Element {
  const preact = getPreact();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    preact.render(element as any, container);
    logger.debug('Gallery mounted with Light DOM (Cascade Layers for style isolation)');
    return container;
  } catch (error) {
    logger.error('Failed to mount gallery:', error);
    throw error;
  }
}

/**
 * 갤러리 언마운트 함수
 * @param container - 언마운트할 DOM 컨테이너
 */
export function unmountGallery(container: Element): void {
  const preact = getPreact();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    preact.render(null as any, container);
    logger.debug('Gallery unmounted successfully');
  } catch (error) {
    logger.error('Failed to unmount gallery:', error);
    throw error;
  }
}

/**
 * 갤러리 컨테이너 컴포넌트 - Light DOM 기반
 */
export function GalleryContainer({ children, onClose, className = '' }: GalleryContainerProps) {
  const { useCallback, useEffect } = getPreactHooks();
  const h = getPreact().h;

  // 키보드 이벤트 핸들러
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    },
    [onClose]
  );

  // 키보드 이벤트 리스너 등록
  useEffect(() => {
    if (onClose) {
      const id = EventManager.getInstance().addListener(
        document,
        'keydown',
        handleKeyDown as unknown as EventListener
      );
      return () => {
        EventManager.getInstance().removeListener(id);
      };
    }
    return undefined;
  }, [handleKeyDown, onClose]);

  return h(
    'div',
    {
      className: `xeg-gallery-overlay xeg-gallery-container gallery-container ${className}`,
      'data-xeg-gallery-container': '',
    },
    children
  );
}

export default GalleryContainer;
