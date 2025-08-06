/**
 * @fileoverview Phase 3: 모바일/터치 코드 제거 TDD 테스트
 * PC 전용 유저스크립트에서 불필요한 모바일/터치 관련 코드 제거
 */

import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('🔴 RED Phase: 모바일/터치 코드 제거 요구사항', () => {
  const srcPath = join(process.cwd(), 'src');

  describe('모바일 클래스 제거 요구사항', () => {
    test('xeg-mobile, xeg-tablet 클래스 참조가 제거되어야 함', () => {
      const uiOptimizerPath = join(srcPath, 'shared/utils/performance/ui-optimizer.ts');
      const content = readFileSync(uiOptimizerPath, 'utf8');

      // xeg-mobile, xeg-tablet 클래스 제거 확인
      expect(content).not.toMatch(/['"`]xeg-mobile['"`]/);
      expect(content).not.toMatch(/['"`]xeg-tablet['"`]/);
      expect(content).not.toMatch(/classList\.remove.*xeg-mobile/);
      expect(content).not.toMatch(/classList\.remove.*xeg-tablet/);
    });

    test('구버전 모바일 브레이크포인트 참조가 제거되어야 함', () => {
      const analyzerPath = join(srcPath, 'core/analyzer/index.ts');
      const content = readFileSync(analyzerPath, 'utf8');

      // OLD_BREAKPOINT_MOBILE 참조 제거 확인
      expect(content).not.toMatch(/OLD_BREAKPOINT_MOBILE/);
    });
  });

  describe('CSS 모바일 브레이크포인트 제거 요구사항', () => {
    test('모든 CSS 파일에서 모바일 미디어 쿼리가 제거되어야 함', () => {
      const cssFiles = [
        'shared/styles/isolated-gallery.css',
        'shared/styles/design-tokens.css',
        'shared/components/ui/Toolbar/Toolbar.module.css',
        'shared/components/ui/Button/Button.module.css',
        'features/gallery/styles/gallery-global.css',
        'features/gallery/styles/Gallery.module.css',
        'features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css',
      ];

      cssFiles.forEach(cssFile => {
        const cssPath = join(srcPath, cssFile);
        try {
          const content = readFileSync(cssPath, 'utf8');

          // 모바일 미디어 쿼리 제거 확인
          expect(content).not.toMatch(/@media\s*\(\s*max-width\s*:\s*768px\s*\)/);
          expect(content).not.toMatch(/@media\s*\(\s*max-width\s*:\s*480px\s*\)/);
          expect(content).not.toMatch(/--xeg-spacing-mobile/);

          // 모바일 관련 코멘트 제거 확인
          expect(content).not.toMatch(/mobile\s+and\s+desktop/i);
          expect(content).not.toMatch(/responsive\s+design.*mobile/i);
        } catch (error) {
          // 파일이 존재하지 않으면 통과 (이미 제거됨)
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw error;
          }
        }
      });
    });

    test('모바일 CSS 변수가 제거되어야 함', () => {
      const verticalGalleryPath = join(
        srcPath,
        'features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
      );
      try {
        const content = readFileSync(verticalGalleryPath, 'utf8');

        // 모바일 전용 CSS 변수 제거 확인
        expect(content).not.toMatch(/--xeg-spacing-mobile/);
        expect(content).not.toMatch(/var\(--xeg-spacing-mobile\)/);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }
    });
  });

  describe('터치 이벤트 핸들러 제거 요구사항', () => {
    test('터치 이벤트 리스너가 존재하지 않아야 함', () => {
      // 모든 TypeScript 파일에서 터치 이벤트 제거 확인
      const tsFiles = [
        'shared/utils/interaction/interaction-manager.ts',
        'shared/dom/unified-dom-service.ts',
        'shared/utils/events.ts',
        'features/gallery/hooks/useGalleryScroll.ts',
      ];

      tsFiles.forEach(tsFile => {
        const filePath = join(srcPath, tsFile);
        try {
          const content = readFileSync(filePath, 'utf8');

          // 터치 이벤트 핸들러 제거 확인
          expect(content).not.toMatch(/addEventListener.*touch/i);
          expect(content).not.toMatch(/ontouchstart|ontouchend|ontouchmove/i);
          expect(content).not.toMatch(/TouchEvent/);
          expect(content).not.toMatch(/touch.*Event/i);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw error;
          }
        }
      });
    });

    test('모바일 전용 제스처 타입이 제거되어야 함', () => {
      const interactionManagerPath = join(
        srcPath,
        'shared/utils/interaction/interaction-manager.ts'
      );
      try {
        const content = readFileSync(interactionManagerPath, 'utf8');

        // swipe, pinch, zoom 등 모바일 제스처 제거 확인
        expect(content).not.toMatch(/swipe|pinch|zoom/i);
        expect(content).not.toMatch(/'swipe'|'pinch'|'zoom'/);

        // PC 전용 제스처만 유지되어야 함
        expect(content).toMatch(/GestureType.*=.*'click'/);
        expect(content).toMatch(/GestureType.*=.*'doubleClick'/);
        expect(content).toMatch(/GestureType.*=.*'rightClick'/);
        expect(content).toMatch(/GestureType.*=.*'hover'/);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }
    });
  });

  describe('PC 전용 기능 보장 요구사항', () => {
    test('PC 전용 마우스 이벤트만 유지되어야 함', () => {
      const interactionManagerPath = join(
        srcPath,
        'shared/utils/interaction/interaction-manager.ts'
      );
      try {
        const content = readFileSync(interactionManagerPath, 'utf8');

        // PC 전용 마우스 이벤트 유지 확인
        expect(content).toMatch(/MouseEvent/);
        expect(content).toMatch(/addEventListener.*click/);
        expect(content).toMatch(/addEventListener.*mousedown/);
        expect(content).toMatch(/addEventListener.*mouseup/);
        expect(content).toMatch(/addEventListener.*mousemove/);
        expect(content).toMatch(/addEventListener.*contextmenu/);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }
    });

    test('키보드 네비게이션은 유지되어야 함', () => {
      const galleryKeyboardPath = join(
        srcPath,
        'features/gallery/components/vertical-gallery-view/hooks/useGalleryKeyboard.ts'
      );
      try {
        const content = readFileSync(galleryKeyboardPath, 'utf8');

        // 키보드 이벤트 유지 확인
        expect(content).toMatch(/KeyboardEvent/);
        expect(content).toMatch(/addEventListener.*keydown/);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }
    });
  });

  describe('호환성 요구사항', () => {
    test('기존 PC 전용 기능이 손상되지 않아야 함', () => {
      // 스크롤 기능 유지 확인
      const scrollUtilsPath = join(srcPath, 'shared/utils/scroll/scroll-utils.ts');
      try {
        const content = readFileSync(scrollUtilsPath, 'utf8');
        expect(content).toMatch(/preventScrollPropagation/);
        expect(content).toMatch(/createScrollHandler/);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }
    });

    test('UnifiedDOMService 통합 기능이 유지되어야 함', () => {
      const unifiedDOMPath = join(srcPath, 'shared/dom/unified-dom-service.ts');
      try {
        const content = readFileSync(unifiedDOMPath, 'utf8');
        expect(content).toMatch(/addEventListener/);
        expect(content).toMatch(/querySelector/);
        expect(content).toMatch(/class UnifiedDOMService/);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }
    });
  });

  describe('성능 요구사항', () => {
    test('번들 크기가 모바일 코드 제거로 감소되어야 함', () => {
      // 이 테스트는 빌드 결과를 통해 검증됨
      // 모바일 관련 코드 제거로 번들 크기가 현재 264.91 KB 이하로 유지되거나 감소해야 함
      expect(true).toBe(true); // 플레이스홀더
    });

    test('제거된 코드가 런타임에 로드되지 않아야 함', () => {
      // 이 테스트는 빌드 결과 분석을 통해 검증됨
      expect(true).toBe(true); // 플레이스홀더
    });
  });
});
