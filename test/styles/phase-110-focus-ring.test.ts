/**
 * @fileoverview Phase 110.1: --xeg-focus-ring 토큰 색상 수정 테스트
 * @phase 110.1
 * @priority 긴급
 *
 * Phase 109에서 --xeg-settings-select-focus-ring는 제거했으나,
 * 전역 포커스 링 --xeg-focus-ring이 여전히 파란색 하드코딩 사용
 *
 * 목표: gray 기반 모노크롬으로 변경하여 흑백 디자인 시스템 통일
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Phase 110.1: --xeg-focus-ring 토큰 색상 수정', () => {
  const semanticCssPath = resolve(__dirname, '../../src/shared/styles/design-tokens.semantic.css');
  const semanticCss = readFileSync(semanticCssPath, 'utf-8');

  it('--xeg-focus-ring에 파란색 하드코딩이 없어야 함', () => {
    // Phase 109에서 제거된 것과 동일한 파란색 값: oklch(0.676 0.151 237.8)
    const blueHue237 = /oklch\(0\.676\s+0\.151\s+237\.8\)/;

    // Note: Toast 토큰은 Phase 110.3에서 별도 검토하므로, --xeg-focus-ring만 검사
    const focusRingLine = semanticCss.split('\n').find(line => line.includes('--xeg-focus-ring:'));

    expect(focusRingLine).toBeTruthy();
    expect(focusRingLine).not.toMatch(blueHue237);
  });

  it('--xeg-focus-ring이 gray 토큰을 사용해야 함', () => {
    // --xeg-focus-ring 정의를 찾음
    const focusRingDef = /--xeg-focus-ring:\s*([^;]+);/;
    const match = semanticCss.match(focusRingDef);

    expect(match).toBeTruthy();
    const value = match?.[1] || '';

    // gray 토큰 사용 확인 (--color-gray-*)
    const usesGrayToken = /var\(--color-gray-\d+\)/.test(value);

    expect(usesGrayToken).toBe(true);
  });

  it('--xeg-focus-ring이 올바른 형식이어야 함', () => {
    const focusRingDef = /--xeg-focus-ring:\s*([^;]+);/;
    const match = semanticCss.match(focusRingDef);

    expect(match).toBeTruthy();
    const value = match?.[1]?.trim() || '';

    // 형식: "0.125rem solid var(--color-gray-500)" 같은 형태
    const validFormat = /^\d+(\.\d+)?rem\s+solid\s+var\(--color-gray-\d+\)$/;

    expect(value).toMatch(validFormat);
  });

  it('--xeg-focus-ring에 chroma > 0인 oklch 값이 없어야 함 (순수 gray만)', () => {
    const focusRingDef = /--xeg-focus-ring:\s*([^;]+);/;
    const match = semanticCss.match(focusRingDef);

    expect(match).toBeTruthy();
    const value = match?.[1] || '';

    // oklch가 직접 사용된다면, chroma는 0이어야 함 (흑백)
    // 하지만 권장은 gray 토큰 사용이므로, oklch 직접 사용은 없어야 함
    const hasColorfulOklch = /oklch\([^)]*\b(?!0\b)\d+\.?\d*\s+[1-9]/.test(value);

    expect(hasColorfulOklch).toBe(false);
  });
});
