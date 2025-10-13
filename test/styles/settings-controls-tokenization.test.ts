/**
 * @fileoverview SettingsControls 디자인 토큰 정책 테스트
 * @description Phase 51.3 - 하드코딩 방지 테스트 (TDD RED → GREEN)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Phase 51.3: SettingsControls 디자인 토큰 정책', () => {
  const cssFilePath = resolve(
    __dirname,
    '../../src/shared/components/ui/Settings/SettingsControls.module.css'
  );
  const cssContent = readFileSync(cssFilePath, 'utf-8');

  it('하드코딩된 px 값이 fallback으로 사용되지 않아야 함', () => {
    // fallback 패턴 검출: var(--token, 12px)
    const hardcodedFallbacks = cssContent.match(/var\([^)]+,\s*\d+px[^)]*\)/g);

    if (hardcodedFallbacks) {
      console.error('발견된 하드코딩 fallback:', hardcodedFallbacks);
    }

    expect(hardcodedFallbacks).toBeNull();
  });

  it('비표준 토큰명을 사용하지 않아야 함', () => {
    // --xeg-border-radius-* 대신 --xeg-radius-* 사용
    const nonStandardRadiusTokens = cssContent.match(/--xeg-border-radius-/g);

    if (nonStandardRadiusTokens) {
      console.error('비표준 radius 토큰:', nonStandardRadiusTokens);
    }

    expect(nonStandardRadiusTokens).toBeNull();
  });

  it('transition 토큰명이 표준을 따라야 함', () => {
    // --xeg-transition-duration-* 대신 --xeg-duration-* 사용
    const oldDurationTokens = cssContent.match(/--xeg-transition-duration-/g);

    if (oldDurationTokens) {
      console.error('비표준 duration 토큰:', oldDurationTokens);
    }

    expect(oldDurationTokens).toBeNull();

    // --xeg-transition-easing 대신 --xeg-ease-* 사용
    const oldEasingTokens = cssContent.match(/--xeg-transition-easing/g);

    if (oldEasingTokens) {
      console.error('비표준 easing 토큰:', oldEasingTokens);
    }

    expect(oldEasingTokens).toBeNull();
  });

  it('모든 색상 값이 토큰을 사용해야 함 (하드코딩 금지)', () => {
    // 하드코딩된 색상 검출 (주석 제외)
    const lines = cssContent.split('\n');
    const hardcodedColors: string[] = [];

    lines.forEach((line, index) => {
      // 주석 라인 제외
      if (line.trim().startsWith('/*') || line.trim().startsWith('*')) {
        return;
      }

      // hex 색상
      const hexMatches = line.match(/:\s*#[0-9a-fA-F]{3,8}/g);
      if (hexMatches) {
        hardcodedColors.push(`Line ${index + 1}: ${line.trim()}`);
      }

      // rgba/rgb 색상
      const rgbaMatches = line.match(/:\s*rgba?\([^)]+\)/g);
      if (rgbaMatches) {
        hardcodedColors.push(`Line ${index + 1}: ${line.trim()}`);
      }
    });

    if (hardcodedColors.length > 0) {
      console.error('발견된 하드코딩 색상:', hardcodedColors);
    }

    expect(hardcodedColors).toHaveLength(0);
  });

  it('spacing 값은 var(--space-*) 또는 var(--xeg-spacing-*)를 사용해야 함', () => {
    // padding, margin, gap에서 직접 px 값 사용 검출
    const lines = cssContent.split('\n');
    const hardcodedSpacing: string[] = [];

    lines.forEach((line, index) => {
      // 주석 라인 제외
      if (line.trim().startsWith('/*') || line.trim().startsWith('*')) {
        return;
      }

      // padding, margin, gap 속성에서 px 값 직접 사용
      if (/(padding|margin|gap):\s*\d+px/.test(line)) {
        // var() 안에 있는지 확인
        if (!line.includes('var(')) {
          hardcodedSpacing.push(`Line ${index + 1}: ${line.trim()}`);
        }
      }
    });

    if (hardcodedSpacing.length > 0) {
      console.error('발견된 하드코딩 spacing:', hardcodedSpacing);
    }

    expect(hardcodedSpacing).toHaveLength(0);
  });

  it('font-size 값은 토큰을 사용해야 함', () => {
    // font-size: 14px 같은 하드코딩 검출
    const lines = cssContent.split('\n');
    const hardcodedFontSize: string[] = [];

    lines.forEach((line, index) => {
      // 주석 라인 제외
      if (line.trim().startsWith('/*') || line.trim().startsWith('*')) {
        return;
      }

      // font-size에서 px/em/rem 값 직접 사용
      if (/font-size:\s*\d+(?:px|em|rem)/.test(line)) {
        // var() 안에 있는지 확인
        if (!line.includes('var(')) {
          hardcodedFontSize.push(`Line ${index + 1}: ${line.trim()}`);
        }
      }
    });

    if (hardcodedFontSize.length > 0) {
      console.error('발견된 하드코딩 font-size:', hardcodedFontSize);
    }

    expect(hardcodedFontSize).toHaveLength(0);
  });

  it('font-weight 값은 토큰을 사용해야 함', () => {
    // font-weight: 500 같은 하드코딩 검출
    const lines = cssContent.split('\n');
    const hardcodedFontWeight: string[] = [];

    lines.forEach((line, index) => {
      // 주석 라인 제외
      if (line.trim().startsWith('/*') || line.trim().startsWith('*')) {
        return;
      }

      // font-weight에서 숫자 값 직접 사용
      if (/font-weight:\s*\d{3}/.test(line)) {
        // var() 안에 있는지 확인
        if (!line.includes('var(')) {
          hardcodedFontWeight.push(`Line ${index + 1}: ${line.trim()}`);
        }
      }
    });

    if (hardcodedFontWeight.length > 0) {
      console.error('발견된 하드코딩 font-weight:', hardcodedFontWeight);
    }

    expect(hardcodedFontWeight).toHaveLength(0);
  });
});
