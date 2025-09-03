import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'fs';

// 2025-09-03 캡처된 baseline (design-tokens.css 바이트 크기)
const BASELINE_BYTES = 33229; // 변경 필요 시 문서/커밋 메시지에 근거 기록 후 업데이트
const ALLOWED_DELTA = 512; // 허용 증가 한계 (512 bytes)

describe('design-tokens.css size guard', () => {
  it('CSS 토큰 파일 크기 증가가 허용 범위 이내', () => {
    const path = 'src/shared/styles/design-tokens.css';
    const size = statSync(path).size;
    // size 가 감소하는 것은 허용 (정리 환영). 증가 시 한계 초과 여부 검사.
    if (size > BASELINE_BYTES) {
      const growth = size - BASELINE_BYTES;
      expect(growth).toBeLessThanOrEqual(ALLOWED_DELTA);
    } else {
      // 감소 또는 동일 → 자동 통과
      expect(size).toBeLessThanOrEqual(BASELINE_BYTES + ALLOWED_DELTA);
    }
  });

  it('파일 내 OKLCH 토큰 파서 수(단순 검사) 30개 이상 유지 (축소 회귀 방지)', () => {
    const css = readFileSync('src/shared/styles/design-tokens.css', 'utf8');
    const matches = css.match(/oklch\(/g) || [];
    expect(matches.length).toBeGreaterThanOrEqual(30);
  });
});
