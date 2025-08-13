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

  const documentElement = document.documentElement;

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

  (window.matchMedia as any) = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-color-scheme: dark') ? isDark : !isDark,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn().mockReturnValue(true),
  }));
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
  if (typeof document === 'undefined' || !document.head) {
    return;
  }

  // JSDOM 환경에서 안전하게 getElementById 수행
  let existingStyle: Element | null = null;
  try {
    if (document.getElementById) {
      existingStyle = document.getElementById('test-theme-variables');
    } else if (document.querySelector) {
      existingStyle = document.querySelector('#test-theme-variables');
    }
  } catch {
    // JSDOM 환경에서 실패하는 경우 무시
  }

  if (existingStyle) {
    return; // 이미 삽입됨
  }

  const style = document.createElement('style');
  style.id = 'test-theme-variables';
  style.textContent = `
    :root {
      --xeg-bg-toolbar: #ffffff;
      --xeg-toolbar-border: #e5e7eb;
      --xeg-toolbar-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      --xeg-toolbar-text: #111827;
      --xeg-bg-solid-light: #ffffff;
      --xeg-bg-solid-dark: #000000;
    }

    [data-theme='light'] {
      --xeg-bg-toolbar: #ffffff;
      --xeg-toolbar-border: #e5e7eb;
      --xeg-toolbar-text: #111827;
    }

    [data-theme='dark'] {
      --xeg-bg-toolbar: #000000;
      --xeg-toolbar-border: #374151;
      --xeg-toolbar-text: #f9fafb;
    }
  `;

  document.head.appendChild(style);
}
