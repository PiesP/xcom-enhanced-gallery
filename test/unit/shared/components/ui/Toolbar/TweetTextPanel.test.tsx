import { SERVICE_KEYS } from '@/constants/service-keys';
import TweetTextPanel from '@shared/components/ui/Toolbar/TweetTextPanel';
import { CoreServiceRegistry } from '@shared/container/core-service-registry';
import { CoreService } from '@shared/services/service-manager';
import { LanguageService } from '@shared/services/language-service';
import { render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('TweetTextPanel', () => {
  let languageService: LanguageService;

  beforeEach(() => {
    languageService = LanguageService.getInstance();

    vi.spyOn(languageService, 'translate').mockImplementation((key: string) => {
      const translations: Record<string, string> = {
        'toolbar.tweetText': 'Tweet text',
      };
      return translations[key] || key;
    });

    CoreServiceRegistry.register(SERVICE_KEYS.LANGUAGE, languageService);
  });

  afterEach(() => {
    vi.clearAllMocks();
    CoreService.resetInstance();
  });

  describe('Rendering', () => {
    it('should render tweet text header', () => {
      render(() => <TweetTextPanel tweetText="Hello world" tweetTextHTML={undefined} />);

      expect(screen.getByText('Tweet text')).toBeInTheDocument();
    });

    it('should render tweet content container with correct attributes', () => {
      const { container } = render(() => (
        <TweetTextPanel tweetText="Hello world" tweetTextHTML={undefined} />
      ));

      const tweetContent = container.querySelector('[data-gallery-element="tweet-content"]');
      expect(tweetContent).toBeInTheDocument();
      expect(tweetContent).toHaveAttribute('data-gallery-scrollable', 'true');
    });
  });

  describe('Text Content Rendering (Non-HTML)', () => {
    it('should render plain text content', () => {
      render(() => <TweetTextPanel tweetText="Just some plain text" tweetTextHTML={undefined} />);

      expect(screen.getByText('Just some plain text')).toBeInTheDocument();
    });

    it('should render links from plain text', () => {
      render(() => (
        <TweetTextPanel tweetText="Check out https://example.com" tweetTextHTML={undefined} />
      ));

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link).toHaveAttribute('data-kind', 'url');
    });

    it('should render mentions from plain text', () => {
      render(() => <TweetTextPanel tweetText="Hello @username" tweetTextHTML={undefined} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://x.com/username');
      expect(link).toHaveAttribute('data-kind', 'mention');
      expect(link).toHaveTextContent('@username');
    });

    it('should render hashtags from plain text', () => {
      render(() => <TweetTextPanel tweetText="Check #trending" tweetTextHTML={undefined} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://x.com/hashtag/trending');
      expect(link).toHaveAttribute('data-kind', 'hashtag');
      expect(link).toHaveTextContent('#trending');
    });

    it('should render cashtags from plain text', () => {
      render(() => <TweetTextPanel tweetText="Investing in $AAPL" tweetTextHTML={undefined} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://x.com/search?q=%24AAPL');
      expect(link).toHaveAttribute('data-kind', 'cashtag');
      expect(link).toHaveTextContent('$AAPL');
    });

    it('should render line breaks from plain text', () => {
      render(() => (
        <TweetTextPanel tweetText={'Line 1\nLine 2'} tweetTextHTML={undefined} />
      ));

      // BR elements should be present
      const { container } = render(() => (
        <TweetTextPanel tweetText={'Line 1\nLine 2'} tweetTextHTML={undefined} />
      ));
      expect(container.querySelectorAll('br').length).toBeGreaterThanOrEqual(1);
    });

    it('should render empty string when tweetText is empty', () => {
      render(() => <TweetTextPanel tweetText="" tweetTextHTML={undefined} />);

      // Should still render the container
      expect(screen.getByText('Tweet text')).toBeInTheDocument();
    });
  });

  describe('HTML Content Rendering', () => {
    it('should render sanitized HTML content', () => {
      const htmlContent = '<span>Hello <strong>world</strong></span>';
      render(() => <TweetTextPanel tweetText={undefined} tweetTextHTML={htmlContent} />);

      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('should prefer tweetTextHTML over tweetText when both provided', () => {
      render(() => (
        <TweetTextPanel tweetText="Plain text" tweetTextHTML="<span>HTML content</span>" />
      ));

      expect(screen.getByText('HTML content')).toBeInTheDocument();
    });

    it('should sanitize dangerous HTML', () => {
      const dangerousHtml = '<script>alert("xss")</script><span>Safe content</span>';
      render(() => <TweetTextPanel tweetText={undefined} tweetTextHTML={dangerousHtml} />);

      // Script tag should be removed
      expect(screen.queryByText('alert("xss")')).not.toBeInTheDocument();
      // Safe content should remain
      expect(screen.getByText('Safe content')).toBeInTheDocument();
    });
  });

  describe('Link Click Handling', () => {
    it('should stop propagation when link is clicked', () => {
      render(() => (
        <TweetTextPanel tweetText="Check https://example.com" tweetTextHTML={undefined} />
      ));

      const link = screen.getByRole('link');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');

      link.dispatchEvent(clickEvent);

      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });

  describe('URL Shortening', () => {
    it('should shorten long URLs in display text', () => {
      const longUrl = 'https://example.com/very/long/path/that/exceeds/forty/characters/limit';
      render(() => <TweetTextPanel tweetText={longUrl} tweetTextHTML={undefined} />);

      const link = screen.getByRole('link');
      // The href should still be the full URL
      expect(link).toHaveAttribute('href', longUrl);
      // Display text should be shortened (shortenUrl limits to 40 chars)
      expect(link.textContent?.length).toBeLessThanOrEqual(43); // 40 + "..."
    });
  });

  describe('Mixed Content', () => {
    it('should render complex tweet with multiple token types', () => {
      const tweet = 'Hello @user! Check #topic and https://example.com for $STOCK updates';
      render(() => <TweetTextPanel tweetText={tweet} tweetTextHTML={undefined} />);

      const links = screen.getAllByRole('link');
      expect(links.length).toBe(4); // mention, hashtag, url, cashtag

      const mentions = links.filter((l) => l.getAttribute('data-kind') === 'mention');
      const hashtags = links.filter((l) => l.getAttribute('data-kind') === 'hashtag');
      const urls = links.filter((l) => l.getAttribute('data-kind') === 'url');
      const cashtags = links.filter((l) => l.getAttribute('data-kind') === 'cashtag');

      expect(mentions.length).toBe(1);
      expect(hashtags.length).toBe(1);
      expect(urls.length).toBe(1);
      expect(cashtags.length).toBe(1);
    });
  });

  describe('Fallback Translation', () => {
    it('should use fallback text when translation returns empty', () => {
      vi.spyOn(languageService, 'translate').mockReturnValue('');
      render(() => <TweetTextPanel tweetText="Hello" tweetTextHTML={undefined} />);

      expect(screen.getByText('Tweet text')).toBeInTheDocument();
    });
  });
});
