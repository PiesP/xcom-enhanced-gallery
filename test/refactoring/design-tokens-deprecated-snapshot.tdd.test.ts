import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readTokensCss(): string {
  return readFileSync(join(process.cwd(), 'src', 'shared', 'styles', 'design-tokens.css'), 'utf8');
}

function extractDeprecatedTokens(css: string): string[] {
  const match = css.match(/DEPRECATED TOKENS[\s\S]*?:root \{([\s\S]*?)\n\}/);
  if (!match) return [];
  const body = match[1];
  const tokens: string[] = [];
  const re = /(--[a-z0-9-]+)\s*:/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) tokens.push(m[1]);
  return tokens.sort();
}

describe('Design Tokens Deprecated Snapshot (Phase2)', () => {
  it('현재 Deprecated 토큰 목록이 스냅샷과 일치', () => {
    const css = readTokensCss();
    const deprecated = extractDeprecatedTokens(css);
    // 존재 보증
    expect(deprecated.length).toBeGreaterThan(0);
    expect(deprecated).toMatchSnapshot();
  });
});
