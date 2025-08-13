/**
 * 테스트 환경에서 테마 설정을 돕는 유틸리티 함수들
 */
import { vi } from 'vitest';

/**
 * 테스트 환경에서 특정 테마를 강제로 설정
 */
export function setTestTheme(theme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') {
    return;
  }

  const documentElement = document.documentElement as
    | (HTMLElement & { classList?: DOMTokenList })
    | null;
  if (!documentElement || !documentElement.classList) {
    // jsdom 초기화 타이밍 이슈 대비
    return;
  }

  // 기존 테마 클래스/속성 제거
  documentElement.classList.remove('xeg-theme-light', 'xeg-theme-dark');

  // JSDOM 환경에서 안전하게 removeAttribute 수행
  try {
    if (documentElement.removeAttribute) {
      documentElement.removeAttribute('data-theme');
    } else if (documentElement.setAttribute) {
      documentElement.setAttribute('data-theme', '');
    }
  } catch {
    // JSDOM 환경에서 removeAttribute가 실패하는 경우 무시
  }

  // 새 테마 적용
  documentElement.classList.add(`xeg-theme-${theme}`);
  if (documentElement.setAttribute) {
    documentElement.setAttribute('data-theme', theme);
  }
}

/**
 * 테스트 환경에서 matchMedia 모킹을 특정 테마로 설정
 */
export function mockMatchMediaForTheme(theme: 'light' | 'dark'): void {
  if (typeof window === 'undefined') {
    return;
  }

  const isDark = theme === 'dark';
  const mockedImpl = (query: string) => ({
    matches: query.includes('prefers-color-scheme: dark') ? isDark : !isDark,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn().mockReturnValue(true),
  });

  try {
    // 우선 spyOn으로 모킹 (읽기 전용 속성에도 안전하게 동작하는 경우가 많음)
    if (typeof window.matchMedia === 'function') {
      vi.spyOn(window, 'matchMedia').mockImplementation(mockedImpl as any);
      return;
    }
  } catch {
    // spy 실패 시 하단 경로로 폴백
  }

  try {
    // 속성 기술자 확인 후 재정의 시도
    const desc = Object.getOwnPropertyDescriptor(window, 'matchMedia');
    if (!desc || desc.writable || desc.configurable) {
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn(mockedImpl),
        configurable: true,
        writable: true,
        enumerable: true,
      });
      return;
    }
  } catch {
    // defineProperty 실패 시 마지막 폴백
  }

  // 마지막 폴백: 전역에 별칭 생성 (테스트에서 직접 사용하지 않지만 안전장치)
  (globalThis as any).__xeg_matchMedia__ = vi.fn(mockedImpl);
}

/**
 * 테스트 환경에서 테마 설정을 초기화 (라이트 테마로)
 */
export function resetTestTheme(): void {
  setTestTheme('light');
  mockMatchMediaForTheme('light');
}

/**
 * 테스트에서 CSS 변수가 제대로 설정되어 있는지 확인
 */
