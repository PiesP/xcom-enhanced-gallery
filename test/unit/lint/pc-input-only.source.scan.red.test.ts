import { describe, it, expect } from 'vitest';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOTS = ['src/features', 'src/shared/components', 'src/shared/services'];
const exts = new Set(['.ts', '.tsx']);
const BANNED = [
  'onTouch',
  'onPointer',
  'TouchEvent',
  'PointerEvent',
  'touchstart',
  'touchend',
  'touchmove',
  'pointerdown',
  'pointerup',
  'pointermove',
  'pointerenter',
  'pointerleave',
  'pointercancel',
];

function listFilesRecursive(dir: string): string[] {
  try {
    if (!statSync(dir)) return [] as any;
  } catch {
    return [] as any;
  }
  const stack: string[] = [dir];
  const files: string[] = [];
  while (stack.length) {
    const cur = stack.pop()!;
    const entries = readdirSync(cur, { withFileTypes: true });
    for (const e of entries) {
      const p = join(cur, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (exts.has(extname(p))) files.push(p.replace(/\\/g, '/'));
    }
  }
  return files;
}

function scanFile(file: string) {
  const content = readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  const offenders: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('// eslint') || trimmed.startsWith('// ts-')) continue;
    for (const token of BANNED) {
      if (line.includes(token)) offenders.push(`${file}:${i + 1} -> ${token}`);
    }
  }
  return offenders;
}

describe('PC-only events source scan', () => {
  it('must not contain touch/pointer events/types in src/** UI/service code', () => {
    const files = ROOTS.flatMap(listFilesRecursive);
    const violations = files.flatMap(scanFile);
    expect(
      violations,
      '터치/포인터 이벤트/타입 사용 금지. src/features, src/shared/components, src/shared/services 하위에서 탐지됨'
    ).toEqual([]);
  });
});
