import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Phase 1: 디자인 토큰 핵심 값 스냅샷 고정
 * 목적:
 *  - 후속 Phase 2 에서 Deprecated 토큰 제거 시 예기치 않은 회귀 감지
 *  - glass / alias / ultra-dark 사용 상태 명확화
 * 구현 메모:
 *  - CSS 파서를 사용하지 않고 단순 정규식으로 1차 추출 (빌드 안정성)
 *  - 필요 시 Phase 3에서 정규화된 파서 도입 가능
 */

const TOKEN_LIST = [
  '--xeg-glass-bg-light',
  '--xeg-glass-bg-medium',
  '--xeg-glass-bg-dark',
  '--xeg-glass-bg-ultra-light',
];

function extractTokenValues(css: string): Record<string, string | null> {
  const lines = css.split(/\n/);
  const map: Record<string, string | null> = {};
  for (const token of TOKEN_LIST) {
    const regex = new RegExp(`${token}\\s*:\\s*([^;]+);`);
    const match = lines.find(l => regex.test(l));
    if (match) {
      const value = match.match(regex)?.[1]?.trim() ?? null;
      map[token] = value;
    } else {
      map[token] = null; // 존재하지 않으면 회귀로 간주
    }
  }
  return map;
}

describe('design-tokens snapshot (Phase 1)', () => {
  it('should keep critical glass tokens stable', () => {
    const cssPath = join(process.cwd(), 'src', 'shared', 'styles', 'design-tokens.css');
    const css = readFileSync(cssPath, 'utf8');
    const extracted = extractTokenValues(css);

    // 존재 여부 보증
    expect(Object.values(extracted).filter(v => v === null).length).toBe(0);

    // 값 스냅샷
    expect(extracted).toMatchInlineSnapshot(`
      {
        "--xeg-glass-bg-dark": "rgba(0, 0, 0, 0.85)",
        "--xeg-glass-bg-light": "rgba(255, 255, 255, 0.85)",
        "--xeg-glass-bg-medium": "rgba(255, 255, 255, 0.65)",
        "--xeg-glass-bg-ultra-light": "rgba(255, 255, 255, 0.95)",
      }
    `);
  });
});
