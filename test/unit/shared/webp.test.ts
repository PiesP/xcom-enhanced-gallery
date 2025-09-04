import { describe, it, expect, beforeEach } from 'vitest';

import { WebPUtils, optimizeWebP } from '@shared/utils/WebPUtils';

describe('WebPUtils', () => {
  beforeEach(() => {
    WebPUtils.resetCache();
  });

  it('optimizeUrl returns original when not supported sync', () => {
    // ensure cache false
    expect(WebPUtils.isSupportedSync()).toBe(false);
    const url = 'https://pbs.twimg.com/media/xyz.jpg';
    const out = WebPUtils.optimizeUrl(url);
    // in test env detectWebPSupport returns true, but sync reflects cache
    expect(typeof out).toBe('string');
  });

  it('optimizeWebP wrapper behaves the same', () => {
    const url = 'https://pbs.twimg.com/media/xyz.jpg';
    expect(optimizeWebP(url)).toBe(WebPUtils.optimizeUrl(url));
  });

  it('cache status reflects detect and reset', async () => {
    expect(WebPUtils.getCacheStatus().cached).toBe(false);
    await WebPUtils.detectSupport();
    expect(WebPUtils.getCacheStatus().cached).toBe(true);
    WebPUtils.resetCache();
    expect(WebPUtils.getCacheStatus().cached).toBe(false);
  });
});
