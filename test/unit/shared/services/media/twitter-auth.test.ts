// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { describe, it, expect } from 'vitest';
import { TWITTER_API_CONFIG } from '@shared/core/twitter-api/endpoint';
import { resolveBearerToken } from '@shared/services/media/twitter-auth/twitter-auth';

// The GUEST_AUTHORIZATION is the fallback token from TWITTER_API_CONFIG
// We check that resolveBearerToken returns the expected fallback when no
// __NEXT_DATA__ is available, or returns a Bearer-prefixed token when
// a valid JWT is found.

const GUEST_PREFIX = 'Bearer ';

// Helper: create a JWT with a given exp timestamp
function createJwt(expSeconds: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: '12345', exp: expSeconds }));
  const signature = btoa('fake-signature');
  return `${header}.${payload}.${signature}`;
}

describe('twitter-auth', () => {
  // ── resolveBearerToken ─────────────────────────────────────────

  describe('resolveBearerToken', () => {
    it('should return guest token when document is null', () => {
      const result = resolveBearerToken(null);
      expect(result.startsWith(GUEST_PREFIX)).toBe(true);
    });

    it('should return guest token when document is undefined', () => {
      const result = resolveBearerToken(undefined);
      expect(result.startsWith(GUEST_PREFIX)).toBe(true);
    });

    it('should return guest token when __NEXT_DATA__ script is missing', () => {
      const doc = document.implementation.createHTMLDocument();
      const result = resolveBearerToken(doc);
      expect(result.startsWith(GUEST_PREFIX)).toBe(true);
    });

    it('should return guest token when __NEXT_DATA__ has no text content', () => {
      const doc = document.implementation.createHTMLDocument();
      const script = doc.createElement('script');
      script.id = '__NEXT_DATA__';
      doc.body.appendChild(script);
      const result = resolveBearerToken(doc);
      expect(result.startsWith(GUEST_PREFIX)).toBe(true);
    });

    it('should return guest token when __NEXT_DATA__ has empty text content', () => {
      const doc = document.implementation.createHTMLDocument();
      const script = doc.createElement('script');
      script.id = '__NEXT_DATA__';
      script.textContent = '';
      doc.body.appendChild(script);
      const result = resolveBearerToken(doc);
      expect(result.startsWith(GUEST_PREFIX)).toBe(true);
    });

    it('should return guest token when __NEXT_DATA__ JSON is invalid', () => {
      const doc = document.implementation.createHTMLDocument();
      const script = doc.createElement('script');
      script.id = '__NEXT_DATA__';
      script.textContent = 'not valid json';
      doc.body.appendChild(script);
      const result = resolveBearerToken(doc);
      expect(result.startsWith(GUEST_PREFIX)).toBe(true);
    });

    it('should return guest token when __NEXT_DATA__ has no token property', () => {
      const doc = document.implementation.createHTMLDocument();
      const script = doc.createElement('script');
      script.id = '__NEXT_DATA__';
      script.textContent = JSON.stringify({ props: { pageProps: {} } });
      doc.body.appendChild(script);
      const result = resolveBearerToken(doc);
      expect(result.startsWith(GUEST_PREFIX)).toBe(true);
    });

    it('should return Bearer token from pageProps.token.Bearer with valid JWT', () => {
      const doc = document.implementation.createHTMLDocument();
      const script = doc.createElement('script');
      script.id = '__NEXT_DATA__';
      // exp in the far future
      const validToken = createJwt(9999999999);
      script.textContent = JSON.stringify({
        props: {
          pageProps: {
            token: {
              Bearer: validToken,
            },
          },
        },
      });
      doc.body.appendChild(script);
      const result = resolveBearerToken(doc);
      expect(result).toBe(`Bearer ${validToken}`);
    });

    it('should return guest token when token is at props.token.Bearer (not pageProps — only pageProps is checked)', () => {
      const doc = document.implementation.createHTMLDocument();
      const script = doc.createElement('script');
      script.id = '__NEXT_DATA__';
      const validToken = createJwt(9999999999);
      script.textContent = JSON.stringify({
        props: {
          token: {
            Bearer: validToken,
          },
        },
      });
      doc.body.appendChild(script);
      // Guest token because pageProps.token.Bearer is not set (only props.token.Bearer)
      const result = resolveBearerToken(doc);
      expect(result).toBe(TWITTER_API_CONFIG.GUEST_AUTHORIZATION);
    });

    it('should return guest token when token is not a string', () => {
      const doc = document.implementation.createHTMLDocument();
      const script = doc.createElement('script');
      script.id = '__NEXT_DATA__';
      script.textContent = JSON.stringify({
        props: {
          pageProps: {
            token: {
              Bearer: 12345,
            },
          },
        },
      });
      doc.body.appendChild(script);
      const result = resolveBearerToken(doc);
      expect(result.startsWith(GUEST_PREFIX)).toBe(true);
    });

    it('should return guest token when JWT has invalid structure', () => {
      const doc = document.implementation.createHTMLDocument();
      const script = doc.createElement('script');
      script.id = '__NEXT_DATA__';
      // Only 2 parts, not 3
      script.textContent = JSON.stringify({
        props: {
          pageProps: {
            token: {
              Bearer: 'header.payload',
            },
          },
        },
      });
      doc.body.appendChild(script);
      const result = resolveBearerToken(doc);
      expect(result.startsWith(GUEST_PREFIX)).toBe(true);
    });

    it('should return guest token when JWT payload is not valid JSON', () => {
      const doc = document.implementation.createHTMLDocument();
      const script = doc.createElement('script');
      script.id = '__NEXT_DATA__';
      // Payload is not valid base64-encoded JSON
      const header = btoa(JSON.stringify({ alg: 'HS256' }));
      script.textContent = JSON.stringify({
        props: {
          pageProps: {
            token: {
              Bearer: `${header}.not-valid-json.abc`,
            },
          },
        },
      });
      doc.body.appendChild(script);
      const result = resolveBearerToken(doc);
      expect(result.startsWith(GUEST_PREFIX)).toBe(true);
    });

    it('should return guest token when JWT has no exp claim', () => {
      const doc = document.implementation.createHTMLDocument();
      const script = doc.createElement('script');
      script.id = '__NEXT_DATA__';
      const header = btoa(JSON.stringify({ alg: 'HS256' }));
      const payload = btoa(JSON.stringify({ sub: '12345' }));
      script.textContent = JSON.stringify({
        props: {
          pageProps: {
            token: {
              Bearer: `${header}.${payload}.sig`,
            },
          },
        },
      });
      doc.body.appendChild(script);
      const result = resolveBearerToken(doc);
      expect(result.startsWith(GUEST_PREFIX)).toBe(true);
    });

    it('should return guest token when JWT is expired', () => {
      const doc = document.implementation.createHTMLDocument();
      const script = doc.createElement('script');
      script.id = '__NEXT_DATA__';
      // exp in the past
      const expiredToken = createJwt(1000000);
      script.textContent = JSON.stringify({
        props: {
          pageProps: {
            token: {
              Bearer: expiredToken,
            },
          },
        },
      });
      doc.body.appendChild(script);
      const result = resolveBearerToken(doc);
      expect(result.startsWith(GUEST_PREFIX)).toBe(true);
    });
  });
});
