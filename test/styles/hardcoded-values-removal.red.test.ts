/**
 * Epic CSS-TOKEN-UNIFY-001 Phase C: 하드코딩 값 제거
 *
 * RED 테스트: CSS 파일에서 하드코딩된 값 감지
 *
 * 목표:
 * - 색상 값 (hex, rgb, hsl) → design token
 * - 간격 값 (px, rem 하드코딩) → spacing token
 * - 애니메이션 duration/timing → animation token
 * - Border-radius 하드코딩 → radius token
 */

import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

// CSS 모듈 파일 검색
function findCSSFiles(dir: string, pattern = '.css'): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !entry.includes('node_modules')) {
      files.push(...findCSSFiles(fullPath, pattern));
    } else if (entry.endsWith(pattern)) {
      files.push(fullPath);
    }
  }

  return files;
}

// 허용된 하드코딩 값 (흑백, transparent 등)
const ALLOWED_COLORS = [
  '#fff',
  '#000',
  '#ffffff',
  '#000000',
  'transparent',
  'currentColor',
  'inherit',
  'initial',
  'unset',
];

// 하드코딩 색상 감지 (hex, rgb, hsl 등)
function findHardcodedColors(content: string, filePath: string): string[] {
  const colorMatches = content.match(
    /(#[0-9a-fA-F]{3,8}|rgb\([^)]+\)|hsl\([^)]+\)|rgba\([^)]+\)|hsla\([^)]+\))/g
  );

  if (!colorMatches) return [];

  // design-tokens.primitive.css는 토큰 정의 파일이므로 제외
  const isPrimitiveTokenFile = filePath.includes('design-tokens.primitive.css');

  return colorMatches.filter(
    color =>
      !isPrimitiveTokenFile && // Primitive 토큰 정의는 허용
      !ALLOWED_COLORS.includes(color.toLowerCase()) &&
      !color.includes('var(') &&
      !color.includes('oklch(') // OKLCH는 허용 (현대 CSS)
  );
}

// 하드코딩 간격 값 감지 (margin, padding 등의 px/rem 직접 사용)
function findHardcodedSpacing(content: string): string[] {
  // margin, padding, gap 등에서 px/rem 직접 사용 감지
  // border-* 속성은 제외 (border-width이므로 간격이 아님)
  const spacingMatches = content.match(
    /(?<!border-)(?<!border-block-)(?<!border-inline-)(margin|padding|gap|top|bottom|left|right):\s*(\d+(?:\.\d+)?(?:px|rem|em))/gi
  );

  if (!spacingMatches) return [];

  return spacingMatches.filter(match => {
    // 0px, 0rem, 1px (border 등에 필요) 제외
    const value = match.match(/(\d+(?:\.\d+)?(?:px|rem|em))/)?.[0];
    if (!value) return false;
    const numValue = parseFloat(value);
    return numValue !== 0 && numValue !== 1;
  });
}

// 하드코딩 애니메이션 duration/timing 감지
function findHardcodedAnimations(content: string): string[] {
  const animationMatches = content.match(/(animation|transition):\s*[^;]+/gi);

  if (!animationMatches) return [];

  return animationMatches.filter(match => {
    // duration이 ms나 s로 하드코딩되어 있고 var()가 없는 경우
    const hasDuration = /\d+(?:\.\d+)?(?:ms|s)/.test(match);
    const hasVar = /var\(/.test(match);
    return hasDuration && !hasVar;
  });
}

// 하드코딩 border-radius 감지
function findHardcodedBorderRadius(content: string): string[] {
  const radiusMatches = content.match(/border-radius:\s*(\d+(?:\.\d+)?(?:px|rem|em|%))/gi);

  if (!radiusMatches) return [];

  return radiusMatches.filter(match => {
    // 0 값 제외, var() 사용 제외
    const hasVar = /var\(/.test(match);
    const value = match.match(/(\d+(?:\.\d+)?)/)?.[0];
    return !hasVar && value && parseFloat(value) !== 0;
  });
}

// Box-shadow 하드코딩 감지
function findHardcodedShadows(content: string): string[] {
  const shadowMatches = content.match(/box-shadow:\s*[^;]+/gi);

  if (!shadowMatches) return [];

  return shadowMatches.filter(shadow => {
    // var() 사용 제외
    if (shadow.includes('var(')) return false;

    // box-shadow: none 제외
    if (shadow.trim().toLowerCase() === 'box-shadow: none') return false;

    // box-shadow: none !important 제외 (성능 최적화용)
    if (/box-shadow:\s*none\s*!important/i.test(shadow)) return false;

    return true;
  });
}

describe('Epic CSS-TOKEN-UNIFY-001 Phase C: 하드코딩 값 제거', () => {
  const cssFiles = findCSSFiles(path.join(projectRoot, 'src'), '.css');

  describe('Colors: 하드코딩된 색상 값이 없어야 함', () => {
    it('should NOT have hardcoded color values (hex, rgb, hsl)', () => {
      const violations: Record<string, string[]> = {};

      cssFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const hardcoded = findHardcodedColors(content, file);

        if (hardcoded.length > 0) {
          const relativePath = path.relative(projectRoot, file);
          violations[relativePath] = hardcoded;
        }
      });

      // RED: 하드코딩 색상 발견 시 실패
      expect(violations).toEqual({});
    });
  });

  describe('Spacing: 하드코딩된 간격 값이 없어야 함', () => {
    it('should NOT have hardcoded spacing values (margin, padding, gap)', () => {
      const violations: Record<string, string[]> = {};

      cssFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const hardcoded = findHardcodedSpacing(content);

        if (hardcoded.length > 0) {
          const relativePath = path.relative(projectRoot, file);
          violations[relativePath] = hardcoded;
        }
      });

      // RED: 하드코딩 간격 발견 시 실패
      expect(violations).toEqual({});
    });
  });

  describe('Animations: 하드코딩된 애니메이션 duration/timing이 없어야 함', () => {
    it('should NOT have hardcoded animation durations', () => {
      const violations: Record<string, string[]> = {};

      cssFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const hardcoded = findHardcodedAnimations(content);

        if (hardcoded.length > 0) {
          const relativePath = path.relative(projectRoot, file);
          violations[relativePath] = hardcoded;
        }
      });

      // RED: 하드코딩 애니메이션 발견 시 실패
      expect(violations).toEqual({});
    });
  });

  describe('Border-radius: 하드코딩된 border-radius 값이 없어야 함', () => {
    it('should NOT have hardcoded border-radius values', () => {
      const violations: Record<string, string[]> = {};

      cssFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const hardcoded = findHardcodedBorderRadius(content);

        if (hardcoded.length > 0) {
          const relativePath = path.relative(projectRoot, file);
          violations[relativePath] = hardcoded;
        }
      });

      // RED: 하드코딩 border-radius 발견 시 실패
      expect(violations).toEqual({});
    });
  });

  describe('Shadows: 하드코딩된 box-shadow 값이 없어야 함', () => {
    it('should NOT have hardcoded box-shadow values', () => {
      const violations: Record<string, string[]> = {};

      cssFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const hardcoded = findHardcodedShadows(content);

        if (hardcoded.length > 0) {
          const relativePath = path.relative(projectRoot, file);
          violations[relativePath] = hardcoded;
        }
      });

      // RED: 하드코딩 box-shadow 발견 시 실패
      expect(violations).toEqual({});
    });
  });

  describe('Phase C Validation: 전체 하드코딩 값 제거 확인', () => {
    it('should have all hardcoded values replaced with design tokens', () => {
      const allViolations: Record<string, { type: string; values: string[] }[]> = {};

      cssFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const relativePath = path.relative(projectRoot, file);
        const fileViolations = [];

        const colors = findHardcodedColors(content, file);
        if (colors.length > 0) {
          fileViolations.push({ type: 'colors', values: colors });
        }

        const spacing = findHardcodedSpacing(content);
        if (spacing.length > 0) {
          fileViolations.push({ type: 'spacing', values: spacing });
        }

        const animations = findHardcodedAnimations(content);
        if (animations.length > 0) {
          fileViolations.push({ type: 'animations', values: animations });
        }

        const radius = findHardcodedBorderRadius(content);
        if (radius.length > 0) {
          fileViolations.push({ type: 'border-radius', values: radius });
        }

        const shadows = findHardcodedShadows(content);
        if (shadows.length > 0) {
          fileViolations.push({ type: 'box-shadow', values: shadows });
        }

        if (fileViolations.length > 0) {
          allViolations[relativePath] = fileViolations;
        }
      });

      // RED: 모든 하드코딩 값 발견 시 실패
      expect(allViolations).toEqual({});
    });
  });
});
