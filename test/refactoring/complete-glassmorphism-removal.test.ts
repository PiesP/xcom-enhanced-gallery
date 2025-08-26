/**
 * @fileoverview 완전한 글래스모피즘 제거 검증 테스트
 * @description TDD Red Phase - 모든 backdrop-filter: blur 효과 검출
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

describe('Complete Glassmorphism Removal Validation', () => {
  const srcPath = join(process.cwd(), 'src');

  // CSS 파일에서 실제 blur 효과만 검출 (변수는 none 값인지 확인)
  const findBlurEffectsInFile = (filePath: string): string[] => {
    try {
      const content = readFileSync(filePath, 'utf-8');

      // 직접적인 blur 사용
      const directBlurPatterns = [
        /backdrop-filter:\s*blur\([^)]+\)/gi,
        /-webkit-backdrop-filter:\s*blur\([^)]+\)/gi,
      ];

      const foundEffects: string[] = [];
      directBlurPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          foundEffects.push(...matches);
        }
      });

      // CSS 변수 참조는 실제 blur 값인지 확인
      const varBlurPatterns = [
        /backdrop-filter:\s*var\([^)]*blur[^)]*\)/gi,
        /-webkit-backdrop-filter:\s*var\([^)]*blur[^)]*\)/gi,
      ];

      varBlurPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const varNameMatch = match.match(/var\(([^)]+)\)/);
            if (varNameMatch) {
              const varName = varNameMatch[1];
              // 변수가 'none'이 아닌 blur 값으로 정의되어 있는지 확인
              const escapedVarName = varName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
              const varDefPattern = new RegExp(
                `${escapedVarName}:\\s*(?!none)[^;]*blur\\([^)]+\\)`,
                'gi'
              );
              if (content.match(varDefPattern)) {
                foundEffects.push(match);
              }
            }
          });
        }
      });

      return foundEffects;
    } catch (error) {
      return [];
    }
  };

  // 디렉토리를 재귀적으로 탐색하여 CSS 파일 찾기
  const getAllCssFiles = (dir: string) => {
    const cssFiles: string[] = [];

    const traverse = (currentDir: string) => {
      const items = readdirSync(currentDir);

      for (const item of items) {
        const fullPath = join(currentDir, item);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          // node_modules, dist, coverage 등 제외
          if (!['node_modules', 'dist', 'coverage', '.git', 'test-results'].includes(item)) {
            traverse(fullPath);
          }
        } else if (stat.isFile() && extname(item) === '.css') {
          cssFiles.push(fullPath);
        }
      }
    };

    traverse(dir);
    return cssFiles;
  };

  describe('🚨 Critical Blur Effect Detection', () => {
    it('should detect ALL remaining backdrop-filter blur effects in CSS files', () => {
      const cssFiles = getAllCssFiles(srcPath);
      const filesWithBlurEffects: Array<{ file: string; effects: string[] }> = [];

      cssFiles.forEach(file => {
        const blurEffects = findBlurEffectsInFile(file);
        if (blurEffects.length > 0) {
          filesWithBlurEffects.push({
            file: file.replace(process.cwd(), ''),
            effects: blurEffects,
          });
        }
      });

      // 상세한 실패 메시지 출력
      if (filesWithBlurEffects.length > 0) {
        console.log('\n🚨 Found remaining blur effects:');
        filesWithBlurEffects.forEach(({ file, effects }) => {
          console.log(`\n📁 ${file}:`);
          effects.forEach(effect => {
            console.log(`  ❌ ${effect}`);
          });
        });
        console.log(`\n📊 Total files with blur effects: ${filesWithBlurEffects.length}`);
        console.log(
          `📊 Total blur effect instances: ${filesWithBlurEffects.reduce((sum, f) => sum + f.effects.length, 0)}`
        );
      }

      // 이 테스트는 의도적으로 실패해야 함 (RED phase)
      expect(filesWithBlurEffects).toHaveLength(0);
    });
  });

  describe('🎯 Design Token Validation', () => {
    it('should ensure design tokens have no blur values', () => {
      const designTokensPath = join(srcPath, 'shared/styles/design-tokens.css');
      const content = readFileSync(designTokensPath, 'utf-8');

      const blurTokenPatterns = [
        /--[^:]*blur[^:]*:\s*blur\([^)]+\)/gi,
        /--[^:]*glass[^:]*:\s*blur\([^)]+\)/gi,
      ];

      const foundTokens: string[] = [];
      blurTokenPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          foundTokens.push(...matches);
        }
      });

      if (foundTokens.length > 0) {
        console.log('\n🚨 Found blur tokens in design-tokens.css:');
        foundTokens.forEach(token => {
          console.log(`  ❌ ${token}`);
        });
      }

      expect(foundTokens).toHaveLength(0);
    });
  });

  describe('🔍 Component-Specific Validation', () => {
    const criticalComponents = [
      'src/features/gallery/styles/Gallery.module.css',
      'src/shared/components/ui/Toast/Toast.module.css',
      'src/shared/components/ui/Toolbar/Toolbar.module.css',
      'src/shared/styles/isolated-gallery.css',
      'src/features/gallery/styles/gallery-global.css',
    ];

    criticalComponents.forEach(componentPath => {
      it(`should have no blur effects in ${componentPath.split('/').pop()}`, () => {
        const fullPath = join(process.cwd(), componentPath);
        const blurEffects = findBlurEffectsInFile(fullPath);

        if (blurEffects.length > 0) {
          console.log(`\n🚨 Found blur effects in ${componentPath}:`);
          blurEffects.forEach(effect => {
            console.log(`  ❌ ${effect}`);
          });
        }

        expect(blurEffects).toHaveLength(0);
      });
    });
  });

  describe('🎨 Minimal Design System Validation', () => {
    it('should use minimal design tokens instead of glassmorphism', () => {
      const minimalTokensPath = join(srcPath, 'shared/styles/minimal-design-tokens.css');
      const content = readFileSync(minimalTokensPath, 'utf-8');

      // 미니멀 디자인 토큰이 올바르게 설정되어 있는지 확인
      expect(content).toContain('--xeg-glass-blur: none');
      expect(content).toContain('backdrop-filter: none');
      expect(content).not.toMatch(/backdrop-filter:\s*blur\(/);
    });
  });
});
