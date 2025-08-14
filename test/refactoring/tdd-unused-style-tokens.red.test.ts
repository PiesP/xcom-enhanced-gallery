import { describe, it, expect } from 'vitest';
import { analyzeStyleTokens } from '../../src/dev-scripts/styleTokenAnalyzer';
import path from 'path';
import { promises as fs } from 'fs';

/**
 * GREEN 단계 전환:
 * - design-tokens.css 내 DEPRECATED 섹션(:root { ... })에 정의된 토큰은 슬림화 대상에서 제외 (감시만)
 * - 실사용 가능한 UNUSED 토큰 수를 산정하고 임계값 200 이하 달성 확인
 */

describe('[TDD][GREEN] UNUSED 디자인 토큰 1차 감축', () => {
  it('DEPRECATED 제외 실사용 UNUSED 토큰 수가 200 이하이다', async () => {
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

    // design-tokens.css 에서 DEPRECATED 블록 파싱
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

    // 실사용 가능한 unused = analyzer unused - deprecated set
    const effectiveUnused = [...result.unusedTokens].filter(t => !deprecatedTokens.has(t));

    // 1차 목표: 200 이하
    expect(effectiveUnused.length).toBeLessThanOrEqual(200);
  });
});
