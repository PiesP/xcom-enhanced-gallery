/**
 * @fileoverview TDD - 툴바와 설정 모달 디자인 일관성 테스트 (간소화)
 * @description 툴바와 설정 모달이 동일한 glassmorphism 디자인을 사용하는지 검증
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('TDD: 툴바와 설정 모달 디자인 일관성', () => {
  let toolbarCSS;
  let modalCSS;
  let glassmorphismCSS;

  beforeEach(() => {
    try {
      // CSS 파일 읽기

      const toolbarPath = join(
        process.cwd(),
        'src/shared/components/ui/Toolbar/Toolbar.module.css'
      );

      const modalPath = join(
        process.cwd(),
        'src/shared/components/ui/SettingsModal/SettingsModal.module.css'
      );
      // eslint-disable-next-line no-undef
      const glassmorphismPath = join(process.cwd(), 'src/shared/styles/glassmorphism-tokens.css');

      toolbarCSS = readFileSync(toolbarPath, 'utf-8');
      modalCSS = readFileSync(modalPath, 'utf-8');
      glassmorphismCSS = readFileSync(glassmorphismPath, 'utf-8');
    } catch {
      // CSS 파일 읽기 실패시 빈 문자열로 초기화
      toolbarCSS = '';
      modalCSS = '';
      glassmorphismCSS = '';
    }
  });

  describe('RED Phase: 실패하는 테스트 (현재 문제 확인)', () => {
    it('툴바는 glass-surface 클래스 방식을 사용해야 한다', () => {
      // 툴바 TSX에서 glass-surface 클래스 사용 확인
      const toolbarTsxPath = join(process.cwd(), 'src/shared/components/ui/Toolbar/Toolbar.tsx');
      const toolbarTSX = readFileSync(toolbarTsxPath, 'utf-8');
      expect(toolbarTSX).toMatch(/glass-surface/);

      // CSS에서는 개별 glassmorphism 속성이 제거되어야 함
      expect(toolbarCSS).not.toMatch(/\.galleryToolbar.*var\(--xeg-surface-glass-bg\)/s);
    });

    it('설정 모달은 glass-surface 클래스 방식을 사용해야 한다', () => {
      // 모달 TSX에서 glass-surface 클래스 사용 확인
      const modalTsxPath = join(
        process.cwd(),
        'src/shared/components/ui/SettingsModal/SettingsModal.tsx'
      );
      const modalTSX = readFileSync(modalTsxPath, 'utf-8');
      expect(modalTSX).toMatch(/glass-surface/);

      // CSS에서는 개별 glassmorphism 속성이 제거되어야 함
      expect(modalCSS).not.toMatch(/\.modal.*var\(--xeg-surface-glass-bg\)/s);
    });

    it('툴바와 설정 모달은 동일한 glass-surface 클래스 방식을 사용해야 한다', () => {
      // TSX 파일에서 glass-surface 클래스 사용 확인
      const toolbarTsxPath = join(process.cwd(), 'src/shared/components/ui/Toolbar/Toolbar.tsx');
      const modalTsxPath = join(
        process.cwd(),
        'src/shared/components/ui/SettingsModal/SettingsModal.tsx'
      );

      const toolbarTSX = readFileSync(toolbarTsxPath, 'utf-8');
      const modalTSX = readFileSync(modalTsxPath, 'utf-8');

      const hasToolbarGlass = toolbarTSX.includes('glass-surface');
      const hasModalGlass = modalTSX.includes('glass-surface');

      expect(hasToolbarGlass).toBe(true);
      expect(hasModalGlass).toBe(true);
    });
  });

  describe('GREEN Phase: 최소 구현으로 테스트 통과', () => {
    it('공통 glassmorphism 디자인 토큰이 정의되어야 한다', () => {
      // 필수 CSS 변수들이 정의되어 있는지 확인
      expect(glassmorphismCSS).toMatch(/--xeg-glass-bg/);
      expect(glassmorphismCSS).toMatch(/--xeg-glass-border/);
      expect(glassmorphismCSS).toMatch(/--xeg-glass-shadow/);
      expect(glassmorphismCSS).toMatch(/--xeg-glass-blur/);
    });

    it('xeg-glassmorphism 글로벌 클래스가 정의되어야 한다', () => {
      // 글로벌 glassmorphism 클래스가 정의되어 있는지 확인
      expect(glassmorphismCSS).toMatch(/\.xeg-glassmorphism/);
    });
  });

  describe('REFACTOR Phase: 코드 품질 개선', () => {
    it('툴바와 모달 컴포넌트는 동일한 디자인 시스템을 사용해야 한다', () => {
      // CSS 변수 기반의 디자인 시스템 사용 확인
      const toolbarUsesVariables = toolbarCSS.includes('var(--xeg-');
      const modalUsesVariables = modalCSS.includes('var(--xeg-');

      expect(toolbarUsesVariables).toBe(true);
      expect(modalUsesVariables).toBe(true);
    });

    it('반응형 디자인이 두 컴포넌트에 일관되게 적용되어야 한다', () => {
      // 미디어 쿼리 사용 확인
      const toolbarHasMediaQuery = toolbarCSS.includes('@media');
      const modalHasMediaQuery = modalCSS.includes('@media');

      expect(toolbarHasMediaQuery).toBe(true);
      expect(modalHasMediaQuery).toBe(true);
    });

    it('접근성 설정이 두 컴포넌트에 일관되게 적용되어야 한다', () => {
      // 접근성 관련 CSS 확인
      const toolbarHasA11y =
        toolbarCSS.includes('prefers-reduced-motion') || toolbarCSS.includes('focus-visible');
      const modalHasA11y =
        modalCSS.includes('prefers-reduced-motion') || modalCSS.includes('focus-visible');

      expect(toolbarHasA11y).toBe(true);
      expect(modalHasA11y).toBe(true);
    });
  });
});
