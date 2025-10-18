/**
 * @fileoverview Phase 117: Language Service Storage Integration Tests (RED)
 * @description TDD for language settings persistence
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LanguageService } from '@shared/services/language-service';
import { InMemoryStorageAdapter } from '../../../../test/__mocks__/in-memory-storage-adapter';
import type { SupportedLanguage } from '@shared/services/language-service';

describe('Phase 117: LanguageService Storage Integration (RED)', () => {
  let languageService: LanguageService;
  let storage: InMemoryStorageAdapter;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    languageService = new LanguageService(storage);
  });

  afterEach(() => {
    storage.clear();
  });

  describe('Language persistence', () => {
    it('should save language setting to storage when setLanguage is called', async () => {
      await languageService.setLanguage('ko');

      const saved = await storage.getItem('xeg-language');
      expect(saved).toBe('ko');
    });

    it('should load saved language setting on initialize', async () => {
      await storage.setItem('xeg-language', 'ja');

      await languageService.initialize();

      expect(languageService.getCurrentLanguage()).toBe('ja');
    });

    it('should fallback to auto if no saved language exists', async () => {
      await languageService.initialize();

      expect(languageService.getCurrentLanguage()).toBe('auto');
    });

    it('should ignore invalid saved language and fallback to auto', async () => {
      await storage.setItem('xeg-language', 'invalid-language');

      await languageService.initialize();

      expect(languageService.getCurrentLanguage()).toBe('auto');
    });

    it('should update storage when language changes', async () => {
      await languageService.setLanguage('en');
      expect(await storage.getItem('xeg-language')).toBe('en');

      await languageService.setLanguage('ko');
      expect(await storage.getItem('xeg-language')).toBe('ko');
    });
  });

  describe('Listener notification', () => {
    it('should notify listeners after setLanguage', async () => {
      const listener = vi.fn();
      languageService.onLanguageChange(listener);

      await languageService.setLanguage('ja');

      expect(listener).toHaveBeenCalledWith('ja');
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should not notify listeners during initialize', async () => {
      await storage.setItem('xeg-language', 'ko');
      const listener = vi.fn();

      languageService.onLanguageChange(listener);
      await languageService.initialize();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should validate supported languages', async () => {
      const validLanguages: SupportedLanguage[] = ['auto', 'ko', 'en', 'ja'];

      for (const lang of validLanguages) {
        await languageService.setLanguage(lang);
        expect(languageService.getCurrentLanguage()).toBe(lang);
      }
    });

    it('should fallback to en for invalid language', async () => {
      // @ts-expect-error Testing invalid input
      await languageService.setLanguage('invalid');

      expect(languageService.getCurrentLanguage()).toBe('en');
    });
  });

  describe('Integration with existing functionality', () => {
    it('should preserve getString functionality after persistence', async () => {
      await languageService.setLanguage('ko');

      const greeting = languageService.getString('settings.theme');
      expect(greeting).toBe('테마');
    });

    it('should preserve auto-detection when language is auto', async () => {
      await languageService.setLanguage('auto');

      // The language should be detected from browser
      const language = languageService.getCurrentLanguage();
      expect(language).toBe('auto');
    });
  });
});
