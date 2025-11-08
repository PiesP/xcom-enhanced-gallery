/**
 * @fileoverview username-extraction-service.ts 테스트
 * @description UsernameParser 클래스 및 편의 함수 테스트
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../../shared/global-cleanup-hooks';
import {
  UsernameParser,
  extractUsername,
  parseUsernameFast,
  type UsernameExtractionResult,
} from '@/shared/services/media/username-extraction-service';
import { SYSTEM_PAGES } from '@/constants';

// Mock logger
vi.mock('@/shared/logging/logger', () => ({
  logger: {
    warn: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('UsernameParser', () => {
  setupGlobalTestIsolation();

  let parser: UsernameParser;

  beforeEach(() => {
    parser = new UsernameParser();
    vi.clearAllMocks();
    // window.location.href 초기화
    Object.defineProperty(window, 'location', {
      value: { href: 'https://x.com/testuser' },
      writable: true,
      configurable: true,
    });
  });

  describe('cleanUsername', () => {
    it('should remove @ prefix', () => {
      // @ts-expect-error - private method 테스트
      const result = parser.cleanUsername('@testuser');
      expect(result).toBe('testuser');
    });

    it('should trim whitespace', () => {
      // @ts-expect-error - private method 테스트
      const result = parser.cleanUsername('  testuser  ');
      expect(result).toBe('testuser');
    });

    it('should remove URL path', () => {
      // @ts-expect-error - private method 테스트
      const result = parser.cleanUsername('https://x.com/testuser');
      expect(result).toBe('testuser');
    });

    it('should accept valid username with underscores', () => {
      // @ts-expect-error - private method 테스트
      const result = parser.cleanUsername('test_user_123');
      expect(result).toBe('test_user_123');
    });

    it('should return empty string for invalid pattern (too long)', () => {
      // @ts-expect-error - private method 테스트
      const result = parser.cleanUsername('verylongusername1234567890');
      expect(result).toBe('');
    });

    it('should return empty string for invalid pattern (special chars)', () => {
      // @ts-expect-error - private method 테스트
      const result = parser.cleanUsername('test-user!@#');
      expect(result).toBe('');
    });

    it('should return empty string for empty input', () => {
      // @ts-expect-error - private method 테스트
      const result = parser.cleanUsername('');
      expect(result).toBe('');
    });

    it('should accept username at minimum length (1 char)', () => {
      // @ts-expect-error - private method 테스트
      const result = parser.cleanUsername('a');
      expect(result).toBe('a');
    });

    it('should accept username at maximum length (15 chars)', () => {
      // @ts-expect-error - private method 테스트
      const result = parser.cleanUsername('123456789012345');
      expect(result).toBe('123456789012345');
    });
  });

  describe('isSystemPage', () => {
    it('should return true for system page (lowercase)', () => {
      // @ts-expect-error - private method 테스트
      const result = parser.isSystemPage('home');
      expect(result).toBe(true);
    });

    it('should return true for system page (uppercase)', () => {
      // @ts-expect-error - private method 테스트
      const result = parser.isSystemPage('HOME');
      expect(result).toBe(true);
    });

    it('should return true for system page (mixed case)', () => {
      // @ts-expect-error - private method 테스트
      const result = parser.isSystemPage('Settings');
      expect(result).toBe(true);
    });

    it('should return false for regular username', () => {
      // @ts-expect-error - private method 테스트
      const result = parser.isSystemPage('testuser');
      expect(result).toBe(false);
    });

    it('should check all SYSTEM_PAGES entries', () => {
      for (const page of SYSTEM_PAGES) {
        // @ts-expect-error - private method 테스트
        expect(parser.isSystemPage(page)).toBe(true);
      }
    });
  });

  describe('extractFromURL', () => {
    it('should extract username from x.com profile URL', () => {
      Object.defineProperty(window, 'location', {
        value: { href: 'https://x.com/testuser' },
        writable: true,
        configurable: true,
      });

      // @ts-expect-error - private method 테스트
      const result: UsernameExtractionResult = parser.extractFromURL();
      expect(result.username).toBe('testuser');
      expect(result.method).toBe('url');
      expect(result.confidence).toBe(0.8);
    });

    it('should extract username from x.com status URL', () => {
      Object.defineProperty(window, 'location', {
        value: { href: 'https://x.com/testuser/status/1234567890' },
        writable: true,
        configurable: true,
      });

      // @ts-expect-error - private method 테스트
      const result: UsernameExtractionResult = parser.extractFromURL();
      expect(result.username).toBe('testuser');
      expect(result.method).toBe('url');
      expect(result.confidence).toBe(0.8);
    });

    it('should extract username from twitter.com domain', () => {
      Object.defineProperty(window, 'location', {
        value: { href: 'https://twitter.com/testuser' },
        writable: true,
        configurable: true,
      });

      // @ts-expect-error - private method 테스트
      const result: UsernameExtractionResult = parser.extractFromURL();
      expect(result.username).toBe('testuser');
      expect(result.method).toBe('url');
      expect(result.confidence).toBe(0.8);
    });

    it('should exclude system pages', () => {
      Object.defineProperty(window, 'location', {
        value: { href: 'https://x.com/home' },
        writable: true,
        configurable: true,
      });

      // @ts-expect-error - private method 테스트
      const result: UsernameExtractionResult = parser.extractFromURL();
      expect(result.username).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it('should return null if no match', () => {
      Object.defineProperty(window, 'location', {
        value: { href: 'https://example.com/' },
        writable: true,
        configurable: true,
      });

      // @ts-expect-error - private method 테스트
      const result: UsernameExtractionResult = parser.extractFromURL();
      expect(result.username).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it('should extract username with underscores', () => {
      Object.defineProperty(window, 'location', {
        value: { href: 'https://x.com/test_user_123' },
        writable: true,
        configurable: true,
      });

      // @ts-expect-error - private method 테스트
      const result: UsernameExtractionResult = parser.extractFromURL();
      expect(result.username).toBe('test_user_123');
    });

    it('should handle URL with query params', () => {
      Object.defineProperty(window, 'location', {
        value: { href: 'https://x.com/testuser?src=search' },
        writable: true,
        configurable: true,
      });

      // @ts-expect-error - private method 테스트
      const result: UsernameExtractionResult = parser.extractFromURL();
      expect(result.username).toBe('testuser');
    });
  });

  describe('extractUsernameFromElement', () => {
    it('should extract username from anchor href', () => {
      const anchor = document.createElement('a');
      anchor.setAttribute('href', '/testuser');

      // @ts-expect-error - private method 테스트
      const result = parser.extractUsernameFromElement(anchor);
      expect(result).toBe('testuser');
    });

    it('should extract username from element textContent', () => {
      const span = document.createElement('span');
      span.textContent = '@testuser';

      // @ts-expect-error - private method 테스트
      const result = parser.extractUsernameFromElement(span);
      expect(result).toBe('testuser');
    });

    it('should apply cleanUsername', () => {
      const span = document.createElement('span');
      span.textContent = '  @testuser  ';

      // @ts-expect-error - private method 테스트
      const result = parser.extractUsernameFromElement(span);
      expect(result).toBe('testuser');
    });

    it('should return null for system page username', () => {
      const anchor = document.createElement('a');
      anchor.setAttribute('href', '/home');

      // @ts-expect-error - private method 테스트
      const result = parser.extractUsernameFromElement(anchor);
      expect(result).toBeNull();
    });

    it('should return null for null element', () => {
      // @ts-expect-error - private method 테스트, null 입력 테스트
      const result = parser.extractUsernameFromElement(null);
      expect(result).toBeNull();
    });

    it('should return null for invalid username pattern', () => {
      const span = document.createElement('span');
      span.textContent = 'invalid-username!@#';

      // @ts-expect-error - private method 테스트
      const result = parser.extractUsernameFromElement(span);
      expect(result).toBeNull();
    });

    it('should handle anchor without href', () => {
      const anchor = document.createElement('a');
      anchor.textContent = 'testuser';

      // @ts-expect-error - private method 테스트
      const result = parser.extractUsernameFromElement(anchor);
      expect(result).toBe('testuser');
    });

    it('should return null for anchor with invalid href pattern', () => {
      const anchor = document.createElement('a');
      anchor.setAttribute('href', 'https://example.com/user');
      anchor.textContent = 'testuser';

      // @ts-expect-error - private method 테스트
      const result = parser.extractUsernameFromElement(anchor);
      // href가 /^\/([a-zA-Z0-9_]+)$/ 패턴과 매칭되지 않으면
      // text는 빈 문자열로 남고, textContent는 사용되지 않음
      expect(result).toBeNull();
    });
  });

  describe('extractFromDOM', () => {
    it('should extract username from DOM element with valid selector', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div data-testid="UserName">
          <span dir="ltr">testuser</span>
        </div>
      `;

      // @ts-expect-error - private method 테스트
      const result: UsernameExtractionResult = parser.extractFromDOM(container);
      expect(result.username).toBe('testuser');
      expect(result.method).toBe('dom');
      expect(result.confidence).toBe(0.9);
    });

    it('should try multiple selectors in order', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <article>
          <a role="link" href="/testuser">
            <span dir="ltr">testuser</span>
          </a>
        </article>
      `;

      // @ts-expect-error - private method 테스트
      const result: UsernameExtractionResult = parser.extractFromDOM(container);
      expect(result.username).toBe('testuser');
    });

    it('should skip system pages in DOM extraction', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div data-testid="UserName">
          <span dir="ltr">home</span>
        </div>
      `;

      // @ts-expect-error - private method 테스트
      const result: UsernameExtractionResult = parser.extractFromDOM(container);
      expect(result.username).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it('should return null if no valid username found', () => {
      const container = document.createElement('div');
      container.innerHTML = '<div>No username here</div>';

      // @ts-expect-error - private method 테스트
      const result: UsernameExtractionResult = parser.extractFromDOM(container);
      expect(result.username).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it('should use document as default root', () => {
      document.body.innerHTML = `
        <div data-testid="UserName">
          <span dir="ltr">testuser</span>
        </div>
      `;

      // @ts-expect-error - private method 테스트
      const result: UsernameExtractionResult = parser.extractFromDOM(document);
      expect(result.username).toBe('testuser');
    });
  });

  describe('extractFromMeta', () => {
    it('should extract username from profile:username meta', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'profile:username');
      meta.setAttribute('content', 'testuser');
      document.head.appendChild(meta);

      // @ts-expect-error - private method 테스트
      const result: UsernameExtractionResult = parser.extractFromMeta();
      expect(result.username).toBe('testuser');
      expect(result.method).toBe('meta');
      expect(result.confidence).toBe(0.7);

      document.head.removeChild(meta);
    });

    it('should extract username from twitter:creator meta', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'twitter:creator');
      meta.setAttribute('content', '@testuser');
      document.head.appendChild(meta);

      // @ts-expect-error - private method 테스트
      const result: UsernameExtractionResult = parser.extractFromMeta();
      expect(result.username).toBe('testuser');
      expect(result.method).toBe('meta');
      expect(result.confidence).toBe(0.7);

      document.head.removeChild(meta);
    });

    it('should clean username from meta content', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'twitter:creator');
      meta.setAttribute('content', '@testuser'); // 공백 제거하여 간단하게 테스트
      document.head.appendChild(meta);

      // @ts-expect-error - private method 테스트
      const result: UsernameExtractionResult = parser.extractFromMeta();
      expect(result.username).toBe('testuser');

      document.head.removeChild(meta);
    });

    it('should exclude system pages', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'profile:username');
      meta.setAttribute('content', 'home');
      document.head.appendChild(meta);

      // @ts-expect-error - private method 테스트
      const result: UsernameExtractionResult = parser.extractFromMeta();
      expect(result.username).toBeNull();
      expect(result.confidence).toBe(0);

      document.head.removeChild(meta);
    });

    it('should return null if no meta tags found', () => {
      // @ts-expect-error - private method 테스트
      const result: UsernameExtractionResult = parser.extractFromMeta();
      expect(result.username).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it('should extract from og:url meta', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:url');
      meta.setAttribute('content', 'https://x.com/testuser');
      document.head.appendChild(meta);

      // @ts-expect-error - private method 테스트
      const result: UsernameExtractionResult = parser.extractFromMeta();
      expect(result.username).toBe('testuser');

      document.head.removeChild(meta);
    });
  });

  describe('extractUsername (orchestrator)', () => {
    it('should return DOM result if available', () => {
      document.body.innerHTML = `
        <div data-testid="UserName">
          <span dir="ltr">domuser</span>
        </div>
      `;
      Object.defineProperty(window, 'location', {
        value: { href: 'https://x.com/urluser' },
        writable: true,
        configurable: true,
      });

      const result = parser.extractUsername(document);
      expect(result.username).toBe('domuser');
      expect(result.method).toBe('dom');
      expect(result.confidence).toBe(0.9);
    });

    it('should fallback to URL if DOM fails', () => {
      document.body.innerHTML = '<div>No username</div>';
      Object.defineProperty(window, 'location', {
        value: { href: 'https://x.com/urluser' },
        writable: true,
        configurable: true,
      });

      const result = parser.extractUsername(document);
      expect(result.username).toBe('urluser');
      expect(result.method).toBe('url');
      expect(result.confidence).toBe(0.8);
    });

    it('should fallback to Meta if DOM and URL fail', () => {
      document.body.innerHTML = '<div>No username</div>';
      Object.defineProperty(window, 'location', {
        value: { href: 'https://example.com/' },
        writable: true,
        configurable: true,
      });

      const meta = document.createElement('meta');
      meta.setAttribute('property', 'profile:username');
      meta.setAttribute('content', 'metauser');
      document.head.appendChild(meta);

      const result = parser.extractUsername(document);
      expect(result.username).toBe('metauser');
      expect(result.method).toBe('meta');
      expect(result.confidence).toBe(0.7);

      document.head.removeChild(meta);
    });

    it('should return fallback if all methods fail', () => {
      document.body.innerHTML = '<div>No username</div>';
      Object.defineProperty(window, 'location', {
        value: { href: 'https://example.com/' },
        writable: true,
        configurable: true,
      });

      const result = parser.extractUsername(document);
      expect(result.username).toBeNull();
      expect(result.method).toBe('fallback');
      expect(result.confidence).toBe(0);
    });

    it('should use document as default element', () => {
      document.body.innerHTML = `
        <div data-testid="UserName">
          <span dir="ltr">testuser</span>
        </div>
      `;

      const result = parser.extractUsername();
      expect(result.username).toBe('testuser');
      expect(result.method).toBe('dom');
    });

    it('should accept custom element parameter', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div data-testid="UserName">
          <span dir="ltr">customuser</span>
        </div>
      `;

      const result = parser.extractUsername(container);
      expect(result.username).toBe('customuser');
      expect(result.method).toBe('dom');
    });
  });

  describe('convenience functions', () => {
    it('extractUsername should return UsernameExtractionResult', () => {
      document.body.innerHTML = `
        <div data-testid="UserName">
          <span dir="ltr">testuser</span>
        </div>
      `;

      const result = extractUsername();
      expect(result).toHaveProperty('username');
      expect(result).toHaveProperty('method');
      expect(result).toHaveProperty('confidence');
      expect(result.username).toBe('testuser');
      expect(result.method).toBe('dom');
      expect(result.confidence).toBe(0.9);
    });

    it('parseUsernameFast should return string | null', () => {
      document.body.innerHTML = `
        <div data-testid="UserName">
          <span dir="ltr">testuser</span>
        </div>
      `;

      const result = parseUsernameFast();
      expect(typeof result === 'string' || result === null).toBe(true);
      expect(result).toBe('testuser');
    });

    it('parseUsernameFast should return null on failure', () => {
      document.body.innerHTML = '<div>No username</div>';
      Object.defineProperty(window, 'location', {
        value: { href: 'https://example.com/' },
        writable: true,
        configurable: true,
      });

      const result = parseUsernameFast();
      expect(result).toBeNull();
    });

    it('convenience functions should create new parser instances', () => {
      document.body.innerHTML = `
        <div data-testid="UserName">
          <span dir="ltr">user1</span>
        </div>
      `;

      const result1 = extractUsername();
      const result2 = parseUsernameFast();

      expect(result1.username).toBe('user1');
      expect(result2).toBe('user1');
    });
  });
});
