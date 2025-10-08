/**
 * @fileoverview Design Tokens Duplication Scan (RED Phase - Phase 9.15)
 * @description Detects duplicate CSS custom property definitions in design token files.
 * Ensures each token is defined only once to avoid confusion and maintenance burden.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cwd } from 'node:process';

describe('Phase 9.15: Design Tokens Duplication Scan (RED)', () => {
  const semanticTokensPath = resolve(cwd(), 'src/shared/styles/design-tokens.semantic.css');

  describe('No Duplicate Token Definitions', () => {
    it('should not have duplicate --xeg-surface-glass-* token definitions in :root block', () => {
      const css = readFileSync(semanticTokensPath, 'utf-8');

      // Extract only :root block tokens (before first theme block)
      const rootBlockMatch = css.match(/:root\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/);
      if (!rootBlockMatch) {
        throw new Error('Could not find :root block');
      }

      const rootBlock = rootBlockMatch[0];

      // Extract all token definitions from root block
      const tokenMatches = rootBlock.matchAll(/^\s*(--[\w-]+):\s*/gm);
      const tokenDefinitions: { name: string }[] = [];

      for (const match of tokenMatches) {
        tokenDefinitions.push({ name: match[1] });
      }

      // Find duplicates within root block
      const tokenCounts = new Map<string, number>();
      for (const { name } of tokenDefinitions) {
        tokenCounts.set(name, (tokenCounts.get(name) || 0) + 1);
      }

      const duplicates = Array.from(tokenCounts.entries())
        .filter(([_, count]) => count > 1)
        .map(([name, count]) => ({ token: name, count }));

      // Assert no duplicates in root block
      if (duplicates.length > 0) {
        const report = duplicates
          .map(d => `  - ${d.token}: defined ${d.count} times in :root`)
          .join('\n');

        throw new Error(
          `Found ${duplicates.length} duplicate token definition(s) in :root block:\n${report}\n\n` +
            `Each token should be defined only once in :root. Theme overrides in [data-theme] blocks are allowed.`
        );
      }

      expect(duplicates).toHaveLength(0);
    });

    it('should specifically check for --xeg-surface-glass-bg duplication (known issue)', () => {
      const css = readFileSync(semanticTokensPath, 'utf-8');

      // Extract only :root block
      const rootBlockMatch = css.match(/:root\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/);
      if (!rootBlockMatch) {
        throw new Error('Could not find :root block');
      }
      const rootBlock = rootBlockMatch[0];

      // Count --xeg-surface-glass-bg definitions in root block only
      const bgTokenPattern = /^\s*--xeg-surface-glass-bg:\s*/gm;
      const matches = Array.from(rootBlock.matchAll(bgTokenPattern));

      expect(
        matches.length,
        `Expected 1 definition of --xeg-surface-glass-bg in :root, found ${matches.length}`
      ).toBe(1);
    });

    it('should specifically check for --xeg-surface-glass-border duplication', () => {
      const css = readFileSync(semanticTokensPath, 'utf-8');

      const rootBlockMatch = css.match(/:root\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/);
      if (!rootBlockMatch) {
        throw new Error('Could not find :root block');
      }
      const rootBlock = rootBlockMatch[0];

      const borderTokenPattern = /^\s*--xeg-surface-glass-border:\s*/gm;
      const matches = Array.from(rootBlock.matchAll(borderTokenPattern));

      expect(
        matches.length,
        `Expected 1 definition of --xeg-surface-glass-border in :root, found ${matches.length}`
      ).toBe(1);
    });

    it('should specifically check for --xeg-surface-glass-shadow duplication', () => {
      const css = readFileSync(semanticTokensPath, 'utf-8');

      const rootBlockMatch = css.match(/:root\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/);
      if (!rootBlockMatch) {
        throw new Error('Could not find :root block');
      }
      const rootBlock = rootBlockMatch[0];

      const shadowTokenPattern = /^\s*--xeg-surface-glass-shadow:\s*/gm;
      const matches = Array.from(rootBlock.matchAll(shadowTokenPattern));

      expect(
        matches.length,
        `Expected 1 definition of --xeg-surface-glass-shadow in :root, found ${matches.length}`
      ).toBe(1);
    });
  });

  describe('Token Definition Quality', () => {
    it('should have consistent comment formatting for token groups in :root', () => {
      const css = readFileSync(semanticTokensPath, 'utf-8');

      // Extract only :root block
      const rootBlockMatch = css.match(/:root\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/);
      if (!rootBlockMatch) {
        throw new Error('Could not find :root block');
      }
      const rootBlock = rootBlockMatch[0];

      // Check for "Surface Glass - Unified Tokens" comment in root block
      const surfaceGlassComments = rootBlock.match(/\/\*\s*Surface Glass - Unified Tokens\s*\*\//g);

      expect(
        surfaceGlassComments?.length,
        `Expected 1 "Surface Glass - Unified Tokens" comment in :root, found ${surfaceGlassComments?.length || 0}`
      ).toBe(1);
    });
  });
});
