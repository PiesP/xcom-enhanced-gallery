/**
 * @fileoverview 갤러리 컨테이너
 * @description IsolatedGalleryContainer + IsolatedGalleryRoot 통합 버전
 * @version 2.0.0 - Phase 2 컴포넌트 단순화
 */

import { getPreact, getPreactHooks, getPreactCompat } from '@shared/external/vendors';
import type { ComponentChildren } from '@shared/external/vendors';
import { logger } from '@shared/logging';

/**
 * 갤러리 컨테이너 Props
 */
export interface GalleryContainerProps {
  /** 자식 컴포넌트 */
  children: ComponentChildren;
  /** 갤러리 닫기 콜백 */
  onClose: () => void;
  /** Shadow DOM 사용 여부 (선택사항) */
  useShadowDOM?: boolean;
  /** 추가 클래스명 */
  className?: string;
  /** 키보드 이벤트 핸들러 */
  onKeyDown?: (event: KeyboardEvent) => void;
  /** 테스트 ID */
  'data-testid'?: string;
  /** Phase 3: 접근성 향상을 위한 옵션들 */
  ariaLabel?: string;
  ariaDescribedBy?: string;
  /** Phase 3: 성능 최적화 옵션들 */
  enableHardwareAcceleration?: boolean;
  enableMemoryOptimization?: boolean;
  /** Phase 3: 사용자 경험 개선 옵션들 */
  enableFocusTrap?: boolean;
  enableAnimations?: boolean;
}

/**
 * 갤러리 컨테이너
 *
 * @description
 * IsolatedGalleryContainer와 IsolatedGalleryRoot를 통합한 단일 컨테이너입니다.
 * - 완전한 스타일 격리
 * - Shadow DOM 지원 (선택사항)
 * - 최고 우선순위 z-index
 * - 비침습적 이벤트 처리
 * - 자동 정리
 */
function GalleryContainerCore({
  children,
  onClose,
  useShadowDOM = false,
  className = '',
  onKeyDown,
  ariaLabel = 'Gallery Container',
  ariaDescribedBy,
  enableHardwareAcceleration = true,
  enableMemoryOptimization = true,
  enableFocusTrap = true,
  enableAnimations = true,
  'data-testid': testId = 'gallery-container',
}: GalleryContainerProps) {
  const { useEffect, useRef, useCallback } = getPreactHooks();
  const { h } = getPreact();

  const containerRef = useRef<HTMLDivElement>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);

  // Shadow DOM 초기화
  useEffect(() => {
    if (!useShadowDOM || !containerRef.current) return;

    try {
      const shadowRoot = containerRef.current.attachShadow({ mode: 'closed' });
      shadowRootRef.current = shadowRoot;

      // Shadow DOM 스타일 주입
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        /* 기본 격리 스타일 */
        :host {
          all: initial;
          display: block;
        }

        .xeg-gallery-container {
          isolation: isolate;
          z-index: 2147483647;
        }
      `;
      shadowRoot.appendChild(styleElement);

      logger.debug('[GalleryContainer] Shadow DOM initialized');
    } catch (error) {
      logger.warn('[GalleryContainer] Shadow DOM creation failed:', error);
    }

    return () => {
      if (shadowRootRef.current) {
        shadowRootRef.current = null;
      }
    };
  }, [useShadowDOM]);

  // 키보드 이벤트 핸들러
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Escape 키로 갤러리 닫기
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      // 사용자 정의 키보드 핸들러 호출
      onKeyDown?.(event);
    },
    [onClose, onKeyDown]
  );

  // Focus trap 구현
  useEffect(() => {
    if (!enableFocusTrap || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [enableFocusTrap]);

  // 메모리 최적화 - 불필요한 DOM 업데이트 방지
  useEffect(() => {
    if (!enableMemoryOptimization || !containerRef.current) return;

    const container = containerRef.current;
    const observer = new MutationObserver(() => {
      // DOM 변경 최적화 로직 (필요시 구현)
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: false,
    });

    return () => {
      observer.disconnect();
    };
  }, [enableMemoryOptimization]);

  const containerClasses = [
    'xeg-gallery-container',
    enableHardwareAcceleration && 'xeg-hardware-accelerated',
    enableAnimations && 'xeg-animations-enabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const containerStyles = {
    position: 'fixed' as const,
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    zIndex: '2147483647', // 최고 우선순위
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    isolation: 'isolate',
    ...(enableHardwareAcceleration && {
      transform: 'translateZ(0)',
      willChange: 'transform, opacity',
    }),
  };

  const containerElement = h(
    'div',
    {
      ref: containerRef,
      className: containerClasses,
      style: containerStyles,
      onKeyDown: handleKeyDown,
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      'data-testid': testId,
      tabIndex: -1,
    },
    children
  );

  return containerElement;
}

/**
 * 갤러리 컨테이너 Props 비교 함수
 */
export function compareGalleryContainerProps(
  prevProps: GalleryContainerProps,
  nextProps: GalleryContainerProps
): boolean {
  // 기본 props 비교
  if (
    prevProps.onClose !== nextProps.onClose ||
    prevProps.useShadowDOM !== nextProps.useShadowDOM ||
    prevProps.className !== nextProps.className ||
    prevProps.onKeyDown !== nextProps.onKeyDown ||
    prevProps.ariaLabel !== nextProps.ariaLabel ||
    prevProps.ariaDescribedBy !== nextProps.ariaDescribedBy ||
    prevProps.enableHardwareAcceleration !== nextProps.enableHardwareAcceleration ||
    prevProps.enableMemoryOptimization !== nextProps.enableMemoryOptimization ||
    prevProps.enableFocusTrap !== nextProps.enableFocusTrap ||
    prevProps.enableAnimations !== nextProps.enableAnimations ||
    prevProps['data-testid'] !== nextProps['data-testid']
  ) {
    return false;
  }

  // children 비교는 얕은 비교 (실제 변경이 있을 때만 리렌더링)
  return prevProps.children === nextProps.children;
}

/**
 * 하위 호환성을 위한 UnifiedGalleryContainer Props 비교 함수
 */
export const compareUnifiedGalleryContainerProps = compareGalleryContainerProps;

/**
 * 갤러리 컨테이너 (메모이제이션 적용)
 */
export const GalleryContainer = (() => {
  const { memo } = getPreactCompat();
  const MemoizedGalleryContainer = memo(GalleryContainerCore, compareGalleryContainerProps);

  // displayName 설정
  (MemoizedGalleryContainer as { displayName?: string }).displayName = 'memo(GalleryContainer)';
  return MemoizedGalleryContainer;
})();

// 하위 호환성을 위한 별칭들
export { GalleryContainer as UnifiedGalleryContainer };
export type { GalleryContainerProps as UnifiedGalleryContainerProps };

// 기본 export
export default GalleryContainer;
