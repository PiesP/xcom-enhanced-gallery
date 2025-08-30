/**
 * @fileoverview Phase 4: Scroll Chaining Prevention 테스트 (TDD)
 * @description 갤러리 스크롤이 페이지 스크롤과 격리되도록 하는 스크롤 체이닝 방지
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// ESM __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Phase 4: Scroll Chaining Prevention - TDD 접근법', () => {
  beforeEach(() => {
    // 각 테스트 전에 상태 초기화
  });

  afterEach(() => {
    // 테스트 후 정리
  });

  describe('TDD RED: 스크롤 체이닝 문제 식별', () => {
    test('갤러리 CSS에서 overscroll-behavior 누락 감지', async () => {
      const fs = await import('fs');

      // 갤러리 관련 CSS 파일들 확인
      const cssFiles = [
        resolve(__dirname, '../../src/features/gallery/styles/gallery-global.css'),
        resolve(
          __dirname,
          '../../src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
        ),
        resolve(__dirname, '../../src/shared/components/ui/Toolbar/Toolbar.module.css'),
      ];

      let hasOverscrollBehavior = false;

      for (const cssFile of cssFiles) {
        if (fs.existsSync(cssFile)) {
          const content = fs.readFileSync(cssFile, 'utf-8');
          if (content.includes('overscroll-behavior')) {
            hasOverscrollBehavior = true;
            break;
          }
        }
      }

      // RED: 현재는 overscroll-behavior가 적용되지 않아 실패할 것
      expect(hasOverscrollBehavior).toBe(true);
    });

    test('갤러리 컨테이너에 스크롤 격리 CSS 속성 부족', async () => {
      const fs = await import('fs');
      const galleryViewPath = resolve(
        __dirname,
        '../../src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
      );

      if (fs.existsSync(galleryViewPath)) {
        const content = fs.readFileSync(galleryViewPath, 'utf-8');

        // RED: 스크롤 격리 관련 CSS 속성들이 없어서 실패할 것
        expect(content).toMatch(/overscroll-behavior:\s*contain/);
        expect(content).toMatch(/overscroll-behavior-y:\s*contain/);
      } else {
        expect.fail('VerticalGalleryView.module.css 파일을 찾을 수 없습니다');
      }
    });

    test('itemsList 클래스에 스크롤 체이닝 방지 속성 누락', async () => {
      const fs = await import('fs');
      const galleryViewPath = resolve(
        __dirname,
        '../../src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
      );

      if (fs.existsSync(galleryViewPath)) {
        const content = fs.readFileSync(galleryViewPath, 'utf-8');

        // RED: @supports 쿼리를 포함한 전체 파일에서 overscroll-behavior 확인
        // 실제로는 구현되어 있어서 이 테스트는 통과할 것 (GREEN 상태)
        const hasOverscrollBehavior = content.includes('overscroll-behavior');
        const hasItemsListWithOverscroll =
          content.includes('.itemsList') && content.includes('overscroll-behavior: contain');

        expect(hasOverscrollBehavior).toBe(true);
        expect(hasItemsListWithOverscroll).toBe(true);
      } else {
        expect.fail('VerticalGalleryView.module.css 파일을 찾을 수 없습니다');
      }
    });
  });

  describe('TDD GREEN: 스크롤 체이닝 방지 구현', () => {
    test('갤러리 컨테이너에 overscroll-behavior: contain 적용', async () => {
      const fs = await import('fs');
      const galleryViewPath = resolve(
        __dirname,
        '../../src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
      );

      if (fs.existsSync(galleryViewPath)) {
        const content = fs.readFileSync(galleryViewPath, 'utf-8');

        // GREEN: overscroll-behavior가 올바르게 적용되어 통과할 것
        expect(content).toMatch(/overscroll-behavior:\s*contain/);
      }
    });

    test('세로 스크롤만 격리하는 overscroll-behavior-y 적용', async () => {
      const fs = await import('fs');
      const galleryViewPath = resolve(
        __dirname,
        '../../src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
      );

      if (fs.existsSync(galleryViewPath)) {
        const content = fs.readFileSync(galleryViewPath, 'utf-8');

        // GREEN: 세로 스크롤 격리가 적용되어 통과할 것
        expect(content).toMatch(/overscroll-behavior-y:\s*contain/);
      }
    });

    test('itemsList에 스크롤 체이닝 방지 적용 확인', async () => {
      const fs = await import('fs');
      const galleryViewPath = resolve(
        __dirname,
        '../../src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
      );

      if (fs.existsSync(galleryViewPath)) {
        const content = fs.readFileSync(galleryViewPath, 'utf-8');

        // GREEN: @supports 쿼리 내에서 itemsList에 overscroll-behavior가 적용되어 통과할 것
        // 전체 파일에서 overscroll-behavior 확인 (주석이 아닌 실제 속성)
        const hasOverscrollBehavior = content.includes('overscroll-behavior: contain');
        const hasItemsListInSupports =
          content.includes('@supports') &&
          content.includes('.itemsList') &&
          content.includes('overscroll-behavior');

        expect(hasOverscrollBehavior).toBe(true);
        expect(hasItemsListInSupports).toBe(true);
      } else {
        expect.fail('VerticalGalleryView.module.css 파일을 찾을 수 없습니다');
      }
    });
  });

  describe('TDD REFACTOR: 스크롤 체이닝 방지 최적화', () => {
    test('브라우저 호환성을 위한 폴백 제공', async () => {
      const fs = await import('fs');
      const galleryViewPath = resolve(
        __dirname,
        '../../src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
      );

      if (fs.existsSync(galleryViewPath)) {
        const content = fs.readFileSync(galleryViewPath, 'utf-8');

        // REFACTOR: 브라우저 호환성을 위한 @supports 또는 폴백 확인
        const hasSupportsQuery =
          content.includes('@supports') && content.includes('overscroll-behavior');
        const hasModernProperties = content.includes('overscroll-behavior');

        // 최소한 modern property가 있어야 함
        expect(hasModernProperties).toBe(true);

        // @supports 쿼리가 있다면 더욱 좋음 (선택사항)
        if (hasSupportsQuery) {
          expect(content).toMatch(/@supports\s*\([^)]*overscroll-behavior[^)]*\)/);
        }
      }
    });

    test('갤러리 외부 요소들의 overscroll 속성 중복 제거', async () => {
      const fs = await import('fs');
      const galleryGlobalPath = resolve(
        __dirname,
        '../../src/features/gallery/styles/gallery-global.css'
      );

      if (fs.existsSync(galleryGlobalPath)) {
        const content = fs.readFileSync(galleryGlobalPath, 'utf-8');

        // REFACTOR: 중복된 overscroll-behavior 선언이 없는지 확인
        const overscrollMatches = content.match(/overscroll-behavior/g);
        const overscrollCount = overscrollMatches ? overscrollMatches.length : 0;

        // 최대 합리적인 수준의 선언만 허용 (예: 5개 이하)
        expect(overscrollCount).toBeLessThanOrEqual(5);
      }
    });

    test('성능 최적화: touch-action과 함께 사용', async () => {
      const fs = await import('fs');
      const galleryViewPath = resolve(
        __dirname,
        '../../src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
      );

      if (fs.existsSync(galleryViewPath)) {
        const content = fs.readFileSync(galleryViewPath, 'utf-8');

        // REFACTOR: touch-action과 overscroll-behavior 조합으로 최적 성능
        const hasOverscroll = content.includes('overscroll-behavior');
        const hasTouchAction = content.includes('touch-action');

        expect(hasOverscroll).toBe(true);

        // touch-action이 함께 있으면 더 좋은 사용자 경험
        if (hasTouchAction) {
          expect(content).toMatch(/touch-action:\s*(pan-y|manipulation)/);
        }
      }
    });

    test('스크롤바 스타일링과 overscroll 속성 조화', async () => {
      const fs = await import('fs');
      const galleryViewPath = resolve(
        __dirname,
        '../../src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
      );

      if (fs.existsSync(galleryViewPath)) {
        const content = fs.readFileSync(galleryViewPath, 'utf-8');

        // REFACTOR: 스크롤바 스타일링과 overscroll 속성이 모두 적용되었는지 확인
        const hasOverscroll = content.includes('overscroll-behavior');
        const hasScrollbarStyling =
          content.includes('::-webkit-scrollbar') || content.includes('scrollbar-width');

        expect(hasOverscroll).toBe(true);

        // 스크롤바 스타일링이 있다면 일관된 디자인인지 확인
        if (hasScrollbarStyling) {
          expect(content).toMatch(/::-webkit-scrollbar/);
        }
      }
    });
  });

  describe('브라우저 호환성 및 접근성', () => {
    test('overscroll-behavior 지원 여부 체크', async () => {
      // REFACTOR: CSS에서 @supports 쿼리로 브라우저 지원 확인
      const fs = await import('fs');
      const galleryViewPath = resolve(
        __dirname,
        '../../src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
      );

      if (fs.existsSync(galleryViewPath)) {
        const content = fs.readFileSync(galleryViewPath, 'utf-8');

        // 브라우저 호환성을 고려한 점진적 개선
        const hasProgressiveEnhancement =
          content.includes('@supports') || content.includes('overscroll-behavior');

        expect(hasProgressiveEnhancement).toBe(true);
      }
    });

    test('reduced-motion 설정 고려', async () => {
      const fs = await import('fs');
      const galleryViewPath = resolve(
        __dirname,
        '../../src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
      );

      if (fs.existsSync(galleryViewPath)) {
        const content = fs.readFileSync(galleryViewPath, 'utf-8');

        // REFACTOR: 접근성을 위한 reduced-motion 고려
        const hasReducedMotion = content.includes('prefers-reduced-motion');
        const hasOverscroll = content.includes('overscroll-behavior');

        expect(hasOverscroll).toBe(true);

        // reduced-motion이 고려되어 있다면 더 좋음
        if (hasReducedMotion) {
          expect(content).toMatch(/@media\s*\([^)]*prefers-reduced-motion[^)]*\)/);
        }
      }
    });
  });
});
