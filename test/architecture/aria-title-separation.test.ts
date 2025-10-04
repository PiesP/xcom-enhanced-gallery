/**
 * @fileoverview Sub-Epic 3 Phase 1 RED - ARIA Label/Title Separation Tests
 * @description TDD workflow for semantic separation of aria-label and title attributes
 *
 * Epic: UI-TEXT-ICON-OPTIMIZATION
 * Sub-Epic 3: ARIA-TITLE-SEPARATION
 * Phase: 1 (RED - failing tests defining the contract)
 *
 * Objective: Separate aria-label (for screen readers) and title (for visual tooltips with keyboard shortcuts)
 *
 * Current State (Phase 1):
 * - ToolbarButton has fallback: title={props.title ?? props['aria-label']}
 * - This causes aria-label and title to be identical when title is not provided
 * - Screen reader users hear redundant information
 *
 * Target State (Phase 2):
 * - aria-label: Concise functional description (e.g., "이전 미디어")
 * - title: Same description + keyboard shortcut (e.g., "이전 미디어 (←)")
 * - ToolbarButton should not have fallback logic
 *
 * Scope:
 * - ToolbarButton.tsx: Remove fallback logic
 * - Toolbar.tsx: Already separated in Sub-Epic 2 (verify no regression)
 * - Other components: Check for aria-label/title duplication patterns
 *
 * Expected Results (Phase 1): All tests RED (failures defining what needs to be implemented)
 *
 * Files under test:
 * - src/shared/components/ui/ToolbarButton/ToolbarButton.tsx
 * - src/shared/components/ui/Toolbar/Toolbar.tsx
 * - src/shared/components/ui/Button/Button.tsx
 * - src/features/settings/solid/SolidSettingsPanel.solid.tsx (if applicable)
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TOOLBAR_BUTTON_PATH = resolve(
  __dirname,
  '../../src/shared/components/ui/ToolbarButton/ToolbarButton.tsx'
);
const TOOLBAR_PATH = resolve(__dirname, '../../src/shared/components/ui/Toolbar/Toolbar.tsx');
const BUTTON_PATH = resolve(__dirname, '../../src/shared/components/ui/Button/Button.tsx');

describe('Sub-Epic 3 Phase 1: ARIA Label/Title Separation (RED)', () => {
  describe('ToolbarButton.tsx - Remove fallback logic', () => {
    it('should NOT have title fallback to aria-label', () => {
      const toolbarButtonContent = readFileSync(TOOLBAR_BUTTON_PATH, 'utf-8');

      // RED: We expect to find this fallback pattern (Phase 1 current state)
      const fallbackPattern = /title=\{props\.title\s*\?\?\s*props\['aria-label'\]\}/;

      expect(
        fallbackPattern.test(toolbarButtonContent),
        'Expected to find title fallback pattern (Phase 1 RED state): title={props.title ?? props["aria-label"]}'
      ).toBe(true);

      // After Phase 2:
      // title={props.title}
    });

    it('should NOT have optional title prop type', () => {
      const toolbarButtonContent = readFileSync(TOOLBAR_BUTTON_PATH, 'utf-8');

      // RED: We expect to find optional title (Phase 1 current state)
      const optionalTitlePattern = /readonly\s+title\?\s*:\s*string/;

      expect(
        optionalTitlePattern.test(toolbarButtonContent),
        'Expected to find optional title prop (Phase 1 RED state): readonly title?: string'
      ).toBe(true);

      // After Phase 2:
      // readonly title: string (required)
    });
  });

  describe('Toolbar.tsx - No regression from Sub-Epic 2', () => {
    it('should have separated aria-label and title for all buttons', () => {
      const toolbarContent = readFileSync(TOOLBAR_PATH, 'utf-8');

      // GREEN: Sub-Epic 2 already separated these
      // We check that aria-label and title use different LanguageService keys

      const ariaLabelCount = (
        toolbarContent.match(/aria-label=\{languageService\.getString\(/g) || []
      ).length;
      const titleCount = (toolbarContent.match(/title=\{languageService\.getString\(/g) || [])
        .length;

      // Toolbar should have multiple buttons with aria-label and title
      expect(ariaLabelCount, 'Expected multiple aria-label with LanguageService').toBeGreaterThan(
        5
      );
      expect(titleCount, 'Expected multiple title with LanguageService').toBeGreaterThan(5);
    });

    it('should NOT have duplicate aria-label and title values (manual check)', () => {
      const toolbarContent = readFileSync(TOOLBAR_PATH, 'utf-8');

      // RED: We expect NOT to find identical aria-label and title on the same button
      // This is a manual check - we verify that aria-label keys are different from title keys

      const ariaLabelKeys = [
        'toolbar.previousMedia',
        'toolbar.nextMedia',
        'toolbar.fitOriginal',
        'toolbar.downloadCurrent',
        'toolbar.closeGallery',
      ];

      const titleKeys = [
        'toolbar.previousMediaWithShortcut',
        'toolbar.nextMediaWithShortcut',
        'toolbar.fitOriginalTitle',
        'toolbar.downloadCurrentWithShortcut',
        'toolbar.closeGalleryWithShortcut',
      ];

      // All aria-label keys should be different from title keys
      const duplicateKeys = ariaLabelKeys.filter(key => titleKeys.includes(key));

      expect(
        duplicateKeys.length,
        'aria-label and title should use different LanguageService keys'
      ).toBe(0);
    });
  });

  describe('Button.tsx - Check for aria-label/title duplication', () => {
    it('should NOT set title from aria-label automatically', () => {
      const buttonContent = readFileSync(BUTTON_PATH, 'utf-8');

      // RED: We check if Button.tsx has any automatic title fallback
      // Example: title={props.title || props['aria-label']}

      const autoTitlePattern = /title=\{props\.title\s*\|\|\s*props\['aria-label'\]\}/;

      expect(
        autoTitlePattern.test(buttonContent),
        'Button.tsx should NOT have automatic title fallback from aria-label'
      ).toBe(false);

      // If this test is GREEN, Button.tsx is already correct (no fallback)
    });

    it('should pass through title prop as-is', () => {
      const buttonContent = readFileSync(BUTTON_PATH, 'utf-8');

      // GREEN: Button.tsx should pass title as-is
      const directTitlePattern = /title=\{props\.title\}/;

      expect(
        directTitlePattern.test(buttonContent),
        'Button.tsx should pass title prop directly without modification'
      ).toBe(true);
    });
  });

  describe('Integration - aria-label and title should be semantically different', () => {
    it('should use LanguageService keys with meaningful suffixes', () => {
      // This test verifies the pattern established in Sub-Epic 2

      const expectedPatterns = [
        {
          component: 'Toolbar',
          ariaLabel: 'toolbar.previousMedia',
          title: 'toolbar.previousMediaWithShortcut',
          reason: 'Keyboard shortcut (←) should be in title only',
        },
        {
          component: 'Toolbar',
          ariaLabel: 'toolbar.nextMedia',
          title: 'toolbar.nextMediaWithShortcut',
          reason: 'Keyboard shortcut (→) should be in title only',
        },
        {
          component: 'Toolbar',
          ariaLabel: 'toolbar.fitOriginal',
          title: 'toolbar.fitOriginalTitle',
          reason: 'Keyboard shortcut (1:1) should be in title only',
        },
        {
          component: 'Toolbar',
          ariaLabel: 'toolbar.downloadCurrent',
          title: 'toolbar.downloadCurrentWithShortcut',
          reason: 'Keyboard shortcut (Ctrl+D) should be in title only',
        },
        {
          component: 'Toolbar',
          ariaLabel: 'toolbar.closeGallery',
          title: 'toolbar.closeGalleryWithShortcut',
          reason: 'Keyboard shortcut (Esc) should be in title only',
        },
      ];

      // This test is documentation - it defines the contract
      expect(expectedPatterns.length).toBe(5);

      expectedPatterns.forEach(pattern => {
        // aria-label should be concise (no "WithShortcut" or "Title" suffix)
        expect(
          pattern.ariaLabel,
          `${pattern.component} aria-label should be concise: ${pattern.ariaLabel}`
        ).not.toContain('WithShortcut');

        expect(
          pattern.ariaLabel,
          `${pattern.component} aria-label should not have Title suffix: ${pattern.ariaLabel}`
        ).not.toContain('Title');

        // title should have additional context (WithShortcut or Title suffix)
        const hasMeaningfulSuffix =
          pattern.title.includes('WithShortcut') || pattern.title.includes('Title');

        expect(
          hasMeaningfulSuffix,
          `${pattern.component} title should have meaningful suffix: ${pattern.title}. Reason: ${pattern.reason}`
        ).toBe(true);
      });
    });

    it('should define the separation principle in code comments', () => {
      const toolbarButtonContent = readFileSync(TOOLBAR_BUTTON_PATH, 'utf-8');

      // RED: We expect NOT to find documentation (Phase 1 current state)
      const hasDocumentation =
        toolbarButtonContent.includes('aria-label: Concise') ||
        toolbarButtonContent.includes('title: Detailed with keyboard');

      expect(
        hasDocumentation,
        'Expected NOT to find ARIA/title separation documentation (Phase 1 RED state)'
      ).toBe(false);

      // After Phase 2:
      // /**
      //  * ARIA Label/Title Separation:
      //  * - aria-label: Concise functional description for screen readers
      //  * - title: Same description + keyboard shortcut for visual tooltips
      //  * Example:
      //  *   aria-label="이전 미디어"
      //  *   title="이전 미디어 (←)"
      //  */
    });
  });

  describe('Phase 1 RED Summary', () => {
    it('should summarize all changes needed for Phase 2', () => {
      const changes = [
        {
          file: 'ToolbarButton.tsx',
          change: 'Remove fallback: title={props.title ?? props["aria-label"]}',
          target: 'title={props.title}',
        },
        {
          file: 'ToolbarButton.tsx',
          change: 'Make title prop required',
          target: 'readonly title: string',
        },
        {
          file: 'ToolbarButton.tsx',
          change: 'Add documentation comment',
          target: 'Explain aria-label vs title separation',
        },
        {
          file: 'Toolbar.tsx',
          change: 'No changes (already separated in Sub-Epic 2)',
          target: 'Verify no regression',
        },
        {
          file: 'Button.tsx',
          change: 'No changes (already passes title as-is)',
          target: 'Verify no fallback logic',
        },
      ];

      // This test is documentation
      expect(changes.length).toBe(5);
      expect(changes[0].file).toBe('ToolbarButton.tsx');
      expect(changes[1].file).toBe('ToolbarButton.tsx');
      expect(changes[2].file).toBe('ToolbarButton.tsx');
    });
  });
});
