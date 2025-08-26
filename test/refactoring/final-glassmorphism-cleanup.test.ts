/**
 * @fileoverview Final Glassmorphism Cleanup - TDD RED
 * @description 잔존 blur 효과 완전 제거를 위한 포괄적 테스트
 * @version 1.0.0
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('🔴 TDD RED: Final Glassmorphism Cleanup', () => {
  const srcPath = join(process.cwd(), 'src');

  describe('Critical: Build Script Blur Injection Prevention', () => {
    it('critical-css.ts should not inject blur tokens', () => {
      const filePath = join(srcPath, 'build/critical-css.ts');
      expect(existsSync(filePath)).toBe(true);

      const content = readFileSync(filePath, 'utf8');

      // blur() 값을 재주입하는 ensure 함수들 탐지
      expect(content).not.toMatch(/ensure\([^)]*'blur\(/);
      expect(content).not.toMatch(/fallback:\s*['"]blur\(/);
      expect(content).not.toMatch(/--xeg-[^'"]*-blur['"][^;]*blur\(/);

      // 특정 blur 재주입 라인들 탐지
      expect(content).not.toMatch(/--xeg-toolbar-glass-blur['"]\s*,\s*['"]blur\(16px\)/);
      expect(content).not.toMatch(/--xeg-modal-glass-blur['"]\s*,\s*['"]blur\(16px\)/);
      expect(content).not.toMatch(/--xeg-surface-glass-blur['"]\s*,\s*['"]blur\(16px\)/);
    });

    it('build output should not contain blur tokens', () => {
      const devFilePath = join(process.cwd(), 'dist/xcom-enhanced-gallery.dev.user.js');

      if (existsSync(devFilePath)) {
        const content = readFileSync(devFilePath, 'utf8');

        // 빌드된 CSS 내 blur 토큰 탐지
        expect(content).not.toMatch(/--xeg-[^:]*-blur:\s*blur\(/);
        expect(content).not.toMatch(/--xeg-modal-glass-blur:\s*blur\(16px\)/);
        expect(content).not.toMatch(/--xeg-toolbar-glass-blur:\s*blur\(16px\)/);
        expect(content).not.toMatch(/--xeg-surface-glass-blur:\s*blur\(16px\)/);
      }
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
          if (matches) {
            // vitest에서는 console.log 사용 가능
            console.log(`❌ Blur pattern ${index + 1} found in ${relativePath}:`, matches);
          }
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

      // 모든 glass-blur 토큰이 none으로 설정되어야 함
      const glassBlurTokens = [
        '--xeg-blur-sm',
        '--xeg-blur-md',
        '--xeg-blur-lg',
        '--xeg-glass-blur-light',
        '--xeg-glass-blur-medium',
        '--xeg-glass-blur-strong',
        '--xeg-toolbar-glass-blur',
        '--xeg-modal-glass-blur',
        '--xeg-surface-glass-blur',
        '--xeg-media-glass-blur',
        '--xeg-toast-glass-blur',
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
