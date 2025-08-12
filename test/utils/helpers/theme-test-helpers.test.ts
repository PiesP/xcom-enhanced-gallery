/**
 * 테마 테스트 헬퍼 함수들 테스트
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  setTestTheme,
  resetTestTheme,
  ensureCSSVariablesForTesting,
} from './theme-test-helpers.js';

describe('테마 테스트 헬퍼 함수들', () => {
  beforeEach(() => {
    // DOM을 초기화
    if (typeof document !== 'undefined') {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.className = '';

      // 기존 스타일 태그 제거
      const existingStyle = document.getElementById('test-theme-variables');
      if (existingStyle) {
        existingStyle.remove();
      }
    }
  });

  describe('setTestTheme', () => {
    it('라이트 테마를 설정할 수 있어야 한다', () => {
      setTestTheme('light');

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.documentElement.classList.contains('xeg-theme-light')).toBe(true);
      expect(document.documentElement.classList.contains('xeg-theme-dark')).toBe(false);
    });

    it('다크 테마를 설정할 수 있어야 한다', () => {
      setTestTheme('dark');

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.documentElement.classList.contains('xeg-theme-dark')).toBe(true);
      expect(document.documentElement.classList.contains('xeg-theme-light')).toBe(false);
    });
  });

  describe('resetTestTheme', () => {
    it('테마를 라이트로 리셋해야 한다', () => {
      // 먼저 다크 테마로 설정
      setTestTheme('dark');

      // 리셋 실행
      resetTestTheme();

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.documentElement.classList.contains('xeg-theme-light')).toBe(true);
    });
  });

  describe('ensureCSSVariablesForTesting', () => {
    it('CSS 변수 스타일 태그를 추가해야 한다', () => {
      ensureCSSVariablesForTesting();

      const styleElement = document.getElementById('test-theme-variables');
      expect(styleElement).toBeTruthy();
      expect(styleElement?.tagName).toBe('STYLE');
    });

    it('이미 스타일 태그가 있으면 중복 생성하지 않아야 한다', () => {
      ensureCSSVariablesForTesting();
      ensureCSSVariablesForTesting();

      const styleElements = document.querySelectorAll('#test-theme-variables');
      expect(styleElements.length).toBe(1);
    });
  });

  describe('통합 테스트', () => {
    it('전체 테마 설정이 올바르게 작동해야 한다', () => {
      // CSS 변수 설정
      ensureCSSVariablesForTesting();

      // 라이트 테마 설정
      setTestTheme('light');

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.getElementById('test-theme-variables')).toBeTruthy();
    });
  });
});
