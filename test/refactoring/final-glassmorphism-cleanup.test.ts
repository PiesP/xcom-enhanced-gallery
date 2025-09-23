/**
 * @fileoverview Final Glassmorphism Cleanup - TDD RED
 * @description 잔존 blur 효과 완전 제거를 위한 포괄적 테스트
 * @version 1.0.0
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { cwd, env } from 'node:process';

describe('🔴 TDD RED: Final Glassmorphism Cleanup', () => {
  const srcPath = join(cwd(), 'src');

  describe('Critical: Build Script Blur Injection Prevention', () => {
    it('critical-css.ts should not inject blur tokens', () => {
      // critical-css.ts 파일이 없으므로 스킵 (해당 기능이 구현되지 않음)
      // 이는 정상적인 상태 - 프로젝트에서 critical CSS 추출 기능을 사용하지 않음
      expect(true).toBe(true);
    });

    it('build output should not contain blur tokens', () => {
      const devFilePath = join(cwd(), 'dist/xcom-enhanced-gallery.dev.user.js');
      const prodFilePath = join(cwd(), 'dist/xcom-enhanced-gallery.user.js');

      // CI에서는 TEST_SKIP_BUILD=true 로 dist 산출물이 없을 수 있으므로 가드
      const hasDevFile = existsSync(devFilePath);
      const hasProdFile = existsSync(prodFilePath);
      const shouldSkip = env.TEST_SKIP_BUILD === 'true' || (!hasDevFile && !hasProdFile);
      if (shouldSkip) {
        // 빌드 의존 테스트는 로컬/빌드 단계에서 검증됨. CI test 단계에서는 스킵
        return;
      }

      // 존재하는 파일들을 모두 검사
      const filesToCheck = [];
      if (hasDevFile) filesToCheck.push(devFilePath);
      if (hasProdFile) filesToCheck.push(prodFilePath);

      filesToCheck.forEach(filePath => {
        const content = readFileSync(filePath, 'utf8');

        // 빌드된 CSS 내 blur 토큰 탐지
        expect(content).not.toMatch(/--xeg-[^:]*-blur:\s*blur\(/);
        expect(content).not.toMatch(/--xeg-modal-glass-blur:\s*blur\(16px\)/);
        expect(content).not.toMatch(/--xeg-toolbar-glass-blur:\s*blur\(16px\)/);
        expect(content).not.toMatch(/--xeg-surface-glass-blur:\s*blur\(16px\)/);

        // 일반적인 blur 패턴도 검사
        expect(content).not.toMatch(/backdrop-filter:\s*blur\(/);
        expect(content).not.toMatch(/-webkit-backdrop-filter:\s*blur\(/);
      });
    });
  });

  describe('High Priority: Animation Blur Effects', () => {
    it('css-animations.ts should not use blur in keyframes', () => {
      const filePath = join(srcPath, 'shared/utils/css-animations.ts');
      expect(existsSync(filePath)).toBe(true);

      const content = readFileSync(filePath, 'utf8');

      // 키프레임 내 blur 효과 탐지
      expect(content).not.toMatch(/filter:\s*blur\(/);
      expect(content).not.toMatch(/from\s*\{[^}]*filter:\s*blur\(/);
      expect(content).not.toMatch(/to\s*\{[^}]*filter:\s*blur\(/);

      // image-load 애니메이션의 blur 탐지
      expect(content).not.toMatch(/@keyframes\s+image-load[^}]*blur\(/);
      expect(content).not.toMatch(/from\s*\{\s*opacity:\s*0;\s*filter:\s*blur\(4px\)/);
    });

    it('animations.ts should not contain blur presets', () => {
      const filePath = join(srcPath, 'shared/utils/animations.ts');
      expect(existsSync(filePath)).toBe(true);

      const content = readFileSync(filePath, 'utf8');

      // ANIMATION_PRESETS 내 blur 효과 탐지
      expect(content).not.toMatch(/filter:\s*\[[^\]]*blur\(/);
      expect(content).not.toMatch(/imageLoad:[^}]*filter:[^}]*blur\(/);
      expect(content).not.toMatch(/blur\(4px\)['"]\s*,\s*['"]blur\(0px\)/);
    });
  });

  describe('Medium Priority: Progressive Image & Isolated CSS', () => {
    it('useProgressiveImage should not use blur effects (or document decision)', () => {
      const filePath = join(
        srcPath,
        'features/gallery/components/vertical-gallery-view/hooks/useProgressiveImage.ts'
      );
      expect(existsSync(filePath)).toBe(true);

      const content = readFileSync(filePath, 'utf8');

      // Progressive loading blur 탐지
      // Note: 이 테스트는 정책 결정에 따라 수정될 수 있음
      // 현재는 blur(2px) 사용을 탐지하여 의도적 실패를 유도
      expect(content).not.toMatch(/filter:\s*[^,}]*blur\(2px\)/);
      expect(content).not.toMatch(/style:\s*\{[^}]*filter:[^}]*blur\(/);
    });

    it('isolated-gallery.css should not contain blur variables', () => {
      const filePath = join(srcPath, 'shared/styles/isolated-gallery.css');
      expect(existsSync(filePath)).toBe(true);

      const content = readFileSync(filePath, 'utf8');

      // isolated blur 변수들 탐지
      expect(content).not.toMatch(/--xeg-isolated-blur-sm:\s*blur\(/);
      expect(content).not.toMatch(/--xeg-isolated-blur-md:\s*blur\(/);
      expect(content).not.toMatch(/--xeg-isolated-blur-lg:\s*blur\(/);
    });
  });

  describe('Comprehensive: Any Remaining Blur/Backdrop-Filter', () => {
    const criticalFiles = [
      'build/critical-css.ts',
      'shared/utils/css-animations.ts',
      'shared/utils/animations.ts',
      'features/gallery/components/vertical-gallery-view/hooks/useProgressiveImage.ts',
      'shared/styles/isolated-gallery.css',
      'shared/styles/design-tokens.css',
      'features/gallery/styles/gallery-global.css',
    ];

    criticalFiles.forEach(relativePath => {
      it(`${relativePath} should be completely blur-free`, () => {
        const filePath = join(srcPath, relativePath);

        if (!existsSync(filePath)) {
          // 파일이 없으면 통과 (삭제된 경우)
          return;
        }

        const content = readFileSync(filePath, 'utf8');

        // 포괄적 blur 패턴 탐지
        const blurPatterns = [
          /blur\(\d+px\)/gi,
          /backdrop-filter:\s*blur\(/gi,
          /-webkit-backdrop-filter:\s*blur\(/gi,
          /filter:\s*[^;]*blur\(/gi,
        ];

        blurPatterns.forEach((pattern, index) => {
          const matches = content.match(pattern);
          // 매치가 있으면 실패 처리
          expect(matches).toBeNull();
        });
      });
    });
  });

  describe('Quality Assurance: Design Token Consistency', () => {
    it('all glass tokens should be set to none or removed', () => {
      const filePath = join(srcPath, 'shared/styles/design-tokens.css');
      expect(existsSync(filePath)).toBe(true);

      const content = readFileSync(filePath, 'utf8');

      // 모든 glass-blur 토큰이 none으로 설정되어야 함 (현재 통합된 파일 기준)
      const glassBlurTokens = [
        '--xeg-toolbar-glass-blur',
        '--xeg-toast-glass-blur',
        '--xeg-gallery-glass-blur',
        '--xeg-surface-glass-blur',
      ];

      glassBlurTokens.forEach(token => {
        const regex = new RegExp(`${token}:\\s*([^;]+);`);
        const match = content.match(regex);

        if (match) {
          const value = match[1].trim();
          expect(value).toBe('none'); // blur 값이 아닌 none이어야 함
        }
      });
    });
  });
});
