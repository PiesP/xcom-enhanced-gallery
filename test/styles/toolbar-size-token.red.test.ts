import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// RED (P4): 아직 Toolbar.module.css 가 --xeg-size-toolbar-button 토큰을 사용하지 않음
// 추후 GREEN 단계에서 해당 토큰을 사용하도록 수정 후 본 테스트를 통과시키고
// 파일명을 toolbar-size-token.test.ts 로 변경

describe('P4 RED: toolbar size token adoption', () => {
  it('Toolbar.module.css should NOT yet reference --xeg-size-toolbar-button (forcing RED)', () => {
    // Match GREEN variant: only ascend two levels to reach project root
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
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
    const usage = css.includes('--xeg-size-toolbar-button');
    // 강제로 실패 (RED) : 아직 사용되지 않았음을 기대 -> usage === false 이어야 하나
    // 테스트는 반대로 usage 가 true 여야 한다고 주장해서 RED 유지
    expect(usage).toBe(true);
  });
});
