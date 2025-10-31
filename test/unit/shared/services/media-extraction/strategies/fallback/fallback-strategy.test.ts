/**
 * @fileoverview FallbackStrategy 테스트
 * @description Fallback 미디어 추출 전략 테스트 (TDD)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FallbackStrategy } from '@/shared/services/media-extraction/strategies/fallback/fallback-strategy';
import type { TweetInfo } from '@/shared/types/media.types';

describe('FallbackStrategy', () => {
  let strategy: FallbackStrategy;
  let container: HTMLElement;

  beforeEach(() => {
    strategy = new FallbackStrategy();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  describe('extract() - 통합 추출', () => {
    it('빈 컨테이너에서는 빈 결과를 반환해야 함', async () => {
      const result = await strategy.extract(container, container);

      expect(result.success).toBe(false);
      expect(result.mediaItems).toHaveLength(0);
      expect(result.metadata.strategy).toBe('fallback');
    });

    it('여러 타입의 미디어를 모두 추출해야 함', async () => {
      // 이미지
      const img = document.createElement('img');
      img.src = 'https://example.com/image.jpg';
      container.appendChild(img);

      // 비디오
      const video = document.createElement('video');
      video.src = 'https://example.com/video.mp4';
      container.appendChild(video);

      // 데이터 속성
      const dataDiv = document.createElement('div');
      dataDiv.setAttribute('data-src', 'https://example.com/data-image.jpg');
      container.appendChild(dataDiv);

      const result = await strategy.extract(container, container);

      expect(result.success).toBe(true);
      expect(result.mediaItems.length).toBeGreaterThanOrEqual(3);
    });

    it('클릭된 요소의 인덱스를 정확히 추적해야 함', async () => {
      const img1 = document.createElement('img');
      img1.src = 'https://example.com/image1.jpg';
      container.appendChild(img1);

      const img2 = document.createElement('img');
      img2.src = 'https://example.com/image2.jpg';
      container.appendChild(img2);

      const result = await strategy.extract(container, img2);

      expect(result.clickedIndex).toBe(1);
    });

    it('TweetInfo를 포함한 결과를 반환해야 함', async () => {
      const img = document.createElement('img');
      img.src = 'https://example.com/image.jpg';
      container.appendChild(img);

      const tweetInfo: TweetInfo = {
        tweetId: '123',
        username: 'testuser',
        tweetUrl: 'https://x.com/testuser/status/123',
        extractionMethod: 'fallback',
        confidence: 1,
      };

      const result = await strategy.extract(container, container, tweetInfo);

      expect(result.tweetInfo).toEqual(tweetInfo);
      expect(result.mediaItems[0]?.tweetUsername).toBe('testuser');
    });
  });

  describe('extractFromImages() - 이미지 추출', () => {
    it('img 태그에서 이미지를 추출해야 함', async () => {
      const img = document.createElement('img');
      img.src = 'https://example.com/image.jpg';
      img.alt = 'Test Image';
      container.appendChild(img);

      const result = await strategy.extract(container, container);

      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(1);
      expect(result.mediaItems[0]?.url).toBe('https://example.com/image.jpg');
      expect(result.mediaItems[0]?.type).toBe('image');
      expect(result.mediaItems[0]?.alt).toBe('Test Image');
    });

    it('profile_images URL은 필터링해야 함', async () => {
      const img = document.createElement('img');
      img.src = 'https://example.com/profile_images/test.jpg';
      container.appendChild(img);

      const result = await strategy.extract(container, container);

      expect(result.success).toBe(false);
      expect(result.mediaItems).toHaveLength(0);
    });

    it('http로 시작하지 않는 URL은 필터링해야 함', async () => {
      const img = document.createElement('img');
      img.src = 'data:image/png;base64,abc';
      container.appendChild(img);

      const result = await strategy.extract(container, container);

      expect(result.success).toBe(false);
      expect(result.mediaItems).toHaveLength(0);
    });

    it('여러 이미지를 추출해야 함', async () => {
      for (let i = 0; i < 3; i++) {
        const img = document.createElement('img');
        img.src = `https://example.com/image${i}.jpg`;
        container.appendChild(img);
      }

      const result = await strategy.extract(container, container);

      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(3);
    });

    it('클릭된 이미지를 정확히 식별해야 함', async () => {
      const img1 = document.createElement('img');
      img1.src = 'https://example.com/image1.jpg';
      container.appendChild(img1);

      const img2 = document.createElement('img');
      img2.src = 'https://example.com/image2.jpg';
      container.appendChild(img2);

      const result = await strategy.extract(container, img2);

      expect(result.clickedIndex).toBe(1);
    });
  });

  describe('extractFromVideos() - 비디오 추출', () => {
    it('video 태그에서 비디오를 추출해야 함', async () => {
      const video = document.createElement('video');
      video.src = 'https://example.com/video.mp4';
      video.setAttribute('poster', 'https://example.com/thumbnail.jpg');
      container.appendChild(video);

      const result = await strategy.extract(container, container);

      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(1);
      expect(result.mediaItems[0]?.url).toBe('https://example.com/video.mp4');
      expect(result.mediaItems[0]?.type).toBe('video');
      expect(result.mediaItems[0]?.thumbnailUrl).toBe('https://example.com/thumbnail.jpg');
    });

    it('poster 속성이 있으면 src 대신 poster를 사용해야 함', async () => {
      const video = document.createElement('video');
      video.setAttribute('poster', 'https://example.com/poster.jpg');
      container.appendChild(video);

      const result = await strategy.extract(container, container);

      expect(result.success).toBe(true);
      expect(result.mediaItems[0]?.url).toBe('https://example.com/poster.jpg');
    });

    it('src와 poster가 모두 없으면 필터링해야 함', async () => {
      const video = document.createElement('video');
      container.appendChild(video);

      const result = await strategy.extract(container, container);

      expect(result.success).toBe(false);
      expect(result.mediaItems).toHaveLength(0);
    });

    it('클릭된 비디오를 정확히 식별해야 함', async () => {
      const video1 = document.createElement('video');
      video1.src = 'https://example.com/video1.mp4';
      container.appendChild(video1);

      const video2 = document.createElement('video');
      video2.src = 'https://example.com/video2.mp4';
      container.appendChild(video2);

      const result = await strategy.extract(container, video2);

      expect(result.clickedIndex).toBe(1);
    });
  });

  describe('extractFromDataAttributes() - 데이터 속성 추출', () => {
    it('data-src 속성에서 미디어를 추출해야 함', async () => {
      const div = document.createElement('div');
      div.setAttribute('data-src', 'https://example.com/data-image.jpg');
      container.appendChild(div);

      const result = await strategy.extract(container, container);

      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(1);
      expect(result.mediaItems[0]?.url).toBe('https://example.com/data-image.jpg');
    });

    it('data-background-image 속성에서 미디어를 추출해야 함', async () => {
      const div = document.createElement('div');
      div.setAttribute('data-background-image', 'https://example.com/bg.jpg');
      container.appendChild(div);

      const result = await strategy.extract(container, container);

      expect(result.success).toBe(true);
      expect(result.mediaItems[0]?.url).toBe('https://example.com/bg.jpg');
    });

    it('data-url 속성에서 미디어를 추출해야 함', async () => {
      const div = document.createElement('div');
      div.setAttribute('data-url', 'https://example.com/data.jpg');
      container.appendChild(div);

      const result = await strategy.extract(container, container);

      expect(result.success).toBe(true);
      expect(result.mediaItems[0]?.url).toBe('https://example.com/data.jpg');
    });

    it('URL에 따라 타입을 자동 감지해야 함', async () => {
      const videoDiv = document.createElement('div');
      videoDiv.setAttribute('data-src', 'https://example.com/video.mp4');
      container.appendChild(videoDiv);

      const imageDiv = document.createElement('div');
      imageDiv.setAttribute('data-src', 'https://example.com/image.jpg');
      container.appendChild(imageDiv);

      const result = await strategy.extract(container, container);

      expect(result.mediaItems[0]?.type).toBe('video');
      expect(result.mediaItems[1]?.type).toBe('image');
    });

    it('클릭된 데이터 속성 요소를 정확히 식별해야 함', async () => {
      const div1 = document.createElement('div');
      div1.setAttribute('data-src', 'https://example.com/data1.jpg');
      container.appendChild(div1);

      const div2 = document.createElement('div');
      div2.setAttribute('data-src', 'https://example.com/data2.jpg');
      container.appendChild(div2);

      const result = await strategy.extract(container, div2);

      expect(result.clickedIndex).toBe(1);
    });
  });

  describe('extractFromBackgroundImages() - 배경 이미지 추출', () => {
    it('배경 이미지에서 URL을 추출해야 함', async () => {
      const div = document.createElement('div');
      div.style.backgroundImage = 'url("https://example.com/bg.jpg")';
      container.appendChild(div);

      const result = await strategy.extract(container, container);

      expect(result.success).toBe(true);
      expect(result.mediaItems.some(item => item.url === 'https://example.com/bg.jpg')).toBe(true);
    });

    it('작은따옴표 URL을 처리해야 함', async () => {
      const div = document.createElement('div');
      div.style.backgroundImage = "url('https://example.com/bg.jpg')";
      container.appendChild(div);

      const result = await strategy.extract(container, container);

      expect(result.success).toBe(true);
      expect(result.mediaItems.some(item => item.url === 'https://example.com/bg.jpg')).toBe(true);
    });

    it('따옴표 없는 URL을 처리해야 함', async () => {
      const div = document.createElement('div');
      div.style.backgroundImage = 'url(https://example.com/bg.jpg)';
      container.appendChild(div);

      const result = await strategy.extract(container, container);

      expect(result.success).toBe(true);
      expect(result.mediaItems.some(item => item.url === 'https://example.com/bg.jpg')).toBe(true);
    });

    it('background-image: none은 필터링해야 함', async () => {
      const div = document.createElement('div');
      div.style.backgroundImage = 'none';
      container.appendChild(div);

      const result = await strategy.extract(container, container);

      // 배경 이미지만 있는 경우 필터링됨
      expect(
        result.mediaItems.filter(item => item.metadata?.fallbackSource === 'background-image')
      ).toHaveLength(0);
    });
  });

  describe('Helper Methods - 헬퍼 메서드', () => {
    describe('isValidMediaUrl()', () => {
      it('http로 시작하는 URL은 유효해야 함', async () => {
        const img = document.createElement('img');
        img.src = 'https://example.com/image.jpg';
        container.appendChild(img);

        const result = await strategy.extract(container, container);

        expect(result.success).toBe(true);
      });

      it('profile_images가 포함된 URL은 무효해야 함', async () => {
        const img = document.createElement('img');
        img.src = 'https://example.com/profile_images/test.jpg';
        container.appendChild(img);

        const result = await strategy.extract(container, container);

        expect(result.success).toBe(false);
      });

      it('상대 경로는 무효해야 함', async () => {
        const img = document.createElement('img');
        img.src = '/relative/path.jpg';
        container.appendChild(img);

        const result = await strategy.extract(container, container);

        expect(result.success).toBe(false);
      });
    });

    describe('detectMediaType()', () => {
      it('video가 포함된 URL은 video 타입이어야 함', async () => {
        const div = document.createElement('div');
        div.setAttribute('data-src', 'https://example.com/video/test.jpg');
        container.appendChild(div);

        const result = await strategy.extract(container, container);

        expect(result.mediaItems[0]?.type).toBe('video');
      });

      it('.mp4 확장자는 video 타입이어야 함', async () => {
        const div = document.createElement('div');
        div.setAttribute('data-src', 'https://example.com/test.mp4');
        container.appendChild(div);

        const result = await strategy.extract(container, container);

        expect(result.mediaItems[0]?.type).toBe('video');
      });

      it('.webm 확장자는 video 타입이어야 함', async () => {
        const div = document.createElement('div');
        div.setAttribute('data-src', 'https://example.com/test.webm');
        container.appendChild(div);

        const result = await strategy.extract(container, container);

        expect(result.mediaItems[0]?.type).toBe('video');
      });

      it('기본적으로 image 타입이어야 함', async () => {
        const div = document.createElement('div');
        div.setAttribute('data-src', 'https://example.com/test.jpg');
        container.appendChild(div);

        const result = await strategy.extract(container, container);

        expect(result.mediaItems[0]?.type).toBe('image');
      });
    });

    describe('extractUrlFromBackgroundImage()', () => {
      it('큰따옴표 URL을 추출해야 함', async () => {
        const div = document.createElement('div');
        div.style.backgroundImage = 'url("https://example.com/bg.jpg")';
        container.appendChild(div);

        const result = await strategy.extract(container, container);

        expect(result.mediaItems.some(item => item.url === 'https://example.com/bg.jpg')).toBe(
          true
        );
      });

      it('작은따옴표 URL을 추출해야 함', async () => {
        const div = document.createElement('div');
        div.style.backgroundImage = "url('https://example.com/bg.jpg')";
        container.appendChild(div);

        const result = await strategy.extract(container, container);

        expect(result.mediaItems.some(item => item.url === 'https://example.com/bg.jpg')).toBe(
          true
        );
      });

      it('따옴표 없는 URL을 추출해야 함', async () => {
        const div = document.createElement('div');
        div.style.backgroundImage = 'url(https://example.com/bg.jpg)';
        container.appendChild(div);

        const result = await strategy.extract(container, container);

        expect(result.mediaItems.some(item => item.url === 'https://example.com/bg.jpg')).toBe(
          true
        );
      });
    });
  });

  describe('MediaInfo 생성', () => {
    it('올바른 fallbackSource 메타데이터를 포함해야 함', async () => {
      const img = document.createElement('img');
      img.src = 'https://example.com/image.jpg';
      container.appendChild(img);

      const result = await strategy.extract(container, container);

      expect(result.mediaItems[0]?.metadata?.fallbackSource).toBe('img-element');
    });

    it('TweetInfo의 username을 tweetUsername에 포함해야 함', async () => {
      const img = document.createElement('img');
      img.src = 'https://example.com/image.jpg';
      container.appendChild(img);

      const tweetInfo: TweetInfo = {
        tweetId: '123',
        username: 'testuser',
        tweetUrl: 'https://x.com/testuser/status/123',
        extractionMethod: 'fallback',
        confidence: 1,
      };

      const result = await strategy.extract(container, container, tweetInfo);

      expect(result.mediaItems[0]?.tweetUsername).toBe('testuser');
      expect(result.mediaItems[0]?.tweetId).toBe('123');
    });

    it('originalUrl과 url이 동일해야 함', async () => {
      const img = document.createElement('img');
      img.src = 'https://example.com/image.jpg';
      container.appendChild(img);

      const result = await strategy.extract(container, container);

      expect(result.mediaItems[0]?.url).toBe(result.mediaItems[0]?.originalUrl);
    });
  });

  describe('에러 처리', () => {
    it('추출 중 에러가 발생하면 실패 결과를 반환해야 함', async () => {
      // 잘못된 DOM 구조로 에러 유발
      const brokenContainer = document.createElement('div');
      const brokenChild = document.createElement('div');
      brokenContainer.appendChild(brokenChild);

      // querySelectorAll을 모킹하여 에러 발생
      const originalQSA = brokenContainer.querySelectorAll;
      brokenContainer.querySelectorAll = vi.fn(() => {
        throw new Error('Mock querySelectorAll error');
      }) as any;

      const result = await strategy.extract(brokenContainer, brokenChild);

      expect(result.success).toBe(false);
      expect(result.metadata.strategy).toBe('fallback-failed');
      expect(result.metadata.error).toBeDefined();

      // 복원
      brokenContainer.querySelectorAll = originalQSA;
    });

    it('TweetInfo가 없어도 정상 동작해야 함', async () => {
      const img = document.createElement('img');
      img.src = 'https://example.com/image.jpg';
      container.appendChild(img);

      const result = await strategy.extract(container, container);

      expect(result.success).toBe(true);
      expect(result.tweetInfo).toBeNull();
    });
  });

  describe('클릭 인덱스 우선순위', () => {
    it('첫 번째 소스에서 클릭 인덱스를 찾으면 이후 소스는 무시해야 함', async () => {
      // 이미지에 클릭된 요소
      const clickedImg = document.createElement('img');
      clickedImg.src = 'https://example.com/clicked.jpg';
      container.appendChild(clickedImg);

      // 비디오 추가 (클릭되지 않음)
      const video = document.createElement('video');
      video.src = 'https://example.com/video.mp4';
      container.appendChild(video);

      const result = await strategy.extract(container, clickedImg);

      // 클릭 인덱스는 0이어야 함 (첫 번째 이미지)
      expect(result.clickedIndex).toBe(0);
    });
  });
});
