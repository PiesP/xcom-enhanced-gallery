import { describe, it, expect } from 'vitest';
import {
  extractOriginalImageUrl,
  getHighQualityMediaUrl,
  cleanFilename,
} from '@shared/utils/media/media-url.util';

describe('media-url.util (pure)', () => {
  it('extractOriginalImageUrl upgrades name param to orig when possible', () => {
    const url = 'https://pbs.twimg.com/media/XYZ?name=small&format=jpg';
    expect(extractOriginalImageUrl(url)).toContain('name=orig');

    const url2 = 'https://example.com/image.png';
    expect(extractOriginalImageUrl(url2)).toContain('?name=orig');
  });

  it('getHighQualityMediaUrl preserves data/blob URLs and sets name/format for http', () => {
    const dataUrl = 'data:image/png;base64,AAA';
    expect(getHighQualityMediaUrl(dataUrl)).toBe(dataUrl);

    const httpUrl = 'https://pbs.twimg.com/media/XYZ?format=png';
    const high = getHighQualityMediaUrl(httpUrl, 'large');
    expect(high).toContain('name=large');
    expect(high).toContain('format=png');
  });

  it('cleanFilename removes extensions and unsafe chars', () => {
    expect(cleanFilename('photo.jpg')).toBe('photo');
    expect(cleanFilename('  my:file?.png  ')).toBe('my_file_');
    expect(cleanFilename('')).toBe('media');
  });
});
