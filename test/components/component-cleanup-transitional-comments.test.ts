import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// P7 GREEN: transitional 주석 제거 가드

const TARGETS = [
  'src/shared/components/ui/Toolbar/Toolbar.module.css',
  'src/shared/components/ui/MediaCounter/MediaCounter.module.css',
  'src/shared/styles/design-tokens.component.css',
  'src/shared/index.ts',
];

const PATTERNS = [
  /P3\s*추출/i,
  /P4[^\n]*toolbar size token/i,
  /TEMP: will be validated/i,
  /새로운 P6 스타일 토큰들/i,
];

describe('P7: transitional comments have been removed', () => {
  for (const rel of TARGETS) {
    it(`ensures ${rel} has no transitional markers`, () => {
      const full = join((globalThis as any).process.cwd(), rel);
      const content = readFileSync(full, 'utf8');
      const hits = PATTERNS.filter(re => re.test(content));
      expect(hits, `Unexpected transitional markers: ${hits.map(String).join(', ')}`).toHaveLength(
        0
      );
    });
  }
});
