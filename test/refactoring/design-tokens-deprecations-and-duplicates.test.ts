import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readTokensCss(): string {
  const cssPath = join(process.cwd(), 'src', 'shared', 'styles', 'design-tokens.css');
  return readFileSync(cssPath, 'utf8');
}

function extractFirstRootBlock(css: string): string {
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const idx = noComments.indexOf(':root');
  if (idx === -1) return '';
  const braceStart = noComments.indexOf('{', idx);
  if (braceStart === -1) return '';
  let depth = 0;
  let collected = '';
  for (let i = braceStart; i < noComments.length; i++) {
    const ch = noComments[i];
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    collected += ch;
    if (depth === 0) break;
  }
  return collected;
}

function findDuplicateDefinitions(css: string): string[] {
  const rootBlock = extractFirstRootBlock(css);
  if (!rootBlock) return [];
  const defRe = /(^|\n)\s*(--[a-z0-9-]+)\s*:/gi;
  const seen = new Map<string, number>();
  let m: RegExpExecArray | null;
  while ((m = defRe.exec(rootBlock))) {
    const name = m[2];
    seen.set(name, (seen.get(name) ?? 0) + 1);
  }
  return Array.from(seen.entries())
    .filter(([, count]) => count > 1)
    .map(([name]) => name)
    .sort();
}

describe('Design Tokens Phase 2: deprecations and duplicates', () => {
  it('should not contain DEPRECATED markers in active CSS', () => {
    const css = readTokensCss();
    // Phase 2 목표: 주석으로만 존재해야 함. 실제 남아있는 DEPRECATED 텍스트를 금지 (주석 제외 검사)
    const active = css.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(/DEPRECATED/i.test(active)).toBe(false);
  });

  it('should not redefine the same custom property multiple times', () => {
    const css = readTokensCss();
    const duplicates = findDuplicateDefinitions(css);
    expect(duplicates).toEqual([]);
  });
});
