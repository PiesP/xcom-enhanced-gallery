/**
 * @fileoverview 통합된 갤러리 컨테이너
 * @description IsolatedGalleryContainer + IsolatedGalleryRoot 통합 버전
 * @version 2.0.0 - Phase 2 컴포넌트 단순화
 */

import { getPreact, getPreactHooks } from '@shared/external/vendors';
import type { VNode, ComponentChildren } from '@shared/external/vendors';
import { logger } from '@shared/logging';
import { namespacedDesignSystem } from '@shared/styles';

/**
 * 통합된 갤러리 컨테이너 Props
 */
export interface UnifiedGalleryContainerProps {
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
}

/**
 * 통합된 갤러리 컨테이너
 *
 * @description
 * IsolatedGalleryContainer와 IsolatedGalleryRoot를 통합한 단일 컨테이너입니다.
 * - 완전한 스타일 격리
 * - Shadow DOM 지원 (선택사항)
 * - 최고 우선순위 z-index
 * - 비침습적 이벤트 처리
 * - 자동 정리
 */
export function UnifiedGalleryContainer({
  children,
  onClose,
  useShadowDOM = false,
  className = '',
  onKeyDown,
  'data-testid': testId,
}: UnifiedGalleryContainerProps): VNode {
  const { h } = getPreact();
  const { useEffect, useRef, useState } = getPreactHooks();

  const containerRef = useRef<HTMLDivElement>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);
  const [isReady, setIsReady] = useState(false);

  // 초기화 Effect
  useEffect(() => {
    logger.info('[UnifiedGalleryContainer] Initializing unified gallery container');

    // 네임스페이스된 디자인 시스템 초기화
    namespacedDesignSystem.initialize();

    // Shadow DOM 설정 (선택사항)
    if (useShadowDOM && containerRef.current && !shadowRootRef.current) {
      try {
        shadowRootRef.current = containerRef.current.attachShadow({ mode: 'closed' });

        // Shadow DOM에 격리된 스타일 주입
        const styleElement = document.createElement('style');
        styleElement.textContent = getShadowDOMStyles();
        shadowRootRef.current.appendChild(styleElement);

        logger.debug('[UnifiedGalleryContainer] Shadow DOM initialized');
      } catch (error) {
        logger.warn(
          '[UnifiedGalleryContainer] Shadow DOM not supported, falling back to regular DOM',
          error
        );
      }
    }

    // ESC 키 이벤트 리스너 추가
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }

      // 커스텀 키보드 핸들러 실행
      if (onKeyDown) {
        onKeyDown(event);
      }
    };

    document.addEventListener('keydown', handleEscKey, true);
    setIsReady(true);

    // 정리 함수
    return () => {
      logger.info('[UnifiedGalleryContainer] Cleaning up unified gallery container');
      document.removeEventListener('keydown', handleEscKey, true);
    };
  }, [onClose, useShadowDOM, onKeyDown]);

  // 배경 클릭 핸들러
  const handleBackgroundClick = (event: Event) => {
    if (event.target === containerRef.current) {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
  };

  // 컨테이너 클래스명 구성
  const containerClassName = [
    'xeg-root', // 루트 클래스 통합
    'xeg-gallery',
    'xeg-gallery-unified',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return h(
    'div',
    {
      ref: containerRef,
      className: containerClassName,
      'data-testid': testId || 'unified-gallery-container',
      'data-gallery-unified': 'true',
      'data-xeg-gallery': 'container',
      'data-xeg-gallery-type': 'unified-root',
      'data-shadow-dom': useShadowDOM ? 'true' : 'false',
      'aria-label': 'X.com Enhanced Gallery',
      'aria-modal': 'true',
      role: 'dialog',
      tabIndex: -1,
      onClick: handleBackgroundClick,
      style: {
        // CSS 격리 - 모든 외부 스타일 차단
        all: 'initial',

        // 고정 위치 전체 화면
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',

        // 최고 우선순위 z-index
        zIndex: '2147483647',

        // 스타일 격리
        isolation: 'isolate',
        contain: 'layout style paint',

        // 기본 폰트 설정
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontSize: '14px',
        lineHeight: '1.5',
        color: '#ffffff',

        // 배경
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',

        // 레이아웃
        display: isReady ? 'flex' : 'none',
        flexDirection: 'column',

        // 이벤트 처리
        pointerEvents: 'auto',
        userSelect: 'none',

        // 하드웨어 가속
        transform: 'translateZ(0)',
        willChange: 'opacity, transform',

        // 접근성
        outline: 'none',
      },
    },
    // 자식 컴포넌트를 래핑하여 이벤트 격리
    h(
      'div',
      {
        className: 'xeg-content-wrapper',
        onClick: (event: Event) => {
          // 이벤트 전파 차단으로 배경 클릭과 구분
          event.stopPropagation();
        },
        style: {
          flex: '1',
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: 'auto',
        },
      },
      children
    )
  ) as VNode;
}

/**
 * Shadow DOM용 격리된 스타일 생성
 */
function getShadowDOMStyles(): string {
  return `
    :host {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 2147483647 !important;
      background: rgba(0, 0, 0, 0.95) !important;
      display: flex !important;
      flex-direction: column !important;
      pointer-events: auto !important;
      isolation: isolate !important;
      contain: layout style paint !important;

      /* 폰트 설정 */
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      color: #ffffff !important;
    }

    /* 모든 내부 요소 리셋 */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      border: none;
      outline: none;
      font-family: inherit;
      color: inherit;
    }

    /* 기본 버튼 스타일 */
    button {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      color: inherit;
      padding: 8px 16px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    button:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.3);
    }

    /* 접근성 */
    button:focus {
      outline: 2px solid #1d9bf0;
      outline-offset: 2px;
    }

    /* 애니메이션 감소 모드 지원 */
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  `;
}

/**
 * 통합된 갤러리를 DOM에 마운트하는 헬퍼 함수
 */
export function mountUnifiedGallery(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'xeg-unified-mount';
  container.setAttribute('data-gallery-mount', 'unified');

  // body에 직접 추가
  document.body.appendChild(container);

  return container;
}

/**
 * 통합된 갤러리를 DOM에서 언마운트하는 헬퍼 함수
 */
export function unmountUnifiedGallery(): void {
  const containers = document.querySelectorAll('[data-gallery-mount="unified"]');
  containers.forEach(container => {
    container.remove();
  });
}
