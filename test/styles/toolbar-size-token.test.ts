import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// GREEN: Toolbar.module.css 가 --xeg-size-toolbar-button 토큰을 사용해야 한다

describe('P4 GREEN: toolbar size token adoption', () => {
  it('Toolbar.module.css references --xeg-size-toolbar-button token', () => {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
    const toolbarCssPath = path.join(
      root,
      'src',
      'shared',
      'components',
      'ui',
      'Toolbar',
      'Toolbar.module.css'
    );
    const css = fs.readFileSync(toolbarCssPath, 'utf-8');
    expect(css.includes('--xeg-size-toolbar-button')).toBe(true);
  });
});
