/**
 * Gallery 컴포넌트 디자인 시스템 일관성 테스트
 *
 * @description Gallery 컴포넌트들이 디자인 시스템을 일관되게 사용하는지 검증
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import process from 'process';

describe('Gallery 컴포넌트 디자인 시스템 TDD', () => {
  const galleryMainCssPath = join(process.cwd(), 'src/features/gallery/styles/Gallery.module.css');
  const verticalGalleryCssPath = join(
    process.cwd(),
    'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
  );
  const verticalImageCssPath = join(
    process.cwd(),
    'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css'
  );

  describe('Phase 1: OKLCH 색상 시스템 사용', () => {
    it('Gallery.module.css가 OKLCH 색상을 사용해야 함', () => {
      const cssContent = readFileSync(galleryMainCssPath, 'utf-8');

      expect(cssContent).toMatch(/oklch\(/);
      expect(cssContent).toMatch(/--xeg-gallery-.*-oklch/);
    });

    it('모든 Gallery CSS 파일이 디자인 토큰을 사용해야 함', () => {
      const cssFiles = [galleryMainCssPath, verticalGalleryCssPath, verticalImageCssPath];

      cssFiles.forEach(filePath => {
        const cssContent = readFileSync(filePath, 'utf-8');

        // CSS 변수 사용 확인
        const hasDesignTokens =
          cssContent.includes('var(--xeg-') ||
          cssContent.includes('oklch(') ||
          cssContent.includes('--xeg-color-') ||
          cssContent.includes('--xeg-glass-');

        expect(hasDesignTokens).toBe(true);
      });
    });
  });

  describe('Phase 2: 글래스모피즘 일관성', () => {
    it('Gallery 컴포넌트들이 backdrop-filter를 사용해야 함', () => {
      const cssFiles = [galleryMainCssPath, verticalGalleryCssPath, verticalImageCssPath];

      cssFiles.forEach(filePath => {
        const cssContent = readFileSync(filePath, 'utf-8');

        // backdrop-filter 사용 확인 (적어도 하나는 있어야 함)
        const hasBackdropFilter =
          cssContent.includes('backdrop-filter:') ||
          cssContent.includes('-webkit-backdrop-filter:');

        expect(hasBackdropFilter).toBe(true);
      });
    });

    it('일관된 블러 강도를 사용해야 함', () => {
      const cssContent = readFileSync(galleryMainCssPath, 'utf-8');

      // 표준 블러 값들 사용 확인
      const hasStandardBlur =
        cssContent.includes('blur(8px)') ||
        cssContent.includes('blur(10px)') ||
        cssContent.includes('blur(12px)') ||
        cssContent.includes('blur(16px)') ||
        cssContent.includes('var(--xeg-glass-blur');

      expect(hasStandardBlur).toBe(true);
    });
  });

  describe('Phase 3: 접근성 및 브라우저 호환성', () => {
    it('webkit 접두사가 포함되어야 함', () => {
      const cssContent = readFileSync(galleryMainCssPath, 'utf-8');

      expect(cssContent).toMatch(/-webkit-backdrop-filter:/);
    });

    it('고대비 모드 또는 투명도 감소 설정 지원이 있어야 함', () => {
      const cssFiles = [galleryMainCssPath, verticalGalleryCssPath, verticalImageCssPath];

      const hasAccessibilitySupport = cssFiles.some(filePath => {
        const cssContent = readFileSync(filePath, 'utf-8');
        return (
          cssContent.includes('prefers-contrast: high') ||
          cssContent.includes('prefers-reduced-transparency') ||
          cssContent.includes('prefers-reduced-motion')
        );
      });

      expect(hasAccessibilitySupport).toBe(true);
    });
  });

  describe('Phase 4: 성능 최적화', () => {
    it('GPU 가속을 위한 속성들이 설정되어야 함', () => {
      const cssContent = readFileSync(galleryMainCssPath, 'utf-8');

      const hasPerformanceOptimization =
        cssContent.includes('will-change:') ||
        cssContent.includes('transform:') ||
        cssContent.includes('translateZ(0)') ||
        cssContent.includes('var(--xeg-gallery-gpu-acceleration');

      expect(hasPerformanceOptimization).toBe(true);
    });

    it('컨테이너 쿼리 또는 모던 CSS 기능을 사용해야 함', () => {
      const cssContent = readFileSync(galleryMainCssPath, 'utf-8');

      const hasModernFeatures =
        cssContent.includes('@container') ||
        cssContent.includes('container-type:') ||
        cssContent.includes('subgrid') ||
        cssContent.includes('contain:');

      expect(hasModernFeatures).toBe(true);
    });
  });

  describe('Phase 5: 반응형 디자인', () => {
    it('모바일 최적화 미디어 쿼리가 있어야 함', () => {
      const cssFiles = [galleryMainCssPath, verticalGalleryCssPath, verticalImageCssPath];

      const hasResponsiveDesign = cssFiles.some(filePath => {
        const cssContent = readFileSync(filePath, 'utf-8');
        return (
          cssContent.includes('@media (max-width:') ||
          cssContent.includes('@media (min-width:') ||
          cssContent.includes('768px') ||
          cssContent.includes('480px')
        );
      });

      expect(hasResponsiveDesign).toBe(true);
    });
  });
});
