/**
 * Phase 1 Task: Normalize media glass background tokens
 * RED TEST: 현재 --xeg-media-glass-bg 정의가 직접 rgba 값을 사용하지 않고
 *           표준화된 투명 글래스 토큰(var(--xeg-glass-bg-translucent-*))을 참조해야 한다.
 * 기대:
 *  - design-tokens.css 내 모든 --xeg-media-glass-bg 정의 라인에 rgba( 가 포함되지 않을 것
 *  - var(--xeg-glass-bg-translucent 로 시작하는 토큰 참조를 사용할 것
 * 이 테스트는 초기에는 실패(RED) 후 토큰 리팩토링 적용으로 GREEN 전환.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('design-tokens media glass normalization (Phase 1)', () => {
  // __dirname => test/consolidated -> project root is two levels up
  const cssPath = resolve(__dirname, '..', '..', 'src/shared/styles/design-tokens.css');
  const css = readFileSync(cssPath, 'utf-8');

  it('should define all --xeg-media-glass-bg lines using translucent glass var tokens (no direct rgba)', () => {
    const lines = css
      .split(/\r?\n/)
      .filter(l => l.includes('--xeg-media-glass-bg'))
      .filter(l => !l.trim().startsWith('/*'));
    expect(lines.length).toBeGreaterThan(0);
    const offending = lines.filter(l => /rgba\(/.test(l));
    // Expect no raw rgba usage
    expect(offending).toEqual([]);
    const missingVar = lines.filter(l => !/var\(--xeg-glass-bg-translucent/.test(l));
    expect(missingVar).toEqual([]);
  });
});
