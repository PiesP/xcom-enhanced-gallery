/**
 * @fileoverview glass-surface 미사용 검증 테스트
 * @description Toolbar와 SettingsModal에서 glass-surface 클래스를 사용하지 않아야 함을 검증
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

describe('Glass Surface Removal', () => {
  it('should not use glass-surface class in Toolbar component', () => {
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

    // glass-surface 클래스 사용 금지
    expect(toolbarContent).not.toMatch(/['"`]glass-surface['"`]/);
    expect(toolbarContent).not.toMatch(/className.*glass-surface/);
  });

  it('should not use glass-surface class in SettingsModal component', () => {
    const modalPath = join(
      process.cwd(),
      'src',
      'shared',
      'components',
      'ui',
      'SettingsModal',
      'SettingsModal.tsx'
    );
    const modalContent = readFileSync(modalPath, 'utf-8');

    // glass-surface 클래스 사용 금지
    expect(modalContent).not.toMatch(/['"`]glass-surface['"`]/);
    expect(modalContent).not.toMatch(/className.*glass-surface/);
  });

  it('should use component tokens for Toolbar background in CSS', () => {
    const toolbarCssPath = join(
      process.cwd(),
      'src',
      'shared',
      'components',
      'ui',
      'Toolbar',
      'Toolbar.module.css'
    );
    const toolbarCssContent = readFileSync(toolbarCssPath, 'utf-8');

    // 컴포넌트 토큰 사용 확인
    expect(toolbarCssContent).toMatch(/var\(--xeg-comp-toolbar-bg\)/);
  });

  it('should use component tokens for SettingsModal background in CSS', () => {
    const modalCssPath = join(
      process.cwd(),
      'src',
      'shared',
      'components',
      'ui',
      'SettingsModal',
      'SettingsModal.module.css'
    );
    const modalCssContent = readFileSync(modalCssPath, 'utf-8');

    // 컴포넌트 토큰 사용 확인
    expect(modalCssContent).toMatch(/var\(--xeg-comp-modal-bg\)/);
  });
});
