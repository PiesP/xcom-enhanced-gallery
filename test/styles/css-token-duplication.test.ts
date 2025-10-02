/**
 * @file CSS 토큰 중복 감지 테스트 (RED)
 * @description Epic CSS-TOKEN-UNIFY-001 Phase A: 토큰 중복 제거
 *
 * 배경:
 * - `--xeg-icon-size-*` 토큰이 `--size-icon-*`을 단순 참조
 * - `--xeg-radius-*` 토큰이 `--radius-*`를 단순 참조
 * - Alias 토큰은 유지보수 부담 증가
 *
 * 목표:
 * - Semantic 토큰만 사용하여 중복 제거
 * - 토큰 레이어 명확화 (base → semantic → component)
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

// ESM 환경에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('CSS 토큰 중복 감지 (Epic CSS-TOKEN-UNIFY-001 Phase A)', () => {
  const rootDir = resolve(__dirname, '../..');
  const designTokensPath = resolve(rootDir, 'src/shared/styles/design-tokens.css');
  const semanticTokensPath = resolve(rootDir, 'src/shared/styles/design-tokens.semantic.css');

  describe('Icon 토큰 중복', () => {
    it('--xeg-icon-size-* alias 토큰이 존재하지 않아야 함', () => {
      const designTokens = readFileSync(designTokensPath, 'utf-8');

      // Alias 패턴 검출
      const aliasPatterns = [
        /--xeg-icon-size:\s*var\(--size-icon-md\)/,
        /--xeg-icon-size-sm:\s*var\(--size-icon-sm\)/,
        /--xeg-icon-size-md:\s*var\(--size-icon-md\)/,
        /--xeg-icon-size-lg:\s*var\(--size-icon-lg\)/,
      ];

      const foundAliases = aliasPatterns.filter(pattern => pattern.test(designTokens));

      expect(foundAliases).toHaveLength(0);

      if (foundAliases.length > 0) {
        console.warn('\n⚠️  Alias 토큰 발견:');
        foundAliases.forEach(pattern => {
          const match = designTokens.match(pattern);
          if (match) console.warn(`  - ${match[0]}`);
        });
        console.warn(
          '\n💡 대신 semantic 토큰 사용: --size-icon-sm, --size-icon-md, --size-icon-lg'
        );
      }
    });

    it('Semantic icon 토큰(--size-icon-*)은 유지되어야 함', () => {
      const semanticTokens = readFileSync(semanticTokensPath, 'utf-8');

      expect(semanticTokens).toMatch(/--size-icon-sm:\s*16px/);
      expect(semanticTokens).toMatch(/--size-icon-md:\s*20px/);
      expect(semanticTokens).toMatch(/--size-icon-lg:\s*24px/);
    });

    it('컴포넌트는 semantic 토큰을 직접 사용해야 함', () => {
      const galleryModulePath = resolve(rootDir, 'src/features/gallery/styles/Gallery.module.css');
      const toastModulePath = resolve(rootDir, 'src/shared/components/ui/Toast/Toast.module.css');

      const galleryCSS = readFileSync(galleryModulePath, 'utf-8');
      const toastCSS = readFileSync(toastModulePath, 'utf-8');

      // Alias 토큰 사용 검출
      const aliasUsage = [
        { file: 'Gallery.module.css', content: galleryCSS },
        { file: 'Toast.module.css', content: toastCSS },
      ].filter(({ content }) => /--xeg-icon-size/.test(content));

      expect(aliasUsage).toHaveLength(0);

      if (aliasUsage.length > 0) {
        console.warn('\n⚠️  Alias 토큰 사용 발견:');
        aliasUsage.forEach(({ file }) => {
          console.warn(`  - ${file}`);
        });
        console.warn('\n💡 변경: var(--xeg-icon-size-md) → var(--size-icon-md)');
      }
    });
  });

  describe('Border-radius 토큰 중복', () => {
    it('--xeg-radius-* alias 토큰이 존재하지 않아야 함', () => {
      const designTokens = readFileSync(designTokensPath, 'utf-8');

      // 일반적인 alias 패턴
      const aliasPatterns = [
        /--xeg-radius-sm:\s*var\(--radius-sm\)/,
        /--xeg-radius-md:\s*var\(--radius-md\)/,
        /--xeg-radius-lg:\s*var\(--radius-lg\)/,
        /--xeg-radius-xl:\s*var\(--radius-xl\)/,
      ];

      const foundAliases = aliasPatterns.filter(pattern => pattern.test(designTokens));

      expect(foundAliases).toHaveLength(0);

      if (foundAliases.length > 0) {
        console.warn('\n⚠️  Border-radius alias 토큰 발견:');
        foundAliases.forEach(pattern => {
          const match = designTokens.match(pattern);
          if (match) console.warn(`  - ${match[0]}`);
        });
      }
    });

    it('Semantic radius 토큰(--radius-*)은 유지되어야 함', () => {
      const semanticTokens = readFileSync(semanticTokensPath, 'utf-8');

      // Semantic 토큰 존재 확인 (정확한 값은 파일 확인 필요)
      expect(semanticTokens).toMatch(/--radius-/);
    });
  });

  describe('중복 감지 자동화', () => {
    it('단순 참조 alias 패턴을 자동 감지해야 함', () => {
      const designTokens = readFileSync(designTokensPath, 'utf-8');

      // 패턴: --xeg-*: var(--size-*) 또는 --xeg-*: var(--radius-*)
      const simpleAliasPattern = /--xeg-(\w+):\s*var\(--(size|radius)-\1\)/g;

      const matches = [...designTokens.matchAll(simpleAliasPattern)];

      expect(matches).toHaveLength(0);

      if (matches.length > 0) {
        console.warn('\n⚠️  단순 참조 alias 발견:');
        matches.forEach(match => {
          console.warn(`  - ${match[0]}`);
        });
        console.warn(`\n총 ${matches.length}개의 불필요한 alias 토큰`);
      }
    });
  });
});
