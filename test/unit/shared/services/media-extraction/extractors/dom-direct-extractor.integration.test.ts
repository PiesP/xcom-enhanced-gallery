/**
 * @fileoverview DOMDirectExtractor Integration Tests with QuoteTweetDetector
 * @description Phase 342.5b: Integration testing for quote tweet media extraction
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DOMDirectExtractor } from '@shared/services/media-extraction/extractors/dom-direct-extractor';
import { QuoteTweetDetector } from '@shared/services/media-extraction/strategies/quote-tweet-detector';
import type { MediaExtractionOptions } from '@shared/types/media.types';

describe('DOMDirectExtractor + QuoteTweetDetector Integration', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container.parentElement === document.body) {
      document.body.removeChild(container);
    }
    container.innerHTML = '';
  });

  // ============================================================================
  // 1. Quote Tweet Detection with DOM Extraction
  // ============================================================================

  describe('Quote tweet detection integration', () => {
    it('일반 트윗에서 미디어 추출', async () => {
      // Arrange
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');

      const wrapper = document.createElement('div');
      const mediaContainer = document.createElement('div');
      mediaContainer.setAttribute('data-testid', 'tweetPhoto');

      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/media/test.jpg';

      mediaContainer.appendChild(img);
      wrapper.appendChild(mediaContainer);
      article.appendChild(wrapper);
      container.appendChild(article);

      const extractor = new DOMDirectExtractor();
      const options: MediaExtractionOptions = {};

      // Act
      const result = await extractor.extract(img, options, 'test-1');

      // Assert
      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(1);
      expect(result.mediaItems[0].url).toContain('test.jpg');
    });

    it('인용 리트윗 내부 이미지에서 미디어 추출', async () => {
      // Arrange - Quote tweet structure
      const outerArticle = document.createElement('article');
      outerArticle.setAttribute('data-testid', 'tweet');

      const innerArticle = document.createElement('article');
      innerArticle.setAttribute('data-testid', 'tweet');

      const innerWrapper = document.createElement('div');
      const innerMediaContainer = document.createElement('div');
      innerMediaContainer.setAttribute('data-testid', 'tweetPhoto');

      const innerImg = document.createElement('img');
      innerImg.src = 'https://pbs.twimg.com/media/inner.jpg';

      innerMediaContainer.appendChild(innerImg);
      innerWrapper.appendChild(innerMediaContainer);
      innerArticle.appendChild(innerWrapper);

      outerArticle.appendChild(innerArticle);
      container.appendChild(outerArticle);

      const extractor = new DOMDirectExtractor();
      const options: MediaExtractionOptions = {};

      // Act
      const structure = QuoteTweetDetector.analyzeQuoteTweetStructure(innerImg);
      const result = await extractor.extract(innerImg, options, 'test-2');

      // Assert
      expect(structure.isQuoteTweet).toBe(true);
      expect(result.success).toBe(true);
      expect(result.mediaItems[0].url).toContain('inner.jpg');
    });
  });

  // ============================================================================
  // 2. Multiple Media Scenarios
  // ============================================================================

  describe('Multiple media extraction', () => {
    it('여러 이미지 포함된 트윗 추출', async () => {
      // Arrange
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');

      for (let i = 0; i < 4; i++) {
        const wrapper = document.createElement('div');
        const mediaContainer = document.createElement('div');
        mediaContainer.setAttribute('data-testid', 'tweetPhoto');

        const img = document.createElement('img');
        img.src = `https://pbs.twimg.com/media/photo${i}.jpg`;

        mediaContainer.appendChild(img);
        wrapper.appendChild(mediaContainer);
        article.appendChild(wrapper);
      }

      container.appendChild(article);

      const extractor = new DOMDirectExtractor();
      const firstImg = article.querySelector('img') as HTMLImageElement;
      const options: MediaExtractionOptions = {};

      // Act
      const result = await extractor.extract(firstImg, options, 'test-3');

      // Assert
      expect(result.success).toBe(true);
      expect(result.mediaItems.length).toBeGreaterThan(0);
    });

    it('비디오와 이미지 혼합 추출', async () => {
      // Arrange
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');

      const wrapper = document.createElement('div');
      const videoContainer = document.createElement('div');
      videoContainer.setAttribute('data-testid', 'videoPlayer');

      const video = document.createElement('video');
      video.src = 'https://video.twimg.com/media/video.mp4';

      videoContainer.appendChild(video);
      wrapper.appendChild(videoContainer);
      article.appendChild(wrapper);
      container.appendChild(article);

      const extractor = new DOMDirectExtractor();
      const options: MediaExtractionOptions = {};

      // Act
      const result = await extractor.extract(video, options, 'test-4');

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // 3. Error Handling
  // ============================================================================

  describe('Error handling', () => {
    it('detached element 처리', async () => {
      // Arrange
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');

      const wrapper = document.createElement('div');
      const mediaContainer = document.createElement('div');
      mediaContainer.setAttribute('data-testid', 'tweetPhoto');

      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/media/test.jpg';

      mediaContainer.appendChild(img);
      wrapper.appendChild(mediaContainer);
      article.appendChild(wrapper);
      container.appendChild(article);

      const extractor = new DOMDirectExtractor();
      const options: MediaExtractionOptions = {};

      // Detach
      article.remove();

      // Act - 요소 참조는 유지되어 추출 가능
      const result = await extractor.extract(img, options, 'test-5');

      // Assert
      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(1);
    });

    it('미디어 없는 article 처리', async () => {
      // Arrange
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');

      const div = document.createElement('div');
      div.textContent = 'No media here';
      article.appendChild(div);
      container.appendChild(article);

      const extractor = new DOMDirectExtractor();
      const options: MediaExtractionOptions = {};

      // Act
      const result = await extractor.extract(div as HTMLElement, options, 'test-6');

      // Assert
      expect(result.success).toBe(false);
    });

    it('null element 안전 처리', async () => {
      // Arrange
      const extractor = new DOMDirectExtractor();
      const options: MediaExtractionOptions = {};

      // Act & Assert - 에러를 던지거나 실패 반환
      try {
        const result = await extractor.extract(null as any, options, 'test-7');
        expect(result.success).toBe(false);
      } catch (error: any) {
        // DOMCache가 null 컨테이너에 대해 에러를 던지는 것도 정상 동작
        expect(error.message).toContain('Container is null or undefined');
      }
    });
  });

  // ============================================================================
  // 4. Quote Tweet Metadata with Extraction
  // ============================================================================

  describe('Quote tweet metadata integration', () => {
    it('인용 리트윗 메타데이터와 함께 미디어 추출', async () => {
      // Arrange
      const outerArticle = document.createElement('article');
      outerArticle.setAttribute('data-testid', 'tweet');

      const innerArticle = document.createElement('article');
      innerArticle.setAttribute('data-testid', 'tweet');

      // 메타데이터
      const statusLink = document.createElement('a');
      statusLink.href = '/author/status/9876543210';
      innerArticle.appendChild(statusLink);

      // 미디어
      const innerWrapper = document.createElement('div');
      const innerMediaContainer = document.createElement('div');
      innerMediaContainer.setAttribute('data-testid', 'tweetPhoto');

      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/media/quoted.jpg';

      innerMediaContainer.appendChild(img);
      innerWrapper.appendChild(innerMediaContainer);
      innerArticle.appendChild(innerWrapper);

      outerArticle.appendChild(innerArticle);
      container.appendChild(outerArticle);

      const extractor = new DOMDirectExtractor();
      const options: MediaExtractionOptions = {};

      // Act
      const structure = QuoteTweetDetector.analyzeQuoteTweetStructure(img);
      const metadata = QuoteTweetDetector.extractQuoteTweetMetadata(img);
      const result = await extractor.extract(img, options, 'test-8');

      // Assert
      expect(structure.isQuoteTweet).toBe(true);
      expect(metadata.isQuoteTweet).toBe(true);
      expect(metadata.quotedTweetId).toBe('9876543210');
      expect(result.success).toBe(true);
      expect(result.mediaItems[0].url).toContain('quoted.jpg');
    });
  });

  // ============================================================================
  // 5. Performance & Large DOM
  // ============================================================================

  describe('Performance considerations', () => {
    it('대규모 DOM 트리에서 효율적 처리', async () => {
      // Arrange - 큰 DOM 트리
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');

      for (let i = 0; i < 50; i++) {
        const div = document.createElement('div');
        div.textContent = `Content ${i}`;
        article.appendChild(div);
      }

      const wrapper = document.createElement('div');
      const mediaContainer = document.createElement('div');
      mediaContainer.setAttribute('data-testid', 'tweetPhoto');

      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/media/test.jpg';

      mediaContainer.appendChild(img);
      wrapper.appendChild(mediaContainer);
      article.appendChild(wrapper);
      container.appendChild(article);

      const extractor = new DOMDirectExtractor();
      const options: MediaExtractionOptions = {};

      // Act
      const startTime = performance.now();
      const result = await extractor.extract(img, options, 'test-9');
      const endTime = performance.now();

      // Assert
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(500); // 500ms 이내
    });
  });
});
