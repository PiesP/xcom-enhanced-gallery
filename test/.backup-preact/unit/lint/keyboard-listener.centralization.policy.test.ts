/**
 * Guard: Keyboard listener centralization policy
 * - Forbid direct document/window keydown/keyup listeners in UI code
 * - Enforce using unified EventManager in features/components/hooks
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOTS = ['src/features', 'src/shared/components', 'src/shared/hooks'];
const exts = new Set(['.ts', '.tsx']);

const BANNED_REGEX = [
  /document\.(addEventListener|onkeydown|onkeyup)\s*\(\s*['"](keydown|keyup)/,
  /window\.(addEventListener|onkeydown|onkeyup)\s*\(\s*['"](keydown|keyup)/,
];

function listFilesRecursive(dir: string): string[] {
  try {
    if (!statSync(dir, { throwIfNoEntry: false as any })) return [] as string[];
  } catch {
    return [];
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

function scanFile(file: string) {
  const content = readFileSync(file, 'utf8');
  const offenders: { file: string; line: number; snippet: string; pattern: string }[] = [];
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('// eslint') || trimmed.startsWith('// ts-')) continue;
    for (const rx of BANNED_REGEX) {
      if (rx.test(line)) {
        offenders.push({ file, line: i + 1, snippet: line.slice(0, 200), pattern: String(rx) });
      }
    }
  }
  return offenders;
}

describe('Keyboard listener centralization policy', () => {
  it('must not directly attach keydown/keyup on document/window in UI code', () => {
    const files = ROOTS.flatMap(listFilesRecursive);
    const offenders = files.flatMap(scanFile);

    // Allow known centralized modules to use direct listeners (excluded roots)
    const filtered = offenders.filter(o => !/shared[\\/]hooks[\\/]useFocusTrap\.ts$/.test(o.file));

    expect(
      filtered.map(o => `${o.file}:${o.line} -> ${o.snippet}`),
      `UI 코드에서 document/window에 직접 keydown/keyup 리스너를 등록하지 마세요. EventManager를 사용하세요. Offenders:\n${filtered
        .map(o => `${o.file}:${o.line}`)
        .join('\n')}`
    ).toEqual([]);
  });
});
