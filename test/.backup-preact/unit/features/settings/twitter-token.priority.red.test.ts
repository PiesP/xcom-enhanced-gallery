import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// We will lazy import the extractor to ensure our DOM/cookie/storage are in place

describe('R3: Twitter token priority policy (RED)', () => {
  let dom: JSDOM;

  beforeEach(() => {
    dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
      url: 'https://x.com/home',
      runScripts: 'outside-only',
      resources: 'usable',
    });

    // Bind globals without type-specific references to satisfy lint rules
    Object.assign(globalThis, {
      window: dom.window,
      document: dom.window.document,
      location: dom.window.location,
      localStorage: dom.window.localStorage,
      sessionStorage: dom.window.sessionStorage,
    });

    // Ensure URL constructor exists on this jsdom window (tough-cookie relies on it)
    // Use the Node.js URL polyfilled in global setup when available
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (dom.window as any).URL = (globalThis as any).URL;
    } catch {
      // ignore - jsdom might already have URL
    }

    // Stabilize cookie API: override document.cookie to avoid tough-cookie's URL dependency in jsdom
    // We implement a minimal in-memory cookie store sufficient for our extractor tests
    try {
      let cookieStore = '';
      Object.defineProperty(dom.window.document, 'cookie', {
        get() {
          return cookieStore;
        },
        set(value: string) {
          cookieStore = cookieStore ? `${cookieStore}; ${value}` : value;
        },
        configurable: true,
      });
    } catch {
      // ignore – fallback not critical for other tests
    }

    // Clock safe
    vi.useFakeTimers();
  });

  it('prefers page(script) token over cookie/session/localStorage', async () => {
    // Arrange: set cookies & storages with weaker tokens
    dom.window.document.cookie = 'auth_token=cookie_token_123%25AA; path=/;';
    dom.window.sessionStorage.setItem('auth_token', 'session_token_456%25AA');
    dom.window.localStorage.setItem(
      'xeg-app-settings',
      JSON.stringify({ tokens: { bearerToken: 'local_token_789%25AA' } })
    );

    // Inject a script tag with an inline token pattern
    const script = dom.window.document.createElement('script');
    script.textContent =
      "const __STATE__ = { 'Bearer': 'script_token_abc%25AA_extra_long_token_value_for_test_purposes_1234567890' };";
    dom.window.document.head.appendChild(script);

    const { TwitterTokenExtractor } = await import(
      '@/features/settings/services/TwitterTokenExtractor'
    );
    const ex = new TwitterTokenExtractor();

    const result = await ex.getToken(true);
    expect(typeof result).toBe('string');
    expect(result!).toMatch(/^script_token_abc%25AA/);
  });

  it('prefers cookie over sessionStorage and localStorage when no page token', async () => {
    // Arrange: cookie, session, localStorage
    dom.window.document.cookie =
      'auth_token=cookie_token_P%25AA_long_enough_token_value_for_policy_check_ABCDEFGHIJKLMNOPQRSTUVWXYZ; path=/;';
    dom.window.sessionStorage.setItem(
      'auth_token',
      'session_token_Q%25AA_long_enough_token_value_for_policy_check_ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    );
    dom.window.localStorage.setItem(
      'xeg-app-settings',
      JSON.stringify({
        tokens: {
          bearerToken:
            'local_token_R%25AA_long_enough_token_value_for_policy_check_ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        },
      })
    );

    const { TwitterTokenExtractor } = await import(
      '@/features/settings/services/TwitterTokenExtractor'
    );
    const ex = new TwitterTokenExtractor();
    const result = await ex.getToken(true);
    expect(typeof result).toBe('string');
    expect(result!).toMatch(/^cookie_token_P%25AA/);
  });
});
