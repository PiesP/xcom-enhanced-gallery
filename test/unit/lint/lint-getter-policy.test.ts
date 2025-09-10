/**
 * @fileoverview ESLint: 외부 의존성 직접 import 금지(Preact/Signals/fflate) 정책 검증
 * - src/** 에서는 직접 import 시 오류
 * - vendors 래퍼(src/shared/external/vendors/**)에서는 허용
 * - getter 사용 시 통과
 */

import { describe, it, expect } from 'vitest';

async function lintText(code, filename) {
  const { ESLint } = await import('eslint');
  const eslint = new ESLint();
  const results = await eslint.lintText(code, { filePath: filename });
  return results[0];
}

describe('ESLint getter policy', () => {
  it('src/features에서 preact 직접 import는 금지되어야 한다', async () => {
    const code = "import { h } from 'preact'; export const v=1;";
    const result = await lintText(code, 'src/features/foo/bad-import.ts');
    const hasRestricted = result.messages.some(m => m.ruleId === 'no-restricted-imports');
    expect(hasRestricted).toBe(true);
  });

  it('vendors 래퍼 경로에서는 직접 import 허용', async () => {
    const code = "import * as preact from 'preact'; export const ok = preact;";
    const result = await lintText(code, 'src/shared/external/vendors/local-ok.ts');
    const hasRestricted = result.messages.some(m => m.ruleId === 'no-restricted-imports');
    expect(hasRestricted).toBe(false);
  });

  it('getter 사용 시 통과해야 한다', async () => {
    const code =
      "import { getPreact } from '@/shared/external/vendors'; const { h } = getPreact(); export const ok = h;";
    const result = await lintText(code, 'src/features/foo/ok-getter.ts');
    const hasRestricted = result.messages.some(m => m.ruleId === 'no-restricted-imports');
    expect(hasRestricted).toBe(false);
  });
});
