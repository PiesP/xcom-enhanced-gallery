import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// R6 RED: 과거 레거시 icons/ 배럴 (예: src/shared/components/ui/Icon/icons/index.ts) 존재 여부 탐지
// GREEN: 해당 경로가 존재하지 않아야 한다.

describe('architecture/icon-legacy-barrel-absence (R6 RED)', () => {
  it('레거시 icons 배럴 디렉터리가 존재하지 않아야 한다', () => {
    const current = fileURLToPath(import.meta.url);
    const root = resolve(dirname(dirname(current))); // ../../ → project root
    const legacyPath = resolve(root, 'src/shared/components/ui/Icon/icons');
    const exists = existsSync(legacyPath);
    expect(exists).toBe(false);
  });
});
