import { describe, it, expect } from 'vitest';
import process from 'node:process';
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
 * - 목표: ModalShell.module.css에서 컴포넌트 alias 그림자 토큰 제거 후 semantic shadow 사용
 * - 금지: oklch( … ) 직접 사용 (토큰으로 대체)
 * - 요구: var(--xeg-shadow-lg) (또는 legacy --shadow-lg) 사용 / alias 미사용
 */

describe('ModalShell surface tokens', () => {
  const css = readCss();

  it('그림자에 semantic shadow 토큰을 사용해야 하며 alias를 사용하지 않아야 함', () => {
    expect(css.includes('var(--xeg-shadow-lg)') || css.includes('var(--shadow-lg)')).toBe(true);
    expect(css.includes('var(--xeg-comp-modal-shadow)')).toBe(false);
  });

  it('oklch 직접 표기(하드코딩 색상 혼합)를 사용하지 않아야 함', () => {
    expect(css.includes('oklch(')).toBe(false);
  });
});
