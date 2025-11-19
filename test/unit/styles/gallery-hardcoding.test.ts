/**
 * @fileoverview Gallery.module.css 하드코딩 검증 테스트
 * @description Phase 37 - 하드코딩된 px 값 검증 (RED → GREEN)
 */

import { readFileSync } from 'node:fs';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GALLERY_CSS_PATH = resolve(__dirname, '../../fixtures/gallery/Gallery.module.css');

function readGalleryCss(): string {
  return readFileSync(GALLERY_CSS_PATH, 'utf-8');
}

describe('Phase 37 - Gallery.module.css 하드코딩 제거', () => {
  setupGlobalTestIsolation();

  describe('Step 2: font-size 토큰화', () => {
    test('should not have hardcoded font-size values', () => {
      const css = readGalleryCss();

      // font-size: <number>px (주석 제외)
      const hardcodedFontSize = /font-size:\s*\d+px(?!\s*;?\s*\/\*)/g;
      const matches = css.match(hardcodedFontSize);

      if (matches) {
        console.error('Found hardcoded font-size:', matches);
      }

      expect(matches).toBeNull();
    });
  });

  describe('Step 3: spacing 토큰화', () => {
    test('should not have hardcoded padding values', () => {
      const css = readGalleryCss();

      // padding: <number>px 또는 padding-*: <number>px (주석 제외)
      const hardcodedPadding = /padding(-\w+)?:\s*\d+px(?!\s*;?\s*\/\*)/g;
      const matches = css.match(hardcodedPadding);

      if (matches) {
        console.error('Found hardcoded padding:', matches);
      }

      expect(matches).toBeNull();
    });

    test('should not have hardcoded margin values', () => {
      const css = readGalleryCss();

      // margin: <number>px 또는 margin-*: <number>px (주석 제외)
      const hardcodedMargin = /margin(-\w+)?:\s*\d+px(?!\s*;?\s*\/\*)/g;
      const matches = css.match(hardcodedMargin);

      if (matches) {
        console.error('Found hardcoded margin:', matches);
      }

      expect(matches).toBeNull();
    });

    test('should not have hardcoded gap values', () => {
      const css = readGalleryCss();

      // gap: <number>px (주석 제외)
      const hardcodedGap = /gap:\s*\d+px(?!\s*;?\s*\/\*)/g;
      const matches = css.match(hardcodedGap);

      if (matches) {
        console.error('Found hardcoded gap:', matches);
      }

      expect(matches).toBeNull();
    });

    test('should not have hardcoded top/bottom/left/right values', () => {
      const css = readGalleryCss();

      // top/bottom/left/right: <number>px (주석 제외, 50% 등 백분율 제외)
      const hardcodedPosition = /(top|bottom|left|right):\s*\d+px(?!\s*;?\s*\/\*)/g;
      const matches = css.match(hardcodedPosition);

      if (matches) {
        console.error('Found hardcoded position:', matches);
      }

      expect(matches).toBeNull();
    });
  });

  describe('Step 4: size 토큰화', () => {
    test('should not have hardcoded width values', () => {
      const css = readGalleryCss();

      // width: <number>px (주석, max-width, .srOnly 컨텍스트 제외)
      const hardcodedWidth = /(?<!max-)width:\s*\d+px(?!\s*;?\s*\/\*)/g;
      const matches = css.match(hardcodedWidth);

      if (matches) {
        // .srOnly 컨텍스트인지 검증 (접근성 패턴 예외)
        const nonSrOnlyMatches = matches.filter(match => {
          const index = css.indexOf(match);
          const before = css.substring(Math.max(0, index - 200), index);
          return !before.includes('.srOnly');
        });

        if (nonSrOnlyMatches.length > 0) {
          console.error('Found hardcoded width:', nonSrOnlyMatches);
        }
        expect(nonSrOnlyMatches.length).toBe(0);
      }
    });

    test('should not have hardcoded height values', () => {
      const css = readGalleryCss();

      // height: <number>px (주석, max-height, .srOnly 컨텍스트 제외)
      const hardcodedHeight = /(?<!max-)height:\s*\d+px(?!\s*;?\s*\/\*)/g;
      const matches = css.match(hardcodedHeight);

      if (matches) {
        // .srOnly 컨텍스트인지 검증 (접근성 패턴 예외)
        const nonSrOnlyMatches = matches.filter(match => {
          const index = css.indexOf(match);
          const before = css.substring(Math.max(0, index - 200), index);
          return !before.includes('.srOnly');
        });

        if (nonSrOnlyMatches.length > 0) {
          console.error('Found hardcoded height:', nonSrOnlyMatches);
        }
        expect(nonSrOnlyMatches.length).toBe(0);
      }
    });
  });

  describe('Step 5: PC 전용 정책 준수', () => {
    test('should not have mobile media queries (max-width)', () => {
      const css = readGalleryCss();

      // @media (max-width: ...) 패턴
      const mobileMediaQuery = /@media\s*\([^)]*max-width[^)]*\)/g;
      const matches = css.match(mobileMediaQuery);

      if (matches) {
        console.error('Found mobile media queries:', matches);
      }

      expect(matches).toBeNull();
    });

    test('should not have mobile breakpoints (768px, 480px)', () => {
      const css = readGalleryCss();

      // 768px, 480px 등 모바일 브레이크포인트 (Container Query는 PC용이므로 제외)
      const mobileBreakpoints = /(768|480)px/g;
      const matches = css.match(mobileBreakpoints);

      if (matches) {
        // Container Query (width > 768px)는 PC용 min-width이므로 제외
        const nonContainerMatches = matches.filter(match => {
          const index = css.indexOf(match);
          const before = css.substring(Math.max(0, index - 50), index);
          return !before.includes('width >'); // (width > 768px)는 PC용
        });

        if (nonContainerMatches.length > 0) {
          console.error('Found mobile breakpoints:', nonContainerMatches);
        }
        expect(nonContainerMatches.length).toBe(0);
      }
    });
  });
});
