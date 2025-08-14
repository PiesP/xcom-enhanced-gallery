import { describe, it, expect } from 'vitest';
import { analyzeStyleTokens } from '../../src/dev-scripts/styleTokenAnalyzer';
import path from 'path';
import { promises as fs } from 'fs';

/**
 * Phase 2 GREEN: effective unused (DEPRECATED 제외) 토큰이 목표치(≤150) 이하로 유지되는지 회귀 보증
 *  - 이전 RED 단계에서 감축 완료 (현재 134)
 *  - 회귀로 150 초과 시 실패
 */

describe('[TDD][GREEN][Phase2] UNUSED 디자인 토큰 2차 감축 회귀', () => {
  it('effective UNUSED 토큰 수가 150 이하를 유지한다 (회귀)', async () => {
    const root = path.join(process.cwd(), 'src');
    const allCss: string[] = [];
    async function walk(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) await walk(full);
        else if (
          full.endsWith('.css') &&
          !full.endsWith('design-tokens.css') &&
          !full.endsWith('design-tokens-solid.css')
        ) {
          allCss.push(full);
        }
      }
    }
    await walk(root);

    const result = await analyzeStyleTokens({
      definitionRoots: [
        'src/shared/styles/design-tokens.css',
        'src/shared/styles/design-tokens-solid.css',
      ],
      componentFiles: allCss.map(p => path.relative(process.cwd(), p).replace(/\\/g, '/')),
    });

    const tokensCss = await fs.readFile(
      path.join(process.cwd(), 'src/shared/styles/design-tokens.css'),
      'utf-8'
    );
    const deprecatedSectionMatch = tokensCss.match(
      /DEPRECATED TOKENS[\s\S]*?:root \{([\s\S]*?)\n\}/
    );
    const deprecatedTokens = new Set<string>();
    if (deprecatedSectionMatch) {
      const body = deprecatedSectionMatch[1];
      const re = /(--[a-z0-9-]+)\s*:/gi;
      let m: RegExpExecArray | null;
      while ((m = re.exec(body)) !== null) deprecatedTokens.add(m[1]);
    }

    const effectiveUnused = [...result.unusedTokens].filter(t => !deprecatedTokens.has(t));

    expect(effectiveUnused.length).toBeLessThanOrEqual(150);
  });
});
