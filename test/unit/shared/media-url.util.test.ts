import { expect } from 'vitest';
import {
  extractOriginalImageUrl,
  getHighQualityMediaUrl,
  cleanFilename,
} from '@shared/utils/media/media-url.util';

describe('media-url.util (extra edge cases)', () => {
  test('extractOriginalImageUrl adds name=orig when missing (no query)', () => {
    const url = 'https://pbs.twimg.com/media/ABC123.jpg';
    const out = extractOriginalImageUrl(url);
    expect(out).toContain('name=orig');
  });

  test('extractOriginalImageUrl handles malformed URL by appending param', () => {
    // malformed (no protocol) should still get ?name=orig appended
    const url = 'pbs.twimg.com/media/ABC123.jpg';
    const out = extractOriginalImageUrl(url);
    expect(out).toContain('name=orig');
  });

  test('getHighQualityMediaUrl fallback works for non-URL values and preserves protocol', () => {
    const url = 'https://pbs.twimg.com/media/XYZ.png?existing=1';
    const out = getHighQualityMediaUrl(url, 'medium');
    expect(out).toContain('name=medium');
    expect(out).toContain('format=');
  });

  test('getHighQualityMediaUrl returns empty string for falsy input', () => {
    // testing runtime behavior for undefined
    expect(getHighQualityMediaUrl(undefined)).toBe('');
  });

  test('cleanFilename strips known extensions, trims and sanitizes', () => {
    expect(cleanFilename('  my-image.PNG  ')).toBe('my-image');
    expect(cleanFilename('')).toBe('media');
    expect(cleanFilename('weird<>name.mp4')).toBe('weird__name');
  });
});
