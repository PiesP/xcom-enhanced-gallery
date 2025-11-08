/**
 * @fileoverview QuoteTweetDetector unit tests
 * @description Phase 342.5: Quote Tweet DOM 구조 분석 테스트
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QuoteTweetDetector } from '@shared/services/media-extraction/strategies';

describe('QuoteTweetDetector', () => {
  let container: HTMLElement;

  beforeEach(() => {
    // JSDOM 환경 설정
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container.innerHTML = '';
  });

  // ============================================================================
  // 1. analyzeQuoteTweetStructure() - 기본 동작
  // ============================================================================

  describe('analyzeQuoteTweetStructure', () => {
    describe('일반 트윗 (단일 article)', () => {
      it('단일 article 요소 내 이미지 클릭 감지', () => {
        // Arrange
        const article = document.createElement('article');
        article.setAttribute('data-testid', 'tweet');

        const img = document.createElement('img');
        img.src = 'https://pbs.twimg.com/media/test.jpg';

        article.appendChild(img);
        container.appendChild(article);

        // Act
        const result = QuoteTweetDetector.analyzeQuoteTweetStructure(img);

        // Assert
        expect(result.isQuoteTweet).toBe(false);
        expect(result.clickedLocation).toBe('original');
        expect(result.outerArticle).toBe(article);
        expect(result.innerArticle).toBeNull();
        expect(result.targetArticle).toBe(article);
      });

      it('일반 트윗 내 비디오 클릭 감지', () => {
        // Arrange
        const article = document.createElement('article');
        article.setAttribute('data-testid', 'tweet');

        const video = document.createElement('video');
        video.src = 'https://video.twimg.com/test.mp4';

        article.appendChild(video);
        container.appendChild(article);

        // Act
        const result = QuoteTweetDetector.analyzeQuoteTweetStructure(video);

        // Assert
        expect(result.isQuoteTweet).toBe(false);
        expect(result.clickedLocation).toBe('original');
        expect(result.targetArticle).toBe(article);
      });

      it('article 요소가 없으면 unknown 반환', () => {
        // Arrange
        const div = document.createElement('div');
        const img = document.createElement('img');
        img.src = 'https://pbs.twimg.com/media/test.jpg';

        div.appendChild(img);
        container.appendChild(div);

        // Act
        const result = QuoteTweetDetector.analyzeQuoteTweetStructure(img);

        // Assert
        expect(result.isQuoteTweet).toBe(false);
        expect(result.clickedLocation).toBe('unknown');
        expect(result.outerArticle).toBeNull();
        expect(result.targetArticle).toBeNull();
      });
    });

    describe('인용 리트윗 (중첩 article)', () => {
      it('내부 article 이미지 클릭 (quoted 감지)', () => {
        // Arrange
        const outerArticle = document.createElement('article');
        outerArticle.setAttribute('data-testid', 'tweet');

        const innerArticle = document.createElement('article');
        innerArticle.setAttribute('data-testid', 'tweet');

        const img = document.createElement('img');
        img.src = 'https://pbs.twimg.com/media/quoted.jpg';

        innerArticle.appendChild(img);
        outerArticle.appendChild(innerArticle);
        container.appendChild(outerArticle);

        // Act
        const result = QuoteTweetDetector.analyzeQuoteTweetStructure(img);

        // Assert
        expect(result.isQuoteTweet).toBe(true);
        expect(result.clickedLocation).toBe('quoted');
        expect(result.outerArticle).toBe(outerArticle);
        expect(result.innerArticle).toBe(innerArticle);
        expect(result.targetArticle).toBe(innerArticle);
      });

      it('외부 article 이미지 클릭 (original 감지)', () => {
        // Arrange
        // 이 시나리오: outerArticle을 직접 클릭하는 경우
        // (예: 인용 리트윗 래퍼의 재공유 버튼 영역)
        const outerArticle = document.createElement('article');
        outerArticle.setAttribute('data-testid', 'tweet');

        const innerArticle = document.createElement('article');
        innerArticle.setAttribute('data-testid', 'tweet');

        const innerImg = document.createElement('img');
        innerImg.src = 'https://pbs.twimg.com/media/quoted.jpg';
        innerArticle.appendChild(innerImg);

        outerArticle.appendChild(innerArticle);

        // 외부 이미지는 outerArticle 직접 하위에만 있음
        const outerImg = document.createElement('img');
        outerImg.src = 'https://pbs.twimg.com/media/original.jpg';
        outerArticle.appendChild(outerImg);

        container.appendChild(outerArticle);

        // Act
        const result = QuoteTweetDetector.analyzeQuoteTweetStructure(outerImg);

        // Assert
        // outerImg 클릭: ancestors = [outerArticle]만 발견
        // articles.length === 1이므로 일반 트윗 취급
        expect(result.isQuoteTweet).toBe(false);
        expect(result.clickedLocation).toBe('original');
        expect(result.targetArticle).toBe(outerArticle);
      });

      it('3중 중첩 article (비정상 구조) 처리', () => {
        // Arrange
        const article1 = document.createElement('article');
        article1.setAttribute('data-testid', 'tweet');

        const article2 = document.createElement('article');
        article2.setAttribute('data-testid', 'tweet');

        const article3 = document.createElement('article');
        article3.setAttribute('data-testid', 'tweet');

        const img = document.createElement('img');
        img.src = 'https://pbs.twimg.com/media/test.jpg';

        article3.appendChild(img);
        article2.appendChild(article3);
        article1.appendChild(article2);
        container.appendChild(article1);

        // Act
        const result = QuoteTweetDetector.analyzeQuoteTweetStructure(img);

        // Assert
        expect(result.isQuoteTweet).toBe(true);
        // article3와 article2를 감지
        expect(result.innerArticle).toBe(article3);
      });
    });

    describe('에러 처리', () => {
      it('null 요소 처리', () => {
        // Act & Assert - null 안전 처리 (에러 없음)
        const result = QuoteTweetDetector.analyzeQuoteTweetStructure(null as any);
        expect(result.isQuoteTweet).toBe(false);
        expect(result.clickedLocation).toBe('unknown');
      });

      it('제거된 DOM 요소 처리', () => {
        // Arrange
        const article = document.createElement('article');
        article.setAttribute('data-testid', 'tweet');
        const img = document.createElement('img');
        img.src = 'https://pbs.twimg.com/media/test.jpg';
        article.appendChild(img);

        // Act - 요소가 DOM에 있을 때 분석
        container.appendChild(article);
        const result1 = QuoteTweetDetector.analyzeQuoteTweetStructure(img);

        // DOM에서 제거해도 요소 자체는 존재
        // (tagName, parentElement 접근 가능)
        container.removeChild(article);

        // 제거된 후에도 요소 참조는 존재
        const result2 = QuoteTweetDetector.analyzeQuoteTweetStructure(img);

        // Assert
        expect(result1.isQuoteTweet).toBe(false);
        expect(result2.isQuoteTweet).toBe(false);
      });
    });
  });

  // ============================================================================
  // 2. extractQuoteTweetMetadata() - 메타데이터 추출
  // ============================================================================

  describe('extractQuoteTweetMetadata', () => {
    it('일반 트윗 메타데이터 추출', () => {
      // Arrange
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');

      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/media/test.jpg';

      article.appendChild(img);
      container.appendChild(article);

      // Act
      const result = QuoteTweetDetector.extractQuoteTweetMetadata(img);

      // Assert
      expect(result.isQuoteTweet).toBe(false);
      expect(result.clickedLocation).toBe('original');
    });

    it('인용 리트윗 메타데이터 추출 (ID 포함)', () => {
      // Arrange
      const outerArticle = document.createElement('article');
      outerArticle.setAttribute('data-testid', 'tweet');

      const innerArticle = document.createElement('article');
      innerArticle.setAttribute('data-testid', 'tweet');

      // 트윗 ID 링크 추가
      const statusLink = document.createElement('a');
      statusLink.href = '/john_doe/status/1234567890';
      innerArticle.appendChild(statusLink);

      // 사용자명 링크 추가
      const userLink = document.createElement('a');
      userLink.href = '/john_doe';
      innerArticle.appendChild(userLink);

      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/media/quoted.jpg';
      innerArticle.appendChild(img);

      outerArticle.appendChild(innerArticle);
      container.appendChild(outerArticle);

      // Act
      const result = QuoteTweetDetector.extractQuoteTweetMetadata(img);

      // Assert
      expect(result.isQuoteTweet).toBe(true);
      expect(result.clickedLocation).toBe('quoted');
      expect(result.quotedTweetId).toBe('1234567890');
      expect(result.quotedUsername).toBe('john_doe');
      expect(result.sourceLocation).toBe('quoted');
    });

    it('인용 리트윗 메타데이터 추출 (ID 없음)', () => {
      // Arrange
      const outerArticle = document.createElement('article');
      outerArticle.setAttribute('data-testid', 'tweet');

      const innerArticle = document.createElement('article');
      innerArticle.setAttribute('data-testid', 'tweet');

      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/media/quoted.jpg';
      innerArticle.appendChild(img);

      outerArticle.appendChild(innerArticle);
      container.appendChild(outerArticle);

      // Act
      const result = QuoteTweetDetector.extractQuoteTweetMetadata(img);

      // Assert
      expect(result.isQuoteTweet).toBe(true);
      expect(result.quotedTweetId).toBeUndefined();
      expect(result.quotedUsername).toBeUndefined();
    });

    it('여러 상태 링크에서 정확한 ID 추출', () => {
      // Arrange
      const outerArticle = document.createElement('article');
      outerArticle.setAttribute('data-testid', 'tweet');

      const innerArticle = document.createElement('article');
      innerArticle.setAttribute('data-testid', 'tweet');

      // 여러 링크 추가 (순서대로)
      const userLink = document.createElement('a');
      userLink.href = '/jane_smith'; // user 링크
      innerArticle.appendChild(userLink);

      // 정상 status 링크 (user 경로 포함)
      const link1 = document.createElement('a');
      link1.href = '/jane_smith/status/1111111111';
      innerArticle.appendChild(link1);

      // 단순 status 링크 (user 경로 없음, 덜 특정적)
      const link2 = document.createElement('a');
      link2.href = '/status/9999999999';
      innerArticle.appendChild(link2);

      const img = document.createElement('img');
      innerArticle.appendChild(img);

      outerArticle.appendChild(innerArticle);
      container.appendChild(outerArticle);

      // Act
      const result = QuoteTweetDetector.extractQuoteTweetMetadata(img);

      // Assert - 첫 번째 발견된 /status/ 링크가 추출됨
      expect(result.quotedTweetId).toBe('1111111111');
      expect(result.quotedUsername).toBe('jane_smith');
    });
  });

  // ============================================================================
  // 3. getMediaContainerForQuoteTweet() - 미디어 컨테이너 찾기
  // ============================================================================

  describe('getMediaContainerForQuoteTweet', () => {
    it('일반 트윗에서 미디어 컨테이너 찾기', () => {
      // Arrange - 선택자 패턴: :scope > div > [data-testid="tweetPhoto"]
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

      // Act
      const result = QuoteTweetDetector.getMediaContainerForQuoteTweet(img);

      // Assert
      expect(result).toBe(mediaContainer);
    });

    it('인용 리트윗에서 올바른 미디어 컨테이너 찾기', () => {
      // Arrange
      const outerArticle = document.createElement('article');
      outerArticle.setAttribute('data-testid', 'tweet');

      const outerWrapper = document.createElement('div');
      const outerMediaContainer = document.createElement('div');
      outerMediaContainer.setAttribute('data-testid', 'tweetPhoto');
      const outerImg = document.createElement('img');
      outerImg.src = 'https://pbs.twimg.com/media/outer.jpg';
      outerMediaContainer.appendChild(outerImg);
      outerWrapper.appendChild(outerMediaContainer);
      outerArticle.appendChild(outerWrapper);

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

      // Act - innerImg 클릭 시 innerMediaContainer 반환
      const result = QuoteTweetDetector.getMediaContainerForQuoteTweet(innerImg);

      // Assert
      expect(result).toBe(innerMediaContainer);
    });

    it('미디어 컨테이너를 찾을 수 없으면 null 반환', () => {
      // Arrange - 깊이 제한을 초과하는 구조 (Phase 370.2: maxDepth=3이므로 4단계 이상)
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');

      const div1 = document.createElement('div');
      const div2 = document.createElement('div');
      const div3 = document.createElement('div');
      const div4 = document.createElement('div');

      const img = document.createElement('img');
      img.src = 'https://example.com/not-twitter.jpg'; // Twitter 미디어 아님

      div4.appendChild(img);
      div3.appendChild(div4);
      div2.appendChild(div3);
      div1.appendChild(div2);
      article.appendChild(div1);
      container.appendChild(article);

      // Act
      const result = QuoteTweetDetector.getMediaContainerForQuoteTweet(img);

      // Assert - Twitter 미디어가 아니므로 null
      expect(result).toBeNull();
    });

    it('다양한 미디어 선택자 지원', () => {
      // Arrange - videoPlayer 선택자 테스트
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');

      const wrapper = document.createElement('div');
      const videoContainer = document.createElement('div');
      videoContainer.setAttribute('data-testid', 'videoPlayer');

      const video = document.createElement('video');
      videoContainer.appendChild(video);
      wrapper.appendChild(videoContainer);
      article.appendChild(wrapper);
      container.appendChild(article);

      // 비디오 클릭으로 테스트
      // Act
      const result = QuoteTweetDetector.getMediaContainerForQuoteTweet(video);

      // Assert
      expect(result).toBe(videoContainer);
    });
  });

  // ============================================================================
  // 4. Private 헬퍼 메서드 (간접 테스트)
  // ============================================================================

  describe('Private helper methods (indirect)', () => {
    it('collectAncestorArticles - 조상 article 순서', () => {
      // Arrange
      const article1 = document.createElement('article');
      article1.setAttribute('data-testid', 'tweet');

      const article2 = document.createElement('article');
      article2.setAttribute('data-testid', 'tweet');

      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/media/test.jpg';

      article2.appendChild(img);
      article1.appendChild(article2);
      container.appendChild(article1);

      // Act
      const result = QuoteTweetDetector.analyzeQuoteTweetStructure(img);

      // Assert
      // article2 (innerArticle)가 article1 (outerArticle)보다 가까워야 함
      expect(result.innerArticle).toBe(article2);
      expect(result.outerArticle).toBe(article1);
    });

    it('extractTweetIdFromArticle - 다양한 status URL 형식', () => {
      // Arrange
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');

      // 표준 status URL
      const link1 = document.createElement('a');
      link1.href = '/john/status/123456789';
      article.appendChild(link1);

      const img = document.createElement('img');
      article.appendChild(img);

      const innerArticle = document.createElement('article');
      innerArticle.setAttribute('data-testid', 'tweet');
      innerArticle.appendChild(article);
      container.appendChild(innerArticle);

      // Act
      const result = QuoteTweetDetector.extractQuoteTweetMetadata(img);

      // Assert (간접 테스트)
      expect(result.quotedTweetId).toBe('123456789');
    });

    it('extractUsernameFromArticle - 사용자명 추출', () => {
      // Arrange
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');

      const userLink = document.createElement('a');
      userLink.href = '/alice_user';
      article.appendChild(userLink);

      const img = document.createElement('img');
      article.appendChild(img);

      const outerArticle = document.createElement('article');
      outerArticle.setAttribute('data-testid', 'tweet');
      outerArticle.appendChild(article);
      container.appendChild(outerArticle);

      // Act
      const result = QuoteTweetDetector.extractQuoteTweetMetadata(img);

      // Assert (간접 테스트)
      expect(result.quotedUsername).toBe('alice_user');
    });
  });

  // ============================================================================
  // 5. 엣지 케이스 & 통합 시나리오
  // ============================================================================

  describe('Edge cases and integration scenarios', () => {
    it('빈 href 속성 처리', () => {
      // Arrange
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');

      const emptyLink = document.createElement('a');
      emptyLink.href = '';
      article.appendChild(emptyLink);

      const img = document.createElement('img');
      article.appendChild(img);

      container.appendChild(article);

      // Act & Assert
      expect(() => {
        QuoteTweetDetector.extractQuoteTweetMetadata(img);
      }).not.toThrow();
    });

    it('잘못된 status URL 무시', () => {
      // Arrange
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');

      const badLink = document.createElement('a');
      badLink.href = '/status/abc'; // 숫자가 아님
      article.appendChild(badLink);

      const img = document.createElement('img');
      article.appendChild(img);

      const outerArticle = document.createElement('article');
      outerArticle.setAttribute('data-testid', 'tweet');
      outerArticle.appendChild(article);
      container.appendChild(outerArticle);

      // Act
      const result = QuoteTweetDetector.extractQuoteTweetMetadata(img);

      // Assert
      expect(result.quotedTweetId).toBeUndefined();
    });

    it('완전한 quote tweet 시나리오 (모든 필드)', () => {
      // Arrange: 복잡한 DOM 구조
      const outerArticle = document.createElement('article');
      outerArticle.setAttribute('data-testid', 'tweet');

      const innerArticle = document.createElement('article');
      innerArticle.setAttribute('data-testid', 'tweet');

      // 메타데이터 링크들
      const statusLink = document.createElement('a');
      statusLink.href = '/bob_dev/status/9876543210';
      innerArticle.appendChild(statusLink);

      const userLink = document.createElement('a');
      userLink.href = '/bob_dev';
      innerArticle.appendChild(userLink);

      // 미디어 (선택자 패턴: :scope > div > [data-testid="tweetPhoto"])
      const wrapper = document.createElement('div');
      const mediaDiv = document.createElement('div');
      mediaDiv.setAttribute('data-testid', 'tweetPhoto');

      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/media/abc123.jpg';
      mediaDiv.appendChild(img);
      wrapper.appendChild(mediaDiv);
      innerArticle.appendChild(wrapper);

      outerArticle.appendChild(innerArticle);
      container.appendChild(outerArticle);

      // Act
      const structure = QuoteTweetDetector.analyzeQuoteTweetStructure(img);
      const metadata = QuoteTweetDetector.extractQuoteTweetMetadata(img);
      const mediaContainer = QuoteTweetDetector.getMediaContainerForQuoteTweet(img);

      // Assert - 모든 메서드 통합 검증
      expect(structure.isQuoteTweet).toBe(true);
      expect(structure.clickedLocation).toBe('quoted');
      expect(structure.targetArticle).toBe(innerArticle);

      expect(metadata.isQuoteTweet).toBe(true);
      expect(metadata.quotedTweetId).toBe('9876543210');
      expect(metadata.quotedUsername).toBe('bob_dev');

      expect(mediaContainer).toBe(mediaDiv);
    });
  });
});
