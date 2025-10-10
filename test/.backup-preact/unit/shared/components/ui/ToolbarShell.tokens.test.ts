/**
 * @fileoverview ToolbarShell 토큰 사용 정책 테스트
 * - box-shadow는 컴포넌트 토큰을 사용해야 함
 * - raw oklch 사용 금지
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

describe('ToolbarShell Token Policy', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  function readCSS() {
    const filePath = resolve(
      __dirname,
      '../../../../..',
      'src/shared/components/ui/ToolbarShell/ToolbarShell.module.css'
    );
    return readFileSync(filePath, 'utf-8');
  }

  it('uses component shadow token instead of raw values', () => {
    const css = readCSS();
    expect(css).toContain('--xeg-comp-toolbar-shadow');
  });

  it('does not contain raw oklch shadows', () => {
    const css = readCSS();
    expect(css.includes('oklch(')).toBe(false);
  });
});
