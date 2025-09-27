import { describe, expect, it } from 'vitest';
import { createTrustedHostnameGuard, isTrustedHostname } from '@shared/utils/url-safety';
import * as urlSafety from '@shared/utils/url-safety';

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

  describe('parseTrustedUrl helper (pending implementation)', () => {
    const parseTrustedUrl = (urlSafety as Record<string, unknown>)['parseTrustedUrl'] as
      | ((
          candidate: string,
          allowlist: readonly string[]
        ) => { href: string; hostname: string } | null)
      | undefined;
    const ALLOWLIST = ['pbs.twimg.com'] as const;

    it('exposes parseTrustedUrl function for structured URL validation', () => {
      expect(typeof parseTrustedUrl).toBe('function');
    });

    it('rejects http protocol even for allowlisted hosts', () => {
      if (typeof parseTrustedUrl !== 'function') {
        expect(typeof parseTrustedUrl).toBe('function');
        return;
      }

      const result = parseTrustedUrl('http://pbs.twimg.com/media/foo.jpg', ALLOWLIST);
      expect(result).toBeNull();
    });

    it('rejects deceptive suffix matches when parsing trusted URLs', () => {
      if (typeof parseTrustedUrl !== 'function') {
        expect(typeof parseTrustedUrl).toBe('function');
        return;
      }

      const result = parseTrustedUrl('https://pbs.twimg.com.attacker/media/foo.jpg', ALLOWLIST);
      expect(result).toBeNull();
    });
  });
});
