import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');

describe('테마 대응성 강화 (TDD Phase 2)', () => {
  setupGlobalTestIsolation();

  it('design-tokens.semantic.css에 dark 테마 토큰이 정의되어 있어야 함', () => {
    const semanticCssPath = join(
      projectRoot,
      'src',
      'shared',
      'styles',
      'design-tokens.semantic.css'
    );
    const semanticCss = readFileSync(semanticCssPath, 'utf-8');

    expect(semanticCss).toContain("[data-theme='dark']");
    expect(semanticCss).toContain('--xeg-gallery-bg-dark');
    expect(semanticCss).toContain('--xeg-modal-bg-dark');
  });

  it('design-tokens.semantic.css에 light 테마 토큰이 정의되어 있어야 함', () => {
    const semanticCssPath = join(
      projectRoot,
      'src',
      'shared',
      'styles',
      'design-tokens.semantic.css'
    );
    const semanticCss = readFileSync(semanticCssPath, 'utf-8');

    expect(semanticCss).toContain("[data-theme='light']");
    expect(semanticCss).toContain('--xeg-gallery-bg-light');
    expect(semanticCss).toContain('--xeg-modal-bg-light');
  });

  it('prefers-color-scheme 미디어 쿼리를 지원해야 함', () => {
    const semanticCssPath = join(
      projectRoot,
      'src',
      'shared',
      'styles',
      'design-tokens.semantic.css'
    );
    const semanticCss = readFileSync(semanticCssPath, 'utf-8');

    // prefers-color-scheme 미디어 쿼리 확인
    expect(semanticCss).toContain('@media (prefers-color-scheme: dark)');
    expect(semanticCss).toContain('@media (prefers-color-scheme: light)');
  });

  it('모든 주요 컴포넌트가 테마 토큰을 사용해야 함', () => {
    // 갤러리 CSS 파일들 확인
    const galleryFiles = [
      'src/shared/styles/isolated-gallery.css',
      'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css',
      'src/shared/components/ui/Settings/SettingsControls.module.css',
    ];

    galleryFiles.forEach(filePath => {
      const fullPath = join(projectRoot, filePath);
      const content = readFileSync(fullPath, 'utf-8');

      // 테마 토큰 사용 확인 (var(--xeg-*) 패턴)
      const hasThemeTokens = /var\(--xeg-[^)]+\)/.test(content);
      expect(hasThemeTokens).toBe(true);

      // 하드코딩된 색상이 없는지 확인
      const hasHardcodedColors = /rgba?\([^)]+\)/.test(content);
      expect(hasHardcodedColors).toBe(false);
    });
  });

  it('갤러리 컨테이너가 테마별 스타일을 올바르게 적용해야 함', () => {
    const isolatedGalleryPath = join(
      projectRoot,
      'src',
      'shared',
      'styles',
      'isolated-gallery.css'
    );
    const content = readFileSync(isolatedGalleryPath, 'utf-8');

    // 갤러리 배경 토큰 사용 확인
    expect(content).toContain('var(--xeg-gallery-bg)');

    // 반응형 디자인을 위한 미디어 쿼리 존재 확인
    expect(content).toContain('@media');
  });

  it('테마 토큰이 계층적으로 fallback을 지원해야 함', () => {
    const semanticCssPath = join(
      projectRoot,
      'src',
      'shared',
      'styles',
      'design-tokens.semantic.css'
    );
    const semanticCss = readFileSync(semanticCssPath, 'utf-8');

    // 기본 토큰과 테마별 토큰의 관계 확인
    expect(semanticCss).toContain('--xeg-gallery-bg:');
    expect(semanticCss).toContain('--xeg-modal-bg:');
  });
});
