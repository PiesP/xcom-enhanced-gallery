/**
 * @fileoverview Conditional Glassmorphism Test (RED Phase - Phase 9.16)
 * @description Validates that glassmorphism is conditionally applied based on:
 * 1. Browser support (@supports backdrop-filter)
 * 2. User preference (prefers-reduced-motion)
 * 3. CSS variable system (--xeg-glassmorphism-blur)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cwd } from 'node:process';

describe('Phase 9.16: Conditional Glassmorphism (RED)', () => {
  const semanticTokensPath = resolve(cwd(), 'src/shared/styles/design-tokens.semantic.css');
  const toolbarCssPath = resolve(cwd(), 'src/shared/components/ui/Toolbar/Toolbar.module.css');
  const modalCssPath = resolve(
    cwd(),
    'src/shared/components/ui/SettingsModal/SettingsModal.module.css'
  );

  describe('CSS Variable System for Conditional Glassmorphism', () => {
    it('should define --xeg-glassmorphism-blur variable in design tokens', () => {
      const css = readFileSync(semanticTokensPath, 'utf-8');

      expect(css, 'design-tokens.semantic.css should define --xeg-glassmorphism-blur').toMatch(
        /--xeg-glassmorphism-blur:\s*0px/
      );
    });

    it('should enable glassmorphism with @supports backdrop-filter', () => {
      const css = readFileSync(semanticTokensPath, 'utf-8');

      // Check for @supports block that enables glassmorphism
      const supportsBlockPattern =
        /@supports\s*\(\s*backdrop-filter:\s*blur\([^)]+\)\s*\)\s*\{[^}]*--xeg-glassmorphism-blur:\s*[1-9][0-9]*px/s;

      expect(
        css,
        '@supports (backdrop-filter: blur()) should set --xeg-glassmorphism-blur to non-zero value'
      ).toMatch(supportsBlockPattern);
    });

    it('should disable glassmorphism for prefers-reduced-motion', () => {
      const css = readFileSync(semanticTokensPath, 'utf-8');

      // Check for media query that disables glassmorphism
      const reducedMotionPattern =
        /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{[^}]*--xeg-glassmorphism-blur:\s*0px/s;

      expect(
        css,
        '@media (prefers-reduced-motion: reduce) should set --xeg-glassmorphism-blur to 0px'
      ).toMatch(reducedMotionPattern);
    });
  });

  describe('Toolbar Uses CSS Variable for Glassmorphism', () => {
    it('should use --xeg-glassmorphism-blur variable instead of hardcoded backdrop-filter: none', () => {
      const css = readFileSync(toolbarCssPath, 'utf-8');

      // Extract .galleryToolbar rule
      const toolbarRulePattern = /\.galleryToolbar\s*\{[^}]*\}/s;
      const toolbarRule = css.match(toolbarRulePattern)?.[0];

      expect(toolbarRule, 'Should find .galleryToolbar rule').toBeDefined();

      // Should use blur(var(--xeg-glassmorphism-blur))
      expect(
        toolbarRule,
        '.galleryToolbar should use backdrop-filter: blur(var(--xeg-glassmorphism-blur))'
      ).toMatch(/backdrop-filter:\s*blur\(var\(--xeg-glassmorphism-blur\)\)/);
    });

    it('should not have hardcoded "backdrop-filter: none !important" in .galleryToolbar', () => {
      const css = readFileSync(toolbarCssPath, 'utf-8');

      // Extract .galleryToolbar rule
      const toolbarRulePattern = /\.galleryToolbar\s*\{[^}]*\}/s;
      const toolbarRule = css.match(toolbarRulePattern)?.[0];

      expect(
        toolbarRule,
        '.galleryToolbar should not have hardcoded backdrop-filter: none !important'
      ).not.toMatch(/backdrop-filter:\s*none\s*!important/);
    });
  });

  describe('SettingsModal Uses CSS Variable for Glassmorphism', () => {
    it('should use --xeg-glassmorphism-blur variable in .modal or .panel', () => {
      const css = readFileSync(modalCssPath, 'utf-8');

      // Check if either .modal or .panel uses the variable
      const usesVariable =
        /\.modal\s*\{[^}]*backdrop-filter:\s*blur\(var\(--xeg-glassmorphism-blur\)\)/s.test(css) ||
        /\.panel\s*\{[^}]*backdrop-filter:\s*blur\(var\(--xeg-glassmorphism-blur\)\)/s.test(css);

      expect(
        usesVariable,
        'SettingsModal (.modal or .panel) should use backdrop-filter: blur(var(--xeg-glassmorphism-blur))'
      ).toBe(true);
    });
  });

  describe('Remove Legacy Hardcoded backdrop-filter: none', () => {
    it('Toolbar should not have any "backdrop-filter: none" in media queries', () => {
      const css = readFileSync(toolbarCssPath, 'utf-8');

      // Allow "backdrop-filter: none" only in comments
      const linesWithBackdropNone = css
        .split('\n')
        .filter(
          line => line.includes('backdrop-filter: none') || line.includes('backdrop-filter:none')
        )
        .filter(line => !line.trim().startsWith('//') && !line.trim().startsWith('/*'));

      expect(
        linesWithBackdropNone.length,
        `Toolbar should not have hardcoded "backdrop-filter: none" (found ${linesWithBackdropNone.length} occurrences)`
      ).toBe(0);
    });

    it('SettingsModal should not have any "backdrop-filter: none" in media queries', () => {
      const css = readFileSync(modalCssPath, 'utf-8');

      const linesWithBackdropNone = css
        .split('\n')
        .filter(
          line => line.includes('backdrop-filter: none') || line.includes('backdrop-filter:none')
        )
        .filter(line => !line.trim().startsWith('//') && !line.trim().startsWith('/*'));

      expect(
        linesWithBackdropNone.length,
        `SettingsModal should not have hardcoded "backdrop-filter: none" (found ${linesWithBackdropNone.length} occurrences)`
      ).toBe(0);
    });
  });
});
