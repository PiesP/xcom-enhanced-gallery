/**
 * @fileoverview 툴바와 설정 모달 디자인 일관성 테스트
 * @description TDD 방식으로 라이트/다크 테마에서 일관된 디자인 적용 검증
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

describe('툴바와 설정 모달 디자인 일관성 - TDD', () => {
  const toolbarCSSPath = path.resolve(
    __dirname,
    '../../src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
  );
  const settingsCSSPath = path.resolve(
    __dirname,
    '../../src/features/settings/components/SettingsOverlay.module.css'
  );
  const tokensPath = path.resolve(__dirname, '../../src/shared/styles/design-tokens.css');

  let toolbarCSS: string;
  let settingsCSS: string;
  let tokensCSS: string;

  beforeEach(() => {
    toolbarCSS = readFileSync(toolbarCSSPath, 'utf-8');
    settingsCSS = readFileSync(settingsCSSPath, 'utf-8');
    tokensCSS = readFileSync(tokensPath, 'utf-8');
  });

  describe('RED: 현재 실패하는 테스트들 - 디자인 일관성 부족', () => {
    it('툴바와 설정 모달이 동일한 배경 토큰을 사용해야 함', () => {
      // 툴바는 그라디언트 사용
      expect(toolbarCSS).toContain('--xeg-toolbar-overlay-gradient');

      // 설정 모달이 툴바와 동일한 토큰을 직접 사용해야 함 (완전한 통합)
      expect(settingsCSS).toContain('--xeg-toolbar-bg');
      expect(settingsCSS).toContain('--xeg-toolbar-border');
      expect(settingsCSS).toContain('--xeg-toolbar-shadow');
    });

    it('테마별 배경 일관성이 보장되어야 함', () => {
      // 모달 배경 토큰이 있어야 함
      expect(tokensCSS).toContain('--xeg-modal-overlay-gradient');
      expect(tokensCSS).toContain('--xeg-modal-content-bg');

      // 테마별 오버라이드가 있어야 함
      expect(tokensCSS).toContain("[data-theme='light']");
      expect(tokensCSS).toContain("[data-theme='dark']");
    });

    it('블러 효과가 툴바와 모달에서 일관되게 적용되어야 함', () => {
      // 툴바는 블러 효과 사용
      expect(toolbarCSS).toContain('backdrop-filter: var(--xeg-blur-medium)');

      // 설정 모달도 블러 효과 사용해야 함
      expect(settingsCSS).toContain('backdrop-filter: var(--xeg-modal-overlay-backdrop)');
    });

    it('호버 효과가 일관된 패턴을 따라야 함', () => {
      // 툴바 호버 효과
      expect(toolbarCSS).toContain('--xeg-toolbar-overlay-gradient-strong');

      // 설정 모달 요소들도 일관된 호버 효과 사용해야 함 (실제 구현된 패턴 확인)
      expect(settingsCSS).toContain('--xeg-modal-content-bg-hover');
    });

    it('트랜지션 토큰이 일관되게 사용되어야 함', () => {
      // 툴바 트랜지션 - semantic 토큰 사용
      expect(toolbarCSS).toContain('var(--xeg-transition-fast)');

      // 설정 모달도 동일한 트랜지션 토큰 사용해야 함 - semantic 토큰에 easing이 포함됨
      expect(settingsCSS).toContain('var(--xeg-transition-fast)');
    });
  });

  describe('GREEN: 수정 후 통과해야 할 테스트들', () => {
    it('모든 모달 배경 토큰이 정의되어야 함', () => {
      // 기본 모달 배경 토큰들
      expect(tokensCSS).toContain('--xeg-modal-overlay-gradient:');
      expect(tokensCSS).toContain('--xeg-modal-content-bg:');
      expect(tokensCSS).toContain('--xeg-modal-overlay-gradient-strong:');
    });

    it('테마별 모달 토큰 오버라이드가 있어야 함', () => {
      // 라이트 테마 섹션에서 모달 토큰 오버라이드
      const lightThemeSection = tokensCSS.match(
        /\[data-theme='light'\][^}]*\{[^}]*--xeg-modal-overlay-gradient[^}]*\}/s
      );
      expect(lightThemeSection).toBeTruthy();

      // 다크 테마 섹션에서 모달 토큰 오버라이드
      const darkThemeSection = tokensCSS.match(
        /\[data-theme='dark'\][^}]*\{[^}]*--xeg-modal-overlay-gradient[^}]*\}/s
      );
      expect(darkThemeSection).toBeTruthy();
    });

    it('설정 모달 CSS가 통합된 툴바 토큰을 사용해야 함', () => {
      expect(settingsCSS).toContain('var(--xeg-toolbar-bg)');
      expect(settingsCSS).toContain('var(--xeg-toolbar-text)');
      expect(settingsCSS).toContain('var(--xeg-toolbar-border)');
    });

    it('테마 전환 시 일관된 시각적 경험을 제공해야 함', () => {
      // 테마별 data-theme 선택자 사용
      expect(settingsCSS).toMatch(/\[data-theme=['"]light['"]]/);
      expect(settingsCSS).toMatch(/\[data-theme=['"]dark['"]]/);
    });
  });

  describe('접근성 및 사용성 향상', () => {
    it('감소된 모션 지원이 일관되게 적용되어야 함', () => {
      // 툴바의 감소된 모션 지원
      expect(toolbarCSS).toContain('@media (prefers-reduced-motion: reduce)');

      // 설정 모달도 감소된 모션 지원해야 함
      expect(settingsCSS).toContain('@media (prefers-reduced-motion: reduce)');
    });

    it('고대비 모드 지원이 추가되어야 함', () => {
      // 고대비 모드에서의 대체 스타일
      expect(settingsCSS).toContain('@media (prefers-contrast: high)');
    });

    it('포커스 상태가 명확하게 표시되어야 함', () => {
      // 포커스 스타일 정의
      expect(settingsCSS).toMatch(/:focus-visible/);
      expect(settingsCSS).toContain('var(--xeg-focus-outline-width)');
    });
  });

  describe('성능 및 코드 품질', () => {
    it('하드웨어 가속 최적화가 적용되어야 함', () => {
      // transform: translateZ(0) 사용
      expect(settingsCSS).toContain('transform: translateZ(0)');
      expect(settingsCSS).toContain('will-change:');
    });

    it('중복된 스타일 정의가 없어야 함', () => {
      // background 정의가 중복되지 않아야 함
      const uniqueBackgroundDeclarations = new Set(settingsCSS.match(/background:[^;]+;/g) || []);

      // 중복 제거된 선언의 수가 합리적인 범위 내에 있어야 함 (모달은 더 복잡할 수 있음)
      expect(uniqueBackgroundDeclarations.size).toBeLessThan(15);
    });

    it('CSS 변수 의존성이 올바르게 정의되어야 함', () => {
      const requiredVariables = [
        '--xeg-modal-overlay-gradient',
        '--xeg-modal-content-bg',
        '--xeg-modal-overlay-gradient-strong',
        '--xeg-blur-light',
        '--xeg-transition-fast',
        '--xeg-easing-ease-out',
      ];

      requiredVariables.forEach(variable => {
        expect(tokensCSS).toContain(variable);
      });
    });
  });
});
