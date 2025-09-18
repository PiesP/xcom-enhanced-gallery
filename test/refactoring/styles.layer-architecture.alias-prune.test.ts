import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 레이어 아키텍처 단순화 – 컴포넌트 alias 토큰 사용 제거 완료 검증
 * 검사 대상 alias (background / border / shadow):
 *  - --xeg-comp-toolbar-bg / --xeg-comp-toolbar-border / --xeg-comp-toolbar-shadow
 *  - --xeg-comp-modal-bg / --xeg-comp-modal-border / --xeg-comp-modal-shadow
 * 허용 예외:
 *  - design-tokens.*.css (정의 파일)
 * 조건: src/** CSS Module / feature 스타일에서 위 alias 사용 0건
 */

const __filename_local = fileURLToPath(import.meta.url);
const __dirname_local = dirname(__filename_local);
const PROJECT_ROOT = join(__dirname_local, '..', '..');
const SRC_DIR = join(PROJECT_ROOT, 'src');

const ALIAS_TOKENS = [
  '--xeg-comp-toolbar-bg',
  '--xeg-comp-toolbar-border',
  '--xeg-comp-toolbar-shadow',
  '--xeg-comp-modal-bg',
  '--xeg-comp-modal-border',
  '--xeg-comp-modal-shadow',
];

function listFiles(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) listFiles(full, acc);
    else if (/\.css$/i.test(full)) acc.push(full);
  }
  return acc;
}

function isDesignTokenFile(file: string): boolean {
  return /design-tokens(\.semantic)?\.css$/.test(file);
}

describe('styles.layer-architecture.alias-prune', () => {
  it('컴포넌트 alias 토큰이 일반 CSS 모듈에서 더 이상 사용되지 않아야 한다', () => {
    const cssFiles = listFiles(SRC_DIR).filter(f => !isDesignTokenFile(f));
    const violations: Array<{ file: string; line: number; token: string; content: string }> = [];

    for (const file of cssFiles) {
      const content = readFileSync(file, 'utf8');
      const lines = content.split(/\r?\n/);
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        // 주석 라인은 무시
        if (trimmed.startsWith('/*') || trimmed.startsWith('//')) return;
        ALIAS_TOKENS.forEach(token => {
          if (line.includes(token)) {
            violations.push({ file, line: idx + 1, token, content: line.trim() });
          }
        });
      });
    }

    // 목표: violations.length === 0
    expect(violations).toEqual([]);
  });
});
