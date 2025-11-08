/**
 * @fileoverview Toolbar Button Design Consistency Tests
 * @description TDD 기반 툴바 버튼 border-radius 일관성 검증
 */

/* eslint-disable no-undef */
import { readFileSync } from 'fs';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';
import { resolve } from 'path';

describe('Toolbar Button Design Consistency', () => {
  setupGlobalTestIsolation();

  let toolbarCssContent: string;
  let buttonCssContent: string;

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
    it('mediaCounter는 CSS 변수를 사용해야 한다', () => {
      const mediaCounterMatch = toolbarCssContent.match(
        /\.mediaCounter[^{}]*\{[^}]*border-radius:\s*([^;]+);/
      );

      expect(mediaCounterMatch).toBeTruthy();
      if (!mediaCounterMatch) {
        throw new Error('mediaCounter border-radius not found');
      }

      const borderRadiusValue = mediaCounterMatch[1]?.trim();
      expect(borderRadiusValue).toBe('var(--xeg-radius-md)');
    });

    it('fitModeGroup 래퍼가 없어도 버튼은 일관된 radius를 유지해야 한다', () => {
      const fitButtonMatch = toolbarCssContent.match(
        /\.fitButton[^{]*\{[^}]*border-radius:\s*([^;]+);/
      );

      expect(fitButtonMatch).toBeTruthy();
      if (!fitButtonMatch) {
        throw new Error('fitButton border-radius not found');
      }

      const borderRadiusValue = fitButtonMatch[1]?.trim();
      expect(borderRadiusValue).toBe('var(--xeg-radius-md)');
    });

    it('Button 컴포넌트는 통일된 CSS 변수를 사용해야 한다', () => {
      // Given: Button CSS 파일 검사
      // When: border-radius 값 찾기
      const borderRadiusMatches = buttonCssContent.match(/border-radius:\s*([^;]+);/g);

      expect(borderRadiusMatches).toBeTruthy();
      if (!borderRadiusMatches) {
        throw new Error('Button border-radius declarations not found');
      }
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
