/**
 * Phase 111.1: Toast 색상 토큰 흑백 통일 테스트
 *
 * 목표:
 * - Toast 색상 토큰이 흑백(gray) 기반인지 검증
 * - 색상(chromatic) 토큰 사용 금지 (chroma > 0)
 * - 기존 gray 토큰 재사용 확인
 *
 * 배경:
 * - Phase 110.2에서 Toast 아이콘 차별화 완료 (색상 없이도 타입 구분 가능)
 * - 사용자 요청: 프로젝트 전체 흑백 통일
 *
 * @group phase-111
 * @group styles
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const SEMANTIC_TOKENS_PATH = join(process.cwd(), 'src/shared/styles/design-tokens.semantic.css');

describe('Phase 111.1: Toast Colors Monochrome Validation', () => {
  const semanticTokens = readFileSync(SEMANTIC_TOKENS_PATH, 'utf-8');

  describe('Toast Background Tokens (흑백 통일)', () => {
    it('--xeg-toast-bg-info는 gray 기반 토큰을 사용해야 함', () => {
      const match = semanticTokens.match(/--xeg-toast-bg-info:\s*([^;]+);/);
      expect(match, '--xeg-toast-bg-info 토큰이 정의되어야 함').toBeTruthy();

      const value = match![1].trim();

      // var(--xeg-*) 또는 var(--color-gray-*) 사용 확인
      const isGrayToken =
        value.includes('var(--xeg-surface-glass-bg)') || value.includes('var(--color-gray-');

      // 직접 oklch 정의 시 chroma가 0이어야 함
      const isGrayscale = /oklch\([^)]*\s+0\s+/.test(value);

      expect(
        isGrayToken || isGrayscale,
        `--xeg-toast-bg-info는 gray 토큰을 사용해야 함. 현재: ${value}`
      ).toBe(true);
    });

    it('--xeg-toast-bg-success는 gray 기반 토큰을 사용해야 함', () => {
      const match = semanticTokens.match(/--xeg-toast-bg-success:\s*([^;]+);/);
      expect(match, '--xeg-toast-bg-success 토큰이 정의되어야 함').toBeTruthy();

      const value = match![1].trim();

      const isGrayToken =
        value.includes('var(--xeg-surface-glass-bg)') || value.includes('var(--color-gray-');
      const isGrayscale = /oklch\([^)]*\s+0\s+/.test(value);

      expect(
        isGrayToken || isGrayscale,
        `--xeg-toast-bg-success는 gray 토큰을 사용해야 함. 현재: ${value}`
      ).toBe(true);
    });

    it('--xeg-toast-bg-warning는 gray 기반 토큰을 사용해야 함', () => {
      const match = semanticTokens.match(/--xeg-toast-bg-warning:\s*([^;]+);/);
      expect(match, '--xeg-toast-bg-warning 토큰이 정의되어야 함').toBeTruthy();

      const value = match![1].trim();

      const isGrayToken =
        value.includes('var(--xeg-surface-glass-bg)') || value.includes('var(--color-gray-');
      const isGrayscale = /oklch\([^)]*\s+0\s+/.test(value);

      expect(
        isGrayToken || isGrayscale,
        `--xeg-toast-bg-warning는 gray 토큰을 사용해야 함. 현재: ${value}`
      ).toBe(true);
    });

    it('--xeg-toast-bg-error는 gray 기반 토큰을 사용해야 함', () => {
      const match = semanticTokens.match(/--xeg-toast-bg-error:\s*([^;]+);/);
      expect(match, '--xeg-toast-bg-error 토큰이 정의되어야 함').toBeTruthy();

      const value = match![1].trim();

      const isGrayToken =
        value.includes('var(--xeg-surface-glass-bg)') || value.includes('var(--color-gray-');
      const isGrayscale = /oklch\([^)]*\s+0\s+/.test(value);

      expect(
        isGrayToken || isGrayscale,
        `--xeg-toast-bg-error는 gray 토큰을 사용해야 함. 현재: ${value}`
      ).toBe(true);
    });
  });

  describe('Toast Border Tokens (흑백 통일)', () => {
    it('--xeg-toast-border-info는 gray 기반 토큰을 사용해야 함', () => {
      const match = semanticTokens.match(/--xeg-toast-border-info:\s*([^;]+);/);
      expect(match, '--xeg-toast-border-info 토큰이 정의되어야 함').toBeTruthy();

      const value = match![1].trim();

      const isGrayToken = value.includes('var(--color-gray-');
      const isGrayscale = /oklch\([^)]*\s+0\s+/.test(value);

      expect(
        isGrayToken || isGrayscale,
        `--xeg-toast-border-info는 gray 토큰을 사용해야 함. 현재: ${value}`
      ).toBe(true);
    });

    it('--xeg-toast-border-success는 gray 기반 토큰을 사용해야 함', () => {
      const match = semanticTokens.match(/--xeg-toast-border-success:\s*([^;]+);/);
      expect(match, '--xeg-toast-border-success 토큰이 정의되어야 함').toBeTruthy();

      const value = match![1].trim();

      const isGrayToken = value.includes('var(--color-gray-');
      const isGrayscale = /oklch\([^)]*\s+0\s+/.test(value);

      expect(
        isGrayToken || isGrayscale,
        `--xeg-toast-border-success는 gray 토큰을 사용해야 함. 현재: ${value}`
      ).toBe(true);
    });

    it('--xeg-toast-border-warning는 gray 기반 토큰을 사용해야 함', () => {
      const match = semanticTokens.match(/--xeg-toast-border-warning:\s*([^;]+);/);
      expect(match, '--xeg-toast-border-warning 토큰이 정의되어야 함').toBeTruthy();

      const value = match![1].trim();

      const isGrayToken = value.includes('var(--color-gray-');
      const isGrayscale = /oklch\([^)]*\s+0\s+/.test(value);

      expect(
        isGrayToken || isGrayscale,
        `--xeg-toast-border-warning는 gray 토큰을 사용해야 함. 현재: ${value}`
      ).toBe(true);
    });

    it('--xeg-toast-border-error는 gray 기반 토큰을 사용해야 함', () => {
      const match = semanticTokens.match(/--xeg-toast-border-error:\s*([^;]+);/);
      expect(match, '--xeg-toast-border-error 토큰이 정의되어야 함').toBeTruthy();

      const value = match![1].trim();

      const isGrayToken = value.includes('var(--color-gray-');
      const isGrayscale = /oklch\([^)]*\s+0\s+/.test(value);

      expect(
        isGrayToken || isGrayscale,
        `--xeg-toast-border-error는 gray 토큰을 사용해야 함. 현재: ${value}`
      ).toBe(true);
    });
  });

  describe('Toast Shadow Tokens (흑백 통일)', () => {
    it('--xeg-toast-shadow-info는 gray 기반 shadow 토큰을 사용해야 함', () => {
      const match = semanticTokens.match(/--xeg-toast-shadow-info:\s*([^;]+);/);
      expect(match, '--xeg-toast-shadow-info 토큰이 정의되어야 함').toBeTruthy();

      const value = match![1].trim();

      // var(--xeg-shadow-*) 사용 확인
      const isShadowToken = value.includes('var(--xeg-shadow-');

      // 직접 정의 시 black(L=0, C=0) 사용 확인
      const isGrayscaleShadow = /oklch\(0\s+0\s+0\s*\//.test(value);

      expect(
        isShadowToken || isGrayscaleShadow,
        `--xeg-toast-shadow-info는 gray 기반 shadow를 사용해야 함. 현재: ${value}`
      ).toBe(true);
    });

    it('--xeg-toast-shadow-focus는 gray 기반 shadow 토큰을 사용해야 함', () => {
      const match = semanticTokens.match(/--xeg-toast-shadow-focus:\s*([^;]+);/);
      expect(match, '--xeg-toast-shadow-focus 토큰이 정의되어야 함').toBeTruthy();

      const value = match![1].trim();

      const isShadowToken = value.includes('var(--xeg-shadow-');
      const isGrayscaleShadow = /oklch\(0\s+0\s+0\s*\//.test(value);

      expect(
        isShadowToken || isGrayscaleShadow,
        `--xeg-toast-shadow-focus는 gray 기반 shadow를 사용해야 함. 현재: ${value}`
      ).toBe(true);
    });
  });

  describe('Toast 색상 토큰 chromatic 값 금지', () => {
    it('Toast 관련 토큰은 chromatic 색상(chroma > 0)을 사용하지 않아야 함', () => {
      // Toast 토큰 블록 추출 (대략 lines 300-320)
      const toastSection = semanticTokens.split('\n').slice(300, 320).join('\n');

      // chromatic oklch 패턴: oklch(L C H) 형식에서 C > 0
      const chromaticPattern = /--xeg-toast-[^:]+:\s*oklch\([^)]*\s+0\.[0-9]+\s+[0-9]/g;
      const chromaticMatches = toastSection.match(chromaticPattern);

      expect(
        chromaticMatches,
        'Toast 토큰은 chromatic 색상(chroma > 0)을 사용하지 않아야 합니다.\n' +
          `발견된 chromatic 토큰:\n${chromaticMatches?.join('\n')}`
      ).toBeNull();
    });
  });
});
