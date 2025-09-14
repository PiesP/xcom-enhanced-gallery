import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { cwd } from 'node:process';

/**
 * R3 RED: Bearer 토큰은 adapter(@shared/external/userscript/adapter)나 안전 경유만 허용.
 * - 금지: 소스 어디에서도 하드코딩된 토큰 패턴이나 상수 정의/직접 import 존재
 * - 허용: TwitterTokenExtractor 내부 구현과 userscript adapter
 */
describe('R3: Token constants must not leak outside adapter/extractor (RED)', () => {
  // vitest runs with cwd at repo root in this project setup
  const repoRoot = cwd();

  // 간단한 정규식: 너무 공격적이지 않게 Bearer/BEARER_TOKEN 흔적을 탐지
  const forbiddenPatterns = [/BEARER_TOKEN\b/i, /['"]Bearer['"]/];

  // 허용 경로 화이트리스트 (경로 구분자 정규화)
  const allowList = ['src/features/settings/services/TwitterTokenExtractor.ts'];
  const allowListNormalized = new Set(allowList.map(p => p.replace(/\\/g, '/')));

  function walk(dir: string, acc: string[] = []): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p, acc);
      else if (/\.(ts|tsx|js|mjs|cjs|css)$/i.test(e.name)) acc.push(p);
    }
    return acc;
  }

  it('no bearer token constants outside allowed files', () => {
    const files = walk(path.join(repoRoot, 'src'));
    const violations: string[] = [];
    for (const file of files) {
      const rel = path.relative(repoRoot, file).replace(/\\/g, '/');
      if (allowListNormalized.has(rel)) continue;
      const text = fs.readFileSync(file, 'utf8');
      if (forbiddenPatterns.some(r => r.test(text))) {
        violations.push(rel);
      }
    }
    expect(violations, `Forbidden token patterns found in: ${violations.join(', ')}`).toEqual([]);
  });
});
