import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import glob from 'fast-glob';

// VENDOR-LEGACY-PRUNE-02 — vendor-api.ts 소스 레벨 금지 스캔
// 허용: vendors/index.ts 내부, 테스트 목/스텁 경로(test/**)만
// 금지: src/** 에서 @shared/external/vendors/vendor-api.ts 직접 import

const ROOT = join(process.cwd());

function isAllowed(file: string) {
  // 허용 경로: vendors 인덱스, 또는 테스트 디렉터리
  const normalized = file.replace(/\\/g, '/');
  if (/src\/shared\/external\/vendors\/index\.ts$/.test(normalized)) return true;
  if (/^test\//.test(normalized)) return true;
  return false;
}

describe('VENDOR-LEGACY-PRUNE-02: forbid vendor-api.ts direct imports in src/**', () => {
  it('should have 0 offending imports outside allowlist', async () => {
    const files = await glob(['src/**/*.{ts,tsx}'], { cwd: ROOT, dot: false, absolute: false });
    const offenders: Array<{ file: string; line: number; lineText: string }> = [];

    for (const file of files) {
      const full = join(ROOT, file);
      const text = readFileSync(full, 'utf8');
      const lines = text.split(/\r?\n/g);
      lines.forEach((line, idx) => {
        if (
          /(from\s+['"]@shared\/external\/vendors\/vendor-api['"])|(from\s+['"]\.\.\/vendor-api['"])|(from\s+['"]\.\/vendor-api['"])|(from\s+['"]@shared\/external\/vendors\/vendor-api\.ts['"])|(from\s+['"]..\/..\/shared\/external\/vendors\/vendor-api['"])|(@shared\/external\/vendors\/vendor-api\.ts)/.test(
            line
          )
        ) {
          if (!isAllowed(file)) {
            offenders.push({ file, line: idx + 1, lineText: line.trim() });
          }
        }
      });
    }

    const details = offenders.map(o => `${o.file}:${o.line} → ${o.lineText}`).join('\n');
    expect(offenders.length, `vendor-api direct import is forbidden. Offenders:\n${details}`).toBe(
      0
    );
  });
});
