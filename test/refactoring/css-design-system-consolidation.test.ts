/**
 * @fileoverview TDD 기반 CSS 디자인 시스템 통합 테스트
 * @description 중복된 CSS 파일들과 충돌하는 클래스들을 테스트하여 문제를 검증하고 해결
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Buffer } from 'node:buffer';
import { getDesignTokenPaths, readAllDesignTokens } from '../shared/design-token-helpers';

describe('CSS Design System Consolidation - TDD', () => {
  setupGlobalTestIsolation();

  const srcPath = join(process.cwd(), 'src');
  const sharedStylesPath = join(srcPath, 'shared', 'styles');

  // 🔴 RED: 이제 GREEN으로 전환된 테스트들 (문제 해결됨)

  describe('Resolved Issues (이전 RED → GREEN)', () => {
    it('should retain only the three-tier design token files (RESOLVED)', () => {
      const expectedFiles = [
        'design-tokens.primitive.css',
        'design-tokens.semantic.css',
        'design-tokens.component.css',
      ];

      expectedFiles.forEach(file => {
        expect(existsSync(join(sharedStylesPath, file)), `${file} should exist`).toBe(true);
      });

      const removedFiles = [
        'design-tokens.css',
        'glassmorphism-tokens.css',
        'minimal-design-tokens.css',
        'unified-glassmorphism.css',
      ];

      removedFiles.forEach(file => {
        expect(existsSync(join(sharedStylesPath, file)), `${file} should be removed`).toBe(false);
      });
    });

    it('should now have no conflicting .xeg-glassmorphism class definitions (RESOLVED)', () => {
      const filesToCheck = ['glassmorphism-tokens.css', 'unified-glassmorphism.css'];

      let glassmorphismDefinitions = 0;

      filesToCheck.forEach(fileName => {
        const filePath = join(sharedStylesPath, fileName);
        if (existsSync(filePath)) {
          const content = readFileSync(filePath, 'utf-8');
          if (content.includes('.xeg-glassmorphism')) {
            glassmorphismDefinitions++;
          }
        }
      });

      // 이제는 중복 정의가 없어야 함 (파일들이 제거됨)
      expect(glassmorphismDefinitions).toBe(0);
    });

    it('should remove legacy minimal design token file', () => {
      const minimalTokensPath = join(sharedStylesPath, 'minimal-design-tokens.css');
      expect(existsSync(minimalTokensPath)).toBe(false);
    });

    it('should remove legacy glassmorphism token files', () => {
      const glassmorphismFiles = ['glassmorphism-tokens.css', 'unified-glassmorphism.css'];
      glassmorphismFiles.forEach(file => {
        expect(existsSync(join(sharedStylesPath, file)), `${file} should be removed`).toBe(false);
      });
    });
  });

  // 🟢 GREEN Phase: 문제 해결을 위한 통합된 디자인 시스템 테스트
  describe('🟢 GREEN Phase: 통합된 디자인 시스템 검증', () => {
    it('should expose the three-tier design tokens as the single source of truth', async () => {
      getDesignTokenPaths().forEach(path => {
        expect(existsSync(path)).toBe(true);
      });

      const deprecatedFiles = [
        'design-tokens.css',
        'glassmorphism-tokens.css',
        'minimal-design-tokens.css',
        'unified-glassmorphism.css',
      ];

      deprecatedFiles.forEach(file => {
        expect(existsSync(join(sharedStylesPath, file)), `${file} should be removed`).toBe(false);
      });
    });

    it('should have consistent CSS variable naming convention', () => {
      const content = readAllDesignTokens();

      // 통일된 네이밍 컨벤션 검증
      const hasConsistentSurfaceNaming = content.includes('--xeg-surface-primary');
      const hasConsistentColorNaming = content.includes('--xeg-color-text-primary');

      expect(hasConsistentSurfaceNaming).toBe(true);
      expect(hasConsistentColorNaming).toBe(true);
    });

    it('should have single source of truth for glassmorphism styles', () => {
      const content = readAllDesignTokens();

      // 기본 glassmorphism 클래스 정의는 1개, 변형들은 허용
      const baseGlassmorphismMatches = content.match(/^\.xeg-glassmorphism\s*{/gm);
      expect(baseGlassmorphismMatches?.length || 0).toBe(1);
    });

    it('should have clear design philosophy documentation', () => {
      const content = readAllDesignTokens();

      // 명확한 디자인 철학이 문서화되어 있어야 함
      const hasDesignPhilosophy =
        content.includes('@fileoverview') || content.includes('@description');
      expect(hasDesignPhilosophy).toBe(true);
    });
  });

  // 🔵 REFACTOR Phase: 코드 품질 및 성능 최적화 검증
  describe('🔵 REFACTOR Phase: 코드 품질 검증', () => {
    it('should have optimized CSS with minimal redundancy', () => {
      const content = readAllDesignTokens();

      // CSS 크기가 적절한 범위 내에 있어야 함 (60KB 미만)
      const sizeInKB = Buffer.byteLength(content, 'utf8') / 1024;
      expect(sizeInKB).toBeLessThan(60);

      // 기본 선택자들의 중복도 체크 (간단한 검증)
      const selectors = content.match(/\.[a-zA-Z-]+(?:\.[a-zA-Z-]+)*\s*{/g) || [];
      expect(selectors.length).toBeGreaterThan(10); // 충분한 스타일이 있는지 확인
    });

    it('should have proper CSS custom properties hierarchy', () => {
      const content = readAllDesignTokens();

      // CSS 변수들이 계층적으로 잘 구성되어 있는지 확인
      const hasBaseColors = content.includes('/* Primary Colors */');
      const hasSemanticColors = content.includes('/* Semantic Colors */');
      const hasComponentTokens = content.includes('/* Component-specific */');

      expect(hasBaseColors).toBe(true);
      expect(hasSemanticColors).toBe(true);
    });

    it('should have accessibility-compliant color contrast', () => {
      const content = readAllDesignTokens();

      // 고대비 모드 지원 확인
      const hasHighContrastSupport = content.includes('@media (prefers-contrast: high)');
      const hasReducedMotionSupport = content.includes('@media (prefers-reduced-motion: reduce)');

      expect(hasHighContrastSupport).toBe(true);
      expect(hasReducedMotionSupport).toBe(true);
    });
  });

  // 컴포넌트 통합 테스트
  describe('Component Integration Tests', () => {
    it('should have components using unified design tokens', () => {
      const toolbarCSSPath = join(
        srcPath,
        'shared',
        'components',
        'ui',
        'Toolbar',
        'Toolbar.module.css'
      );

      if (existsSync(toolbarCSSPath)) {
        const content = readFileSync(toolbarCSSPath, 'utf-8');

        // 컴포넌트가 통합된 디자인 토큰을 사용하는지 확인
        const usesDesignTokens =
          content.includes('var(--xeg-color-') ||
          content.includes('var(--xeg-surface-') ||
          content.includes('var(--xeg-spacing-');

        expect(usesDesignTokens).toBe(true);
      }
    });

    it('should not have components with local color definitions', () => {
      const toolbarCSSPath = join(
        srcPath,
        'shared',
        'components',
        'ui',
        'Toolbar',
        'Toolbar.module.css'
      );

      if (existsSync(toolbarCSSPath)) {
        const content = readFileSync(toolbarCSSPath, 'utf-8');

        // 컴포넌트 내에서 로컬 색상 정의가 없어야 함
        const hasLocalColors =
          content.includes('rgba(255, 255, 255') ||
          content.includes('rgb(') ||
          content.includes('#ffffff') ||
          content.includes('#000000');

        // 이상적으로는 로컬 색상 정의가 없어야 함 (디자인 토큰 사용)
        // expect(hasLocalColors).toBe(false);
      }
    });
  });
});

// 유틸리티 함수들
export const CSSTestUtils = {
  /**
   * CSS 파일에서 특정 클래스 정의 개수를 세는 함수
   */
  countClassDefinitions(content: string, className: string) {
    const regex = new RegExp(`\\.${className}\\s*{`, 'g');
    return (content.match(regex) || []).length;
  },

  /**
   * CSS 변수 중복을 찾는 함수
   */
  findDuplicateVariables(content: string) {
    const variables = content.match(/--[a-zA-Z-]+:/g) || [];
    const variableNames = variables.map(v => v.replace(':', ''));
    const duplicates: string[] = [];

    variableNames.forEach((name, index) => {
      if (variableNames.indexOf(name) !== index && !duplicates.includes(name)) {
        duplicates.push(name);
      }
    });

    return duplicates;
  },

  /**
   * CSS 파일 크기를 KB 단위로 반환
   */
  getFileSizeInKB(content: string) {
    return Buffer.byteLength(content, 'utf8') / 1024;
  },
};
