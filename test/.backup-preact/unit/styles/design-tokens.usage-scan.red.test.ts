/**
 * LEGACY-TOKENS-PRUNE-01 — usage scan (RED)
 *
 * 목적: 레거시 alias 중 실제 사용되지 않는 토큰을 자동 검출한다.
 * - 1차 타겟: overlay alias(무접두 color-) `--xeg-overlay-*` 4종
 * - 허용 리스트(ALLOWLIST)를 제공해 점진 제거를 안전하게 진행
 * - 선언 파일(design-tokens.css) 자체는 사용처로 간주하지 않음
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

function toPosix(p: string): string {
  return p.replace(/\\/g, '/');
}

function listFilesRecursive(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(p));
    else out.push(p);
  }
  return out;
}

describe('LEGACY-TOKENS-PRUNE-01: unused legacy aliases scan (RED)', () => {
  it('Overlay aliases without color- prefix should have zero usage or be removed', () => {
    const ROOT = process.cwd();
    const SRC = join(ROOT, 'src');
    const TOKENS_FILE = toPosix(join(ROOT, 'src/shared/styles/design-tokens.css'));
    expect(statSync(SRC).isDirectory()).toBe(true);

    // 1차 대상: color- 접두가 없는 overlay alias 4종
    const TARGET_TOKENS = [
      '--xeg-overlay-light',
      '--xeg-overlay-medium',
      '--xeg-overlay-strong',
      '--xeg-overlay-backdrop',
    ] as const;

    // 허용 리스트(외부 의존/주입 CSS 등) — 필요 시 추가
    const ALLOWLIST = new Set<string>([
      // 예) '--xeg-overlay-light'
    ]);

    const tokensCss = readFileSync(TOKENS_FILE, 'utf8');
    const declared = new Set(TARGET_TOKENS.filter(t => new RegExp(`${t}\\s*:`).test(tokensCss)));

    const offenders: string[] = [];
    const files = listFilesRecursive(SRC).filter(f => /\.(css|ts|tsx)$/.test(f));
    for (const token of TARGET_TOKENS) {
      if (!declared.has(token)) {
        // 이미 제거되었으면 스킵(OK)
        continue;
      }
      if (ALLOWLIST.has(token)) continue;

      const usageNeedle = `var(${token})`;
      let used = false;
      for (const f of files) {
        const rel = toPosix(relative(ROOT, f));
        if (toPosix(f) === TOKENS_FILE) continue; // 선언 파일은 제외
        const text = readFileSync(f, 'utf8');
        if (text.includes(usageNeedle)) {
          used = true;
          break;
        }
      }

      if (!used) offenders.push(token);
    }

    if (offenders.length > 0) {
      throw new Error(
        `Unused legacy overlay aliases detected (remove or allowlist):\n` +
          offenders.map(t => `- ${t}`).join('\n')
      );
    }
  });
});
