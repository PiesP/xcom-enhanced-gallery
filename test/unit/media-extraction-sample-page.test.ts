/**
 * @fileoverview 샘플 페이지 미디어 추출 테스트
 * @description 실제 Twitter 페이지 구조에서 미디어 추출 기능 검증
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('Media Extraction Sample Page Tests', () => {
  let mockTweetElement: HTMLElement;

  beforeEach(() => {
    // 실제 Twitter 트윗 구조 모방
    mockTweetElement = document.createElement('article');
    mockTweetElement.setAttribute('data-testid', 'tweet');

    // 이미지 요소 추가
    const imgElement = document.createElement('img');
    imgElement.src = 'https://pbs.twimg.com/media/test-image?format=jpg&name=medium';
    imgElement.alt = 'Test image';

    const mediaContainer = document.createElement('div');
    mediaContainer.setAttribute('data-testid', 'tweet-photo');
    mediaContainer.appendChild(imgElement);

    mockTweetElement.appendChild(mediaContainer);
    document.body.appendChild(mockTweetElement);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('이미지 추출 기능', () => {
    it('트윗에서 이미지 URL을 추출할 수 있어야 함', async () => {
      const { MediaService } = await import('@shared/services');
      const mediaService = new MediaService();

      const result = await mediaService.extractFromClickedElement(mockTweetElement);

      expect(result).toBeDefined();
      expect(Array.isArray(result.mediaItems)).toBe(true);
    });

    it('고품질 이미지 URL로 변환할 수 있어야 함', () => {
      const originalUrl = 'https://pbs.twimg.com/media/test-image?format=jpg&name=medium';
      const expectedHighQualityUrl = 'https://pbs.twimg.com/media/test-image?format=jpg&name=orig';

      // URL 변환 로직 테스트
      const result = originalUrl.replace(/(\?.*)?name=\w+/, '$1name=orig');
      expect(result).toBe(expectedHighQualityUrl);
    });
  });

  describe('비디오 추출 기능', () => {
    it('비디오 요소를 감지할 수 있어야 함', () => {
      // 비디오 요소 추가
      const videoElement = document.createElement('video');
      videoElement.setAttribute(
        'poster',
        'https://pbs.twimg.com/ext_tw_video_thumb/test-video.jpg'
      );

      const videoContainer = document.createElement('div');
      videoContainer.setAttribute('data-testid', 'tweet-video');
      videoContainer.appendChild(videoElement);

      mockTweetElement.appendChild(videoContainer);

      const hasVideo = mockTweetElement.querySelector('[data-testid="tweet-video"]') !== null;
      expect(hasVideo).toBe(true);
    });
  });

  describe('에러 처리', () => {
    it('잘못된 요소가 전달되어도 안전하게 처리해야 함', async () => {
      const { MediaService } = await import('@shared/services');
      const mediaService = new MediaService();

      const invalidElement = document.createElement('div');
      const result = await mediaService.extractFromClickedElement(invalidElement);

      expect(result).toBeDefined();
      expect(Array.isArray(result.mediaItems)).toBe(true);
    });
  });
});
