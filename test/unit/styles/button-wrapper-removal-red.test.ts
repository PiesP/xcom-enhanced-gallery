/**
 * @fileoverview Phase 4 RED Test - Wrapper 제거 확인 테스트
 * 
 * 이 테스트는 legacy wrapper 컴포넌트들이 존재할 때 실패해야 합니다.
 * Codemod 실행 후 모든 wrapper가 제거되면 GREEN이 됩니다.
 */

import { describe, test, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// test/unit/styles → 프로젝트 루트 상위 3단계
const root = path.normalize(path.join(__dirname, '..', '..', '..'));

describe('Phase 4 RED: Button Wrapper 제거 확인', () => {
  test('ToolbarButton wrapper 컴포넌트가 제거되어야 함', () => {
    const toolbarButtonPath = join(root, 'src/shared/components/ui/Toolbar/ToolbarButton.tsx');
    
    // RED: wrapper가 존재하면 실패
    expect(existsSync(toolbarButtonPath)).toBe(false);
  });

  test('IconButton wrapper 컴포넌트가 제거되어야 함', () => {
    const iconButtonPath = join(root, 'src/shared/components/ui/primitive/IconButton.tsx');
    
    // RED: wrapper가 존재하면 실패  
    expect(existsSync(iconButtonPath)).toBe(false);
  });

  test('Button-legacy 디렉터리가 제거되어야 함', () => {
    const legacyButtonDir = join(root, 'src/shared/components/ui/Button-legacy');
    
    // RED: legacy 디렉터리가 존재하면 실패
    expect(existsSync(legacyButtonDir)).toBe(false);
  });

  test('placeholder CSS 파일들이 제거되어야 함', () => {
    const toolbarCssPath = join(root, 'src/shared/components/ui/Toolbar/ToolbarButton.module.css');
    const iconCssPath = join(root, 'src/shared/components/ui/primitive/IconButton.css');
    
    // RED: placeholder CSS가 존재하면 실패
    expect(existsSync(toolbarCssPath)).toBe(false);
    expect(existsSync(iconCssPath)).toBe(false);
  });
});
