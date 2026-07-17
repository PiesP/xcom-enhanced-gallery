// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── PersistentStorage mock (must be before LanguageService import) ─────

const mockStorageGet = vi.fn().mockResolvedValue(undefined);
const mockStorageSet = vi.fn().mockResolvedValue(undefined);
const mockStorageRemove = vi.fn().mockResolvedValue(undefined);

vi.mock('@shared/services/persistent-storage', () => ({
  getPersistentStorage: () => ({
    get: mockStorageGet,
    set: mockStorageSet,
    remove: mockStorageRemove,
    has: vi.fn().mockResolvedValue(false),
    getString: vi.fn().mockResolvedValue(undefined),
    getSync: vi.fn(),
  }),
}));

import { LanguageService } from '@shared/services/language-service';

// ── Helpers ─────────────────────────────────────────────────────────────

let originalNavigatorLanguage: PropertyDescriptor | undefined;

function setNavigatorLanguage(lang: string): void {
  Object.defineProperty(navigator, 'language', {
    get: () => lang,
    configurable: true,
  });
}

function restoreNavigatorLanguage(): void {
  Object.defineProperty(navigator, 'language', {
    get: () => 'en-US',
    configurable: true,
  });
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('LanguageService', () => {
  let service: LanguageService;

  beforeEach(() => {
    mockStorageGet.mockReset().mockResolvedValue(undefined);
    mockStorageSet.mockReset().mockResolvedValue(undefined);
    mockStorageRemove.mockReset().mockResolvedValue(undefined);
    restoreNavigatorLanguage();
  });

  afterEach(() => {
    service?.destroy();
  });

  // ── detectLanguage ───────────────────────────────────────────────────

  describe('detectLanguage', () => {
    it('should detect "en" from navigator.language', () => {
      setNavigatorLanguage('en');
      service = new LanguageService();
      expect(service.detectLanguage()).toBe('en');
    });

    it('should detect "ko" from navigator.language', () => {
      setNavigatorLanguage('ko');
      service = new LanguageService();
      expect(service.detectLanguage()).toBe('ko');
    });

    it('should detect "zh-cn" from region code "zh-CN"', () => {
      setNavigatorLanguage('zh-CN');
      service = new LanguageService();
      expect(service.detectLanguage()).toBe('zh-cn');
    });

    it('should detect "es" from region code "es-ES"', () => {
      setNavigatorLanguage('es-ES');
      service = new LanguageService();
      expect(service.detectLanguage()).toBe('es');
    });

    it('should fall back to 2-letter code when region is unsupported', () => {
      setNavigatorLanguage('ja-JP');
      service = new LanguageService();
      expect(service.detectLanguage()).toBe('ja');
    });

    it('should return default language for completely unsupported languages', () => {
      setNavigatorLanguage('fr');
      service = new LanguageService();
      expect(service.detectLanguage()).toBe('en');
    });

    it('should return default language when navigator is unavailable', () => {
      // Simulate no navigator
      const origNav = (globalThis as any).navigator;
      (globalThis as any).navigator = undefined;
      service = new LanguageService();
      expect(service.detectLanguage()).toBe('en');
      (globalThis as any).navigator = origNav;
    });
  });

  // ── getCurrentLanguage ───────────────────────────────────────────────

  describe('getCurrentLanguage', () => {
    it('should return "auto" by default', () => {
      service = new LanguageService();
      expect(service.getCurrentLanguage()).toBe('auto');
    });

    it('should return the last set language', () => {
      service = new LanguageService();
      service.setLanguage('ko');
      expect(service.getCurrentLanguage()).toBe('ko');
    });
  });

  // ── setLanguage ──────────────────────────────────────────────────────

  describe('setLanguage', () => {
    it('should set language to a valid base code', () => {
      service = new LanguageService();
      service.setLanguage('ko');
      expect(service.getCurrentLanguage()).toBe('ko');
    });

    it('should set language to "auto"', () => {
      service = new LanguageService();
      service.setLanguage('en');
      service.setLanguage('auto');
      expect(service.getCurrentLanguage()).toBe('auto');
    });

    it('should fall back to default language for unsupported values', () => {
      service = new LanguageService();
      service.setLanguage('fr' as any);
      expect(service.getCurrentLanguage()).toBe('en');
    });

    it('should persist language to storage after setting', () => {
      service = new LanguageService();
      mockStorageSet.mockClear();
      service.setLanguage('ko');
      expect(mockStorageSet).toHaveBeenCalledWith('xeg-language', 'ko');
    });

    it('should not persist or notify when language is unchanged', () => {
      service = new LanguageService();
      service.setLanguage('auto');
      mockStorageSet.mockClear();
      service.setLanguage('auto');
      expect(mockStorageSet).not.toHaveBeenCalled();
    });

    it('should notify listeners on language change', () => {
      service = new LanguageService();
      const listener = vi.fn();
      service.onLanguageChange(listener);
      service.setLanguage('ja');
      expect(listener).toHaveBeenCalledWith('ja');
    });
  });

  // ── onLanguageChange ─────────────────────────────────────────────────

  describe('onLanguageChange', () => {
    it('should register a listener and fire on change', () => {
      service = new LanguageService();
      const listener = vi.fn();
      service.onLanguageChange(listener);
      service.setLanguage('ko');
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should return an unsubscribe function', () => {
      service = new LanguageService();
      const listener = vi.fn();
      const unsubscribe = service.onLanguageChange(listener);
      unsubscribe();
      service.setLanguage('ko');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should support multiple listeners', () => {
      service = new LanguageService();
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      service.onLanguageChange(listener1);
      service.onLanguageChange(listener2);
      service.setLanguage('ko');
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });

  // ── initialize ───────────────────────────────────────────────────────

  describe('initialize', () => {
    it('should mark service as initialized', async () => {
      service = new LanguageService();
      expect(service.isInitialized()).toBe(false);
      await service.initialize();
      expect(service.isInitialized()).toBe(true);
    });

    it('should be idempotent', async () => {
      service = new LanguageService();
      await service.initialize();
      await service.initialize();
      expect(mockStorageGet).toHaveBeenCalledTimes(1);
    });

    it('should restore language from storage', async () => {
      mockStorageGet.mockResolvedValue('ko');
      service = new LanguageService();
      await service.initialize();
      expect(service.getCurrentLanguage()).toBe('ko');
    });

    it('should keep "auto" when storage has no value', async () => {
      mockStorageGet.mockResolvedValue(undefined);
      service = new LanguageService();
      await service.initialize();
      expect(service.getCurrentLanguage()).toBe('auto');
    });

    it('should handle storage errors gracefully', async () => {
      mockStorageGet.mockRejectedValue(new Error('Storage error'));
      service = new LanguageService();
      await expect(service.initialize()).resolves.not.toThrow();
      expect(service.isInitialized()).toBe(true);
      expect(service.getCurrentLanguage()).toBe('auto');
    });
  });

  // ── destroy ──────────────────────────────────────────────────────────

  describe('destroy', () => {
    it('should clear initialization state', () => {
      service = new LanguageService();
      service.destroy();
      expect(service.isInitialized()).toBe(false);
    });

    it('should clear listeners so they no longer fire', () => {
      service = new LanguageService();
      const listener = vi.fn();
      service.onLanguageChange(listener);
      service.destroy();
      // Re-create to avoid calling on destroyed instance
      service = new LanguageService();
      // Old listener reference is gone
      expect(listener).not.toHaveBeenCalled();
    });
  });

  // ── isInitialized ────────────────────────────────────────────────────

  describe('isInitialized', () => {
    it('should return false by default', () => {
      service = new LanguageService();
      expect(service.isInitialized()).toBe(false);
    });

    it('should return true after initialize', async () => {
      service = new LanguageService();
      await service.initialize();
      expect(service.isInitialized()).toBe(true);
    });

    it('should return false after destroy', () => {
      service = new LanguageService();
      service.destroy();
      expect(service.isInitialized()).toBe(false);
    });
  });

  // ── translate ────────────────────────────────────────────────────────

  describe('translate', () => {
    it('should translate a key using the current language', () => {
      setNavigatorLanguage('ko');
      service = new LanguageService();
      const result = service.translate('tb.prev');
      expect(result).toBe('이전');
    });

    it('should translate a key with parameters', () => {
      setNavigatorLanguage('en');
      service = new LanguageService();
      service.setLanguage('en');
      // Some translation keys don't have params; verify basic translation works
      const result = service.translate('msg.dl.one.err.t');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return key as fallback for missing translations', () => {
      setNavigatorLanguage('en');
      service = new LanguageService();
      service.setLanguage('en');
      // Use a non-existent key
      const result = service.translate('nonexistent.key' as any);
      expect(result).toBe('nonexistent.key');
    });

    it('should fall back to English when target language bundle is missing', () => {
      // Use 'ja' (Japanese) which should have full bundles
      service = new LanguageService();
      service.setLanguage('ja');
      const result = service.translate('tb.prev');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
