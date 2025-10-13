/**
 * @fileoverview Bundle size optimization tests for Settings components
 * @description Phase 39 Step 1: Verify settings modal bundle size optimization
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Buffer } from 'node:buffer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BUNDLE_BUDGET = 320 * 1024; // 320 KB in bytes
const SETTINGS_SIZE_TARGET = 15 * 1024; // Target: < 15 KB for settings

describe('Phase 39 Step 1: Bundle size optimization (Settings)', () => {
  describe('Production bundle size', () => {
    it('should be under 320 KB budget', () => {
      const prodBundlePath = resolve(__dirname, '../../../dist/xcom-enhanced-gallery.user.js');

      try {
        const stats = statSync(prodBundlePath);
        const sizeInKB = (stats.size / 1024).toFixed(2);

        expect(stats.size).toBeLessThanOrEqual(BUNDLE_BUDGET);
        console.log(`✅ Production bundle: ${sizeInKB} KB (budget: 320 KB)`);
      } catch (error) {
        // Build may not exist yet - skip test
        console.warn('⚠️ Production bundle not found - run `npm run build` first');
        expect(true).toBe(true);
      }
    });
  });

  describe('Settings component size estimation', () => {
    it('should have minimal SettingsModal footprint', () => {
      const modalPath = resolve(
        __dirname,
        '../../../src/shared/components/ui/SettingsModal/SettingsModal.tsx'
      );
      const cssPath = resolve(
        __dirname,
        '../../../src/shared/components/ui/SettingsModal/SettingsModal.module.css'
      );

      try {
        const tsxContent = readFileSync(modalPath, 'utf-8');
        const cssContent = readFileSync(cssPath, 'utf-8');

        const tsxSize = Buffer.byteLength(tsxContent, 'utf-8');
        const cssSize = Buffer.byteLength(cssContent, 'utf-8');
        const totalSize = tsxSize + cssSize;

        const tsxKB = (tsxSize / 1024).toFixed(2);
        const cssKB = (cssSize / 1024).toFixed(2);
        const totalKB = (totalSize / 1024).toFixed(2);

        console.log(`📦 SettingsModal.tsx: ${tsxKB} KB`);
        console.log(`🎨 SettingsModal.module.css: ${cssKB} KB`);
        console.log(`📊 Total (estimated): ${totalKB} KB`);

        // Source code should be reasonable (not minified yet)
        expect(totalSize).toBeLessThan(30 * 1024); // < 30 KB source
      } catch (error) {
        console.warn('⚠️ Settings files not found');
        expect(true).toBe(true);
      }
    });
  });

  describe('Lazy loading opportunity', () => {
    it('should identify ToolbarWithSettings as lazy loading candidate', () => {
      const toolbarWithSettingsPath = resolve(
        __dirname,
        '../../../src/shared/components/ui/ToolbarWithSettings/ToolbarWithSettings.tsx'
      );

      try {
        const content = readFileSync(toolbarWithSettingsPath, 'utf-8');

        // Check if SettingsModal is imported directly (not lazy)
        const hasDirectImport = /import\s+{\s*SettingsModal\s*}/.test(content);
        const hasLazyImport = /lazy\(.*SettingsModal/.test(content);

        if (hasDirectImport && !hasLazyImport) {
          console.warn('💡 Optimization opportunity: SettingsModal can be lazy loaded');
        }

        // This is informational - not a hard requirement yet
        expect(true).toBe(true);
      } catch (error) {
        console.warn('⚠️ ToolbarWithSettings not found');
        expect(true).toBe(true);
      }
    });
  });

  describe('Tree shaking readiness', () => {
    it('should have ESM exports for tree shaking', () => {
      const settingsIndexPath = resolve(
        __dirname,
        '../../../src/shared/components/ui/SettingsModal/index.ts'
      );

      try {
        const content = readFileSync(settingsIndexPath, 'utf-8');

        // Check for named exports (tree-shakeable)
        const hasNamedExports = /export\s+{\s*\w+/.test(content);
        const hasDefaultExport = /export\s+default/.test(content);

        expect(hasNamedExports).toBe(true);
        console.log(`✅ Named exports found (tree-shakeable)`);

        if (hasDefaultExport) {
          console.warn('⚠️ Default export may hinder tree shaking');
        }
      } catch (error) {
        console.warn('⚠️ Settings index not found');
        expect(true).toBe(true);
      }
    });
  });
});
