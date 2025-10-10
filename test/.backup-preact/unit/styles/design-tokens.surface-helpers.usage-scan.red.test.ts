/**
 * LEGACY-TOKENS-PRUNE-02 — surface helper usage scan (RED)
 *
 * 목적: design-tokens.css 내 surface helper 클래스(.xeg-surface-*) 중
 * 실제 src 내에서 사용되지 않는 클래스가 남아있으면 실패한다.
 * - 선언 파일(design-tokens.css) 자체는 사용처로 간주하지 않음
 * - 점진적 제거를 위한 ALLOWLIST 제공
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

describe('LEGACY-TOKENS-PRUNE-02: unused surface helper classes scan (RED)', () => {
  it('Surface helpers declared in design-tokens.css must be used or removed', () => {
    const ROOT = process.cwd();
    const SRC = join(ROOT, 'src');
    const TOKENS_FILE = toPosix(join(ROOT, 'src/shared/styles/design-tokens.css'));

    expect(statSync(SRC).isDirectory()).toBe(true);

    // 타겟 surface helper 클래스 (필요 시 확장)
    const TARGET_CLASSES = ['.xeg-surface-primary', '.xeg-surface-elevated'] as const;

    // 선언 존재 여부 확인 (design-tokens.css 내 정의 블록 존재)
    const tokensCss = readFileSync(TOKENS_FILE, 'utf8');

    const declared = new Set(
      TARGET_CLASSES.filter(cls => new RegExp(`^\\${cls}\\s*{`, 'm').test(tokensCss))
    );

    // 점진 제거 허용 목록 (필요 시 항목 추가)
    const ALLOWLIST = new Set<string>([
      // 예) '.xeg-surface-primary'
    ]);

    const offenders: string[] = [];

    // src 전체에서 사용 여부 검사(선언 파일 제외)
    const files = listFilesRecursive(SRC).filter(f => /\.(css|ts|tsx)$/.test(f));

    for (const cls of TARGET_CLASSES) {
      if (!declared.has(cls)) continue; // 이미 제거됨 → OK
      if (ALLOWLIST.has(cls)) continue;

      // 클래스 문자열 사용(정의 외) 탐지: 'class="... xeg-surface-primary"' 또는 CSS에서 '.xeg-surface-primary'
      const usageNeedles = [cls.slice(1), cls]; // 'xeg-surface-primary', '.xeg-surface-primary'

      let used = false;
      for (const f of files) {
        if (toPosix(f) === TOKENS_FILE) continue; // 선언 파일 제외
        const text = readFileSync(f, 'utf8');
        if (usageNeedles.some(n => text.includes(n))) {
          used = true;
          break;
        }
      }

      if (!used) offenders.push(cls);
    }

    if (offenders.length > 0) {
      throw new Error(
        `Unused surface helper classes detected (remove or allowlist):\n` +
          offenders.map(c => `- ${c}`).join('\n')
      );
    }
  });
});
