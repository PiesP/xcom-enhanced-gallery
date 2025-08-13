/**
 * @fileoverview 툴바 배경 가시성 CSS 테스트
 * @description CSS 스타일이 올바르게 적용되는지 확인하는 간단한 테스트
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

describe('툴바 배경 가시성 - CSS 수정 검증', () => {
  const cssFilePath = path.resolve(
    __dirname,
    '../../src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
  );
  const cssContent = readFileSync(cssFilePath, 'utf-8');

  describe('CSS 파일 수정사항 검증', () => {
    it('toolbarWrapper가 배경 그라디언트를 가져야 함(호버 존은 투명)', () => {
      // toolbarWrapper 클래스를 찾기 (실제 툴바 컨테이너)
      const toolbarWrapperMatch = cssContent.match(/(^|\n)\.toolbarWrapper\s*\{[^}]*\}/s);

      expect(toolbarWrapperMatch).not.toBeNull();

      const toolbarWrapperStyles = toolbarWrapperMatch![0];

      // 툴바 래퍼는 그라디언트 사용
      expect(toolbarWrapperStyles).toContain('--xeg-toolbar-overlay-gradient');

      // 호버 존인 toolbarContainer는 배경을 강제하지 않음(투명 유지)
      const toolbarContainerMatch = cssContent.match(/(^|\n)\.toolbarContainer\s*\{[^}]*\}/s);
      expect(toolbarContainerMatch).not.toBeNull();
      const toolbarContainerStyles = toolbarContainerMatch![0];
      expect(toolbarContainerStyles).not.toContain('--xeg-toolbar-overlay-gradient');
    });

    it('기본 상태에서 backdrop-filter가 적용되어야 함', () => {
      const toolbarContainerMatch = cssContent.match(/\.toolbarContainer\s*\{[^}]*\}/s);
      const toolbarContainerStyles = toolbarContainerMatch![0];

      // backdrop-filter가 기본 상태에서 적용되는지 확인
      expect(toolbarContainerStyles).not.toMatch(/backdrop-filter\s*:/);
      expect(toolbarContainerStyles).not.toMatch(/-webkit-backdrop-filter\s*:/);
    });

    it('호버 스타일이 더 강한 효과를 제공해야 함', () => {
      // 툴바 래퍼 호버는 강한 그라디언트를 사용
      const wrapperHoverMatch = cssContent.match(
        /(^|\n)\.toolbarWrapper:(?:hover|focus-within)[^{]*\{[^}]*\}/s
      );
      expect(wrapperHoverMatch).not.toBeNull();
      const wrapperHoverStyles = wrapperHoverMatch![0];
      // Hover/focus-within should apply stronger blur
      expect(wrapperHoverStyles).toMatch(/backdrop-filter:\s*var\(--xeg-blur-strong/);
      expect(wrapperHoverStyles).toMatch(/-webkit-backdrop-filter:\s*var\(--xeg-blur-strong/);

      // 호버 존 컨테이너의 호버는 강한 블러만 적용되고 배경 그라디언트는 없음
      const containerHoverMatch = cssContent.match(/(^|\n)\.toolbarContainer:hover\s*\{[^}]*\}/s);
      expect(containerHoverMatch).not.toBeNull();
      const containerHoverStyles = containerHoverMatch![0];
      expect(containerHoverStyles).not.toMatch(/backdrop-filter\s*:/);
      expect(containerHoverStyles).not.toMatch(/-webkit-backdrop-filter\s*:/);
      expect(containerHoverStyles).not.toContain('--xeg-toolbar-overlay-gradient-strong');
    });

    it('적절한 트랜지션이 설정되어야 함', () => {
      const toolbarContainerMatch = cssContent.match(/\.toolbarContainer\s*\{[^}]*\}/s);
      const toolbarContainerStyles = toolbarContainerMatch![0];

      // 트랜지션이 설정되었는지 확인
      expect(toolbarContainerStyles).toContain('transition:');
      expect(toolbarContainerStyles).toMatch(/(background-color|backdrop-filter)/);
    });
  });

  describe('CSS 변수 의존성 확인', () => {
    it('필요한 CSS 변수들이 사용되고 있어야 함', () => {
      const requiredVariables = [
        '--xeg-toolbar-overlay-gradient',
        '--xeg-blur-medium',
        '--xeg-duration-fast',
        '--xeg-easing-ease-out',
      ];

      requiredVariables.forEach(variable => {
        expect(cssContent).toContain(variable);
      });
    });
  });

  describe('접근성 및 사용성 개선', () => {
    it('감소된 모션 지원이 개선되어야 함', () => {
      const reducedMotionMatch = cssContent.match(
        /@media\s*\(prefers-reduced-motion:\s*reduce\)[^}]*\{[^}]*\}/s
      );

      expect(reducedMotionMatch).not.toBeNull();

      const reducedMotionStyles = reducedMotionMatch![0];
      expect(reducedMotionStyles).toContain('background-color');
      expect(reducedMotionStyles).toContain('backdrop-filter');
    });
  });
});
