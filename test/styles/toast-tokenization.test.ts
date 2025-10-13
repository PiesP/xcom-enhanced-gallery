/**
 * @fileoverview Toast 컴포넌트 토큰화 정책 테스트 (Phase 52)
 * @description Toast.module.css의 하드코딩된 값 검출 및 토큰 사용 검증
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const TOAST_CSS_PATH = join(process.cwd(), 'src/shared/components/ui/Toast/Toast.module.css');

describe('Toast Tokenization Policy (Phase 52)', () => {
  const toastCSS = readFileSync(TOAST_CSS_PATH, 'utf-8');

  it('하드코딩된 px 값 금지 - spacing 값은 토큰 사용', () => {
    // margin-bottom: 12px → var(--xeg-toast-margin-bottom)
    expect(toastCSS).not.toMatch(/margin-bottom:\s*12px/);

    // padding: 18px → var(--xeg-toast-padding)
    expect(toastCSS).not.toMatch(/padding:\s*18px/);

    // gap: 8px → var(--xeg-toast-gap)
    expect(toastCSS).not.toMatch(/\.content\s*\{[^}]*gap:\s*8px/s);

    // gap: 12px → var(--xeg-toast-header-gap)
    expect(toastCSS).not.toMatch(/\.header\s*\{[^}]*gap:\s*12px/s);

    // Toast 토큰 사용 확인
    expect(toastCSS).toMatch(/var\(--xeg-toast-margin-bottom\)/);
    expect(toastCSS).toMatch(/var\(--xeg-toast-padding\)/);
    expect(toastCSS).toMatch(/var\(--xeg-toast-gap\)/);
    expect(toastCSS).toMatch(/var\(--xeg-toast-header-gap\)/);
  });

  it('하드코딩된 px 값 금지 - 크기 값은 토큰 사용', () => {
    // min-width: 320px → var(--xeg-toast-min-width)
    expect(toastCSS).not.toMatch(/min-width:\s*320px/);

    // max-width: 480px → var(--xeg-toast-max-width)
    expect(toastCSS).not.toMatch(/max-width:\s*480px/);

    // Toast 토큰 사용 확인
    expect(toastCSS).toMatch(/var\(--xeg-toast-min-width\)/);
    expect(toastCSS).toMatch(/var\(--xeg-toast-max-width\)/);
  });

  it('border-width는 토큰 사용', () => {
    // border-left: 4px solid → border-left: var(--xeg-toast-border-width) solid
    // 직접적인 4px 하드코딩 검출 (border-left 컨텍스트에서만)
    const borderLeftMatch = toastCSS.match(/border-left:\s*4px\s+solid/);
    expect(borderLeftMatch).toBeNull();

    // Toast 토큰 사용 확인
    expect(toastCSS).toMatch(/var\(--xeg-toast-border-width\)/);
  });

  it('font-size 값은 토큰 사용', () => {
    // title font-size: 14px → var(--xeg-toast-title-font-size)
    expect(toastCSS).not.toMatch(/\.title\s*\{[^}]*font-size:\s*14px/s);

    // message font-size: 13px → var(--xeg-toast-message-font-size)
    expect(toastCSS).not.toMatch(/\.message\s*\{[^}]*font-size:\s*13px/s);

    // Toast 토큰 사용 확인
    expect(toastCSS).toMatch(/var\(--xeg-toast-title-font-size\)/);
    expect(toastCSS).toMatch(/var\(--xeg-toast-message-font-size\)/);
  });

  it('font-weight 값은 토큰 사용', () => {
    // title font-weight: 600 → var(--xeg-toast-title-font-weight)
    expect(toastCSS).not.toMatch(/\.title\s*\{[^}]*font-weight:\s*600/s);

    // Toast 토큰 사용 확인
    expect(toastCSS).toMatch(/var\(--xeg-toast-title-font-weight\)/);
  });
});
