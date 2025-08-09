/**
 * vendor-api가 hooks/signals에 대해 동적 import를 사용하지 않는지 확인
 * (IIFE + inlineDynamicImports 환경에서 TDZ/CSP 이슈를 방지)
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('vendor-api dynamic import guards', () => {
  it('must not contain dynamic import() for hooks/signals', () => {
    const repoRoot = path.resolve(__dirname, '../../../../../');
    const filePath = path.join(repoRoot, 'src', 'shared', 'external', 'vendors', 'vendor-api.ts');
    const src = fs.readFileSync(filePath, 'utf8');
    expect(src.includes("import('preact/hooks')")).toBe(false);
    expect(src.includes("import('@preact/signals')")).toBe(false);
  });
});
