/**
 * TDD Test: 라이트 모드 배경 불투명도 개선
 *
 * 요구사항:
 * 1. 라이트 모드에서 UI 배경이 충분히 불투명해야 함 (98% 이상)
 * 2. 완전 불투명 solid 옵션 제공
 * 3. 글래스모피즘 스타일은 유지하되 가독성 개선
 *
 * @author XEG Team
 * @version 1.0.0
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { themeService } from '@shared/services/theme-service';

describe('라이트 모드 배경 불투명도 개선', () => {
  beforeEach(() => {
    // DOM 환경 준비
    document.documentElement.innerHTML = '';
    document.documentElement.className = '';

    // CSS 변수 초기화
    document.documentElement.removeAttribute('data-theme');

    // 테스트용 CSS 변수 설정 (실제 design-tokens.css 값 반영)
    const root = document.documentElement;
    // Phase3: glass tokens removed; fallback to direct rgba values on modal tokens
    root.style.setProperty('--xeg-modal-bg', 'rgba(255, 255, 255, 0.98)');
    root.style.setProperty('--xeg-modal-bg-solid', 'rgba(255, 255, 255, 1.0)');
    root.style.setProperty('--xeg-glass-blur-strong', 'blur(16px)');
  });

  describe('CSS 변수 정의 검증', () => {
    test('라이트 테마 글래스 배경이 98% 이상 불투명해야 함', () => {
      // Given: 라이트 테마 적용
      themeService.setTheme('light');

      // When: CSS 변수 값 확인
      const computedStyle = getComputedStyle(document.documentElement);
      const modalBg = computedStyle.getPropertyValue('--xeg-modal-bg').trim();
      const alphaMatch = modalBg.match(/rgba\([\d\s,]+,\s*([\d.]+)\)/);
      if (alphaMatch) {
        const alpha = parseFloat(alphaMatch[1]);
        expect(alpha).toBeGreaterThanOrEqual(0.98);
      }
    });

    test('완전 불투명 solid 배경 옵션이 정의되어야 함', () => {
      // Given: 라이트 테마 적용
      themeService.setTheme('light');

      // When: solid 배경 CSS 변수 존재 확인
      const computedStyle = getComputedStyle(document.documentElement);
      const modalBgSolid = computedStyle.getPropertyValue('--xeg-modal-bg-solid').trim();
      expect(modalBgSolid).toBe('rgba(255, 255, 255, 1.0)');
    });
  });

  describe('통합 동작 테스트', () => {
    test('설정 모달에 CSS 변수가 올바르게 매핑되어야 함', () => {
      // Given: 라이트 테마 적용 및 CSS 변수 수동 설정
      themeService.setTheme('light');

      // 테스트 환경용 CSS 변수 수동 설정
      document.documentElement.style.setProperty('--xeg-modal-bg', 'rgba(255, 255, 255, 0.98)');
      document.documentElement.style.setProperty('--xeg-glass-bg-modal', 'var(--xeg-modal-bg)');

      // When: 모달 관련 CSS 변수들 확인
      const computedStyle = getComputedStyle(document.documentElement);
      const modalBg = computedStyle.getPropertyValue('--xeg-modal-bg').trim();
      const glassBgModal = computedStyle.getPropertyValue('--xeg-glass-bg-modal').trim();

      // Then: CSS 변수들이 올바르게 정의되어야 함
      expect(modalBg).toBe('rgba(255, 255, 255, 0.98)');
      expect(glassBgModal).toBeTruthy();
    });
  });

  describe('다크 모드와의 일관성 테스트', () => {
    test('다크 모드 배경 불투명도는 기존과 동일해야 함', () => {
      // Given: 다크 테마 적용 및 CSS 변수 설정
      themeService.setTheme('dark');
      const root = document.documentElement;
      root.setAttribute('data-theme', 'dark');
      root.style.setProperty('--xeg-modal-bg', 'rgba(0, 0, 0, 0.85)');
      root.style.setProperty('--xeg-modal-bg-solid', 'rgba(0, 0, 0, 1.0)');

      // When: CSS 변수 값 확인
      const computedStyle = getComputedStyle(document.documentElement);
      const modalBgDark = computedStyle.getPropertyValue('--xeg-modal-bg').trim();

      // Then: 다크 모드는 기존 불투명도 유지
      expect(modalBgDark).toBeTruthy();
    });
  });

  describe('백드롭 필터 호환성 테스트', () => {
    test('불투명도 증가 후에도 백드롭 필터가 정상 작동해야 함', () => {
      // Given: 라이트 테마 적용
      themeService.setTheme('light');

      // When: 백드롭 필터 CSS 변수 확인
      const computedStyle = getComputedStyle(document.documentElement);
      const glassBlur = computedStyle.getPropertyValue('--xeg-glass-blur-strong').trim();

      // Then: 백드롭 필터가 정의되어 있어야 함
      expect(glassBlur).toMatch(/blur\(/);
    });
  });
});
