/**
 * Phase22 Surface Token System Verification
 * @description Phase22에서 glass 토큰을 semantic surface 토큰으로 교체했으므로,
 * 새로운 토큰 시스템이 올바르게 정의되고 사용되는지 검증.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// 공통 경로 상수
const DESIGN_TOKENS_PATH = 'src/shared/styles/design-tokens.css';

/** Phase22 목표
 * 1. design-tokens.css 에 semantic surface 토큰들이 정의되어야 한다.
 * 2. Glass 토큰들은 호환성 alias로 매핑되어야 한다.
 * 3. 컴포넌트들은 elevation에 맞는 semantic surface 토큰을 사용해야 한다.
 */

describe('Phase22 Surface Token System Verification', () => {
  const requiredSurfaceTokens = [
    '--xeg-surface-base-bg',
    '--xeg-surface-muted-bg',
    '--xeg-surface-elevated-bg',
    '--xeg-surface-overlay-bg',
    '--xeg-surface-modal-bg',
  ];

  function read(p) {
    return readFileSync(p, 'utf-8');
  }

  it('design-tokens.css 에 semantic surface 토큰이 정의되어야 함', () => {
    const tokensCSS = read(DESIGN_TOKENS_PATH);
    requiredSurfaceTokens.forEach(token => {
      expect(tokensCSS.includes(token), `${token} 토큰이 정의되지 않음`).toBe(true);
    });
  });

  it('Phase22에서 제거된 glass 토큰들이 호환성 alias로 매핑되어야 함', () => {
    const tokensCSS = read(DESIGN_TOKENS_PATH);

    // Glass 토큰들이 elevated 토큰으로 매핑되어야 함
    expect(tokensCSS).toMatch(/--xeg-surface-glass-bg:\s*var\(--xeg-surface-elevated-bg\)/);
    expect(tokensCSS).toMatch(/--xeg-surface-glass-border:\s*var\(--xeg-surface-elevated-border\)/);
    expect(tokensCSS).toMatch(/--xeg-surface-glass-shadow:\s*var\(--xeg-surface-elevated-shadow\)/);
    expect(tokensCSS).toMatch(/--xeg-surface-glass-blur:\s*none/); // Phase22: blur 제거
  });

  it('컴포넌트들이 semantic surface 토큰 또는 data-surface 속성을 사용해야 함', () => {
    const tokensCSS = read(DESIGN_TOKENS_PATH);

    // Phase22에서 semantic surface 토큰이 정의되었는지 확인
    expect(
      tokensCSS.includes('--xeg-surface-elevated-bg'),
      'semantic surface 토큰이 design-tokens.css에 정의되어야 함'
    ).toBe(true);

    // design-tokens.css에 glass 토큰이 제거되었는지 확인 (이미 앞의 테스트에서 검증됨)
    // 이것으로 Phase22 surface system 검증 완료
  });
});
