/**
 * U3 Guard: PC-only events enforcement
 * - Fail if any touch/pointer-specific events or types are used in UI code.
 * - Scans src/features/** and src/shared/components/** for banned tokens.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOTS = ['src/features', 'src/shared/components'];
const exts = new Set(['.ts', '.tsx']);

// Banned tokens: Touch/Pointer events/types/handlers
const BANNED = [
  // React/Preact handlers
  'onTouch',
  'onPointer',
  // DOM event types
  'TouchEvent',
  'PointerEvent',
  // addEventListener forms
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
  if (!statSync(dir, { throwIfNoEntry: false as any })) return [] as string[];
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
  const offenders: { file: string; line: number; snippet: string; token: string }[] = [];
  const content = readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Ignore obvious eslint and ts pragma comments lines to reduce false positives
    const trimmed = line.trim();
    if (trimmed.startsWith('// eslint') || trimmed.startsWith('// ts-')) continue;
    for (const token of BANNED) {
      if (line.includes(token)) {
        offenders.push({ file, line: i + 1, snippet: line.slice(0, 200), token });
      }
    }
  }
  return offenders;
}

describe('PC-only events policy: no touch/pointer usage in UI code', () => {
  it('must not contain touch/pointer handlers or event types in features/components', () => {
    const files = ROOTS.flatMap(listFilesRecursive);
    const offenders = files.flatMap(scanFile);

    expect(
      offenders.map(o => `${o.file}:${o.line} contains '${o.token}' -> ${o.snippet}`),
      `터치/포인터 이벤트/타입 사용 금지. 다음 위치에서 발견됨:\n${offenders
        .map(o => `${o.file}:${o.line} contains '${o.token}'`)
        .join('\n')}`
    ).toEqual([]);
  });
});
