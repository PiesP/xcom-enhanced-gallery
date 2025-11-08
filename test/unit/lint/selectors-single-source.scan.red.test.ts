import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = 'src';
const exts = new Set(['.ts', '.tsx']);
const ALLOWLIST = new Set<string>([
  // constants는 단일 소스 정의 파일이므로 허용
  'src/constants/selectors.ts',
  'src/constants/video-controls.ts',
]);

// 핵심 testid/role 패턴 (필요시 확장)
const BANNED_SNIPPETS = [
  '[data-testid="tweetPhoto"]',
  '[data-testid="videoPlayer"]',
  'article[data-testid="tweet"]',
  '[data-testid="videoComponent"]',
  '[data-testid="playButton"]',
  '[data-testid="bookmark"]',
  '[data-testid="retweet"]',
  '[data-testid="like"]',
  '[data-testid="reply"]',
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
  const offenders: string[] = [];
  for (const token of BANNED_SNIPPETS) {
    if (content.includes(token)) offenders.push(token);
  }
  return offenders;
}

describe('Selectors single-source policy', () => {
  setupGlobalTestIsolation();

  it('must not hardcode common testid selectors in src/** (use constants)', () => {
    const files = listFilesRecursive(ROOT).filter(f => !ALLOWLIST.has(f));
    const violations: string[] = [];
    for (const f of files) {
      const tokens = scanFile(f);
      if (tokens.length) violations.push(`${f} -> ${tokens.join(', ')}`);
    }
    expect(
      violations,
      '하드코딩된 testid/role 선택자를 constants(STABLE_SELECTORS/SELECTORS)로 치환하세요.'
    ).toEqual([]);
  });
});
