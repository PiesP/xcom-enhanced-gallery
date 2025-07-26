/**
 * @fileoverview 격리된 갤러리 컨테이너 컴포넌트
 * @description 트위터 페이지에 영향을 주지 않는 독립적인 갤러리 환경 제공
 * @version 1.0.0
 */

import { getPreact, getPreactHooks } from '@shared/external/vendors';
import type { VNode } from '@shared/external/vendors';
import { logger } from '@shared/logging';
import { namespacedDesignSystem } from '@shared/styles';

/**
 * 격리된 갤러리 컨테이너 Props
 */
export interface IsolatedGalleryContainerProps {
  /** 자식 컴포넌트 */
  children: VNode;
  /** 갤러리 닫기 콜백 */
  onClose: () => void;
  /** Shadow DOM 사용 여부 (선택사항) */
  useShadowDOM?: boolean;
  /** 추가 클래스명 */
  className?: string;
}

/**
 * 완전히 격리된 갤러리 컨테이너
 *
 * @description
 * 트위터 페이지에 영향을 주지 않는 독립적인 갤러리 환경을 제공합니다.
 *
 * 주요 기능:
 * - 네임스페이스된 스타일 격리
 * - 최소한의 스크롤 잠금
 * - Shadow DOM 지원 (선택사항)
 * - 완전한 이벤트 격리
 * - 자동 정리
 */
export function IsolatedGalleryContainer({
  children,
  onClose,
  useShadowDOM = false,
  className = '',
}: IsolatedGalleryContainerProps): VNode {
  const { h } = getPreact();
  const { useEffect, useRef, useState } = getPreactHooks();

  const containerRef = useRef<HTMLDivElement>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);
  const [isReady, setIsReady] = useState(false);

  // 초기화 Effect
  useEffect(() => {
    logger.info('[IsolatedGalleryContainer] Initializing isolated gallery container');

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

        logger.debug('[IsolatedGalleryContainer] Shadow DOM initialized');
      } catch (error) {
        logger.warn(
          '[IsolatedGalleryContainer] Shadow DOM not supported, falling back to regular DOM',
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
    };

    document.addEventListener('keydown', handleEscKey, true);
    setIsReady(true);

    // 정리 함수
    return () => {
      logger.info('[IsolatedGalleryContainer] Cleaning up isolated gallery container');

      // 이벤트 리스너 제거
      document.removeEventListener('keydown', handleEscKey, true);

      // Shadow DOM 정리는 자동으로 처리됨 (컨테이너 제거 시)
    };
  }, [onClose, useShadowDOM]);

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
    'xeg-gallery', // 네임스페이스 하드코딩
    'xeg-gallery-isolated',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return h(
    'div',
    {
      ref: containerRef,
      className: containerClassName,
      'data-gallery-isolated': 'true',
      'data-shadow-dom': useShadowDOM ? 'true' : 'false',
      'aria-label': 'X.com Enhanced Gallery',
      'aria-modal': 'true',
      role: 'dialog',
      tabIndex: -1,
      onClick: handleBackgroundClick,
      style: {
        // 기본 스타일 보장 (CSS가 로드되지 않은 경우를 대비)
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        zIndex: '2147483647',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        display: isReady ? 'flex' : 'none',
        flexDirection: 'column',
        isolation: 'isolate',
        contain: 'layout style paint',
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

      /* 갤러리 내부 스크롤만 허용 */
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
