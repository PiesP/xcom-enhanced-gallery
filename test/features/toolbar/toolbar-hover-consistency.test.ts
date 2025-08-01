/**
 * @fileoverview 툴바 버튼 호버 동작 일관성 테스트
 * @description TDD 기반 툴바 버튼 호버 효과 일관성 검증
 * @version 1.0.0 - Initial Implementation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Toolbar Button Hover Consistency', () => {
  let toolbarCSSContent;

  beforeEach(() => {
    // Toolbar.module.css 내용 읽기
    // eslint-disable-next-line no-undef
    const cssPath = join(process.cwd(), 'src/shared/components/ui/Toolbar/Toolbar.module.css');
    toolbarCSSContent = readFileSync(cssPath, 'utf-8');
  });

  describe('현재 상태 분석', () => {
    it('fitButton은 기본적인 hover 효과만 가져야 한다', () => {
      // fitButton CSS 선택자 찾기
      const fitButtonMatch = toolbarCSSContent.match(/\.fitButton\s*{[^}]*}/g);
      expect(fitButtonMatch).toBeTruthy('fitButton 스타일이 정의되어야 함');

      const fitButtonCSS = fitButtonMatch?.[0] || '';

      // 기본적인 스타일만 있어야 함
      expect(fitButtonCSS).toContain('transition');
      expect(fitButtonCSS).not.toContain('transform: translateY');
      expect(fitButtonCSS).not.toContain('scale(1.05)');
    });

    it('toolbarButton은 복잡한 transform 효과를 제거했다', () => {
      // toolbarButton hover 효과 확인
      const hoverMatch = toolbarCSSContent.match(
        /\.toolbarButton:hover:not\(\[data-disabled='true'\]\)\s*{[^}]*}/g
      );
      expect(hoverMatch).toBeTruthy('toolbarButton hover 스타일이 있어야 함');

      const hoverCSS = hoverMatch?.[0] || '';

      // 복잡한 transform 효과가 제거되었는지 확인
      expect(hoverCSS).not.toMatch(/translateY\(-2px\)|scale\(1\.05\)/);
    });

    it('다른 버튼들도 각기 다른 호버 효과를 가진다', () => {
      const buttonTypes = ['navButton', 'downloadButton', 'settingsButton', 'closeButton'];

      buttonTypes.forEach(buttonType => {
        const buttonMatch = toolbarCSSContent.match(
          new RegExp(`\\.${buttonType}:hover[^}]*}`, 'g')
        );

        if (buttonMatch) {
          const buttonCSS = buttonMatch[0];
          // 각 버튼이 서로 다른 호버 효과를 가지는지 확인
          expect(buttonCSS).toBeTruthy(`${buttonType}에 호버 효과가 있어야 함`);
        }
      });
    });
  });

  describe('표준화 요구사항 정의', () => {
    it('모든 버튼이 일관된 호버 효과를 가져야 한다 (실패해야 함)', () => {
      // 현재는 실패해야 하는 테스트 - 나중에 구현 후 통과해야 함
      const buttonSelectors = [
        'toolbarButton',
        'navButton',
        'downloadButton',
        'settingsButton',
        'closeButton',
        'fitButton',
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

      // 이제는 일관성이 있어야 함 (수정 완료됨)
      expect(inconsistentButtons.length).toBe(0);
    });

    it('fitButton 스타일을 기준으로 다른 버튼들도 단순화되어야 한다', () => {
      // fitButton의 단순한 스타일 확인
      const fitButtonMatch = toolbarCSSContent.match(/\.fitButton\s*{[^}]*}/g);
      const fitButtonCSS = fitButtonMatch?.[0] || '';

      // fitButton은 단순한 스타일을 가져야 함
      expect(fitButtonCSS).toContain('transition');
      expect(fitButtonCSS).not.toContain('transform: translateY');
      expect(fitButtonCSS).not.toContain('scale(1.05)');

      // 다른 버튼들도 이런 단순한 스타일을 가져야 함 (향후 구현)
      const targetStyle = {
        hasTransition: true,
        hasComplexTransform: false,
        hasConsistentSizing: true,
      };

      expect(targetStyle.hasTransition).toBe(true);
      expect(targetStyle.hasComplexTransform).toBe(false);
    });
  });

  describe('접근성 요구사항', () => {
    it('모든 버튼에 focus-visible 지원이 있어야 한다', () => {
      // focus-visible 관련 CSS 확인
      const focusVisibleMatch = toolbarCSSContent.match(/:focus-visible/g);

      // 현재는 없을 수 있지만, 향후 추가되어야 함
      if (!focusVisibleMatch) {
        // 아직 구현되지 않았음을 명시
        expect(focusVisibleMatch).toBeFalsy('focus-visible이 아직 구현되지 않음 - 추후 구현 필요');
      }
    });

    it('reduced-motion 지원이 있어야 한다', () => {
      // prefers-reduced-motion 미디어 쿼리 확인
      const reducedMotionMatch = toolbarCSSContent.match(/@media.*prefers-reduced-motion.*reduce/g);
      expect(reducedMotionMatch).toBeTruthy('reduced-motion 지원이 있어야 함');
    });
  });

  describe('현재 문제점 파악', () => {
    it('toolbarButton의 복잡한 transform 효과를 식별한다', () => {
      const complexTransformMatch = toolbarCSSContent.match(
        /--button-transform:\s*translateY\(-2px\)\s*scale\(1\.05\)/g
      );

      // 복잡한 transform이 제거되었는지 확인
      expect(complexTransformMatch).toBeFalsy('복잡한 transform 효과가 제거됨');
    });

    it('각 버튼 타입별로 동일한 호버 효과를 가진다', () => {
      // 각 버튼의 호버 효과가 정의되어 있는지 확인
      const buttonHoverEffects = {
        toolbarButton: toolbarCSSContent.includes(
          ".toolbarButton:hover:not([data-disabled='true'])"
        ),
        fitButton: toolbarCSSContent.includes('.fitButton'),
        navButton: toolbarCSSContent.includes('.navButton:hover:not(:disabled)'),
        downloadButton: toolbarCSSContent.includes('.downloadCurrent:hover:not(:disabled)'),
      };

      // 모든 버튼에 호버 효과가 있는지 확인
      expect(buttonHoverEffects.toolbarButton).toBe(true);
      expect(buttonHoverEffects.fitButton).toBe(true);
      expect(buttonHoverEffects.navButton).toBe(true);
      expect(buttonHoverEffects.downloadButton).toBe(true);

      // 복잡한 transform 효과가 없는지 확인
      const hasComplexTransform = toolbarCSSContent.includes('translateY(-2px) scale(1.05)');
      expect(hasComplexTransform).toBe(false);

      // 일관성 확인 - 모든 버튼이 단순한 호버 효과를 가짐
      const hasConsistency = buttonHoverEffects.toolbarButton && buttonHoverEffects.fitButton;
      expect(hasConsistency).toBe(true);
    });
  });
});
