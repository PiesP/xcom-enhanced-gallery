/**
 * Phase 2: 최신 CSS 기능 완전 통합 테스트
 * @version 2.0.0 - Phase 2 CSS Integration Tests
 *
 * CSS Cascade Layers, OKLCH 색상, Container Queries, CSS Subgrid,
 * CSS Containment, CSS Logical Properties 통합 검증
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT_DIR = join(__dirname, '..', '..');

/**
 * CSS 파일 읽기 유틸리티
 */
function readCSSFile(relativePath: string) {
  return readFileSync(join(ROOT_DIR, relativePath), 'utf-8');
}

describe('Phase 2: 최신 CSS 기능 완전 통합', () => {
  describe('1. CSS Cascade Layers 검증', () => {
    it('cascade-layers.css 파일이 올바른 레이어 구조를 정의해야 함', () => {
      const content = readCSSFile('src/shared/styles/cascade-layers.css');

      // 7개 레이어 구조 확인
      expect(content).toContain(
        '@layer reset, tokens, base, layout, components, utilities, overrides'
      );

      // 각 레이어별 import 확인
      expect(content).toContain('@layer reset');
      expect(content).toContain('@layer tokens');
      expect(content).toContain('@layer base');
      expect(content).toContain('@layer layout');
      expect(content).toContain('@layer components');
      expect(content).toContain('@layer utilities');
      expect(content).toContain('@layer overrides');
    });

    it('Gallery.module.css에서 CSS Cascade Layers 활용해야 함', () => {
      const content = readCSSFile('src/features/gallery/styles/Gallery.module.css');

      // Phase 2 헤더 확인
      expect(content).toContain('Phase 2: 최신 CSS 기능 완전 통합');
      expect(content).toContain('@version 3.0.0');

      // Layer 정의 확인 (선택적)
      const hasLayerDefinition =
        content.includes('@layer') || content.includes('CSS Cascade Layers');
      expect(hasLayerDefinition).toBeTruthy();
    });
  });

  describe('2. OKLCH 색상 공간 검증', () => {
    it('modern-features.css에서 OKLCH 색상 변수 정의해야 함', () => {
      const content = readCSSFile('src/shared/styles/modern-features.css');

      // OKLCH 색상 변수 확인
      expect(content).toContain('oklch(');
      expect(content).toContain('--xeg-color-primary-oklch');
      expect(content).toContain('--xeg-color-primary-hover-oklch');
      expect(content).toContain('--xeg-color-accent-oklch');
    });

    it('Gallery.module.css에서 OKLCH 색상 사용해야 함', () => {
      const content = readCSSFile('src/features/gallery/styles/Gallery.module.css');

      // OKLCH 색상 사용 확인
      expect(content).toContain('oklch(');
      expect(content).toContain('--xeg-gallery-bg-oklch');
      expect(content).toContain('--xeg-gallery-surface-oklch');
      expect(content).toContain('--xeg-gallery-text-oklch');

      // OKLCH from 구문 확인
      expect(content).toContain('oklch(from');
    });

    it('VerticalGalleryView.module.css에서 OKLCH 색상 사용해야 함', () => {
      const content = readCSSFile(
        'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
      );

      // OKLCH 색상 변수 확인
      expect(content).toContain('--xeg-vertical-bg-oklch');
      expect(content).toContain('--xeg-vertical-surface-oklch');
      expect(content).toContain('--xeg-vertical-text-oklch');
      expect(content).toContain('oklch(');
    });
  });

  describe('3. Container Queries 검증', () => {
    it('modern-features.css에서 Container Queries 정의해야 함', () => {
      const content = readCSSFile('src/shared/styles/modern-features.css');

      // Container Queries 기본 설정
      expect(content).toContain('container-type: size');
      expect(content).toContain('@container');
    });

    it('Gallery.module.css에서 Container Queries 활용해야 함', () => {
      const content = readCSSFile('src/features/gallery/styles/Gallery.module.css');

      // Container 설정
      expect(content).toContain('container-type: size');
      expect(content).toContain('container-name: gallery-main');

      // Container Queries 사용
      expect(content).toContain('@container gallery-main');
      expect(content).toContain('@container media-container');
    });

    it('VerticalGalleryView.module.css에서 Container Queries 활용해야 함', () => {
      const content = readCSSFile(
        'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
      );

      // 수직 갤러리 컨테이너 설정
      expect(content).toContain('container-name: vertical-gallery');
      expect(content).toContain('container-type: size');
    });
  });

  describe('4. CSS Subgrid 검증', () => {
    it('modern-features.css에서 CSS Subgrid 패턴 정의해야 함', () => {
      const content = readCSSFile('src/shared/styles/modern-features.css');

      // Subgrid 패턴 확인
      expect(content).toContain('grid-template-rows: subgrid');
    });

    it('Gallery.module.css에서 CSS Subgrid 활용해야 함', () => {
      const content = readCSSFile('src/features/gallery/styles/Gallery.module.css');

      // Grid 레이아웃 및 Subgrid 폴백
      expect(content).toContain('display: grid');
      expect(content).toContain('grid-template-areas');
      expect(content).toContain('@supports not (grid-template-rows: subgrid)');
    });
  });

  describe('5. CSS Containment 검증', () => {
    it('performance.css에서 CSS Containment 최적화 정의해야 함', () => {
      const content = readCSSFile('src/shared/styles/performance.css');

      // CSS Containment 패턴
      expect(content).toContain('contain: layout style paint');
      expect(content).toContain('content-visibility: auto');
      expect(content).toContain('contain-intrinsic-size');
    });

    it('Gallery.module.css에서 CSS Containment 활용해야 함', () => {
      const content = readCSSFile('src/features/gallery/styles/Gallery.module.css');

      // Containment 적용
      expect(content).toContain('contain: layout style');
      expect(content).toContain('contain: layout style paint');
      expect(content).toContain('content-visibility: auto');
    });

    it('VerticalGalleryView.module.css에서 CSS Containment 활용해야 함', () => {
      const content = readCSSFile(
        'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
      );

      // Containment 적용
      expect(content).toContain('contain: layout style paint');
      expect(content).toContain('content-visibility: auto');
    });
  });

  describe('6. CSS Logical Properties 검증', () => {
    it('Gallery.module.css에서 CSS Logical Properties 사용해야 함', () => {
      const content = readCSSFile('src/features/gallery/styles/Gallery.module.css');

      // Logical Properties 사용
      expect(content).toContain('padding-block');
      expect(content).toContain('padding-inline');
      expect(content).toContain('inset-block-start');
      expect(content).toContain('inset-inline-start');
      expect(content).toContain('inset-inline-end');
      expect(content).toContain('inline-size');
      expect(content).toContain('block-size');
      expect(content).toContain('max-inline-size');
      expect(content).toContain('max-block-size');
    });
  });

  describe('7. 고급 CSS 선택자 검증', () => {
    it('modern-features.css에서 고급 선택자 정의해야 함', () => {
      const content = readCSSFile('src/shared/styles/modern-features.css');

      // 고급 선택자 사용
      expect(content).toMatch(/:has\(|:where\(|:is\(/);
    });

    it('Gallery.module.css에서 :has() 선택자 활용해야 함', () => {
      const content = readCSSFile('src/features/gallery/styles/Gallery.module.css');

      // :has() 선택자 사용
      expect(content).toContain(':has(');
    });
  });

  describe('8. CSS Nesting 검증', () => {
    it('Gallery.module.css에서 CSS Nesting 활용해야 함', () => {
      const content = readCSSFile('src/features/gallery/styles/Gallery.module.css');

      // CSS Nesting 패턴
      expect(content).toContain('&:hover');
      expect(content).toContain('&:active');
      expect(content).toContain('&:focus-visible');
      expect(content).toContain('&:disabled');
      expect(content).toContain('&.xeg');
    });
  });

  describe('9. 성능 최적화 검증', () => {
    it('모든 갤러리 컴포넌트에서 GPU 가속 활용해야 함', () => {
      const galleryCSS = readCSSFile('src/features/gallery/styles/Gallery.module.css');
      const verticalCSS = readCSSFile(
        'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
      );

      // GPU 가속 변수 사용
      expect(galleryCSS).toContain('--xeg-gallery-gpu-acceleration');
      expect(galleryCSS).toContain('will-change: transform');

      expect(verticalCSS).toContain('--xeg-vertical-gpu-acceleration');
    });

    it('will-change 속성이 적절히 사용되어야 함', () => {
      const galleryCSS = readCSSFile('src/features/gallery/styles/Gallery.module.css');

      // will-change 사용
      expect(galleryCSS).toContain('will-change: opacity, transform');
      expect(galleryCSS).toContain('will-change: transform, background-color');
      expect(galleryCSS).toContain('will-change: transform');
    });
  });

  describe('10. 전체 통합 검증', () => {
    it('모든 주요 CSS 파일이 Phase 2 기능을 포함해야 함', () => {
      const files = [
        'src/shared/styles/cascade-layers.css',
        'src/shared/styles/modern-features.css',
        'src/shared/styles/performance.css',
        'src/features/gallery/styles/Gallery.module.css',
        'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css',
      ];

      files.forEach(file => {
        expect(() => readCSSFile(file)).not.toThrow();
        const content = readCSSFile(file);
        expect(content.length).toBeGreaterThan(0);
      });
    });

    it('CSS 구문 오류가 없어야 함', () => {
      const galleryCSS = readCSSFile('src/features/gallery/styles/Gallery.module.css');
      const verticalCSS = readCSSFile(
        'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
      );

      // 기본적인 CSS 구문 검증
      expect(galleryCSS).not.toContain('{{');
      expect(galleryCSS).not.toContain('}}');
      expect(verticalCSS).not.toContain('{{');
      expect(verticalCSS).not.toContain('}}');

      // 닫히지 않은 중괄호 검증
      const openBraces = (galleryCSS.match(/{/g) || []).length;
      const closeBraces = (galleryCSS.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });
  });
});
