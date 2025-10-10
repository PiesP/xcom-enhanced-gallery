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

describe('Phase 3: Button Consolidation (완료) + Phase 4: Wrapper 제거 (완료)', () => {
  test('Wrapper 컴포넌트 제거 완료 (Phase 4 GREEN)', () => {
    const toolbarButton = existsSync(
      join(root, 'src/shared/components/ui/Toolbar/ToolbarButton.tsx')
    );
    const iconButton = existsSync(join(root, 'src/shared/components/ui/primitive/IconButton.tsx'));
    const legacyButton = existsSync(
      join(root, 'src/shared/components/ui/Button-legacy/Button.tsx')
    );

    // Phase 4 완료: 모든 wrapper가 제거되어야 함
    expect(toolbarButton || iconButton || legacyButton).toBe(false);
  });

  test('중복 CSS 파일 제거 완료 (Phase 4 GREEN)', () => {
    const toolbarCssPath = join(root, 'src/shared/components/ui/Toolbar/ToolbarButton.module.css');
    const toolbarCssExists = existsSync(toolbarCssPath);
    expect(toolbarCssExists).toBe(false);
  });

  test('IconButton.css 제거 완료 (Phase 4 GREEN)', () => {
    const iconCssExists = existsSync(
      join(root, 'src/shared/components/ui/primitive/IconButton.css')
    );
    expect(iconCssExists).toBe(false);
  });

  test('Button 전용 semantic token layer (button.ts) 구현 여부 (Phase 2 GREEN)', () => {
    const tokenFile = existsSync(join(root, 'src/shared/styles/tokens/button.ts'));
    expect(tokenFile).toBe(true);
  });
});
