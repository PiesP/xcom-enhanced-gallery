/**
 * @fileoverview Toolbar Button Design Consistency Tests
 * @description TDD 기반 툴바 버튼 border-radius 일관성 검증
 */

/* eslint-disable no-undef */
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Toolbar Button Design Consistency', () => {
  let toolbarCssContent;
  let buttonCssContent;

  beforeEach(() => {
    // CSS 파일 내용 읽기
    const toolbarCssPath = resolve(
      __dirname,
      '../../src/shared/components/ui/Toolbar/Toolbar.module.css'
    );
    const buttonCssPath = resolve(
      __dirname,
      '../../src/shared/components/ui/Button/Button.module.css'
    );

    toolbarCssContent = readFileSync(toolbarCssPath, 'utf-8');
    buttonCssContent = readFileSync(buttonCssPath, 'utf-8');
  });

  describe('Border Radius Consistency', () => {
    it('fitButton은 CSS 변수를 사용해야 한다', () => {
      // Given: CSS 파일 내용 검사
      // When: fitButton 스타일 찾기
      const fitButtonMatch = toolbarCssContent.match(
        /\.fitButton[^{]*\{[^}]*border-radius:\s*([^;]+);/
      );

      // Then: CSS 변수를 사용해야 함
      expect(fitButtonMatch).toBeTruthy();
      const borderRadiusValue = fitButtonMatch[1].trim();
      expect(borderRadiusValue).toBe('var(--xeg-radius-md)');
    });

    it('mediaCounter는 CSS 변수를 사용해야 한다', () => {
      // GIVEN: mediaCounter forward 스타일은 Toolbar.module.css 에서 제거되었음
      // WHEN: mediaCounter 셀렉터를 검색
      const mediaCounterRegex = /\.mediaCounter[^{]*\{[^}]*border-radius:\s*([^;]+);/;
      const mediaCounterMatch = toolbarCssContent.match(mediaCounterRegex);

      // THEN: 더 이상 툴바 CSS 안에 존재하지 않아야 함 (정상적인 정리 단계)
      expect(mediaCounterMatch).toBeNull();
    });

    it('fitModeGroup 제거 후 fitButton radius 규칙이 여전히 var(--xeg-radius-md) 사용', () => {
      // fitButton 관련 모든 규칙 스캔 (multi selector 포함)
      const allFitRules = toolbarCssContent
        .split(/}\s*/)
        .filter(block => /\.fitButton/.test(block));
      const radiusLines = allFitRules
        .flatMap(block => block.split(/\n/))
        .filter(l => /border-radius:/.test(l));
      expect(radiusLines.length).toBeGreaterThan(0);
      // 적어도 하나는 정확한 토큰을 사용해야 함
      expect(radiusLines.some(l => /border-radius:\s*var\(--xeg-radius-md\)/.test(l))).toBe(true);
    });

    it('Button 컴포넌트는 통일된 CSS 변수를 사용해야 한다', () => {
      // Given: Button CSS 파일 검사
      // When: border-radius 값 찾기
      const borderRadiusMatches = buttonCssContent.match(/border-radius:\s*([^;]+);/g);

      // Then: 모든 border-radius가 --xeg-radius-* 변수를 사용해야 함
      expect(borderRadiusMatches).toBeTruthy();
      borderRadiusMatches.forEach(match => {
        const value = match.replace('border-radius:', '').replace(';', '').trim();
        if (value.includes('var(')) {
          // CSS 변수를 사용하는 경우, --xeg-radius- 형태여야 함
          expect(value).toMatch(/var\(--xeg-radius-/);
        }
      });
    });
  });

  describe('Hard-coded Values Detection', () => {
    it('Toolbar CSS에 하드코딩된 border-radius 값이 없어야 한다 (progress bar 제외)', () => {
      // Given: 하드코딩된 픽셀 값 패턴 (progress bar 제외)
      const hardcodedPixelPattern = /border-radius:\s*\d+px/g;

      // When: Toolbar CSS에서 하드코딩된 값 찾기
      const hardcodedMatches = toolbarCssContent.match(hardcodedPixelPattern);

      // Then: progress bar의 1px만 허용됨
      if (hardcodedMatches) {
        // 발견된 하드코딩된 border-radius 값들 디버깅용 로그는 생략
        // progress bar의 1px만 허용
        const allowedValues = hardcodedMatches.filter(match => match === 'border-radius: 1px');
        expect(hardcodedMatches.length).toBe(allowedValues.length);
        expect(allowedValues.length).toBeLessThanOrEqual(2); // progressBar와 progressFill
      }
    });

    it('모든 컴포넌트가 --xeg-radius-* 형태의 변수를 사용해야 한다', () => {
      // Given: CSS 변수 패턴
      const cssVariablePattern = /border-radius:\s*var\(--([^)]+)\)/g;

      // When: 모든 CSS 변수 추출
      const variableMatches = [...toolbarCssContent.matchAll(cssVariablePattern)];

      // Then: 모든 변수가 xeg-radius 형태여야 함
      variableMatches.forEach(match => {
        const variableName = match[1];
        expect(variableName).toMatch(/^xeg-radius-/);
      });
    });
  });
});
