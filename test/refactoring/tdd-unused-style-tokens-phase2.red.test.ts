import { describe, it, expect } from 'vitest';
import { analyzeStyleTokens } from '../../src/dev-scripts/styleTokenAnalyzer';
import path from 'path';
import { promises as fs } from 'fs';

/**
 * Phase 2 RED: effective unused (DEPRECATED 제외) 토큰을 150 이하로 더 낮추기 위한 목표 테스트
 * 현재 effectiveUnused ≈ 198 -> 실패해야 함
 */

describe('[TDD][RED][Phase2] UNUSED 디자인 토큰 2차 감축', () => {
  it('effective UNUSED 토큰 수가 150 이하이어야 한다 (RED)', async () => {
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

    // 디버그 정보 추가
    console.log('=== PHASE 2 DEBUG ===');
    console.log('Total defined tokens:', result.definedTokens.size);
    console.log('Total unused tokens:', result.unusedTokens.size);
    console.log('Deprecated tokens:', deprecatedTokens.size);
    console.log('Effective unused:', effectiveUnused.length);
    console.log('Need to remove for Phase 2:', Math.max(0, effectiveUnused.length - 150));

    console.log('\nFirst 30 unused tokens:');
    effectiveUnused.slice(0, 30).forEach((token, i) => {
      console.log(`  ${(i + 1).toString().padStart(2)}: ${token}`);
    });

    expect(effectiveUnused.length).toBeLessThanOrEqual(150);
  });
});
