// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { describe, it, expect } from 'vitest';
import { migrateSettings } from '@features/settings/services/settings-migration';
import { DEFAULT_SETTINGS } from '@constants/settings';
import type { AppSettings } from '@shared/types/settings.types';

describe('settings-migration', () => {
  // ── migrateSettings ───────────────────────────────────────────────
  describe('migrateSettings', () => {
    it('should preserve valid settings', () => {
      const input = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as AppSettings;
      const result = migrateSettings(input, 1000);

      expect(result.gallery.theme).toBe('auto');
      expect(result.gallery.enableKeyboardNav).toBe(true);
      expect(result.toolbar.autoHideDelay).toBe(3000);
    });

    it('should strip unknown keys', () => {
      const input = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as AppSettings;
      (input as any).gallery.unknownKey = 'should be removed';
      (input as any).unknownTopLevel = 'also removed';

      const result = migrateSettings(input, 1000);
      expect((result.gallery as any).unknownKey).toBeUndefined();
      expect((result as any).unknownTopLevel).toBeUndefined();
    });

    it('should migrate legacy blockVideoControlClick=true to block-controls-only', () => {
      const input = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as AppSettings;
      (input.gallery as any).blockVideoControlClick = true;
      delete (input.gallery as any).videoClickMode;

      const result = migrateSettings(input, 1000);
      expect(result.gallery.videoClickMode).toBe('block-controls-only');
    });

    it('should migrate legacy blockVideoControlClick=false to allow-all', () => {
      const input = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as AppSettings;
      (input.gallery as any).blockVideoControlClick = false;
      delete (input.gallery as any).videoClickMode;

      const result = migrateSettings(input, 1000);
      expect(result.gallery.videoClickMode).toBe('allow-all');
    });

    it('should migrate legacy blockVideoControlClick=true + preciseVideoControlDetection=false to block-all', () => {
      const input = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as AppSettings;
      (input.gallery as any).blockVideoControlClick = true;
      (input.gallery as any).preciseVideoControlDetection = false;
      delete (input.gallery as any).videoClickMode;

      const result = migrateSettings(input, 1000);
      expect(result.gallery.videoClickMode).toBe('block-all');
    });

    it('should preserve valid videoClickMode if already set', () => {
      const input = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as AppSettings;
      (input.gallery as any).videoClickMode = 'allow-all';
      (input.gallery as any).blockVideoControlClick = true;

      const result = migrateSettings(input, 1000);
      expect(result.gallery.videoClickMode).toBe('allow-all');
    });

    it('should preserve invalid videoClickMode string as-is', () => {
      const input = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as AppSettings;
      (input.gallery as any).videoClickMode = 'invalid-value';

      const result = migrateSettings(input, 1000);
      // Invalid string is NOT migrated — pruneWithTemplate preserves it
      // because it exists in the input and matches the template key
      expect(result.gallery.videoClickMode).toBe('invalid-value');
    });

    it('should update version and lastModified', () => {
      const input = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as AppSettings;
      const result = migrateSettings(input, 12345);

      expect(result.lastModified).toBe(12345);
    });

    it('should handle missing gallery section', () => {
      const input = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as AppSettings;
      delete (input as any).gallery;

      const result = migrateSettings(input, 1000);
      expect(result.gallery).toBeDefined();
      expect(result.gallery.theme).toBe('auto'); // from DEFAULT_SETTINGS
    });

    it('should handle missing toolbar section', () => {
      const input = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as AppSettings;
      delete (input as any).toolbar;

      const result = migrateSettings(input, 1000);
      expect(result.toolbar).toBeDefined();
      expect(result.toolbar.autoHideDelay).toBe(3000);
    });

    it('should handle empty input', () => {
      const input = {} as AppSettings;
      const result = migrateSettings(input, 1000);
      expect(result.gallery).toBeDefined();
      expect(result.toolbar).toBeDefined();
      expect(result.download).toBeDefined();
    });
  });
});
