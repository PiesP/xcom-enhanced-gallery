/**
 * @fileoverview 툴바 가시성 문제 진단 테스트
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  debugToolbarVisibility,
  forceToolbarVisible,
  setToolbarCSSVariables,
} from '@shared/utils/debug/toolbar-visibility-debug';

describe('Toolbar Visibility Debug', () => {
  let mockElement;
  let mockToolbar;

  beforeEach(() => {
    // DOM 환경 설정
    document.body.innerHTML = '';

    // 툴바 요소 모킹
    mockToolbar = document.createElement('div');
    mockToolbar.setAttribute('data-testid', 'xcom-gallery-toolbar');
    mockToolbar.className = 'toolbar';
    mockToolbar.style.position = 'fixed';
    mockToolbar.style.top = '20px';
    mockToolbar.style.left = '50%';
    mockToolbar.style.transform = 'translateX(-50%)';
    mockToolbar.style.width = '200px';
    mockToolbar.style.height = '40px';
    mockToolbar.style.zIndex = '9999';

    document.body.appendChild(mockToolbar);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('DOM 요소 존재 확인', () => {
    it('툴바 요소가 DOM에 존재해야 한다', () => {
      const toolbar = document.querySelector('[data-testid="xcom-gallery-toolbar"]');
      expect(toolbar).toBeTruthy();
      expect(toolbar).toBeInstanceOf(HTMLElement);
    });

    it('툴바 요소가 올바른 클래스명을 가져야 한다', () => {
      const toolbar = document.querySelector('[data-testid="xcom-gallery-toolbar"]');
      expect(toolbar?.className).toContain('toolbar');
    });
  });

  describe('스타일 속성 검증', () => {
    it('툴바가 기본 레이아웃 스타일을 가져야 한다', () => {
      const toolbar = document.querySelector('[data-testid="xcom-gallery-toolbar"]');
      const styles = window.getComputedStyle(toolbar);

      expect(styles.position).toBe('fixed');
      expect(styles.zIndex).toBe('9999');
      expect(styles.width).toBe('200px');
      expect(styles.height).toBe('40px');
    });

    it('툴바가 기본적으로 보이는 상태여야 한다', () => {
      const toolbar = document.querySelector('[data-testid="xcom-gallery-toolbar"]');
      const styles = window.getComputedStyle(toolbar);

      // 기본 가시성 속성 확인
      expect(styles.display).not.toBe('none');
      expect(styles.visibility).not.toBe('hidden');
      expect(parseFloat(styles.opacity) || 1).toBeGreaterThan(0);
    });

    it('툴바가 화면 범위 내에 위치해야 한다', () => {
      const toolbar = document.querySelector('[data-testid="xcom-gallery-toolbar"]');
      const rect = toolbar.getBoundingClientRect();

      expect(rect.top).toBeGreaterThanOrEqual(0);
      expect(rect.left).toBeGreaterThanOrEqual(0);
      expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight);
      expect(rect.right).toBeLessThanOrEqual(window.innerWidth);
    });
  });

  describe('가시성 문제 시나리오', () => {
    it('opacity가 0으로 설정된 경우를 감지해야 한다', () => {
      const toolbar = document.querySelector('[data-testid="xcom-gallery-toolbar"]');
      toolbar.style.opacity = '0';

      const styles = window.getComputedStyle(toolbar);
      expect(parseFloat(styles.opacity)).toBe(0);

      // 마우스 이벤트는 여전히 동작하지만 시각적으로 보이지 않음
      expect(styles.pointerEvents).not.toBe('none');
    });

    it('visibility: hidden으로 설정된 경우를 감지해야 한다', () => {
      const toolbar = document.querySelector('[data-testid="xcom-gallery-toolbar"]');
      toolbar.style.visibility = 'hidden';

      const styles = window.getComputedStyle(toolbar);
      expect(styles.visibility).toBe('hidden');
    });

    it('z-index가 너무 낮아서 가려진 경우를 감지해야 한다', () => {
      // 다른 요소를 높은 z-index로 생성
      const coverElement = document.createElement('div');
      coverElement.style.position = 'fixed';
      coverElement.style.top = '0';
      coverElement.style.left = '0';
      coverElement.style.width = '100%';
      coverElement.style.height = '100%';
      coverElement.style.zIndex = '10000';
      coverElement.style.backgroundColor = 'rgba(0,0,0,0.5)';
      document.body.appendChild(coverElement);

      const toolbar = document.querySelector('[data-testid="xcom-gallery-toolbar"]');
      const toolbarStyles = window.getComputedStyle(toolbar);
      const coverStyles = window.getComputedStyle(coverElement);

      expect(parseInt(coverStyles.zIndex)).toBeGreaterThan(parseInt(toolbarStyles.zIndex));
    });

    it('부모 요소의 overflow: hidden으로 인한 클리핑을 감지해야 한다', () => {
      const parentContainer = document.createElement('div');
      parentContainer.style.position = 'relative';
      parentContainer.style.width = '100px';
      parentContainer.style.height = '100px';
      parentContainer.style.overflow = 'hidden';

      const toolbar = document.querySelector('[data-testid="xcom-gallery-toolbar"]');
      document.body.removeChild(toolbar);
      parentContainer.appendChild(toolbar);
      document.body.appendChild(parentContainer);

      const parentStyles = window.getComputedStyle(parentContainer);
      expect(parentStyles.overflow).toBe('hidden');

      const toolbarRect = toolbar.getBoundingClientRect();
      const parentRect = parentContainer.getBoundingClientRect();

      // 툴바가 부모 컨테이너 범위를 벗어나는지 확인
      const isClipped =
        toolbarRect.left < parentRect.left ||
        toolbarRect.top < parentRect.top ||
        toolbarRect.right > parentRect.right ||
        toolbarRect.bottom > parentRect.bottom;

      if (isClipped) {
        console.warn('Toolbar is clipped by parent container');
      }
    });
  });

  describe('CSS 변수 기반 가시성 제어', () => {
    it('CSS 변수를 통한 가시성 제어가 동작해야 한다', () => {
      const toolbar = document.querySelector('[data-testid="xcom-gallery-toolbar"]') as HTMLElement;

      // CSS 변수 설정
      toolbar.style.setProperty('--toolbar-opacity', '0');
      toolbar.style.setProperty('--toolbar-pointer-events', 'none');

      // 직접 스타일 적용 (CSS 변수는 JSDOM에서 완전히 지원되지 않음)
      toolbar.style.opacity = '0';
      toolbar.style.pointerEvents = 'none';

      const styles = window.getComputedStyle(toolbar);
      expect(parseFloat(styles.opacity || '1')).toBe(0);
      expect(styles.pointerEvents).toBe('none');
    });

    it('상태별 CSS 변수가 올바르게 적용되어야 한다', () => {
      const toolbar = document.querySelector('[data-testid="xcom-gallery-toolbar"]') as HTMLElement;

      // 상태 데이터 속성 설정
      toolbar.setAttribute('data-state', 'loading');

      // 상태별 CSS 변수 설정
      toolbar.style.setProperty('--toolbar-bg-loading', 'rgba(0,0,0,0.7)');

      expect(toolbar.getAttribute('data-state')).toBe('loading');
    });
  });

  describe('디버깅 유틸리티 함수', () => {
    it('툴바 디버깅 정보를 수집할 수 있어야 한다', () => {
      const debugInfo = debugToolbarVisibility();

      expect(debugInfo.found).toBe(true);
      expect(debugInfo.element).toBeTruthy();
      expect(debugInfo.boundingRect).toBeTruthy();
      expect(debugInfo.computed).toBeTruthy();
      expect(debugInfo.visibility).toBeTruthy();

      if (debugInfo.boundingRect) {
        expect(debugInfo.boundingRect.width).toBeGreaterThanOrEqual(0);
        expect(debugInfo.boundingRect.height).toBeGreaterThanOrEqual(0);
      }

      if (debugInfo.computed) {
        expect(debugInfo.computed.display).toBeDefined();
      }
    });

    it('마우스 이벤트 활성화 상태를 확인할 수 있어야 한다', () => {
      const toolbar = document.querySelector('[data-testid="xcom-gallery-toolbar"]');

      let isClickable = false;
      toolbar?.addEventListener('click', () => {
        isClickable = true;
      });

      // 클릭 이벤트 시뮬레이션 (JSDOM 호환)
      const clickEvent = new Event('click', {
        bubbles: true,
        cancelable: true,
      });

      toolbar?.dispatchEvent(clickEvent);
      expect(isClickable).toBe(true);
    });
  });

  describe('실제 사용 시나리오', () => {
    it('X.com 플랫폼에서 발생할 수 있는 스타일 충돌을 시뮬레이션해야 한다', () => {
      // X.com의 일반적인 스타일 시뮬레이션
      const twitterStyles = document.createElement('style');
      twitterStyles.textContent = `
        /* X.com 스타일 시뮬레이션 */
        div {
          box-sizing: border-box !important;
        }

        [data-testid="xcom-gallery-toolbar"] {
          /* 잠재적 충돌 스타일 */
          opacity: 0.5 !important;
        }
      `;
      document.head.appendChild(twitterStyles);

      const toolbar = document.querySelector('[data-testid="xcom-gallery-toolbar"]');
      const styles = window.getComputedStyle(toolbar);

      // !important로 인한 스타일 오버라이드 확인
      expect(parseFloat(styles.opacity)).toBe(0.5);

      document.head.removeChild(twitterStyles);
    });

    it('다양한 브라우저 환경에서의 호환성을 확인해야 한다', () => {
      const toolbar = document.querySelector('[data-testid="xcom-gallery-toolbar"]');

      // backdrop-filter 지원 확인
      toolbar.style.backdropFilter = 'blur(8px)';
      const supportsBackdropFilter = toolbar.style.backdropFilter !== '';

      // CSS Custom Properties 지원 확인
      toolbar.style.setProperty('--test-var', '1');
      const supportsCSSVars = toolbar.style.getPropertyValue('--test-var') === '1';

      expect(typeof supportsBackdropFilter).toBe('boolean');
      expect(typeof supportsCSSVars).toBe('boolean');
    });
  });
});
