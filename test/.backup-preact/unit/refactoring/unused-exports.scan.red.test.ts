import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

// Phase U4 (부분): HOC 배럴에서 사용되지 않는 export 축소
// 범위 축소: src/shared/components/hoc/index.ts 의 export 심볼만 검사

const BARREL = 'src/shared/components/hoc/index.ts';
const SOURCE = 'src/shared/components/hoc/GalleryHOC.tsx';
const ROOT = 'src';
const normalize = (p: string) => p.replace(/\\/g, '/');
const exts = new Set(['.ts', '.tsx']);

function listFilesRecursive(dir: string): string[] {
  const files: string[] = [];
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop()!;
    let stats: any;
    try {
      stats = statSync(cur, { throwIfNoEntry: false as any });
    } catch {
      continue;
    }
    if (!stats) continue;
    if (stats.isDirectory()) {
      for (const e of readdirSync(cur, { withFileTypes: true })) {
        stack.push(join(cur, e.name));
      }
    } else if (exts.has(extname(cur))) {
      files.push(normalize(cur));
    }
  }
  return files;
}

function parseExportedNames(content: string): string[] {
  // 단순 파서: export { a, b as c, type T } from './GalleryHOC';
  const names: string[] = [];
  const re = /export\s*\{([^}]+)\}\s*from\s*['"][^'"]+['"];?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) {
    const inner = m[1];
    inner
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .forEach(entry => {
        // remove leading 'type' and handle aliases 'x as y'
        const cleaned = entry.replace(/^type\s+/, '');
        const parts = cleaned.split(/\s+as\s+/);
        const name = (parts[1] ?? parts[0]).trim();
        if (name) names.push(name);
      });
  }
  return Array.from(new Set(names));
}

describe('U4: HOC 배럴 unused export 축소', () => {
  it('배럴에서 export된 심볼은 최소 1회 이상 사용되어야 한다 (현재 RED 기대: FAIL)', () => {
    const barrelContent = readFileSync(BARREL, 'utf8');
    const exported = parseExportedNames(barrelContent);
    const files = listFilesRecursive(ROOT).filter(
      f => normalize(f) !== BARREL && normalize(f) !== SOURCE
    );

    const contentMap = new Map<string, string>();
    for (const f of files) contentMap.set(f, readFileSync(f, 'utf8'));

    const unused: string[] = [];
    for (const name of exported) {
      let used = false;
      for (const [, c] of contentMap) {
        const re = new RegExp(`\\b${name}\\b`);
        if (re.test(c)) {
          used = true;
          break;
        }
      }
      if (!used) unused.push(name);
    }

    expect(
      unused,
      `사용되지 않는 export가 발견되었습니다. 배럴 표면을 축소하세요: ${unused.join(', ')}`
    ).toEqual([]);
  });
});
