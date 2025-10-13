/**
 * @fileoverview Phase 32: CSS Optimization 검증 테스트
 * @description CSS 중복 패턴을 검증하고 최적화 가이드를 제공
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { Buffer } from 'node:buffer';

const SRC_DIR = join(process.cwd(), 'src');

/**
 * CSS 파일들을 재귀적으로 수집
 */
function collectCssFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...collectCssFiles(fullPath));
    } else if (entry.endsWith('.css')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * 파일 내용과 경로를 매핑
 */
function readCssFiles(): Map<string, string> {
  const cssFiles = collectCssFiles(SRC_DIR);
  const fileMap = new Map<string, string>();

  for (const filePath of cssFiles) {
    const content = readFileSync(filePath, 'utf-8');
    fileMap.set(filePath, content);
  }

  return fileMap;
}

describe('Phase 32: CSS Optimization - Duplication Detection', () => {
  const cssFiles = readCssFiles();

  describe('Media Query Duplication', () => {
    it('should limit prefers-reduced-motion media queries (현재 19개 → 목표 1-2개)', () => {
      const files: string[] = [];
      let totalCount = 0;

      for (const [path, content] of cssFiles) {
        const matches = content.match(/@media.*prefers-reduced-motion/gi);
        if (matches) {
          files.push(path);
          totalCount += matches.length;
        }
      }

      // RED: 현재 19개가 발견됨 (19 > 2)
      expect(totalCount).toBeLessThanOrEqual(2);

      if (totalCount > 2) {
        console.warn(
          `\n⚠️  prefers-reduced-motion 중복: ${totalCount}개 발견\n` +
            `   목표: 전역 파일 1-2개로 통합\n` +
            `   파일:\n${files.map(f => `   - ${f.replace(SRC_DIR, 'src')}`).join('\n')}`
        );
      }
    });

    it('should limit prefers-contrast media queries (현재 15개 → 목표 1-2개)', () => {
      const files: string[] = [];
      let totalCount = 0;

      for (const [path, content] of cssFiles) {
        const matches = content.match(/@media.*prefers-contrast/gi);
        if (matches) {
          files.push(path);
          totalCount += matches.length;
        }
      }

      // RED: 현재 15개가 발견됨
      expect(totalCount).toBeLessThanOrEqual(2);

      if (totalCount > 2) {
        console.warn(
          `\n⚠️  prefers-contrast 중복: ${totalCount}개 발견\n` +
            `   목표: 전역 파일 1-2개로 통합\n` +
            `   파일:\n${files.map(f => `   - ${f.replace(SRC_DIR, 'src')}`).join('\n')}`
        );
      }
    });

    it('should limit prefers-color-scheme media queries (목표 1-3개)', () => {
      const files: string[] = [];
      let totalCount = 0;

      for (const [path, content] of cssFiles) {
        const matches = content.match(/@media.*prefers-color-scheme/gi);
        if (matches) {
          files.push(path);
          totalCount += matches.length;
        }
      }

      // 색상 테마는 일부 컴포넌트별 필요할 수 있으므로 3개까지 허용
      expect(totalCount).toBeLessThanOrEqual(3);

      if (totalCount > 3) {
        console.warn(
          `\n⚠️  prefers-color-scheme 중복: ${totalCount}개 발견\n` +
            `   목표: design-tokens 파일에서만 관리\n` +
            `   파일:\n${files.map(f => `   - ${f.replace(SRC_DIR, 'src')}`).join('\n')}`
        );
      }
    });
  });

  describe('Transition Pattern Duplication', () => {
    it('should use shared transition utility classes instead of inline definitions', () => {
      const problematicFiles: string[] = [];
      const transitionPattern =
        /transition:\s*(?:transform|opacity|background-color|border-color|box-shadow)[\s\S]{0,200}?;/gi;

      for (const [path, content] of cssFiles) {
        // design-tokens, utilities, animations 파일은 제외 (정의 파일)
        if (
          path.includes('design-tokens') ||
          path.includes('utilities') ||
          path.includes('animations.css')
        ) {
          continue;
        }

        const matches = content.match(transitionPattern);
        if (matches && matches.length > 3) {
          // 파일당 3개 이상의 transition 정의는 중복으로 간주
          problematicFiles.push(`${path.replace(SRC_DIR, 'src')} (${matches.length}개)`);
        }
      }

      // RED: 중복된 transition 정의 파일들이 존재함
      expect(problematicFiles).toHaveLength(0);

      if (problematicFiles.length > 0) {
        console.warn(
          `\n⚠️  Transition 중복 정의 파일:\n` +
            problematicFiles.map(f => `   - ${f}`).join('\n') +
            `\n   권장: .xeg-transition-fast, .xeg-transition-normal 등 유틸리티 클래스 사용`
        );
      }
    });
  });

  describe('Legacy Alias Detection', () => {
    it('should minimize legacy token aliases in design-tokens.css', () => {
      const designTokensPath = Array.from(cssFiles.keys()).find(path =>
        path.endsWith('design-tokens.css')
      );

      expect(designTokensPath).toBeDefined();

      if (!designTokensPath) return;

      const content = cssFiles.get(designTokensPath)!;

      // 레거시 호환성 alias 주석 찾기
      const hasLegacyComment = content.includes('레거시 호환성을 위한 alias');

      if (hasLegacyComment) {
        // alias 섹션의 CSS 변수 개수 세기
        const aliasSection = content.split('레거시 호환성을 위한 alias')[1];
        const aliasVars = aliasSection?.match(/--xeg-[^:]+:/g) || [];

        // RED: alias가 10개 이상이면 정리 필요
        expect(aliasVars.length).toBeLessThan(10);

        if (aliasVars.length >= 10) {
          console.warn(
            `\n⚠️  레거시 alias 과다: ${aliasVars.length}개 발견\n` +
              `   목표: 10개 미만으로 축소\n` +
              `   방법: 사용되지 않는 alias 제거, 3단 계층 토큰으로 통합`
          );
        }
      }
    });
  });

  describe('CSS File Size Analysis', () => {
    it('should identify large CSS files for optimization', () => {
      const largeFiles: Array<{ path: string; size: number }> = [];
      const SIZE_THRESHOLD = 15 * 1024; // 15 KB

      for (const [path, content] of cssFiles) {
        const size = Buffer.byteLength(content, 'utf-8');
        if (size > SIZE_THRESHOLD) {
          largeFiles.push({
            path: path.replace(SRC_DIR, 'src'),
            size,
          });
        }
      }

      largeFiles.sort((a, b) => b.size - a.size);

      if (largeFiles.length > 0) {
        console.info(
          `\n📊 큰 CSS 파일들 (>15 KB):\n` +
            largeFiles.map(f => `   - ${f.path}: ${(f.size / 1024).toFixed(2)} KB`).join('\n') +
            `\n   최적화 우선순위로 검토 권장`
        );
      }

      // 이 테스트는 정보 제공용이므로 항상 통과
      expect(true).toBe(true);
    });
  });

  describe('Total CSS Size Budget', () => {
    it('should track total CSS source size', () => {
      let totalSize = 0;
      const sizes: Array<{ path: string; size: number }> = [];

      for (const [path, content] of cssFiles) {
        const size = Buffer.byteLength(content, 'utf-8');
        totalSize += size;
        sizes.push({ path: path.replace(SRC_DIR, 'src'), size });
      }

      const totalKB = totalSize / 1024;

      console.info(
        `\n📦 CSS 소스 총 크기: ${totalKB.toFixed(2)} KB (${cssFiles.size}개 파일)\n` +
          `   Phase 32 목표: 중복 제거로 10-15% 축소\n` +
          `   기대 결과: ~${(totalKB * 0.85).toFixed(2)}-${(totalKB * 0.9).toFixed(2)} KB`
      );

      // 정보 제공용
      expect(true).toBe(true);
    });
  });
});
