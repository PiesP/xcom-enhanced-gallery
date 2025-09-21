/**
 * TDD (D1): 디자인 토큰 위반 검출 - 하드코딩된 값들을 토큰으로 대체
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// CSS 모듈 파일 검색 함수
function findCSSModules(dir) {
  const files = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findCSSModules(fullPath));
    } else if (entry.endsWith('.module.css')) {
      files.push(fullPath);
    }
  }

  return files;
}

describe('D1: Design token violations detection', () => {
  it('should detect hardcoded border-radius values in CSS modules', () => {
    // CSS 모듈 파일들에서 하드코딩된 border-radius 검출
    const cssFiles = findCSSModules('src');
    const hardcodedBorderRadius = [];

    cssFiles.forEach(file => {
      const content = readFileSync(file, 'utf-8');
      const borderRadiusMatches = content.match(/border-radius:\s*\d+px/g);
      if (borderRadiusMatches) {
        hardcodedBorderRadius.push(...borderRadiusMatches);
      }
    });

    // 하드코딩된 border-radius가 있으면 실패해야 함 (RED → GREEN)
    expect(hardcodedBorderRadius.length).toBe(0);
  });

  it('should detect hardcoded color values in CSS modules', () => {
    // CSS 모듈 파일들에서 하드코딩된 색상값 검출
    const cssFiles = findCSSModules('src');
    const hardcodedColors = [];

    cssFiles.forEach(file => {
      const content = readFileSync(file, 'utf-8');
      // RGB, HEX, HSL 등 하드코딩된 색상 검출
      const colorMatches = content.match(
        /(#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|hsl\([^)]+\)|rgba\([^)]+\)|hsla\([^)]+\))/g
      );
      if (colorMatches) {
        // 디자인 토큰이 아닌 하드코딩된 색상만 필터링
        const hardcoded = colorMatches.filter(
          color =>
            !color.includes('var(') &&
            !color.includes('oklch(') &&
            color !== '#fff' && // 기본 흰색은 예외
            color !== '#000' // 기본 검은색은 예외
        );
        hardcodedColors.push(...hardcoded);
      }
    });

    // 하드코딩된 색상이 있으면 실패해야 함 (RED → GREEN)
    expect(hardcodedColors.length).toBe(0);
  });

  it('should detect hardcoded shadow values in CSS modules', () => {
    // CSS 모듈 파일들에서 하드코딩된 shadow 값 검출
    const cssFiles = findCSSModules('src');
    const hardcodedShadows = [];

    cssFiles.forEach(file => {
      const content = readFileSync(file, 'utf-8');
      // box-shadow 하드코딩 검출
      const shadowMatches = content.match(/box-shadow:\s*[^;]+(?<!var\([^)]+\))/g);
      if (shadowMatches) {
        const hardcoded = shadowMatches.filter(
          shadow =>
            !shadow.includes('var(') &&
            shadow !== 'box-shadow: none' &&
            !shadow.includes('box-shadow: none !important')
        );
        hardcodedShadows.push(...hardcoded);
      }
    });

    // 하드코딩된 shadow가 있으면 실패해야 함 (RED → GREEN)
    expect(hardcodedShadows.length).toBe(0);
  });

  it('should not use named colors (white/black) directly in CSS modules', () => {
    const cssFiles = findCSSModules('src');
    const namedColorUsages: string[] = [];

    cssFiles.forEach(file => {
      const content = readFileSync(file, 'utf-8');
      // 속성 값으로 white/black이 직접 사용된 경우 탐지 (토큰 미사용)
      // var(--color-base-white) 같은 토큰은 해당되지 않도록 ':' 다음 값만 검사
      const matches = content.match(/:\s*(white|black)\b/gi);
      if (matches) {
        namedColorUsages.push(...matches.map(m => `${file} -> ${m}`));
      }
    });

    expect(namedColorUsages.length).toBe(0);
  });
});
