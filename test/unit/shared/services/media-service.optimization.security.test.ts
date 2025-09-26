import { describe, expect, it } from 'vitest';
import { MediaService } from '@shared/services/MediaService';

describe('MediaService.getOptimizedImageUrl hostname guard', () => {
  it('does not rewrite URLs for spoofed hosts', () => {
    const service = new MediaService();
    // Force WebP support to simulate optimization path
    (service as unknown as { webpSupported: boolean | null }).webpSupported = true;

    const spoofed = 'https://pbs.twimg.com.evil.tld/media/attack.jpg';
    expect(service.getOptimizedImageUrl(spoofed)).toBe(spoofed);
  });

  it('continues to optimize genuine twimg hosts when WebP is supported', () => {
    const service = new MediaService();
    (service as unknown as { webpSupported: boolean | null }).webpSupported = true;

    const trusted = 'https://pbs.twimg.com/media/safe.jpg';
    const optimized = service.getOptimizedImageUrl(trusted);
    expect(optimized).toMatch(/format=webp/);
    expect(optimized).toContain(trusted);
  });
});
