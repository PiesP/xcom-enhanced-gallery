import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readTokensCss(): string {
  const cssPath = join(process.cwd(), 'src', 'shared', 'styles', 'design-tokens.css');
  return readFileSync(cssPath, 'utf8');
}

function extractDefinedTokens(css: string): Set<string> {
  // 간단한 파서: 주석 제거 후 --tokenName: value; 패턴 수집 (네임스페이스 불문)
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const defined = new Set<string>();
  const defRe = /(--[a-z0-9-]+)\s*:/gi;
  let m: RegExpExecArray | null;
  while ((m = defRe.exec(noComments))) {
    defined.add(m[1]);
  }
  return defined;
}

function extractUsedTokens(css: string): Set<string> {
  const used = new Set<string>();
  const varRe = /var\(\s*(--[a-z0-9-]+)\s*(?:,[^)]+)?\)/gi;
  let m: RegExpExecArray | null;
  while ((m = varRe.exec(css))) {
    used.add(m[1]);
  }
  return used;
}

describe('Design Tokens Audit (RED)', () => {
  it('should not reference undefined CSS variables in design-tokens.css (inventory gate)', () => {
    const css = readTokensCss();
    const defined = extractDefinedTokens(css);
    const used = extractUsedTokens(css);

    const missing = Array.from(used).filter(t => !defined.has(t));

    // 현재 상태에서는 border-radius 계열 네이밍 불일치가 있을 가능성이 높아 실패를 유도
    expect({ missing }).toEqual({ missing: [] });
  });

  it("should not use '--xeg-border-radius-*' naming; use '--xeg-radius-*' instead (naming consistency)", () => {
    const css = readTokensCss();
    const hasBorderRadiusNaming = /--xeg-border-radius-[a-z0-9-]+/i.test(css);
    // 현 상태에서는 발견될 것으로 예상하므로 실패를 유도
    expect(hasBorderRadiusNaming).toBe(false);
  });
});
