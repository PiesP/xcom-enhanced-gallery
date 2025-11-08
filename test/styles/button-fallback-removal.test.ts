/**
 * @fileoverview Phase 53: Button Fallback 제거 정책 테스트 (TDD RED)
 * @description Button.module.css의 모든 fallback 값을 제거하고 semantic 토큰만 사용
 */

import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

describe('Phase 53: Button Fallback Removal Policy (RED)', () => {
  setupGlobalTestIsolation();

  const here = fileURLToPath(import.meta.url);
  const root = resolve(here, '../../..');
  const buttonCssPath = resolve(root, 'src/shared/components/ui/Button/Button.module.css');
  const buttonCss = readFileSync(buttonCssPath, 'utf-8');

  it('Button.module.css should not have fallback values in var() declarations', () => {
    // Detect all var(--token, fallback) patterns
    const fallbackPattern = /var\(--[^,)]+,\s*[^)]+\)/g;
    const matches = buttonCss.match(fallbackPattern);

    if (matches) {
      console.error('Found fallback patterns in Button.module.css:');
      matches.forEach(match => console.error(`  - ${match}`));
    }

    expect(matches).toBeNull();
  });

  it('All button tokens should be defined in design token files', () => {
    const semanticCssPath = resolve(root, 'src/shared/styles/design-tokens.semantic.css');
    const componentCssPath = resolve(root, 'src/shared/styles/design-tokens.component.css');
    const primitiveCssPath = resolve(root, 'src/shared/styles/design-tokens.primitive.css');

    const semanticCss = readFileSync(semanticCssPath, 'utf-8');
    const componentCss = readFileSync(componentCssPath, 'utf-8');
    const primitiveCss = readFileSync(primitiveCssPath, 'utf-8');
    const allTokenCss = semanticCss + componentCss + primitiveCss;

    // Extract all --xeg-* tokens used in Button.module.css
    const tokenPattern = /var\((--xeg-[a-z0-9-]+)/g;
    const usedTokens = [...buttonCss.matchAll(tokenPattern)].map(m => m[1]);
    const uniqueTokens = [...new Set(usedTokens)];

    const missingTokens = uniqueTokens.filter(token => !allTokenCss.includes(`${token}:`));

    if (missingTokens.length > 0) {
      console.error('Missing tokens in design token files:');
      missingTokens.forEach(token => console.error(`  - ${token}`));
    }

    expect(missingTokens).toEqual([]);
  });

  it('--xeg-shadow-xs should be defined in semantic tokens', () => {
    const semanticCssPath = resolve(root, 'src/shared/styles/design-tokens.semantic.css');
    const semanticCss = readFileSync(semanticCssPath, 'utf-8');

    expect(semanticCss).toMatch(/--xeg-shadow-xs:/);
  });
});
