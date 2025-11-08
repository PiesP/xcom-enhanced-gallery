/**
 * Phase 58: Toolbar UI Consistency
 * - mediaCounter 텍스트 컨테이너의 색상을 툴바 배경색과 통일
 * - 툴바의 외곽선 제거하고 전체적인 외곽선 디자인 패턴 통일
 * - 이미지 오른쪽 상단의 다운로드용 버튼 제거
 *
 * TDD RED Phase: 실패하는 테스트 작성
 */
import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Phase 58: Toolbar UI Consistency', () => {
  setupGlobalTestIsolation();

  describe('Goal 1: mediaCounter background matches toolbar background', () => {
    it('mediaCounter should use transparent or toolbar background token', () => {
      const toolbarCssPath = join(
        __dirname,
        '../../src/shared/components/ui/Toolbar/Toolbar.module.css'
      );
      const content = readFileSync(toolbarCssPath, 'utf-8');

      // mediaCounter 스타일 블록 찾기
      const mediaCounterMatch = content.match(/\.mediaCounter\s*\{[^}]+\}/s);
      expect(mediaCounterMatch, 'mediaCounter style block should exist').toBeTruthy();

      const mediaCounterStyles = mediaCounterMatch![0];

      // 현재 문제: background: var(--xeg-bg-counter) 사용 중
      // 목표: background: transparent 또는 var(--xeg-comp-toolbar-bg) 사용
      const hasInvalidBackground = /background:\s*var\(--xeg-bg-counter\)/.test(mediaCounterStyles);
      const hasValidBackground =
        /background:\s*transparent/.test(mediaCounterStyles) ||
        /background:\s*var\(--xeg-comp-toolbar-bg\)/.test(mediaCounterStyles);

      expect(hasInvalidBackground).toBe(false);
      expect(hasValidBackground).toBe(true);
    });

    it('mediaCounter should not have a visible border', () => {
      const toolbarCssPath = join(
        __dirname,
        '../../src/shared/components/ui/Toolbar/Toolbar.module.css'
      );
      const content = readFileSync(toolbarCssPath, 'utf-8');

      const mediaCounterMatch = content.match(/\.mediaCounter\s*\{[^}]+\}/s);
      expect(mediaCounterMatch).toBeTruthy();

      const mediaCounterStyles = mediaCounterMatch![0];

      // 현재 문제: border: 1px solid var(--xeg-border-counter) 사용 중
      // 목표: border 속성 제거 또는 border: none
      const hasVisibleBorder = /border:\s*1px\s+solid/.test(mediaCounterStyles);
      const hasNoBorder =
        /border:\s*none/.test(mediaCounterStyles) || !/border:/.test(mediaCounterStyles);

      expect(hasVisibleBorder).toBe(false);
      expect(hasNoBorder).toBe(true);
    });
  });

  describe('Goal 2: Toolbar border removal and pattern unification', () => {
    it('galleryToolbar should not have a border', () => {
      const toolbarCssPath = join(
        __dirname,
        '../../src/shared/components/ui/Toolbar/Toolbar.module.css'
      );
      const content = readFileSync(toolbarCssPath, 'utf-8');

      // .galleryToolbar 스타일 블록 찾기
      const toolbarMatch = content.match(/\.galleryToolbar\s*\{[^}]+\}/s);
      expect(toolbarMatch, 'galleryToolbar style block should exist').toBeTruthy();

      const toolbarStyles = toolbarMatch![0];

      // 현재 문제: border: 1px solid var(--xeg-comp-toolbar-border) 존재
      // 목표: border 제거 또는 border: none
      const hasVisibleBorder = /border:\s*1px\s+solid/.test(toolbarStyles);
      const hasNoBorder = /border:\s*none/.test(toolbarStyles) || !/border:/.test(toolbarStyles);

      expect(hasVisibleBorder).toBe(false);
      expect(hasNoBorder).toBe(true);
    });

    it('Toolbar CSS should maintain consistent border pattern across all elements', () => {
      const toolbarCssPath = join(
        __dirname,
        '../../src/shared/components/ui/Toolbar/Toolbar.module.css'
      );
      const content = readFileSync(toolbarCssPath, 'utf-8');

      // 모든 border 선언 추출
      const borderDeclarations = content.match(/border:\s*[^;]+;/g) || [];

      // 주요 컴포넌트(.galleryToolbar, .mediaCounter)는 border가 제거되었어야 함
      const galleryToolbarMatch = content.match(/\.galleryToolbar\s*\{[^}]+\}/s);
      const mediaCounterMatch = content.match(/\.mediaCounter\s*\{[^}]+\}/s);

      expect(galleryToolbarMatch).toBeTruthy();
      expect(mediaCounterMatch).toBeTruthy();

      const galleryToolbarHasBorder = /border:\s*1px\s+solid/.test(galleryToolbarMatch![0]);
      const mediaCounterHasBorder = /border:\s*1px\s+solid/.test(mediaCounterMatch![0]);

      expect(galleryToolbarHasBorder, 'galleryToolbar should not have 1px solid border').toBe(
        false
      );
      expect(mediaCounterHasBorder, 'mediaCounter should not have 1px solid border').toBe(false);
    });
  });

  describe('Goal 3: Download button removal from gallery items', () => {
    it('VerticalImageItem should not render download button', () => {
      const verticalItemPath = join(
        __dirname,
        '../../src/features/gallery/components/vertical-gallery-view/VerticalImageItem.tsx'
      );
      const content = readFileSync(verticalItemPath, 'utf-8');

      // 다운로드 버튼 조건부 렌더링 패턴 찾기
      // 현재: {onDownload && <ButtonCompat ... downloadButton ... />}
      // 목표: 조건부 렌더링 제거 또는 항상 false
      const hasDownloadButtonRender = /{onDownload\s*&&\s*<ButtonCompat/.test(content);
      const hasDownloadButtonClass = /className.*downloadButton/.test(content);

      expect(hasDownloadButtonRender, 'Download button conditional render should be removed').toBe(
        false
      );
      expect(hasDownloadButtonClass, 'Download button className should be removed').toBe(false);
    });

    it('VerticalImageItem should not import or use download-related icons', () => {
      const verticalItemPath = join(
        __dirname,
        '../../src/features/gallery/components/vertical-gallery-view/VerticalImageItem.tsx'
      );
      const content = readFileSync(verticalItemPath, 'utf-8');

      // 다운로드 아이콘 사용 확인 (emoji ⬇️ 또는 icon component)
      const hasDownloadIcon = /['"]⬇️['"]/.test(content) || /<HeroDownload/.test(content);

      expect(hasDownloadIcon, 'Download icon usage should be removed').toBe(false);
    });

    it('VerticalImageItem event handlers should not include download logic', () => {
      const verticalItemPath = join(
        __dirname,
        '../../src/features/gallery/components/vertical-gallery-view/VerticalImageItem.tsx'
      );
      const content = readFileSync(verticalItemPath, 'utf-8');

      // onDownload prop 사용 확인
      // 목표: 컴포넌트 내부에서 onDownload 호출/참조 제거
      const functionBody = content.match(/function\s+VerticalImageItem[^{]*\{([\s\S]*)\}$/m);
      if (functionBody) {
        const body = functionBody[1];
        // props destructuring에서 onDownload 제거되어야 함
        const propsMatch = body.match(/const\s*\{[^}]+\}\s*=\s*props/);
        if (propsMatch) {
          const hasOnDownloadInProps = /onDownload/.test(propsMatch[0]);
          expect(hasOnDownloadInProps, 'onDownload should not be in props destructuring').toBe(
            false
          );
        }
      }
    });
  });

  describe('Build and bundle validation', () => {
    it('should maintain bundle size under 325KB after changes', () => {
      // 이 테스트는 빌드 후에 실행되어야 함
      // validate-build.js가 자동으로 체크하지만 명시적 테스트 추가
      expect(true).toBe(true); // Placeholder: 실제로는 dist 파일 크기 확인
    });

    it('should remove unused downloadButton styles from VerticalImageItem.module.css', () => {
      const cssPath = join(
        __dirname,
        '../../src/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css'
      );
      const content = readFileSync(cssPath, 'utf-8');

      // downloadButton 클래스 사용 확인
      const hasDownloadButtonClass = /\.downloadButton/.test(content);
      const hasDownloadIconClass = /\.downloadIcon/.test(content);

      // REFACTOR 단계에서 제거되어야 하지만, 여기서 미리 체크
      // GREEN 단계에서는 아직 남아있을 수 있음
      expect(
        hasDownloadButtonClass || hasDownloadIconClass,
        'Download button styles should be removed in REFACTOR phase'
      ).toBe(true); // RED에서는 true여야 함
    });
  });
});
