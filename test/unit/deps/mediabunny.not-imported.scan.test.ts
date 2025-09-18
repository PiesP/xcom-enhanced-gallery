import { describe, it, expect } from 'vitest';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

function walk(dir: string, acc: string[] = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (/\.(ts|tsx|js|jsx|cjs|mjs)$/.test(entry)) acc.push(full);
  }
  return acc;
}

describe('M0: mediabunny 정적 import 금지 스캔', () => {
  it('src 내 소스 코드에서 mediabunny를 정적으로 import 하지 않는다', () => {
    const files = walk(join(process.cwd(), 'src'));
    const offenders: string[] = [];
    const importRe = /from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      let m: RegExpExecArray | null;
      importRe.lastIndex = 0;
      while ((m = importRe.exec(content))) {
        const spec = m[1] || m[2];
        if (!spec) continue;
        if (/mediabunny/i.test(spec)) {
          offenders.push(`${file} -> ${spec}`);
        }
      }
    }

    expect(
      offenders,
      `정적 import 금지 위반:
${offenders.join('\n')}`
    ).toHaveLength(0);
  });
});
