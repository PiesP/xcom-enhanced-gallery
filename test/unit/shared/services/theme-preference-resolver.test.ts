import { describe, it, expect } from 'vitest';
import { resolveStoredThemePreference } from '@shared/services/theme-service';

describe('resolveStoredThemePreference', () => {
  it('prefers explicit settings theme when available', () => {
    const result = resolveStoredThemePreference('light', 'dark');
    expect(result).toBe('light');
  });

  it('falls back to explicit legacy theme when settings remain auto', () => {
    const result = resolveStoredThemePreference('auto', 'dark');
    expect(result).toBe('dark');
  });

  it('returns auto when both sources only contain auto', () => {
    const result = resolveStoredThemePreference('auto', 'auto');
    expect(result).toBe('auto');
  });

  it('returns null when neither storage contains a theme', () => {
    const result = resolveStoredThemePreference(null, null);
    expect(result).toBeNull();
  });

  it('prefers legacy explicit theme when settings are empty', () => {
    const result = resolveStoredThemePreference(null, 'light');
    expect(result).toBe('light');
  });

  it('falls back to settings auto when legacy is missing', () => {
    const result = resolveStoredThemePreference('auto', null);
    expect(result).toBe('auto');
  });
});
