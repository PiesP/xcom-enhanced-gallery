import { describe, it, expect } from 'vitest';
import { MediaValidationUtils } from '@shared/utils/media/MediaValidationUtils';

describe('MediaValidationUtils (pure helpers)', () => {
  it('validates common media URLs correctly', () => {
    expect(MediaValidationUtils.isValidMediaUrl('')).toBe(false);

    // data URL - default disallowed
    expect(MediaValidationUtils.isValidMediaUrl('data:image/png;base64,abcd')).toBe(false);
    expect(
      MediaValidationUtils.isValidMediaUrl('data:image/png;base64,abcd', { allowDataUrls: true })
    ).toBe(true);

    // HTTP without allowHttp should be rejected
    expect(
      MediaValidationUtils.isValidMediaUrl('http://pbs.twimg.com/media/1.jpg', { allowHttp: false })
    ).toBe(false);

    // Allowed domain + extension
    expect(MediaValidationUtils.isValidMediaUrl('https://pbs.twimg.com/media/XYZ.jpg')).toBe(true);

    // profile images should be rejected by default
    expect(
      MediaValidationUtils.isValidMediaUrl('https://pbs.twimg.com/profile_images/abc.jpg')
    ).toBe(false);
  });

  it('detects media type from url', () => {
    expect(MediaValidationUtils.detectMediaType('https://example.com/file.mp4')).toBe('video');
    expect(MediaValidationUtils.detectMediaType('https://example.com/file.jpg')).toBe('image');
    expect(MediaValidationUtils.detectMediaType('https://example.com/video/123')).toBe('video');
  });

  it('extracts filename from valid urls and returns fallback for invalid', () => {
    const name = MediaValidationUtils.extractFilename(
      'https://example.com/path/to/photo.png?query=1'
    );
    expect(name).toBe('photo.png');

    const fallback = MediaValidationUtils.extractFilename('not-a-url');
    expect(fallback).toMatch(/^media_/);
  });

  it('normalizes twitter image urls to orig name', () => {
    const input = 'https://pbs.twimg.com/media/ABC123';
    const normalized = MediaValidationUtils.normalizeMediaUrl(input);
    expect(normalized).toContain('?name=orig');
  });
});
