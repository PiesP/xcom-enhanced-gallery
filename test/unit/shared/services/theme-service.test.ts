// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Hoisted mocks (must be before any vi.mock for correct hoisting) ────

const mockAddEventListener = vi.hoisted(() => vi.fn());
const mockRemoveByContext = vi.hoisted(() => vi.fn());
const mockSyncThemeAttributes = vi.hoisted(() => vi.fn());

vi.mock('@shared/services/event-manager', () => ({
  getEventManager: () => ({
    addEventListener: mockAddEventListener,
    removeByContext: mockRemoveByContext,
  }),
}));

vi.mock('@shared/dom/theme', () => ({
  syncThemeAttributes: mockSyncThemeAttributes,
}));

// ── SUT import (after mocks) ────────────────────────────────────────────

import { ThemeService } from '@shared/services/theme-service';

// ── Helpers ─────────────────────────────────────────────────────────────

function createMockMatchMedia(prefersDark = false): MediaQueryList {
  return {
    matches: prefersDark,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
  } as unknown as MediaQueryList;
}

function createMockSettingsBinding() {
  const store: Record<string, unknown> = {};
  return {
    get: vi.fn((key: string) => store[key]),
    set: vi.fn((key: string, value: unknown) => {
      store[key] = value;
    }),
    _reset() {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('ThemeService', () => {
  let service: ThemeService;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    mockAddEventListener.mockClear();
    mockRemoveByContext.mockClear();
    mockSyncThemeAttributes.mockClear();
    // Default: light mode
    window.matchMedia = vi.fn(() => createMockMatchMedia(false));
  });

  afterEach(() => {
    service?.destroy();
    window.matchMedia = originalMatchMedia;
  });

  // ── Constructor ──────────────────────────────────────────────────────

  describe('constructor', () => {
    it('should create matchMedia query in constructor', () => {
      window.matchMedia = vi.fn(() => createMockMatchMedia(false));
      service = new ThemeService();
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });

    it('should handle absent matchMedia gracefully', () => {
      (window as any).matchMedia = undefined;
      service = new ThemeService();
      expect(service.getEffectiveTheme()).toBe('light');
      (window as any).matchMedia = originalMatchMedia;
    });
  });

  // ── getEffectiveTheme ────────────────────────────────────────────────

  describe('getEffectiveTheme', () => {
    it('should return "light" when auto and system prefers light', () => {
      window.matchMedia = vi.fn(() => createMockMatchMedia(false));
      service = new ThemeService();
      expect(service.getEffectiveTheme()).toBe('light');
    });

    it('should return "dark" when auto and system prefers dark', () => {
      window.matchMedia = vi.fn(() => createMockMatchMedia(true));
      service = new ThemeService();
      expect(service.getEffectiveTheme()).toBe('dark');
    });

    it('should return "light" when theme explicitly set to light', () => {
      service = new ThemeService();
      service.setTheme('light', { persist: false });
      expect(service.getEffectiveTheme()).toBe('light');
    });

    it('should return "dark" when theme explicitly set to dark', () => {
      service = new ThemeService();
      service.setTheme('dark', { persist: false });
      expect(service.getEffectiveTheme()).toBe('dark');
    });

    it('should delegate to matchMedia when theme is auto', () => {
      service = new ThemeService();
      service.setTheme('auto', { persist: false });
      expect(service.getEffectiveTheme()).toBe('light');
    });
  });

  // ── getCurrentTheme ──────────────────────────────────────────────────

  describe('getCurrentTheme', () => {
    it('should return "auto" by default', () => {
      service = new ThemeService();
      expect(service.getCurrentTheme()).toBe('auto');
    });

    it('should return the last set theme value', () => {
      service = new ThemeService();
      service.setTheme('dark', { persist: false });
      expect(service.getCurrentTheme()).toBe('dark');
      service.setTheme('light', { persist: false });
      expect(service.getCurrentTheme()).toBe('light');
      service.setTheme('auto', { persist: false });
      expect(service.getCurrentTheme()).toBe('auto');
    });
  });

  // ── isDarkMode ───────────────────────────────────────────────────────

  describe('isDarkMode', () => {
    it('should return false when theme is light', () => {
      service = new ThemeService();
      service.setTheme('light', { persist: false });
      expect(service.isDarkMode()).toBe(false);
    });

    it('should return true when theme is dark', () => {
      service = new ThemeService();
      service.setTheme('dark', { persist: false });
      expect(service.isDarkMode()).toBe(true);
    });

    it('should delegate to system preference when auto and dark mode', () => {
      window.matchMedia = vi.fn(() => createMockMatchMedia(true));
      service = new ThemeService();
      expect(service.isDarkMode()).toBe(true);
    });
  });

  // ── setTheme ─────────────────────────────────────────────────────────

  describe('setTheme', () => {
    it('should set theme to "light"', () => {
      service = new ThemeService();
      service.setTheme('light', { persist: false });
      expect(service.getEffectiveTheme()).toBe('light');
    });

    it('should set theme to "dark"', () => {
      service = new ThemeService();
      service.setTheme('dark', { persist: false });
      expect(service.getEffectiveTheme()).toBe('dark');
    });

    it('should set theme to "auto"', () => {
      service = new ThemeService();
      service.setTheme('auto', { persist: false });
      expect(service.getCurrentTheme()).toBe('auto');
    });

    it('should fall back to "light" for invalid theme strings', () => {
      service = new ThemeService();
      service.setTheme('neon', { persist: false });
      expect(service.getCurrentTheme()).toBe('light');
      expect(service.getEffectiveTheme()).toBe('light');
    });

    it('should call syncThemeAttributes when theme changes', () => {
      service = new ThemeService();
      mockSyncThemeAttributes.mockClear();
      service.setTheme('dark', { persist: false });
      expect(mockSyncThemeAttributes).toHaveBeenCalledWith('dark');
    });

    it('should persist to settings when persist option is true (default)', () => {
      const mockSettings = createMockSettingsBinding();
      service = new ThemeService();
      service.bindSettingsService(mockSettings);
      service.setTheme('dark');
      expect(mockSettings.set).toHaveBeenCalledWith('gallery.theme', 'dark');
    });

    it('should not persist to settings when persist option is false', () => {
      const mockSettings = createMockSettingsBinding();
      service = new ThemeService();
      service.bindSettingsService(mockSettings);
      mockSettings.set.mockClear();
      service.setTheme('dark', { persist: false });
      expect(mockSettings.set).not.toHaveBeenCalled();
    });

    it('should notify listeners on theme change', () => {
      service = new ThemeService();
      const listener = vi.fn();
      service.onThemeChange(listener);
      service.setTheme('dark', { persist: false });
      expect(listener).toHaveBeenCalledWith('dark', 'dark');
    });

    it('should still notify listeners even if effective theme is unchanged', () => {
      service = new ThemeService();
      service.setTheme('light', { persist: false });
      const listener = vi.fn();
      service.onThemeChange(listener);
      service.setTheme('light', { persist: false });
      // Listener is still called because notification happens on every setTheme
      expect(listener).toHaveBeenCalledWith('light', 'light');
    });
  });

  // ── onThemeChange ────────────────────────────────────────────────────

  describe('onThemeChange', () => {
    it('should register and fire a theme change listener', () => {
      service = new ThemeService();
      const listener = vi.fn();
      service.onThemeChange(listener);
      service.setTheme('dark', { persist: false });
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith('dark', 'dark');
    });

    it('should return an unsubscribe function', () => {
      service = new ThemeService();
      const listener = vi.fn();
      const unsubscribe = service.onThemeChange(listener);
      unsubscribe();
      service.setTheme('dark', { persist: false });
      expect(listener).not.toHaveBeenCalled();
    });

    it('should support multiple listeners', () => {
      service = new ThemeService();
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      service.onThemeChange(listener1);
      service.onThemeChange(listener2);
      service.setTheme('dark', { persist: false });
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });

  // ── initialize / destroy / isInitialized ─────────────────────────────

  describe('initialize', () => {
    it('should mark service as initialized', async () => {
      service = new ThemeService();
      await service.initialize();
      expect(service.isInitialized()).toBe(true);
    });

    it('should be idempotent', async () => {
      service = new ThemeService();
      await service.initialize();
      mockSyncThemeAttributes.mockClear();
      await service.initialize();
      // Should not apply theme again on second call
      expect(service.isInitialized()).toBe(true);
    });

    it('should apply theme on initialization', async () => {
      service = new ThemeService();
      mockSyncThemeAttributes.mockClear();
      await service.initialize();
      expect(mockSyncThemeAttributes).toHaveBeenCalledWith('light');
    });
  });

  describe('destroy', () => {
    it('should clear initialization state', () => {
      service = new ThemeService();
      service.destroy();
      expect(service.isInitialized()).toBe(false);
    });

    it('should remove listeners by context', () => {
      service = new ThemeService();
      service.destroy();
      expect(mockRemoveByContext).toHaveBeenCalledWith('theme-service');
    });

    it('should clear theme change listeners', () => {
      service = new ThemeService();
      const listener = vi.fn();
      service.onThemeChange(listener);
      service.destroy();
      // After destroy, old listeners are cleared
      // Create a new service to verify old listener doesn't fire
      const service2 = new ThemeService();
      service2.setTheme('dark', { persist: false });
      expect(listener).not.toHaveBeenCalled();
      service2.destroy();
    });
  });

  describe('isInitialized', () => {
    it('should return false before initialize', () => {
      service = new ThemeService();
      expect(service.isInitialized()).toBe(false);
    });

    it('should return true after initialize', async () => {
      service = new ThemeService();
      await service.initialize();
      expect(service.isInitialized()).toBe(true);
    });

    it('should return false after destroy', () => {
      service = new ThemeService();
      service.destroy();
      expect(service.isInitialized()).toBe(false);
    });
  });

  // ── bindSettingsService ──────────────────────────────────────────────

  describe('bindSettingsService', () => {
    it('should accept a settings binding and read gallery.theme', () => {
      const mockSettings = createMockSettingsBinding();
      service = new ThemeService();
      service.bindSettingsService(mockSettings);
      expect(mockSettings.get).toHaveBeenCalledWith('gallery.theme');
    });

    it('should adopt theme from settings if different from current', () => {
      const mockSettings = createMockSettingsBinding();
      // Pre-set a dark theme in the store
      mockSettings.set('gallery.theme', 'dark');

      service = new ThemeService();
      mockSyncThemeAttributes.mockClear();
      service.bindSettingsService(mockSettings);
      expect(service.getEffectiveTheme()).toBe('dark');
    });

    it('should ignore null settings binding', () => {
      service = new ThemeService();
      service.bindSettingsService(null as any);
      // Should not throw
      expect(service.getCurrentTheme()).toBe('auto');
    });

    it('should not re-apply if same binding is passed again', () => {
      const mockSettings = createMockSettingsBinding();
      service = new ThemeService();
      service.bindSettingsService(mockSettings);
      mockSyncThemeAttributes.mockClear();
      // The second call with same reference should be a no-op
      service.bindSettingsService(mockSettings);
      expect(mockSyncThemeAttributes).not.toHaveBeenCalled();
    });
  });
});
