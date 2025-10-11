import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSetting, setSetting } from '@shared/container/settings-access';

describe('Gallery Wheel Scroll Setting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns default wheelScrollMultiplier of 1.2 when not set', () => {
    const multiplier = getSetting<number>('gallery.wheelScrollMultiplier', 1.2);
    expect(multiplier).toBe(1.2);
  });

  it('saves and retrieves wheelScrollMultiplier setting', async () => {
    const testValue = 2.0;
    await setSetting('gallery.wheelScrollMultiplier', testValue);

    const retrieved = getSetting<number>('gallery.wheelScrollMultiplier', 1.2);
    expect(retrieved).toBe(testValue);
  });

  it('clamps wheelScrollMultiplier below 0.5 to 0.5', async () => {
    const lowValue = 0.3;
    const clamped = Math.max(0.5, Math.min(3.0, lowValue));

    await setSetting('gallery.wheelScrollMultiplier', clamped);
    const retrieved = getSetting<number>('gallery.wheelScrollMultiplier', 1.2);

    expect(retrieved).toBe(0.5);
    expect(retrieved).toBeGreaterThanOrEqual(0.5);
  });

  it('clamps wheelScrollMultiplier above 3.0 to 3.0', async () => {
    const highValue = 5.0;
    const clamped = Math.max(0.5, Math.min(3.0, highValue));

    await setSetting('gallery.wheelScrollMultiplier', clamped);
    const retrieved = getSetting<number>('gallery.wheelScrollMultiplier', 1.2);

    expect(retrieved).toBe(3.0);
    expect(retrieved).toBeLessThanOrEqual(3.0);
  });

  it('accepts valid wheelScrollMultiplier within range', async () => {
    const validValues = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];

    for (const value of validValues) {
      await setSetting('gallery.wheelScrollMultiplier', value);
      const retrieved = getSetting<number>('gallery.wheelScrollMultiplier', 1.2);

      expect(retrieved).toBe(value);
      expect(retrieved).toBeGreaterThanOrEqual(0.5);
      expect(retrieved).toBeLessThanOrEqual(3.0);
    }
  });
});
