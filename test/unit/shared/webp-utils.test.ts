import { beforeEach, describe, expect, test } from 'vitest';
import { WebPUtils, optimizeWebP, optimizeTwitterImageUrl } from '@shared/utils/WebPUtils';

describe('WebPUtils and helpers', () => {
  beforeEach(() => {
    WebPUtils.resetCache();
  });

  test('optimizeWebP returns original when support not cached', () => {
    const url = 'https://example.com/image.jpg';
    expect(optimizeWebP(url)).toBe(url);
  });

  test('optimizeWebP adds format=webp for pbs.twimg.com when support detected', async () => {
    await WebPUtils.detectSupport(); // in test env this resolves to true
    const url = 'https://pbs.twimg.com/media/ABC123.jpg';
    const out = optimizeWebP(url);
    expect(out).toContain('format=webp');
    // also ensure convenience alias works
    expect(optimizeTwitterImageUrl(url)).toContain('format=webp');
  });

  test('optimizeWebP leaves already-webp URLs unchanged', async () => {
    await WebPUtils.detectSupport();
    const url = 'https://pbs.twimg.com/media/ABC.jpg?format=webp';
    expect(optimizeWebP(url)).toBe(url);
  });
});