export function ensureCSSVariablesForTesting(): void {
  if (typeof document === 'undefined' || !document.documentElement) return;

  const rootEl = document.documentElement as HTMLElement & {
    __xeg_theme_observer__?: MutationObserver;
  };

  // 안전한 방법으로 스타일 객체 확보
  let rootStyle: CSSStyleDeclaration;
  try {
    rootStyle = rootEl.style;
    // 스타일 객체가 유효한지 확인
    if (!rootStyle || typeof rootStyle.setProperty !== 'function') {
      // 스타일 객체가 없거나 setProperty가 없는 경우 대체 구현 사용
      console.warn(
        '[Theme Test Helper] document.documentElement.style이 유효하지 않음, 대체 구현 사용'
      );
      return;
    }
  } catch (error) {
    console.warn('[Theme Test Helper] 스타일 객체 접근 실패:', error);
    return;
  }

  // 공통 토큰 주입 (테스트에서 참조하는 최소 집합)
  const injectBaseTokens = () => {
    try {
      // Solid colors
      rootStyle.setProperty('--xeg-bg-solid-light', '#ffffff');
      rootStyle.setProperty('--xeg-bg-solid-dark', '#000000');
      rootStyle.setProperty('--xeg-color-solid-light', '#ffffff');
      rootStyle.setProperty('--xeg-color-solid-dark', '#000000');

      // Alpha tokens (white)
      rootStyle.setProperty('--xeg-white-alpha-10', 'rgba(255, 255, 255, 0.1)');
      rootStyle.setProperty('--xeg-white-alpha-30', 'rgba(255, 255, 255, 0.3)');
      rootStyle.setProperty('--xeg-white-alpha-50', 'rgba(255, 255, 255, 0.5)');
      rootStyle.setProperty('--xeg-white-alpha-80', 'rgba(255, 255, 255, 0.8)');
      rootStyle.setProperty('--xeg-white-alpha-95', 'rgba(255, 255, 255, 0.95)');

      // Alpha tokens (black)
      rootStyle.setProperty('--xeg-black-alpha-10', 'rgba(0, 0, 0, 0.1)');
      rootStyle.setProperty('--xeg-black-alpha-30', 'rgba(0, 0, 0, 0.3)');
      rootStyle.setProperty('--xeg-black-alpha-50', 'rgba(0, 0, 0, 0.5)');
      rootStyle.setProperty('--xeg-black-alpha-80', 'rgba(0, 0, 0, 0.8)');
      rootStyle.setProperty('--xeg-black-alpha-95', 'rgba(0, 0, 0, 0.95)');

      // Overlay tokens (defaults align with light/dark base, overridden per theme below)
      rootStyle.setProperty('--xeg-overlay-light-primary', 'rgba(255, 255, 255, 0.95)');
      rootStyle.setProperty('--xeg-overlay-light-secondary', 'rgba(255, 255, 255, 0.8)');
      rootStyle.setProperty('--xeg-overlay-dark-primary', 'rgba(0, 0, 0, 0.95)');
      rootStyle.setProperty('--xeg-overlay-dark-secondary', 'rgba(0, 0, 0, 0.8)');

      // color-mix tokens
      rootStyle.setProperty(
        '--xeg-overlay-mix-dark-80',
        'color-mix(in srgb, black 80%, transparent)'
      );
      rootStyle.setProperty(
        '--xeg-overlay-mix-dark-40',
        'color-mix(in srgb, black 40%, transparent)'
      );
      rootStyle.setProperty(
        '--xeg-overlay-mix-light-80',
        'color-mix(in srgb, white 80%, transparent)'
      );
      rootStyle.setProperty(
        '--xeg-overlay-mix-light-40',
        'color-mix(in srgb, white 40%, transparent)'
      );

      // Text/background tokens used by tests
      rootStyle.setProperty('--xeg-color-text-primary', 'hsl(210, 15%, 20%)');
      rootStyle.setProperty('--xeg-color-background', '#f8fafc');
    } catch (error) {
      console.warn('[Theme Test Helper] 기본 토큰 주입 실패:', error);
    }
  };

  // 테마별 토큰 적용
  const applyThemeSpecificTokens = () => {
    try {
      const theme = rootEl.getAttribute('data-theme') || 'light';

      if (theme === 'dark') {
        rootStyle.setProperty(
          '--xeg-toolbar-overlay-gradient',
          'linear-gradient( to bottom, var(--xeg-overlay-dark-primary) 0%, var(--xeg-black-alpha-80) 70%, transparent 100% )'
        );
        rootStyle.setProperty('--xeg-overlay-mix-primary', 'var(--xeg-overlay-mix-dark-80)');
        // Dark-specific text/background contrast
        rootStyle.setProperty('--xeg-color-text-primary', 'hsl(210, 20%, 95%)');
        rootStyle.setProperty('--xeg-color-background', '#0f172a');
      } else if (theme === 'dim') {
        // Dim: Twitter-like
        rootStyle.setProperty(
          '--xeg-toolbar-overlay-gradient',
          'linear-gradient( to bottom, rgba(21, 32, 43, 0.95) 0%, rgba(21, 32, 43, 0.8) 70%, transparent 100% )'
        );
        rootStyle.setProperty('--xeg-overlay-dark-primary', 'rgba(21, 32, 43, 0.95)');
        rootStyle.setProperty('--xeg-overlay-dark-secondary', 'rgba(21, 32, 43, 0.8)');
        rootStyle.setProperty(
          '--xeg-overlay-mix-primary',
          'color-mix(in srgb, #15202b 80%, transparent)'
        );
        rootStyle.setProperty('--xeg-color-text-primary', '#f7f9fa');
        rootStyle.setProperty('--xeg-color-background', '#192734');
      } else {
        // light (default)
        rootStyle.setProperty(
          '--xeg-toolbar-overlay-gradient',
          'linear-gradient( to bottom, var(--xeg-overlay-light-primary) 0%, var(--xeg-white-alpha-80) 70%, transparent 100% )'
        );
        rootStyle.setProperty('--xeg-overlay-mix-primary', 'var(--xeg-overlay-mix-light-80)');
        rootStyle.setProperty('--xeg-color-text-primary', 'hsl(210, 15%, 20%)');
        rootStyle.setProperty('--xeg-color-background', '#f8fafc');
      }
    } catch (error) {
      console.warn('[Theme Test Helper] 테마별 토큰 적용 실패:', error);
    }
  };

  injectBaseTokens();
  applyThemeSpecificTokens();

  // data-theme 변경 자동 감지하여 재적용 (테스트 파일의 beforeEach가 style 태그를 제거해도 영향 없음)
  try {
    if (rootEl.__xeg_theme_observer__) {
      rootEl.__xeg_theme_observer__.disconnect();
    }
    const observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'data-theme') {
          applyThemeSpecificTokens();
        }
      }
    });
    observer.observe(rootEl, { attributes: true, attributeFilter: ['data-theme'] });
    rootEl.__xeg_theme_observer__ = observer;
  } catch {
    // ignore observer failures in restricted environments
  }
}
