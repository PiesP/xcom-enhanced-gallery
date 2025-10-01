/**
 * @fileoverview Stage D Phase 2 RED Guard - Preact Shell Regression
 *
 * Purpose: Ensures that no Preact components appear in the rendering tree during Stage D.
 *
 * Acceptance Criteria (RED → GREEN):
 * - RED: GalleryRenderer contains 'preact' mode or fallback logic
 * - RED: Feature Shell files import from 'preact' or '@preact/*'
 * - GREEN: Only Solid shell is rendered, no Preact mode exists
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '../../..');

const GALLERY_RENDERER_PATH = join(PROJECT_ROOT, 'src/features/gallery/GalleryRenderer.ts');

describe('Stage D Phase 2 - Preact Shell Regression Guard', () => {
  it('should NOT contain Preact renderer mode in GalleryRenderer', () => {
    const content = readFileSync(GALLERY_RENDERER_PATH, 'utf-8');

    // RED Guard: 'preact' mode should not exist
    const preactModePattern = /rendererMode.*['"]preact['"]/i;
    const hasPreactMode = preactModePattern.test(content);

    expect(hasPreactMode).toBe(false);
    expect(content).not.toMatch(/type RendererMode = ['"]preact['"] \| ['"]solid['"]/);
  });

  it('should NOT contain Preact fallback logic in resolveSolidRenderConfig', () => {
    const content = readFileSync(GALLERY_RENDERER_PATH, 'utf-8');

    // RED Guard: Preact fallback overrides should not exist
    const preactFallbackPattern = /fallbackOverrides.*SolidGalleryShellOverrides/;
    const hasPreactFallback = preactFallbackPattern.test(content);

    expect(hasPreactFallback).toBe(false);
  });

  it('should NOT import Preact APIs in Feature Shell modules', () => {
    const featureShellFiles = [
      'src/features/gallery/GalleryApp.ts',
      'src/features/gallery/GalleryRenderer.ts',
      'src/features/settings/SettingsManager.ts',
    ];

    featureShellFiles.forEach(filePath => {
      const absolutePath = join(PROJECT_ROOT, filePath);
      let content: string;

      try {
        content = readFileSync(absolutePath, 'utf-8');
      } catch (error) {
        // File might not exist, skip
        return;
      }

      // RED Guard: No Preact imports allowed
      const preactImportPattern = /import.*['"]preact['"]/;
      const preactSignalsImportPattern = /import.*['"]@preact\/signals['"]/;

      expect(content).not.toMatch(preactImportPattern);
      expect(content).not.toMatch(preactSignalsImportPattern);
    });
  });

  it('should ensure solidGalleryShell feature flag is removed', () => {
    const content = readFileSync(GALLERY_RENDERER_PATH, 'utf-8');

    // RED Guard: Feature flag check should not exist
    const featureFlagPattern = /isFeatureFlagEnabled\(['"]solidGalleryShell['"]\)/;
    const hasFeatureFlag = featureFlagPattern.test(content);

    expect(hasFeatureFlag).toBe(false);
  });
});
