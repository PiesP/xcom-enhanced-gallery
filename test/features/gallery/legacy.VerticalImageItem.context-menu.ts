/**
 * VerticalImageItem Context Menu Tests
 * @description 이미지 컨텍스트 메뉴 이벤트 처리 테스트
 * @version 1.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('VerticalImageItem - Context Menu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('CSS 스타일 검증', () => {
    it('VerticalImageItem CSS에서 pointer-events: none이 제거되어야 함', () => {
      // CSS 파일 경로
      const cssPath = path.resolve(
        'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css'
      );

      // CSS 파일 읽기
      const cssContent = fs.readFileSync(cssPath, 'utf-8');

      // .image 클래스 섹션 찾기
      const imageClassMatch = cssContent.match(/\.image\s*\{[^}]*\}/);
      expect(imageClassMatch).toBeTruthy();

      const imageClassContent = imageClassMatch ? imageClassMatch[0] : '';

      // pointer-events: none이 있으면 안 됨
      expect(imageClassContent).not.toMatch(/pointer-events:\s*none/);

      // 또는 pointer-events: auto가 있어야 함
      expect(imageClassContent).toMatch(/pointer-events:\s*auto/);
    });

    it('드래그 방지 스타일은 유지되어야 함', () => {
      const cssPath = path.resolve(
        'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css'
      );
      const cssContent = fs.readFileSync(cssPath, 'utf-8');

      const imageClassMatch = cssContent.match(/\.image\s*\{[^}]*\}/);
      expect(imageClassMatch).toBeTruthy();

      const imageClassContent = imageClassMatch ? imageClassMatch[0] : '';

      // user-select: none은 유지되어야 함
      expect(imageClassContent).toMatch(/user-select:\s*none/);
      expect(imageClassContent).toMatch(/-webkit-user-select:\s*none/);
    });

    it('비디오 요소에도 올바른 pointer-events가 설정되어야 함', () => {
      const cssPath = path.resolve(
        'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css'
      );
      const cssContent = fs.readFileSync(cssPath, 'utf-8');

      // 비디오 클래스 확인 (.video 클래스가 있다면)
      const videoClassMatch = cssContent.match(/\.video\s*\{[^}]*\}/);
      if (videoClassMatch) {
        const videoClassContent = videoClassMatch[0];
        // 비디오도 pointer-events: none이 없어야 함
        expect(videoClassContent).not.toMatch(/pointer-events:\s*none/);
      }
    });
  });

  describe('이벤트 핸들러 검증', () => {
    it('컴포넌트에 onContextMenu 핸들러가 있어야 함', () => {
      // VerticalImageItem 컴포넌트 파일 읽기
      const componentPath = path.resolve(
        'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.tsx'
      );
      const componentContent = fs.readFileSync(componentPath, 'utf-8');

      // onContextMenu 이벤트 핸들러가 있는지 확인
      expect(componentContent).toMatch(/onContextMenu\s*[=:]/);
    });

    it('컴포넌트에 onDragStart 핸들러가 있어야 함', () => {
      const componentPath = path.resolve(
        'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.tsx'
      );
      const componentContent = fs.readFileSync(componentPath, 'utf-8');

      // onDragStart 이벤트 핸들러가 있는지 확인 (드래그 방지용)
      expect(componentContent).toMatch(/onDragStart\s*[=:]/);
    });
  });

  describe('TypeScript 타입 검증', () => {
    it('onImageContextMenu prop 타입이 정의되어야 함', () => {
      const componentPath = path.resolve(
        'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.tsx'
      );
      const componentContent = fs.readFileSync(componentPath, 'utf-8');

      // Props 인터페이스에 onImageContextMenu가 있는지 확인
      expect(componentContent).toMatch(/onImageContextMenu\??\s*:\s*\(/);
    });
  });
});
