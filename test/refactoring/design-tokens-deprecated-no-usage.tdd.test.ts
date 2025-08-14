import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function listCssFiles(base: string): string[] {
  const out: string[] = [];
  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) walk(full);
      else if (
        full.endsWith('.css') &&
        !full.endsWith('design-tokens.css') &&
        !full.endsWith('design-tokens-solid.css')
      ) {
        out.push(full);
      }
    }
  }
  walk(base);
  return out;
}

function extractDeprecatedTokens(css: string): string[] {
  const match = css.match(/DEPRECATED TOKENS[\s\S]*?:root \{([\s\S]*?)\n\}/);
  if (!match) return [];
  const body = match[1];
  const tokens: string[] = [];
  const re = /(--[a-z0-9-]+)\s*:/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) tokens.push(m[1]);
  return tokens;
}

describe('Design Tokens Deprecated Usage Guard (Phase2)', () => {
  it('Deprecated 토큰이 컴포넌트 CSS에서 참조되지 않는다', () => {
    const css = readFileSync(
      join(process.cwd(), 'src', 'shared', 'styles', 'design-tokens.css'),
      'utf8'
    );
    const deprecated = extractDeprecatedTokens(css);
    const files = listCssFiles(join(process.cwd(), 'src'));
    const offenders: Record<string, string[]> = {};
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      for (const token of deprecated) {
        const pattern = new RegExp(
          `var\\(\\s*${token.replace(/[-/\\^$*+?.()|[\]{}]/g, r => r)}\\s*(?:[,)]|$)`
        );
        if (pattern.test(content)) {
          (offenders[token] ||= []).push(file.replace(process.cwd() + '\\', ''));
        }
      }
    }
    expect(offenders).toEqual({});
  });
});
