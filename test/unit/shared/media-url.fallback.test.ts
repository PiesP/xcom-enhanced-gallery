import { describe, expect, test } from 'vitest';
import { WebPUtils } from '@shared/utils/WebPUtils';
import { getHighQualityMediaUrl, cleanFilename } from '@shared/utils/media/media-url.util';

describe('media-url.util fallback and WebP cache helpers', () => {
  test('WebPUtils cache status toggles with reset and detect', async () => {
    WebPUtils.resetCache();
    const before = WebPUtils.getCacheStatus();
    expect(before.cached).toBe(false);

    await WebPUtils.detectSupport();
    const after = WebPUtils.getCacheStatus();
    expect(after.cached).toBe(true);
    // in test env, supported should be true
    expect(after.supported).toBe(true);
  });

  test('getHighQualityMediaUrl fallback preserves non-http URLs', () => {
    const dataUrl = 'data:image/png;base64,AAA';
    const out = getHighQualityMediaUrl(dataUrl, 'small');
    expect(out).toBe(dataUrl);
  });

  test('cleanFilename trims very long names to 200 chars', () => {
    const long = 'a'.repeat(500) + '.jpg';
    const cleaned = cleanFilename(long);
    expect(cleaned.length).toBeLessThanOrEqual(200);
    expect(cleaned).not.toContain('.jpg');
  });
});
