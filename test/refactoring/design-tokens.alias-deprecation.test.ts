import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

/**
 * RED 단계: 컴포넌트 background alias 토큰 사용 제거 목표
 * - 대상: --xeg-comp-toolbar-bg, --xeg-comp-modal-bg
 * - 허용: 토큰 정의 파일 자체(design-tokens.*.css) 내 선언 (점진 제거 예정)
 * - 금지: 일반 CSS Module / feature / component / assets 내 사용
 * GREEN 조건(후속 단계): 아래 bannedAliasUsage 배열이 빈 배열이 되도록 치환
 */

describe('design-tokens.alias-deprecation (RED)', () => {
  const __filename = fileURLToPath(import.meta.url);
  // __filename => <repo>/test/refactoring/design-tokens.alias-deprecation.red.test.ts
  // Two levels up to reach repo root
  const projectRoot = join(dirname(__filename), '..', '..');
  const srcDir = join(projectRoot, 'src');

  const bannedAliases = ['--xeg-comp-toolbar-bg', '--xeg-comp-modal-bg'];

  // Phase 1 범위 축소: 갤러리 스타일 모듈에서만 alias 제거를 우선 적용한다.
  const targetCssFiles = [join(srcDir, 'features', 'gallery', 'styles', 'Gallery.module.css')];

  it('금지 alias 토큰이 일반 CSS에서 더 이상 사용되지 않아야 한다 (현재 RED 기대: FAIL)', () => {
    const bannedAliasUsage: Array<{ file: string; alias: string; line: number; content: string }> =
      [];

    for (const file of targetCssFiles) {
      const content = readFileSync(file, 'utf8');
      const lines = content.split(/\r?\n/);
      lines.forEach((line, idx) => {
        for (const alias of bannedAliases) {
          if (line.includes(alias)) {
            bannedAliasUsage.push({ file, alias, line: idx + 1, content: line.trim() });
          }
        }
      });
    }

    // GREEN 목표: 사용처 0. (현재 단계에서 해결 후 GREEN 전환 예상)
    expect(bannedAliasUsage).toEqual([]);
  });
});
