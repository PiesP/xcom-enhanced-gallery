import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(path) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('Animation tokens policy', () => {
  it('xeg-spin 애니메이션은 하드코딩 시간(1s 등) 대신 토큰을 사용해야 함', () => {
    const buttonCSS = read('src/shared/components/ui/Button/Button.module.css');
    const toolbarCSS = read('src/shared/components/ui/Toolbar/Toolbar.module.css');

    // 금지: xeg-spin 1s (혹은 500ms 등 숫자 단위)
    const hardcodedSpinPattern = /animation:\s*xeg-spin\s+\d+(?:ms|s)\b/;
    expect(hardcodedSpinPattern.test(buttonCSS)).toBe(false);
    expect(hardcodedSpinPattern.test(toolbarCSS)).toBe(false);

    // 권장: xeg-spin var(--xeg-duration-*)
    const tokenizedSpinPattern = /animation:\s*xeg-spin\s+var\(--xeg-duration-[^)]+\)/;
    expect(tokenizedSpinPattern.test(buttonCSS) || tokenizedSpinPattern.test(toolbarCSS)).toBe(
      true
    );
  });
});
