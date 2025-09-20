/**
 * @fileoverview ESLint getter 정책: Flat Config 텍스트에 규칙 존재 여부를 정적 검증
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

function getESLintConfigText() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const p = join(__dirname, '../../../eslint.config.js');
  return readFileSync(p, 'utf-8');
}

describe('ESLint getter policy (config presence)', () => {
  it('preact/fflate/@preact/signals 직접 import 금지 패턴이 설정되어 있어야 한다', () => {
    const text = getESLintConfigText();
    expect(text).toContain('no-restricted-imports');
    // 구체 배열 문자열 대신, 개별 금지 대상이 패턴에 포함되어 있는지 점검한다
    expect(text).toContain("'preact'");
    expect(text).toContain("'preact/hooks'");
    expect(text).toContain("'preact/compat'");
    expect(text).toContain("'@preact/signals'");
    expect(text).toContain("'fflate'");
  });

  it('vendors 경로에서 no-restricted-imports 예외가 선언되어 있어야 한다', () => {
    const text = getESLintConfigText();
    expect(text).toContain("files: ['src/shared/external/vendors/**/*.{ts,tsx}']");
    expect(text).toContain("'no-restricted-imports': 'off'");
  });
});
