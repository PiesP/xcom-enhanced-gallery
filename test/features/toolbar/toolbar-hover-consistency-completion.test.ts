/**
 * @fileoverview 툴바 버튼 호버 동작 일관성 완료 검증 테스트
 * @description 수정 완료 후 일관성 검증
 * @version 1.0.0 - Completion Verification
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Toolbar Button Hover Consistency - Completion', () => {
  let toolbarCSSContent;

  beforeEach(() => {
    // eslint-disable-next-line no-undef
    const cssPath = join(process.cwd(), 'src/shared/components/ui/Toolbar/Toolbar.module.css');
    toolbarCSSContent = readFileSync(cssPath, 'utf-8');
  });

  describe('수정 완료 검증', () => {
    it('toolbarButton에서 복잡한 transform 효과가 제거되었다', () => {
      const hoverMatch = toolbarCSSContent.match(
        /\.toolbarButton:hover:not\(\[data-disabled='true'\]\)\s*{[^}]*}/g
      );
      expect(hoverMatch).toBeTruthy();

      const hoverCSS = hoverMatch[0];

      // 복잡한 transform 효과가 제거되었는지 확인
      expect(hoverCSS).not.toMatch(/translateY\(-2px\)|scale\(1\.05\)/);
      expect(hoverCSS).toContain('/* 복잡한 transform 효과 제거 */');
    });

    it('모든 버튼이 일관된 단순한 호버 효과를 가진다', () => {
      const buttonSelectors = [
        'toolbarButton',
        'navButton',
        'downloadButton',
        'settingsButton',
        'closeButton',
      ];

      const inconsistentButtons = [];

      buttonSelectors.forEach(selector => {
        const hoverMatch = toolbarCSSContent.match(new RegExp(`\\.${selector}:hover[^}]*}`, 'g'));

        if (hoverMatch) {
          const hoverCSS = hoverMatch[0];

          // 복잡한 transform 효과가 있으면 일관성 없음
          if (hoverCSS.match(/translateY\(-2px\)|scale\(1\.05\)/)) {
            inconsistentButtons.push(selector);
          }
        }
      });

      // 모든 버튼이 일관되어야 함
      expect(inconsistentButtons.length).toBe(0);
    });

    it('focus-visible 지원이 추가되었다', () => {
      const focusVisibleMatch = toolbarCSSContent.match(/:focus-visible/g);
      expect(focusVisibleMatch).toBeTruthy('focus-visible 지원이 추가됨');

      // 모든 버튼 타입에 focus-visible이 적용되었는지 확인
      const buttonTypes = [
        'toolbarButton',
        'navButton',
        'downloadButton',
        'settingsButton',
        'closeButton',
        'fitButton',
      ];
      buttonTypes.forEach(buttonType => {
        expect(toolbarCSSContent).toContain(`.${buttonType}:focus-visible`);
      });
    });

    it('모든 호버 효과에 명확한 주석이 있다', () => {
      const hoverSections = toolbarCSSContent.match(/\.[\w]+:hover[^}]*}/g) || [];

      hoverSections.forEach(section => {
        // transform 효과 제거 주석이 있는지 확인
        if (
          section.includes('toolbarButton') ||
          section.includes('navButton') ||
          section.includes('downloadButton') ||
          section.includes('settingsButton') ||
          section.includes('closeButton')
        ) {
          // 주석이 있는지 또는 단순한 호버 효과인지 확인
          const hasExpectedComment = section.match(
            /\/\*.*단순한.*호버.*효과.*\*\/|\/\*.*transform.*제거.*\*\/|\/\*.*fitButton.*기준.*\*\//
          );
          const hasSimpleHover =
            section.includes('background:') || section.includes('border-color:');

          expect(hasExpectedComment || hasSimpleHover).toBeTruthy(
            '적절한 주석 또는 단순한 호버 효과가 있어야 합니다'
          );
        }
      });
    });

    it('fitButton 기준 스타일이 다른 버튼들에 적용되었다', () => {
      // fitButton의 단순함이 다른 버튼에도 적용되었는지 확인
      const buttonHoverSelectors = [
        '.toolbarButton:hover',
        '.navButton:hover',
        '.downloadButton:hover',
        '.settingsButton:hover',
        '.closeButton:hover',
      ];

      buttonHoverSelectors.forEach(selector => {
        const match = toolbarCSSContent.match(
          new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^}]*}`, 'g')
        );
        if (match) {
          const css = match[0];

          // 단순한 색상 변경만 있어야 함
          expect(css).toMatch(/background:|border-color:|color:/);

          // 복잡한 transform이나 복잡한 shadow는 없어야 함
          expect(css).not.toMatch(/translateY\(-2px\)|scale\(1\.05\)/);
          expect(css).not.toMatch(/0 8px 24px|0 4px 12px/); // 복잡한 shadow
        }
      });
    });
  });

  describe('접근성 및 호환성 검증', () => {
    it('reduced-motion 지원이 유지되었다', () => {
      const reducedMotionMatch = toolbarCSSContent.match(/@media.*prefers-reduced-motion.*reduce/g);
      expect(reducedMotionMatch).toBeTruthy('reduced-motion 지원 유지');
    });

    it('고대비 모드 지원이 유지되었다', () => {
      const highContrastMatch = toolbarCSSContent.match(/@media.*prefers-contrast.*high/g);
      expect(highContrastMatch).toBeTruthy('고대비 모드 지원 유지');
    });

    it('모바일 반응형 지원이 유지되었다', () => {
      const mobileMatch = toolbarCSSContent.match(/@media.*max-width.*768px/g);
      expect(mobileMatch).toBeTruthy('모바일 반응형 지원 유지');
    });
  });

  describe('최종 품질 검증', () => {
    it('CSS 구조가 깔끔하게 정리되었다', () => {
      // 중복된 스타일이 없는지 확인
      const hoverRules = toolbarCSSContent.match(/\.[\w]+:hover[^}]*}/g) || [];

      // 각 버튼 타입별로 호버 규칙이 하나씩만 있어야 함
      const buttonTypes = [
        'toolbarButton',
        'navButton',
        'downloadButton',
        'settingsButton',
        'closeButton',
      ];
      buttonTypes.forEach(buttonType => {
        const typeSpecificHovers = hoverRules.filter(rule => rule.includes(buttonType));
        expect(typeSpecificHovers.length).toBeLessThanOrEqual(4); // :hover, :not(:disabled), focus-visible 등 고려
      });
    });

    it('주석이 명확하고 일관되다', () => {
      // fitButton 기준 주석이나 transform 제거 주석이 있는지 확인
      expect(toolbarCSSContent).toMatch(
        /\/\*.*fitButton.*기준.*\*\/|\/\*.*transform.*효과.*제거.*\*\//
      );
    });
  });
});
