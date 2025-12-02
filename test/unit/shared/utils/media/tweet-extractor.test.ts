import { sanitizeHTML } from '@shared/utils/text/html-sanitizer';
import { logger } from '@shared/logging';
import {
  extractTweetTextHTML,
  extractTweetTextHTMLFromClickedElement,
} from '@shared/utils/media/tweet-extractor';
// Use vitest globals and import only types
import type { Mock } from 'vitest';

// Mock sanitizeHTML and logger
vi.mock('@shared/utils/text/html-sanitizer', () => ({
  sanitizeHTML: vi.fn(),
}));

vi.mock('@shared/logging', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe('tweet-extractor utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (sanitizeHTML as unknown as Mock).mockReset?.();
  });

  describe('extractTweetTextHTML', () => {
    it('returns undefined for null article', () => {
      expect(extractTweetTextHTML(null)).toBeUndefined();
    });

    it('returns undefined when tweetText element is missing', () => {
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');
      const result = extractTweetTextHTML(article);
      expect(result).toBeUndefined();
      expect(logger.debug).toHaveBeenCalled();
    });

    it('returns undefined when innerHTML is empty/whitespace', () => {
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');
      const span = document.createElement('span');
      span.setAttribute('data-testid', 'tweetText');
      span.innerHTML = '   ';
      article.appendChild(span);
      const result = extractTweetTextHTML(article);
      expect(result).toBeUndefined();
      expect(logger.debug).toHaveBeenCalled();
    });

    it('returns undefined when sanitizeHTML returns empty string', () => {
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');
      const span = document.createElement('span');
      span.setAttribute('data-testid', 'tweetText');
      span.innerHTML = '<b>text</b>';
      article.appendChild(span);
      (sanitizeHTML as any).mockReturnValue('');
      const result = extractTweetTextHTML(article);
      expect(result).toBeUndefined();
      expect(logger.debug).toHaveBeenCalledWith(
        '[extractTweetTextHTML] HTML sanitization resulted in empty content'
      );
    });

    it('returns sanitized HTML when present', () => {
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');
      const span = document.createElement('span');
      span.setAttribute('data-testid', 'tweetText');
      span.innerHTML = '<b>hello</b>';
      article.appendChild(span);
      (sanitizeHTML as any).mockReturnValue('<b>hello</b>');
      const res = extractTweetTextHTML(article);
      expect(res).toBe('<b>hello</b>');
      expect(logger.debug).toHaveBeenCalled();
    });

    it('returns undefined and logs on thrown error', () => {
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');
      // Create a querySelector that throws
      (article as any).querySelector = () => {
        throw new Error('boom');
      };
      const res = extractTweetTextHTML(article);
      expect(res).toBeUndefined();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('extractTweetTextHTMLFromClickedElement', () => {
    it('finds tweet article and returns sanitized content', () => {
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');
      const wrapper = document.createElement('div');
      const span = document.createElement('span');
      span.setAttribute('data-testid', 'tweetText');
      span.innerHTML = '<i>hey</i>';
      article.appendChild(span);
      article.appendChild(wrapper);
      document.body.appendChild(article);
      (sanitizeHTML as any).mockReturnValue('<i>hey</i>');
      const nestedChild = document.createElement('div');
      wrapper.appendChild(nestedChild);
      const res = extractTweetTextHTMLFromClickedElement(nestedChild);
      expect(res).toBe('<i>hey</i>');
    });

    it('returns undefined if no article within maxDepth', () => {
      const deepParent = document.createElement('div');
      let current = deepParent;
      for (let i = 0; i < 5; i++) {
        const c = document.createElement('div');
        current.appendChild(c);
        current = c;
      }
      // Add article outside of depth
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');
      const span = document.createElement('span');
      span.setAttribute('data-testid', 'tweetText');
      span.innerHTML = 'x';
      article.appendChild(span);
      current.appendChild(article);

      // Provide maxDepth shorter than distance
      const res = extractTweetTextHTMLFromClickedElement(deepParent, 2);
      expect(res).toBeUndefined();
    });
  });
});
