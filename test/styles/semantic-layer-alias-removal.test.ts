/**
 * Epic: CSS-TOKEN-UNIFY-001 Phase B
 * RED Test: Semantic Layer Alias Removal
 *
 * Phase A에서 design-tokens.css의 alias는 제거했지만,
 * design-tokens.semantic.css에 --xeg-radius-* alias가 여전히 존재.
 * 이로 인해 100+ 컴포넌트가 레거시 alias를 사용 중.
 *
 * Goal: Semantic layer의 alias를 제거하고, 직접 semantic 토큰만 제공
 *
 * Strategy:
 * 1. design-tokens.semantic.css의 --xeg-radius-* 제거 (8개)
 * 2. Icon.tsx의 'var(--xeg-icon-size)' fallback 제거
 * 3. 모든 컴포넌트를 semantic 토큰 직접 사용으로 전환 (100+ 파일)
 */

import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { describe, it, expect } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Epic CSS-TOKEN-UNIFY-001 Phase B: Semantic Layer Alias Removal', () => {
  const projectRoot = join(__dirname, '..', '..');
  const semanticCss = readFileSync(
    join(projectRoot, 'src/shared/styles/design-tokens.semantic.css'),
    'utf-8'
  );
  const iconTsx = readFileSync(
    join(projectRoot, 'src/shared/components/ui/Icon/Icon.tsx'),
    'utf-8'
  );

  describe('Semantic CSS should not define legacy aliases', () => {
    it('should NOT contain --xeg-radius-* alias definitions', () => {
      // Phase A에서 design-tokens.css에서 제거했지만
      // semantic.css에 여전히 존재 (lines 182-189)
      const radiusAliasPattern = /--xeg-radius-(xs|sm|md|lg|xl|2xl|pill|full):/g;
      const matches = semanticCss.match(radiusAliasPattern);

      expect(matches, 'semantic.css should not redefine --xeg-radius-* aliases').toBe(null);
    });

    it('should NOT contain --xeg-icon-size-* alias definitions', () => {
      // Icon size alias가 semantic layer에 정의되어 있는지 확인
      const iconAliasPattern = /--xeg-icon-size(-sm|-md|-lg)?:/g;
      const matches = semanticCss.match(iconAliasPattern);

      expect(matches, 'semantic.css should not define --xeg-icon-size-* aliases').toBe(null);
    });
  });

  describe('Icon.tsx should use semantic tokens only', () => {
    it('should NOT use var(--xeg-icon-size) as fallback', () => {
      // Icon.tsx line 22: props.size ?? 'var(--xeg-icon-size)'
      // 이는 레거시 alias 의존성
      const legacyFallbackPattern = /var\(--xeg-icon-size\)/;
      const hasLegacyFallback = legacyFallbackPattern.test(iconTsx);

      expect(hasLegacyFallback, 'Icon.tsx should not use --xeg-icon-size fallback').toBe(false);
    });

    it('should use --size-icon-md as default fallback', () => {
      // 권장: 'var(--size-icon-md)' 사용
      const semanticFallbackPattern = /var\(--size-icon-md\)/;
      const hasSemanticFallback = semanticFallbackPattern.test(iconTsx);

      expect(hasSemanticFallback, 'Icon.tsx should use semantic --size-icon-md as fallback').toBe(
        true
      );
    });
  });

  describe('Phase B Validation: Alias removal complete', () => {
    it('should have removed all --xeg-radius-* aliases from semantic layer', () => {
      // NOTE: Base 토큰은 design-tokens.primitive.css에 정의되어 있음
      // Semantic layer는 alias를 제거하고 컴포넌트가 primitive 토큰을 직접 사용하도록 유도
      const hasNoRadiusAlias = !semanticCss.includes('--xeg-radius-');
      expect(hasNoRadiusAlias, 'semantic.css should not have radius aliases').toBe(true);
    });

    it('should have removed all --xeg-icon-size aliases from semantic layer', () => {
      const hasNoIconAlias = !semanticCss.includes('--xeg-icon-size');
      expect(hasNoIconAlias, 'semantic.css should not have icon size aliases').toBe(true);
    });
  });
});
