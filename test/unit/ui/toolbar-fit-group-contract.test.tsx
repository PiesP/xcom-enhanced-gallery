/* eslint-disable no-undef */
import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Toolbar FitModeGroup Contract', () => {
  test('fitModeGroup 제거 완료 및 fitButton radius 정책 유지 검증', () => {
    const css = readFileSync(
      join(process.cwd(), 'src', 'shared', 'components', 'ui', 'Toolbar', 'Toolbar.module.css'),
      'utf-8'
    );

    // fitModeGroup 클래스가 제거되었음을 확인
    expect(css).not.toMatch(/\.fitModeGroup/);

    // fitButton이 디자인 토큰을 사용하여 radius 정책을 준수하는지 확인
    // .fitButton, button.fitButton 선언부를 찾아 검증
    const fitButtonPattern =
      /\.fitButton[,\s]*(?:button\.fitButton\s*)?\{[^}]*border-radius:\s*var\(--xeg-radius-md\)[^}]*\}/;
    expect(css).toMatch(fitButtonPattern);
  });
});
