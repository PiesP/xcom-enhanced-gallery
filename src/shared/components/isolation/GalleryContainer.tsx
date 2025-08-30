/**
 * @fileoverview 갤러리 컨테이너
 * @description 간소화된 갤러리 컨테이너
 */

import { getPreact, getPreactHooks } from '@shared/external/vendors';
import type { ComponentChildren } from '@shared/external/vendors';
import { logger } from '@shared/logging';

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
  /** Shadow DOM 사용 여부 */
  useShadowDOM?: boolean;
}

/**
 * 갤러리 마운트 함수 (간소화)
 * @param container - 마운트할 DOM 컨테이너
 * @param element - 렌더링할 Preact 요소
 */
export function mountGallery(container: Element, element: unknown): void {
  const preact = getPreact();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    preact.render(element as any, container);
    logger.debug('Gallery mounted successfully');
  } catch (error) {
    logger.error('Failed to mount gallery:', error);
    throw error;
  }
}

/**
 * 갤러리 언마운트 함수 (간소화)
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
 * 갤러리 컨테이너 컴포넌트 (간소화)
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
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
    return undefined;
  }, [handleKeyDown, onClose]);

  return h(
    'div',
    {
      className: `gallery-container ${className}`,
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        minHeight: '100vh',
        overflowY: 'scroll',
        boxSizing: 'border-box',
        padding: '2rem',
        background: 'rgba(0, 0, 0, 0.9)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    },
    children
  );
}

export default GalleryContainer;
