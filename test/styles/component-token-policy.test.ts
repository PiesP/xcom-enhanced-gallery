/**
 * @fileoverview Component Token Policy Tests
 * @description Phase 54.0 - 컴포넌트 CSS에서 semantic 토큰 로컬 재정의 방지 정책
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '../..');

describe('Phase 54.0: Component Token Policy (RED)', () => {
  it('ToolbarShell은 semantic 토큰을 직접 참조해야 함', () => {
    const toolbarShellPath = resolve(
      root,
      'src/shared/components/ui/ToolbarShell/ToolbarShell.module.css'
    );
    const content = readFileSync(toolbarShellPath, 'utf-8');

    // 로컬 재정의 패턴 검출
    const redefinitions = content.match(/^\s*--xeg-[a-z0-9-]+:\s*var\(--xeg-/gm);

    if (redefinitions) {
      console.error('\n❌ ToolbarShell에서 발견된 로컬 재정의:');
      redefinitions.forEach(r => console.error(`  ${r.trim()}`));
      console.error('\n💡 수정: 로컬 재정의를 제거하고 semantic 토큰을 직접 사용하세요.');
    }

    expect(redefinitions).toBeNull();
  });

  it('VerticalGalleryView는 semantic 토큰을 직접 참조해야 함', () => {
    const galleryViewPath = resolve(
      root,
      'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
    );
    const content = readFileSync(galleryViewPath, 'utf-8');

    // 로컬 재정의 패턴 검출
    const redefinitions = content.match(/^\s*--xeg-[a-z0-9-]+:\s*var\(--xeg-/gm);

    if (redefinitions) {
      console.error('\n❌ VerticalGalleryView에서 발견된 로컬 재정의:');
      redefinitions.forEach(r => console.error(`  ${r.trim()}`));
      console.error('\n💡 수정: 로컬 재정의를 제거하고 semantic 토큰을 직접 사용하세요.');
    }

    expect(redefinitions).toBeNull();
  });

  it('툴바 관련 토큰은 semantic 레이어에 정의되어 있어야 함', () => {
    const semanticCssPath = resolve(root, 'src/shared/styles/design-tokens.semantic.css');
    const content = readFileSync(semanticCssPath, 'utf-8');

    // 필수 툴바 토큰 확인
    const requiredTokens = ['--xeg-bg-toolbar', '--color-border-default', '--xeg-shadow-md'];

    const missingTokens = requiredTokens.filter(token => !content.includes(`${token}:`));

    if (missingTokens.length > 0) {
      console.error('\n❌ Semantic 레이어에서 누락된 툴바 토큰:');
      missingTokens.forEach(token => console.error(`  - ${token}`));
    }

    expect(missingTokens).toEqual([]);
  });
});
