/**
 * @fileoverview 격리된 갤러리 루트 컴포넌트
 * @description 트위터 페이지에 영향을 주지 않는 완전히 격리된 갤러리 컨테이너
 * @version 1.0.0
 */

import { getPreact } from '@core/external/vendors';
import type { ComponentChildren } from '@core/external/vendors';

export interface IsolatedGalleryRootProps {
  children: ComponentChildren;
  onKeyDown?: (event: KeyboardEvent) => void;
  'data-testid'?: string;
}

/**
 * 완전히 격리된 갤러리 루트 컴포넌트
 *
 * @description
 * - 모든 외부 스타일을 차단하고 독립적인 스타일 공간 생성
 * - 트위터 페이지의 CSS나 JavaScript에 영향받지 않음
 * - 최고 우선순위 z-index로 다른 요소들 위에 표시
 * - 하드웨어 가속 및 컨테인먼트 최적화
 */
export function IsolatedGalleryRoot({
  children,
  onKeyDown,
  'data-testid': testId,
}: IsolatedGalleryRootProps) {
  const { h } = getPreact();

  return h(
    'div',
    {
      className: 'xeg-root',
      'data-testid': testId || 'isolated-gallery-root',
      'data-gallery-isolated': 'true',
      'data-xeg-gallery': 'container',
      'data-xeg-gallery-type': 'isolated-root',
      onKeyDown,
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

        // 이벤트 처리
        pointerEvents: 'auto',

        // 하드웨어 가속
        transform: 'translateZ(0)',
        willChange: 'opacity, transform',

        // 접근성
        outline: 'none',
      },
      tabIndex: -1,
    },
    children
  );
}

/**
 * 격리된 갤러리를 DOM에 마운트하는 헬퍼 함수
 */
export function mountIsolatedGallery(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'xeg-root-mount';
  container.setAttribute('data-gallery-mount', 'true');

  // body에 직접 추가
  document.body.appendChild(container);

  return container;
}

/**
 * 격리된 갤러리를 DOM에서 언마운트하는 헬퍼 함수
 */
export function unmountIsolatedGallery(): void {
  const containers = document.querySelectorAll('[data-gallery-mount="true"]');
  containers.forEach(container => {
    container.remove();
  });
}
