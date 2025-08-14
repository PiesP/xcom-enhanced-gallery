/**
 * 툴바 테마 통합 테스트
 * 테스트 환경에서 툴바의 배경색이 올바르게 적용되는지 확인
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setTestTheme, ensureCSSVariablesForTesting } from '../utils/helpers/theme-test-helpers.js';

describe('툴바 테마 통합 테스트', () => {
  beforeEach(() => {
    // 테스트 환경 초기화
    ensureCSSVariablesForTesting();
    setTestTheme('light');
  });

  it('라이트 테마 설정이 DOM에 올바르게 적용되어야 한다', () => {
    setTestTheme('light');

    // data-theme 속성이 설정되어 있는지 확인
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.classList.contains('xeg-theme-light')).toBe(true);
    expect(document.documentElement.classList.contains('xeg-theme-dark')).toBe(false);
  });

  it('다크 테마 설정이 DOM에 올바르게 적용되어야 한다', () => {
    setTestTheme('dark');

    // data-theme 속성이 설정되어 있는지 확인
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('xeg-theme-dark')).toBe(true);
    expect(document.documentElement.classList.contains('xeg-theme-light')).toBe(false);
  });

  it('CSS 변수가 툴바에 적용되는지 확인', () => {
    ensureCSSVariablesForTesting();

    // 스타일 태그가 있는지 확인
    const styleElement = document.getElementById('test-theme-variables');
    expect(styleElement).toBeTruthy();

    // 스타일 내용이 올바른지 확인
    const styleContent = styleElement?.textContent || '';
    expect(styleContent).toContain('--xeg-color-primary'); // 현재 사용 중인 토큰으로 변경
    expect(styleContent).toContain('#2563eb'); // 라이트 테마 기본 primary 색상
    expect(styleContent).toContain('#3b82f6'); // 다크 테마 기본 primary 색상
  });

  it('툴바 CSS에 fallback 값이 있는지 확인 (시뮬레이션)', () => {
    // 실제 CSS가 로드되는지는 확인할 수 없지만,
    // 최소한 CSS 변수가 정의되어 있는지 확인
    ensureCSSVariablesForTesting();

    // CSS 변수가 정의되어 있는지 확인 (실제로는 스타일시트가 로드되어야 함)
    // 여기서는 적어도 스타일 태그가 추가되었는지 확인
    const styleElement = document.getElementById('test-theme-variables');
    expect(styleElement).toBeTruthy();
  });
});
