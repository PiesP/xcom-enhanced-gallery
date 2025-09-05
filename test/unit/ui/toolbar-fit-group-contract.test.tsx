import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Toolbar FitModeGroup Contract', () => {
  test('fitModeGroup white box 제거 + radius 정책 유지', () => {
    const css = readFileSync(
      join(process.cwd(), 'src', 'shared', 'components', 'ui', 'Toolbar', 'Toolbar.module.css'),
      'utf-8'
    );
    const match = css.match(/\.fitModeGroup\s*{[^}]*}/);
    expect(match).toBeTruthy();
    const rule = match ? match[0] : '';
    expect(rule).toMatch(/background:\s*transparent/);
    expect(rule).toMatch(/border:\s*none/);
    expect(rule).toMatch(/padding:\s*0/);
    expect(rule).toMatch(/border-radius:\s*var\(--xeg-radius-md\)/);
  });
});
