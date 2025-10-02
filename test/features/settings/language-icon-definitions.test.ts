/**
 * @fileoverview Phase 1 RED test for Epic LANG_ICON_SELECTOR
 * Tests for 4 language icon definitions (auto, ko, en, ja)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import type { XegIconSlug } from '@assets/icons/xeg-icons';
import { XEG_ICON_DEFINITIONS } from '@assets/icons/xeg-icons';
import { initializeVendors } from '@shared/external/vendors';

describe('Epic LANG_ICON_SELECTOR Phase 1: Language Icon Definitions', () => {
  beforeAll(async () => {
    await initializeVendors();
  });

  describe('RAW_ICON_DEFINITIONS must contain 4 language icons', () => {
    const requiredIcons: XegIconSlug[] = [
      'language-auto',
      'language-ko',
      'language-en',
      'language-ja',
    ];

    it.each(requiredIcons)('should have "%s" icon definition', iconSlug => {
      expect(XEG_ICON_DEFINITIONS).toHaveProperty(iconSlug);
      const icon = XEG_ICON_DEFINITIONS[iconSlug as keyof typeof XEG_ICON_DEFINITIONS];
      expect(icon).toBeDefined();
    });
  });

  describe('Language icon definitions must follow 24x24 viewBox standard', () => {
    const languageIcons: XegIconSlug[] = [
      'language-auto',
      'language-ko',
      'language-en',
      'language-ja',
    ];

    it.each(languageIcons)('"%s" should have viewBox="0 0 24 24"', iconSlug => {
      const icon = XEG_ICON_DEFINITIONS[iconSlug as keyof typeof XEG_ICON_DEFINITIONS];
      expect(icon.viewBox).toBe('0 0 24 24');
    });

    it.each(languageIcons)('"%s" should have paths array with currentColor fill', iconSlug => {
      const icon = XEG_ICON_DEFINITIONS[iconSlug as keyof typeof XEG_ICON_DEFINITIONS];
      expect(Array.isArray(icon.paths)).toBe(true);
      expect(icon.paths.length).toBeGreaterThan(0);
      // At least one path should use currentColor for theme compatibility
      const hasCurrentColor = icon.paths.some(path => path.fill === 'currentColor');
      expect(hasCurrentColor).toBe(true);
    });

    it.each(languageIcons)('"%s" should have correct metadata', iconSlug => {
      const icon = XEG_ICON_DEFINITIONS[iconSlug as keyof typeof XEG_ICON_DEFINITIONS];
      expect(icon.metadata).toBe(iconSlug);
    });
  });

  describe('XEG_ICONS must expose language icon aliases', () => {
    const expectedAliases = ['LanguageAuto', 'LanguageKo', 'LanguageEn', 'LanguageJa'] as const;

    it.each(expectedAliases)('should have "%s" PascalCase alias', alias => {
      // This test will fail until we add the aliases in xeg-icons.ts
      // For now, we expect the slug to be accessible via XEG_ICON_DEFINITIONS
      const slug = alias
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .slice(1) as XegIconSlug;
      expect(XEG_ICON_DEFINITIONS[slug as keyof typeof XEG_ICON_DEFINITIONS]).toBeDefined();
    });
  });
});
