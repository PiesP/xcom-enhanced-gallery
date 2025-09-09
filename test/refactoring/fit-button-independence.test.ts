/**
 * @fileoverview 핏 버튼 독립 배치 검증 테스트
 * @description 핏 버튼들이 그룹 래퍼 없이 개별적으로 배치되어야 함을 검증
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

describe('Fit Button Independence', () => {
  it('should not have fitModeGroup wrapper in Toolbar component', () => {
    const toolbarPath = join(
      process.cwd(),
      'src',
      'shared',
      'components',
      'ui',
      'Toolbar',
      'Toolbar.tsx'
    );
    const toolbarContent = readFileSync(toolbarPath, 'utf-8');

    // fitModeGroup 클래스나 래퍼가 존재하지 않아야 함
    expect(toolbarContent).not.toMatch(/fitModeGroup/);
    expect(toolbarContent).not.toMatch(/className.*fitModeGroup/);
  });

  it('should have fit buttons directly in toolbarRight section', () => {
    const toolbarPath = join(
      process.cwd(),
      'src',
      'shared',
      'components',
      'ui',
      'Toolbar',
      'Toolbar.tsx'
    );
    const toolbarContent = readFileSync(toolbarPath, 'utf-8');

    // 핏 버튼들이 개별적으로 존재해야 함
    expect(toolbarContent).toMatch(/data-gallery-element=["']fit-original["']/);
    expect(toolbarContent).toMatch(/data-gallery-element=["']fit-width["']/);
    expect(toolbarContent).toMatch(/data-gallery-element=["']fit-height["']/);
    expect(toolbarContent).toMatch(/data-gallery-element=["']fit-container["']/);
  });

  it('should not have fitModeGroup CSS class defined', () => {
    const cssPath = join(
      process.cwd(),
      'src',
      'shared',
      'components',
      'ui',
      'Toolbar',
      'Toolbar.module.css'
    );
    const cssContent = readFileSync(cssPath, 'utf-8');

    // fitModeGroup 관련 스타일이 제거되어야 함
    expect(cssContent).not.toMatch(/\.fitModeGroup/);
  });
});
