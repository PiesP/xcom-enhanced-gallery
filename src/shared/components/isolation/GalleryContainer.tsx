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
 * 갤러리 마운트 함수 - Shadow DOM 지원
 * @param container - 마운트할 DOM 컨테이너
 * @param element - 렌더링할 Preact 요소
 * @param useShadowDOM - Shadow DOM 사용 여부
 */
export function mountGallery(
  container: Element,
  element: unknown,
  useShadowDOM = false
): { root: Element; shadowRoot?: ShadowRoot } {
  const preact = getPreact();

  try {
    let renderTarget: Element;
    let shadowRoot: ShadowRoot | undefined;

    if (useShadowDOM && 'attachShadow' in container) {
      // Shadow DOM 지원
      shadowRoot = (container as HTMLElement).attachShadow({ mode: 'open' });

      // 갤러리 스타일을 Shadow DOM에 주입
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        @import url('/src/features/gallery/styles/gallery-global.css');
        @import url('/src/shared/styles/design-tokens.primitive.css');

        :host {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: var(--xeg-z-overlay);
          isolation: isolate;
        }
      `;
      shadowRoot.appendChild(styleElement);

      // ShadowRoot를 Element로 타입 캐스팅 (preact 렌더링 호환성)
      renderTarget = shadowRoot as unknown as Element;
      logger.info('Gallery mounted with Shadow DOM for style isolation');
    } else {
      // 일반 DOM 마운트 (폴백)
      renderTarget = container;
      shadowRoot = undefined;
      logger.debug('Gallery mounted without Shadow DOM (fallback mode)');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    preact.render(element as any, renderTarget);

    // exactOptionalPropertyTypes 호환성을 위한 조건부 반환
    if (shadowRoot) {
      return { root: renderTarget, shadowRoot };
    } else {
      return { root: renderTarget };
    }
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
 * 갤러리 컨테이너 컴포넌트 - Shadow DOM 지원
 */
export function GalleryContainer({
  children,
  onClose,
  className = '',
  useShadowDOM = false,
}: GalleryContainerProps) {
  const { useCallback, useEffect, useRef } = getPreactHooks();
  const h = getPreact().h;
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Shadow DOM 초기화
  useEffect(() => {
    if (useShadowDOM && containerRef.current && 'attachShadow' in containerRef.current) {
      logger.debug('Shadow DOM container initialized');
    }
  }, [useShadowDOM]);

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
      ref: containerRef,
      className: `xeg-gallery-overlay xeg-gallery-container gallery-container ${className}`,
    },
    children
  );
}

export default GalleryContainer;
