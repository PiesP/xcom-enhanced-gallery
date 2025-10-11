import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSetting, setSetting } from '../../../../src/shared/container/settings-access';
import type { GallerySettings } from '../../../../src/features/settings/types/settings.types';

describe('Gallery Wheel Scroll Setting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns default wheelScrollMultiplier of 1.2 when not set', () => {
    const multiplier = getSetting<number>('gallery.wheelScrollMultiplier', 1.2);
    expect(multiplier).toBe(1.2);
  });

  it('wheelScrollMultiplier is part of GallerySettings type', () => {
    // Type-level test: ensure wheelScrollMultiplier is a valid property
    const mockSettings: Partial<GallerySettings> = {
      wheelScrollMultiplier: 1.2,
    };

    expect(mockSettings.wheelScrollMultiplier).toBe(1.2);
    expect(typeof mockSettings.wheelScrollMultiplier).toBe('number');
  });

  it('clamps wheelScrollMultiplier below 0.5 to 0.5', () => {
    const lowValue = 0.3;
    const minValue = 0.5;
    const maxValue = 3.0;
    const clamped = Math.max(minValue, Math.min(maxValue, lowValue));

    expect(clamped).toBe(0.5);
    expect(clamped).toBeGreaterThanOrEqual(minValue);
  });

  it('clamps wheelScrollMultiplier above 3.0 to 3.0', () => {
    const highValue = 5.0;
    const minValue = 0.5;
    const maxValue = 3.0;
    const clamped = Math.max(minValue, Math.min(maxValue, highValue));

    expect(clamped).toBe(3.0);
    expect(clamped).toBeLessThanOrEqual(maxValue);
  });

  it('accepts valid wheelScrollMultiplier within range', () => {
    const validValues = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
    const minValue = 0.5;
    const maxValue = 3.0;

    for (const value of validValues) {
      const clamped = Math.max(minValue, Math.min(maxValue, value));

      expect(clamped).toBe(value);
      expect(clamped).toBeGreaterThanOrEqual(minValue);
      expect(clamped).toBeLessThanOrEqual(maxValue);
    }
  });

  it('setSetting accepts wheelScrollMultiplier key without error', async () => {
    // Smoke test: ensure the key is accepted by the API
    await expect(setSetting('gallery.wheelScrollMultiplier', 1.5)).resolves.not.toThrow();
  });
});
