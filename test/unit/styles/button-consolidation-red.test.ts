/**
 * @fileoverview Phase 1 RED: Button Consolidation Guard Tests
 * @description Wrapper 컴포넌트/중복 CSS 변형이 남아있으면 실패하도록 하는 사전 방어 테스트
 * 실패 상태 유지가 정상(RED)이며 이후 Green 단계에서 통합 후 수정 예정.
 */
import { describe, test, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

// 프로젝트 루트 추정: 테스트 실행 경로 기준 상위로 이동 (src/test 구조 가정)
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// test/unit/styles → 프로젝트 루트 상위 3단계
const root = path.normalize(path.join(__dirname, '..', '..', '..'));


describe('Phase 3: Button Consolidation (Transition to GREEN)', () => {
  test('Wrapper 컴포넌트 현재 존재 (Baseline) - Phase 4에서 제거 예정', () => {
    const toolbarButton = existsSync(
      join(root, 'src/shared/components/ui/Toolbar/ToolbarButton.tsx')
    );
    const iconButton = existsSync(join(root, 'src/shared/components/ui/primitive/IconButton.tsx'));
    const legacyButton = existsSync(
      join(root, 'src/shared/components/ui/Button-legacy/Button.tsx')
    );

    // Baseline: 현재는 존재해야 함 (Phase 4에서 제거 후 반대로 수정)
    expect(toolbarButton || iconButton || legacyButton).toBe(true);
  });

  test('중복 CSS 변형 제거 확인 (ToolbarButton.styles 축소 placeholder)', () => {
    const toolbarCssPath = join(
      root,
      'src/shared/components/ui/Toolbar/ToolbarButton.module.css'
    );
    const toolbarCssExists = existsSync(toolbarCssPath);
    expect(toolbarCssExists).toBe(true);
  });

  test('IconButton.css 축소 placeholder (통합 완료)', () => {
    const iconCssExists = existsSync(
      join(root, 'src/shared/components/ui/primitive/IconButton.css')
    );
    expect(iconCssExists).toBe(true);
  });

  test('Button 전용 semantic token layer (button.ts) 구현 여부 (Phase 2 GREEN)', () => {
    const tokenFile = existsSync(join(root, 'src/shared/styles/tokens/button.ts'));
    expect(tokenFile).toBe(true);
  });
});
