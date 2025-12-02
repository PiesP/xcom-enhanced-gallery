import {
  extractTweetTextHTML,
  extractTweetTextHTMLFromClickedElement,
} from '@shared/utils/media/tweet-extractor';
import { logger } from '@shared/logging';
import { sanitizeHTML } from '@shared/utils/text/html-sanitizer';

// Mock dependencies
vi.mock('@shared/logging', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@shared/utils/text/html-sanitizer', () => ({
  sanitizeHTML: vi.fn(html => html), // Default identity
}));

describe('tweet-extractor mutation tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractTweetTextHTML', () => {
    it('should not log error when tweetArticle is null (kills "if (!tweetArticle) return undefined" -> "if (false)")', () => {
      // If the check is removed, tweetArticle.querySelector throws, and catch block logs error.
      // We want to ensure that normally it just returns undefined WITHOUT logging error.
      const result = extractTweetTextHTML(null);
      expect(result).toBeUndefined();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should not call sanitizeHTML if rawHTML is whitespace (kills "if (!rawHTML?.trim())" -> "if (!rawHTML)")', () => {
      const article = document.createElement('article');
      const content = document.createElement('div');
      content.setAttribute('data-testid', 'tweetText');
      content.innerHTML = '   ';
      article.appendChild(content);

      const result = extractTweetTextHTML(article);

      expect(result).toBeUndefined();
      expect(sanitizeHTML).not.toHaveBeenCalled();
    });

    it('should return undefined if sanitized HTML is whitespace (kills "if (!sanitized?.trim())" -> "if (!sanitized)")', () => {
      const article = document.createElement('article');
      const content = document.createElement('div');
      content.setAttribute('data-testid', 'tweetText');
      content.innerHTML = '<div>   </div>';
      article.appendChild(content);

      // Mock sanitizeHTML to return whitespace
      vi.mocked(sanitizeHTML).mockReturnValue('   ');

      const result = extractTweetTextHTML(article);

      expect(result).toBeUndefined();
    });
  });

  describe('extractTweetTextHTMLFromClickedElement', () => {
    it('should respect maxDepth exactly (kills "depth < maxDepth" -> "depth <= maxDepth")', () => {
      // Structure: Article -> Div -> Div -> Target
      // Depth 0: Target
      // Depth 1: Div
      // Depth 2: Div
      // Depth 3: Article

      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');
      const content = document.createElement('div');
      content.setAttribute('data-testid', 'tweetText');
      content.innerHTML = 'content';
      article.appendChild(content);

      const div1 = document.createElement('div');
      const div2 = document.createElement('div');
      const target = document.createElement('div');

      article.appendChild(div1);
      div1.appendChild(div2);
      div2.appendChild(target);

      // Target is at depth 0.
      // Parent (div2) is at depth 1.
      // Parent (div1) is at depth 2.
      // Parent (article) is at depth 3.

      // If maxDepth is 3, we check 0, 1, 2. We stop BEFORE checking 3.
      // So we should NOT find the article.
      // If mutant "depth <= maxDepth" exists, we check 3, and find it.

      const result = extractTweetTextHTMLFromClickedElement(target, 3);
      expect(result).toBeUndefined();
    });

    it('should stop traversal if maxDepth is reached even if article is deeper (kills "depth++" -> "depth--")', () => {
      // If depth decrements, it stays < maxDepth forever (until root).
      // So if we set maxDepth=1, and article is at depth 2.
      // Normal: checks 0. depth=1. 1 < 1 is false. Stop. Result undefined.
      // Mutant: checks 0. depth=-1. -1 < 1 is true. Checks 1. depth=-2. ... Checks 2. Found.

      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');
      const content = document.createElement('div');
      content.setAttribute('data-testid', 'tweetText');
      content.innerHTML = 'content';
      article.appendChild(content);

      const mid = document.createElement('div');
      const target = document.createElement('div');

      article.appendChild(mid);
      mid.appendChild(target);

      // Target (0) -> Mid (1) -> Article (2)

      const result = extractTweetTextHTMLFromClickedElement(target, 1);
      expect(result).toBeUndefined();
    });

    it('should ignore non-ARTICLE elements with data-testid (kills "current.tagName === ARTICLE" -> "current.tagName !== ARTICLE")', () => {
      const div = document.createElement('div');
      div.setAttribute('data-testid', 'tweet');

      // Add tweetText so if it were checked, it would succeed
      const content = document.createElement('div');
      content.setAttribute('data-testid', 'tweetText');
      content.innerHTML = 'content';
      div.appendChild(content);

      const target = document.createElement('span');
      div.appendChild(target);

      const result = extractTweetTextHTMLFromClickedElement(target);
      expect(result).toBeUndefined();
    });

    it('should ignore ARTICLE elements without data-testid or selector (kills "hasAttribute || querySelector" -> "true")', () => {
      const article = document.createElement('article');
      // No data-testid, no .tweet selector inside (except tweetText which is different)
      // Wait, SELECTORS.TWEET usually matches the article itself or something inside?
      // Looking at code: current.querySelector(SELECTORS.TWEET)
      // If SELECTORS.TWEET is '[data-testid="tweet"]', then it looks for a nested tweet?
      // Or maybe the article itself is the tweet.

      // The code checks: current.tagName === 'ARTICLE' && (current.hasAttribute('data-testid') || current.querySelector(SELECTORS.TWEET))
      // If I have an ARTICLE with no attributes and no children matching SELECTORS.TWEET.
      // It should be skipped.
      // If mutant is "true", it will be accepted.

      // Add tweetText so extractTweetTextHTML would succeed if called
      const content = document.createElement('div');
      content.setAttribute('data-testid', 'tweetText');
      content.innerHTML = 'content';
      article.appendChild(content);

      const target = document.createElement('span');
      article.appendChild(target);

      const result = extractTweetTextHTMLFromClickedElement(target);
      expect(result).toBeUndefined();
    });
  });
});
