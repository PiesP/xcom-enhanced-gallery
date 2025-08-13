/**
 * @fileoverview 통합 다크모드 시스템 CSS 변수 자동 초기화
 *
 * 앱 시작시 CSS 커스텀 프로퍼티를 DOM에 자동으로 주입하여
 * 모든 컴포넌트가 통합된 다크모드 스타일을 사용할 수 있도록 합니다.
 */

import { UnifiedDarkModeStyleSystem } from './unified-dark-mode-style-system';

/**
 * 통합 다크모드 스타일 시스템 자동 초기화
 *
 * DOM이 로드되면 자동으로 CSS 커스텀 프로퍼티를 적용합니다.
 * 테마 변경을 감지하여 동적으로 스타일을 업데이트합니다.
 */
export class UnifiedDarkModeInitializer {
  private static initialized = false;
  private static styleElement: HTMLStyleElement | null = null;
  private static mediaQuery: MediaQueryList | null = null;

  /**
   * 시스템 초기화 (한 번만 실행)
   */
  public static initialize(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.injectCSSVariables();
    this.setupThemeChangeListener();
  }

  /**
   * CSS 커스텀 프로퍼티를 DOM에 주입
   */
  private static injectCSSVariables(): void {
    const styleSystem = UnifiedDarkModeStyleSystem.getInstance();
    const currentTheme = this.getCurrentTheme();

    // 기존 스타일 요소 제거
    if (this.styleElement) {
      this.styleElement.remove();
    }

    // 새 스타일 요소 생성
    this.styleElement = document.createElement('style');
    this.styleElement.id = 'xeg-unified-dark-mode-vars';
    this.styleElement.textContent = `
      :root {
        ${styleSystem.generateCSSCustomProperties(currentTheme)}
      }
    `;

    // head에 추가
    document.head.appendChild(this.styleElement);
  }

  /**
   * 테마 변경 감지 리스너 설정
   */
  private static setupThemeChangeListener(): void {
    if (!window.matchMedia) {
      return; // matchMedia 미지원 환경
    }

    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleThemeChange = (): void => {
      this.injectCSSVariables(); // 테마 변경시 CSS 변수 재주입
    };

    // 리스너 등록 (최신 브라우저)
    if (this.mediaQuery.addEventListener) {
      this.mediaQuery.addEventListener('change', handleThemeChange);
    } else {
      // 레거시 브라우저 지원
      this.mediaQuery.addListener(handleThemeChange);
    }
  }

  /**
   * 현재 테마 감지
   */
  private static getCurrentTheme(): 'light' | 'dark' {
    // 1. 수동 테마 설정 확인
    const dataTheme = document.documentElement.getAttribute('data-theme');
    if (dataTheme === 'dark' || dataTheme === 'light') {
      return dataTheme;
    }

    // 2. 시스템 선호도 확인
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }

  /**
   * 수동으로 테마 변경
   */
  public static setTheme(theme: 'light' | 'dark'): void {
    document.documentElement.setAttribute('data-theme', theme);
    this.injectCSSVariables(); // CSS 변수 즉시 업데이트
  }

  /**
   * 초기화 해제 (테스트용)
   */
  public static cleanup(): void {
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }

    if (this.mediaQuery) {
      if (this.mediaQuery.removeEventListener) {
        this.mediaQuery.removeEventListener('change', () => {});
      } else {
        this.mediaQuery.removeListener(() => {});
      }
      this.mediaQuery = null;
    }

    this.initialized = false;
  }
}

/**
 * DOM 로드 완료시 자동 초기화
 */
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      UnifiedDarkModeInitializer.initialize();
    });
  } else {
    // 이미 로드된 경우 즉시 초기화
    UnifiedDarkModeInitializer.initialize();
  }
}
