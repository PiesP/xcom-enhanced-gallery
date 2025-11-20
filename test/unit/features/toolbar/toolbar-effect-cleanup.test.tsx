/**
 * @fileoverview Toolbar Effect Cleanup 검증
 * @description Toolbar 컴포넌트의 effect cleanup 및 최적화 정책 검증
 *
 * 검증 항목:
 * - 배경 밝기 감지 effect의 메모리 누수 방지
 * - props 동기화 최적화 (on() helper 사용)
 * - EventManager 리스너 cleanup
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const toolbarPath = resolve(process.cwd(), 'src/shared/components/ui/Toolbar/Toolbar.tsx');
const settingsControllerPath = resolve(
  process.cwd(),
  'src/shared/hooks/toolbar/use-toolbar-settings-controller.ts'
);

describe('Toolbar Effect Cleanup', () => {
  it('외부 클릭 감지는 cleanup 시 이벤트 리스너를 제거해야 함', () => {
    const sourceCode = readFileSync(settingsControllerPath, 'utf-8');

    expect(sourceCode).toContain("addEventListener('mousedown'");
    expect(sourceCode).toContain("removeEventListener('mousedown'");
    expect(sourceCode).toContain('onCleanup');
  });

  it('isDownloading props 동기화는 on() helper로 최적화되어야 함', () => {
    // Toolbar.tsx의 isDownloading 효과 검증
    const sourceCode = readFileSync(toolbarPath, 'utf-8');

    // isDownloading props 동기화 effect가 있어야 함
    expect(sourceCode).toContain('setDownloading');
    expect(sourceCode).toContain('props.isDownloading');

    // on() helper 사용 패턴 검증 (최적화된 경우)
    // 또는 createEffect(() => { ... }) 패턴 (대안)
    // Updated to support both direct prop access and accessor variable
    const hasOnHelper = /on\(\s*(\(\)\s*=>\s*props\.isDownloading|isDownloading)/s.test(sourceCode);
    const hasDirectEffect = /createEffect\(\(\)\s*=>\s*\{[^}]*setDownloading[^}]*\}\)/s.test(
      sourceCode
    );

    // 둘 중 하나는 있어야 함
    expect(hasOnHelper || hasDirectEffect).toBe(true);
  });

  it('파생 상태는 createMemo로 안정적으로 계산되어야 함', () => {
    const sourceCode = readFileSync(toolbarPath, 'utf-8');

    expect(sourceCode).toContain('const navState = createMemo');
    expect(sourceCode).toContain('computeNavigationState');
    expect(sourceCode).toContain('const progressWidth = createMemo');
  });
});
