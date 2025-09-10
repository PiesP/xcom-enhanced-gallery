import { describe, it, expect } from 'vitest';
// Vite/Vitest raw import to read CSS content as string
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readCss() {
  const cssPath = resolve(
    process.cwd(),
    'src/shared/components/ui/ModalShell/ModalShell.module.css'
  );
  return readFileSync(cssPath, 'utf8');
}

/**
 * Overlay/Modal/Surface 토큰 일관화 – CSS 토큰 감사 테스트
 * - 목표: ModalShell.module.css에서 그림자 표현이 컴포넌트 토큰을 사용하도록 강제
 * - 금지: oklch( … ) 직접 사용 (토큰으로 대체)
 * - 요구: var(--xeg-comp-modal-shadow) 사용
 */

describe('ModalShell surface tokens', () => {
  const css = readCss();

  it('그림자에 컴포넌트 토큰을 사용해야 함', () => {
    expect(css.includes('var(--xeg-comp-modal-shadow)')).toBe(true);
  });

  it('oklch 직접 표기(하드코딩 색상 혼합)를 사용하지 않아야 함', () => {
    expect(css.includes('oklch(')).toBe(false);
  });
});
