/**
 * @fileoverview Toolbar CSS 중복 및 품질 스캔 테스트 (Phase 9.14 RED)
 * @description Toolbar.module.css의 중복 선언, !important 남용, 사용하지 않는 스타일 검증
 *
 * 목표:
 * - 중복 미디어 쿼리 검출
 * - !important 과다 사용 검출
 * - 호버 효과 중복 검출
 * - 미사용 position 스타일 검출
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

describe('Phase 9.14: Toolbar CSS Quality Scan (RED)', () => {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const toolbarCssPath = resolve(
    currentDir,
    '../../../src/shared/components/ui/Toolbar/Toolbar.module.css'
  );
  let cssContent: string;

  try {
    cssContent = readFileSync(toolbarCssPath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read Toolbar.module.css: ${error}`);
  }

  describe('미디어 쿼리 중복 검증', () => {
    it('should not have duplicate @media (max-width: 48em) declarations', () => {
      const mediaQuery = '@media (max-width: 48em)';
      const matches = cssContent.match(new RegExp(mediaQuery, 'g'));
      const count = matches ? matches.length : 0;

      expect(count).toBeLessThanOrEqual(
        1,
        `Found ${count} duplicate @media (max-width: 48em) declarations. Expected 1 or less.`
      );
    });

    it('should not have duplicate @media (max-width: 30em) declarations', () => {
      const mediaQuery = '@media (max-width: 30em)';
      const matches = cssContent.match(new RegExp(mediaQuery, 'g'));
      const count = matches ? matches.length : 0;

      expect(count).toBeLessThanOrEqual(
        1,
        `Found ${count} duplicate @media (max-width: 30em) declarations. Expected 1 or less.`
      );
    });

    it('should not have duplicate @media (prefers-contrast: high) declarations', () => {
      const mediaQuery = '@media (prefers-contrast: high)';
      const matches = cssContent.match(new RegExp(mediaQuery, 'g'));
      const count = matches ? matches.length : 0;

      expect(count).toBeLessThanOrEqual(
        1,
        `Found ${count} duplicate @media (prefers-contrast: high) declarations. Expected 1 or less.`
      );
    });
  });

  describe('!important 남용 검증', () => {
    it('should not use !important excessively in fitButton', () => {
      // fitButton 클래스 내에서 !important 사용 횟수 검출
      const fitButtonBlock = cssContent.match(/\.fitButton[^{]*\{[^}]*\}/gs);

      if (fitButtonBlock) {
        const importantCount = fitButtonBlock.join('').match(/!important/g)?.length || 0;

        expect(importantCount).toBe(
          0,
          `Found ${importantCount} !important declarations in fitButton. ` +
            `Expected 0. Use proper specificity instead.`
        );
      }
    });

    it('should have less than 10 total !important declarations in entire file', () => {
      const importantMatches = cssContent.match(/!important/g);
      const count = importantMatches ? importantMatches.length : 0;

      expect(count).toBeLessThan(
        10,
        `Found ${count} !important declarations. Expected less than 10. ` +
          `Refactor to use proper CSS specificity.`
      );
    });
  });

  describe('호버 효과 중복 검증', () => {
    it('should not have duplicate hover effect definitions', () => {
      // :hover 선택자를 포함하는 룰 개수 확인
      const hoverRules = cssContent.match(/[^{]+:hover[^{]*\{[^}]*\}/gs);
      const hoverCount = hoverRules ? hoverRules.length : 0;

      // toolbarButton:hover가 여러 변형과 함께 정의되므로 합리적인 임계값 설정
      expect(hoverCount).toBeLessThan(
        20,
        `Found ${hoverCount} :hover rules. Expected less than 20. ` +
          `Consider consolidating hover effects using CSS variables.`
      );
    });

    it('should use CSS variables for hover effects where possible', () => {
      // 호버 효과에서 하드코딩된 색상/값 대신 CSS 변수 사용 권장
      const hoverRules = cssContent.match(/[^{]+:hover[^{]*\{([^}]*)\}/gs);

      if (hoverRules) {
        const hardcodedColorInHover = hoverRules.some(rule => {
          const content = rule.match(/\{([^}]*)\}/)?.[1] || '';
          // rgba, rgb, #hex 색상이 var()로 감싸지지 않은 경우 검출
          return /(?:rgba?|#[0-9a-f]{3,8})\s*\(/i.test(content) && !content.includes('var(');
        });

        expect(hardcodedColorInHover).toBe(
          false,
          'Found hardcoded colors in :hover rules. Use CSS variables (--xeg-*) instead.'
        );
      }
    });
  });

  describe('미사용 position 스타일 검증', () => {
    it('should not have unused position styles for left/right/bottom', () => {
      // position="left|right|bottom"은 현재 사용하지 않으므로 관련 스타일 제거 권장
      const unusedPositionPatterns = [
        /\.galleryToolbar\[data-position=['"]left['"]\]/,
        /\.galleryToolbar\[data-position=['"]right['"]\]/,
        /\.galleryToolbar\[data-position=['"]bottom['"]\]/,
      ];

      const foundUnusedStyles = unusedPositionPatterns.some(pattern => pattern.test(cssContent));

      expect(foundUnusedStyles).toBe(
        false,
        'Found unused position styles (left/right/bottom). ' +
          'Remove or comment them as they are not currently used.'
      );
    });
  });

  describe('파일 크기 검증', () => {
    it('should have less than 450 lines', () => {
      const lines = cssContent.split('\n').length;

      expect(lines).toBeLessThanOrEqual(
        450,
        `Toolbar.module.css has ${lines} lines. Expected 450 or less. ` +
          `Consolidate duplicate rules and remove unused code.`
      );
    });
  });
});
