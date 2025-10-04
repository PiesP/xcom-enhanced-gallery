/**
 * @fileoverview Sub-Epic 2 Phase 1 RED - Toolbar I18N Completion Tests
 * @description TDD workflow for complete internationalization of Toolbar component
 *
 * Epic: UI-TEXT-ICON-OPTIMIZATION
 * Sub-Epic 2: I18N-TOOLBAR-LABELS
 * Phase: 1 (RED - failing tests defining the contract)
 *
 * Objective: Replace all hardcoded Korean text in Toolbar.tsx with LanguageService keys
 *
 * Scope:
 * - 12 hardcoded strings in Toolbar.tsx (aria-label + title attributes)
 * - 13 missing keys in LanguageService (including keyboard shortcuts)
 * - Support for 3 languages: Korean, English, Japanese
 *
 * Expected Results (Phase 1): All tests RED (failures defining what needs to be implemented)
 *
 * Files under test:
 * - src/shared/components/ui/Toolbar/Toolbar.tsx
 * - src/shared/services/LanguageService.ts
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '../..');
const TOOLBAR_PATH = resolve(REPO_ROOT, 'src/shared/components/ui/Toolbar/Toolbar.tsx');
const LANGUAGE_SERVICE_PATH = resolve(REPO_ROOT, 'src/shared/services/LanguageService.ts');

describe('Sub-Epic 2: I18N-TOOLBAR-LABELS Phase 1 RED', () => {
  describe('Hardcoded strings removal', () => {
    test('Toolbar.tsx should not have hardcoded Korean aria-label for navigation buttons', () => {
      const toolbarContent = readFileSync(TOOLBAR_PATH, 'utf-8');

      // Phase 1 expectation: These hardcoded strings should exist (RED)
      // Phase 2 will replace them with LanguageService calls
      const hardcodedNavigationLabels = [
        /aria-label=['"]이전 미디어['"]/,
        /aria-label=['"]다음 미디어['"]/,
      ];

      const foundHardcoded = hardcodedNavigationLabels.filter(pattern =>
        pattern.test(toolbarContent)
      );

      // RED: We expect to find hardcoded text (this will fail in Phase 2)
      expect(
        foundHardcoded.length,
        'Expected to find hardcoded navigation aria-labels (Phase 1 RED state)'
      ).toBe(hardcodedNavigationLabels.length);

      // After Phase 2, this should be replaced with:
      // aria-label={languageService.getString('toolbar.previousMedia')}
      // aria-label={languageService.getString('toolbar.nextMedia')}
    });

    test('Toolbar.tsx should not have hardcoded Korean aria-label for fit mode buttons', () => {
      const toolbarContent = readFileSync(TOOLBAR_PATH, 'utf-8');

      const hardcodedFitLabels = [
        /aria-label=['"]원본 크기['"]/,
        /aria-label=['"]가로에 맞춤['"]/,
        /aria-label=['"]세로에 맞춤['"]/,
        /aria-label=['"]창에 맞춤['"]/,
      ];

      const foundHardcoded = hardcodedFitLabels.filter(pattern => pattern.test(toolbarContent));

      // RED: We expect to find hardcoded text
      expect(
        foundHardcoded.length,
        'Expected to find hardcoded fit mode aria-labels (Phase 1 RED state)'
      ).toBe(hardcodedFitLabels.length);

      // After Phase 2:
      // aria-label={languageService.getString('toolbar.fitOriginal')}
      // aria-label={languageService.getString('toolbar.fitWidth')}
      // aria-label={languageService.getString('toolbar.fitHeight')}
      // aria-label={languageService.getString('toolbar.fitContainer')}
    });

    test('Toolbar.tsx should not have hardcoded Korean aria-label for action buttons', () => {
      const toolbarContent = readFileSync(TOOLBAR_PATH, 'utf-8');

      const hardcodedActionLabels = [
        /aria-label=['"]현재 파일 다운로드['"]/,
        /aria-label=['"]설정 열기['"]/,
        /aria-label=['"]갤러리 닫기['"]/,
      ];

      const foundHardcoded = hardcodedActionLabels.filter(pattern => pattern.test(toolbarContent));

      // RED: We expect to find hardcoded text
      expect(
        foundHardcoded.length,
        'Expected to find hardcoded action aria-labels (Phase 1 RED state)'
      ).toBe(hardcodedActionLabels.length);

      // After Phase 2:
      // aria-label={languageService.getString('toolbar.downloadCurrent')}
      // aria-label={languageService.getString('toolbar.openSettings')}
      // aria-label={languageService.getString('toolbar.closeGallery')}
    });

    test('Toolbar.tsx should not have hardcoded English aria-label for keyboard help', () => {
      const toolbarContent = readFileSync(TOOLBAR_PATH, 'utf-8');

      // Currently English hardcoded
      const hardcodedKeyboardHelp = /aria-label=['"]Show keyboard shortcuts['"]/;

      // RED: We expect to find hardcoded text
      expect(
        hardcodedKeyboardHelp.test(toolbarContent),
        'Expected to find hardcoded keyboard help aria-label (Phase 1 RED state)'
      ).toBe(true);

      // After Phase 2:
      // aria-label={languageService.getString('toolbar.showKeyboardHelp')}
    });

    test('Toolbar.tsx should not have hardcoded Korean title with keyboard shortcuts', () => {
      const toolbarContent = readFileSync(TOOLBAR_PATH, 'utf-8');

      const hardcodedTitlesWithShortcuts = [
        /title=['"]이전 미디어 \(←\)['"]/,
        /title=['"]다음 미디어 \(→\)['"]/,
        /title=['"]원본 크기 \(1:1\)['"]/,
        /title=['"]현재 파일 다운로드 \(Ctrl\+D\)['"]/,
        /title=['"]갤러리 닫기 \(Esc\)['"]/,
      ];

      const foundHardcoded = hardcodedTitlesWithShortcuts.filter(pattern =>
        pattern.test(toolbarContent)
      );

      // RED: We expect to find hardcoded text
      expect(
        foundHardcoded.length,
        'Expected to find hardcoded titles with keyboard shortcuts (Phase 1 RED state)'
      ).toBe(hardcodedTitlesWithShortcuts.length);

      // After Phase 2:
      // title={languageService.getString('toolbar.previousMediaWithShortcut')}
      // title={languageService.getString('toolbar.nextMediaWithShortcut')}
      // etc.
    });
  });

  describe('LanguageService missing keys', () => {
    test('LanguageService should have toolbar.previousMedia key', () => {
      const languageServiceContent = readFileSync(LANGUAGE_SERVICE_PATH, 'utf-8');

      // RED: This key should NOT exist yet
      expect(
        /previousMedia:\s*['"]/.test(languageServiceContent),
        'Expected toolbar.previousMedia key to NOT exist (Phase 1 RED state)'
      ).toBe(false);

      // After Phase 2, LanguageStrings interface should have:
      // readonly toolbar: {
      //   ...
      //   readonly previousMedia: string;
      // }
    });

    test('LanguageService should have fit mode keys (fitOriginal, fitWidth, fitHeight, fitContainer)', () => {
      const languageServiceContent = readFileSync(LANGUAGE_SERVICE_PATH, 'utf-8');

      const fitModeKeys = ['fitOriginal', 'fitWidth', 'fitHeight', 'fitContainer'];

      const foundKeys = fitModeKeys.filter(key => {
        const pattern = new RegExp(`${key}:\\s*['"]`);
        return pattern.test(languageServiceContent);
      });

      // RED: These keys should NOT exist yet
      expect(foundKeys.length, 'Expected fit mode keys to NOT exist (Phase 1 RED state)').toBe(0);

      // After Phase 2, LanguageStrings interface should have:
      // readonly toolbar: {
      //   ...
      //   readonly fitOriginal: string;
      //   readonly fitWidth: string;
      //   readonly fitHeight: string;
      //   readonly fitContainer: string;
      // }
    });

    test('LanguageService should have keyboard shortcut title keys', () => {
      const languageServiceContent = readFileSync(LANGUAGE_SERVICE_PATH, 'utf-8');

      const shortcutKeys = [
        'previousMediaWithShortcut',
        'nextMediaWithShortcut',
        'fitOriginalWithShortcut',
        'downloadCurrentWithShortcut',
        'closeGalleryWithShortcut',
        'showKeyboardHelpWithShortcut',
      ];

      const foundKeys = shortcutKeys.filter(key => {
        const pattern = new RegExp(`${key}:\\s*['"]`);
        return pattern.test(languageServiceContent);
      });

      // RED: These keys should NOT exist yet
      expect(
        foundKeys.length,
        'Expected keyboard shortcut title keys to NOT exist (Phase 1 RED state)'
      ).toBe(0);

      // After Phase 2, LanguageStrings interface should have:
      // readonly toolbar: {
      //   ...
      //   readonly previousMediaWithShortcut: string;
      //   readonly nextMediaWithShortcut: string;
      //   // etc.
      // }
    });

    test('LanguageService should have all action button keys', () => {
      const languageServiceContent = readFileSync(LANGUAGE_SERVICE_PATH, 'utf-8');

      const actionKeys = [
        'nextMedia',
        'downloadCurrent',
        'downloadAllWithCount', // Template: "전체 {count}개 파일 ZIP 다운로드"
        'openSettings',
        'closeGallery',
        'showKeyboardHelp',
      ];

      const foundKeys = actionKeys.filter(key => {
        const pattern = new RegExp(`${key}:\\s*['"]`);
        return pattern.test(languageServiceContent);
      });

      // RED: These keys should NOT exist yet
      expect(foundKeys.length, 'Expected action button keys to NOT exist (Phase 1 RED state)').toBe(
        0
      );

      // After Phase 2, LanguageStrings interface should have all these keys
    });

    test('LanguageService should have fit mode title keys (without shortcuts)', () => {
      const languageServiceContent = readFileSync(LANGUAGE_SERVICE_PATH, 'utf-8');

      const fitModeTitleKeys = ['fitWidthTitle', 'fitHeightTitle', 'fitContainerTitle'];

      const foundKeys = fitModeTitleKeys.filter(key => {
        const pattern = new RegExp(`${key}:\\s*['"]`);
        return pattern.test(languageServiceContent);
      });

      // RED: These keys should NOT exist yet
      expect(
        foundKeys.length,
        'Expected fit mode title keys to NOT exist (Phase 1 RED state)'
      ).toBe(0);

      // After Phase 2:
      // fitWidthTitle: "가로에 맞추기" (Korean)
      // fitHeightTitle: "세로에 맞추기" (Korean)
      // fitContainerTitle: "창에 맞추기" (Korean)
    });

    test('LanguageService should have settingsTitle key', () => {
      const languageServiceContent = readFileSync(LANGUAGE_SERVICE_PATH, 'utf-8');

      // Currently there's settings.title, but we need toolbar.settingsTitle for button
      const hasToolbarSettingsTitle = /settingsTitle:\s*['"]/.test(languageServiceContent);

      // RED: This key should NOT exist yet in toolbar section
      expect(
        hasToolbarSettingsTitle,
        'Expected toolbar.settingsTitle key to NOT exist (Phase 1 RED state)'
      ).toBe(false);

      // After Phase 2:
      // toolbar: {
      //   ...
      //   settingsTitle: string; // "설정"
      // }
    });
  });

  describe('Multi-language support verification', () => {
    test('All new toolbar keys should exist in Korean (ko) section', () => {
      const languageServiceContent = readFileSync(LANGUAGE_SERVICE_PATH, 'utf-8');

      // RED: We expect the Korean section to NOT have the new keys yet
      const koSectionMatch = /ko:\s*\{[\s\S]*?toolbar:\s*\{[\s\S]*?\}/m.exec(
        languageServiceContent
      );

      expect(koSectionMatch).toBeTruthy();

      const koToolbarSection = koSectionMatch![0];

      const newKeys = [
        'previousMedia',
        'nextMedia',
        'fitOriginal',
        'fitWidth',
        'fitHeight',
        'fitContainer',
        'downloadCurrent',
        'downloadAllWithCount',
        'showKeyboardHelp',
        'openSettings',
        'closeGallery',
      ];

      const foundKeys = newKeys.filter(key => {
        const pattern = new RegExp(`${key}:\\s*['"]`);
        return pattern.test(koToolbarSection);
      });

      // RED: None of these keys should exist yet
      expect(
        foundKeys.length,
        'Expected new keys to NOT exist in Korean section (Phase 1 RED state)'
      ).toBe(0);
    });

    test('All new toolbar keys should exist in English (en) section', () => {
      const languageServiceContent = readFileSync(LANGUAGE_SERVICE_PATH, 'utf-8');

      const enSectionMatch = /en:\s*\{[\s\S]*?toolbar:\s*\{[\s\S]*?\}/m.exec(
        languageServiceContent
      );

      expect(enSectionMatch).toBeTruthy();

      const enToolbarSection = enSectionMatch![0];

      const newKeys = [
        'previousMedia',
        'nextMedia',
        'fitOriginal',
        'fitWidth',
        'fitHeight',
        'fitContainer',
        'downloadCurrent',
        'downloadAllWithCount',
        'showKeyboardHelp',
        'openSettings',
        'closeGallery',
      ];

      const foundKeys = newKeys.filter(key => {
        const pattern = new RegExp(`${key}:\\s*['"]`);
        return pattern.test(enToolbarSection);
      });

      // RED: None of these keys should exist yet
      expect(
        foundKeys.length,
        'Expected new keys to NOT exist in English section (Phase 1 RED state)'
      ).toBe(0);
    });

    test('All new toolbar keys should exist in Japanese (ja) section', () => {
      const languageServiceContent = readFileSync(LANGUAGE_SERVICE_PATH, 'utf-8');

      const jaSectionMatch = /ja:\s*\{[\s\S]*?toolbar:\s*\{[\s\S]*?\}/m.exec(
        languageServiceContent
      );

      expect(jaSectionMatch).toBeTruthy();

      const jaToolbarSection = jaSectionMatch![0];

      const newKeys = [
        'previousMedia',
        'nextMedia',
        'fitOriginal',
        'fitWidth',
        'fitHeight',
        'fitContainer',
        'downloadCurrent',
        'downloadAllWithCount',
        'showKeyboardHelp',
        'openSettings',
        'closeGallery',
      ];

      const foundKeys = newKeys.filter(key => {
        const pattern = new RegExp(`${key}:\\s*['"]`);
        return pattern.test(jaToolbarSection);
      });

      // RED: None of these keys should exist yet
      expect(
        foundKeys.length,
        'Expected new keys to NOT exist in Japanese section (Phase 1 RED state)'
      ).toBe(0);
    });
  });
});
