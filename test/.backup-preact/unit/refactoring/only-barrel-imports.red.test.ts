import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

// Phase U4 (부분): 배럴 import 강제 (HOC 경로)
// 규칙: '@shared/components/hoc' 배럴을 통해서만 접근해야 하며,
//       '@shared/components/hoc/*' 하위 직접 경로 import 금지

const ROOTS = ['src'];
const exts = new Set(['.ts', '.tsx']);

function listFilesRecursive(dir: string): string[] {
  try {
    if (!statSync(dir)) return [] as string[];
  } catch {
    return [] as string[];
  }
  const stack: string[] = [dir];
  const files: string[] = [];
  while (stack.length) {
    const cur = stack.pop()!;
    const entries = readdirSync(cur, { withFileTypes: true });
    for (const e of entries) {
      const p = join(cur, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (exts.has(extname(p))) files.push(p);
    }
  }
  return files;
}

describe('U4: HOC 배럴 import 강제', () => {
  it("'@shared/components/hoc' 이외의 하위 경로 import를 금지한다 (현재 RED 기대: FAIL)", () => {
    const offenders: string[] = [];
    const files = ROOTS.flatMap(listFilesRecursive);
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      // 정규식: from '@shared/components/hoc/...' 또는 import('@shared/components/hoc/...')
      const pattern = /['"]@shared\/components\/hoc\/[\w\-/.]+['"]/g;
      const matches = content.match(pattern);
      if (matches && matches.length) {
        offenders.push(`${file}: ${matches.join(', ')}`);
      }
    }

    expect(
      offenders,
      `배럴 경로를 사용하세요. 다음 파일에서 하위 경로 import가 발견됨:\n${offenders.join('\n')}`
    ).toEqual([]);
  });
});
