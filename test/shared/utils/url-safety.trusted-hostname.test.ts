import { describe, expect, it } from 'vitest';
import { createTrustedHostnameGuard, isTrustedHostname } from '@shared/utils/url-safety';

describe('Trusted hostname guard', () => {
  const ALLOWLIST = ['pbs.twimg.com', 'video.twimg.com'] as const;

  it('accepts exact allowlisted hostnames', () => {
    for (const url of [
      'https://pbs.twimg.com/media/example.jpg',
      'https://video.twimg.com/ext_tw_video/example.mp4',
    ]) {
      expect(isTrustedHostname(url, ALLOWLIST)).toBe(true);
    }
  });

  it('rejects deceptive suffix matches', () => {
    const guard = createTrustedHostnameGuard(ALLOWLIST);
    expect(guard('https://pbs.twimg.com.evil.tld/media/attack.jpg')).toBe(false);
    expect(guard('https://video.twimg.com.attacker.net/video/attack.mp4')).toBe(false);
  });

  it('rejects protocol-relative, relative, or malformed inputs', () => {
    const guard = createTrustedHostnameGuard(ALLOWLIST);
    expect(guard('//pbs.twimg.com/media/foo.jpg')).toBe(false);
    expect(guard('/media/foo.jpg')).toBe(false);
    expect(guard('javascript:alert(1)')).toBe(false);
    expect(guard('')).toBe(false);
  });

  it('supports optional subdomain allowance', () => {
    const guard = createTrustedHostnameGuard(['twimg.com'], { allowSubdomains: true });
    expect(guard('https://pbs.twimg.com/media/foo.jpg')).toBe(true);
    expect(guard('https://media.pbs.twimg.com/media/foo.jpg')).toBe(true);
    expect(guard('https://twimg.com/media/foo.jpg')).toBe(true);
    expect(guard('https://twimg.com.evil')).toBe(false);
  });
});
