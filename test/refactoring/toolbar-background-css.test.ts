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
    it('toolbarContainer가 기본적으로 투명하지 않은 배경을 가져야 함', () => {
      // toolbarContainer 클래스를 찾기
      const toolbarContainerMatch = cssContent.match(/\.toolbarContainer\s*\{[^}]*\}/s);

      expect(toolbarContainerMatch).not.toBeNull();

      const toolbarContainerStyles = toolbarContainerMatch![0];

      // 기존의 'background: transparent;' 가 제거되었는지 확인
      expect(toolbarContainerStyles).not.toContain('background: transparent');

      // 새로운 배경 그라디언트가 적용되었는지 확인
      expect(toolbarContainerStyles).toContain('--xeg-toolbar-overlay-gradient');
    });

    it('기본 상태에서 backdrop-filter가 적용되어야 함', () => {
      const toolbarContainerMatch = cssContent.match(/\.toolbarContainer\s*\{[^}]*\}/s);
      const toolbarContainerStyles = toolbarContainerMatch![0];

      // backdrop-filter가 기본 상태에서 적용되는지 확인
      expect(toolbarContainerStyles).toContain('backdrop-filter: var(--xeg-blur-medium)');
      expect(toolbarContainerStyles).toContain('-webkit-backdrop-filter: var(--xeg-blur-medium)');
    });

    it('호버 스타일이 더 강한 효과를 제공해야 함', () => {
      const hoverMatch = cssContent.match(/\.toolbarContainer:hover\s*\{[^}]*\}/s);

      expect(hoverMatch).not.toBeNull();

      const hoverStyles = hoverMatch![0];

      // 호버 시 더 강한 배경 효과 확인
      expect(hoverStyles).toContain('--xeg-toolbar-overlay-gradient-strong');
      expect(hoverStyles).toContain('--xeg-blur-strong');
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
