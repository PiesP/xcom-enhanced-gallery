/**
 * @fileoverview Twitter Video Extractor 테스트
 * @description TDD 방식으로 작성된 twitter-video-extractor.ts 테스트
 *
 * 목표: 6.34% → 80% 이상 커버리지 달성
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isVideoThumbnail,
  isVideoPlayer,
  isVideoElement,
  extractTweetId,
  getTweetIdFromContainer,
  getVideoMediaEntry,
  getVideoUrlFromThumbnail,
  TwitterAPI,
  type TweetMediaEntry,
} from '../../../../../src/shared/services/media/twitter-video-extractor';
import { STABLE_SELECTORS } from '../../../../../src/constants';

describe('twitter-video-extractor', () => {
  describe('isVideoThumbnail', () => {
    let mockImg: HTMLImageElement;

    beforeEach(() => {
      mockImg = document.createElement('img');
    });

    it('should return true for ext_tw_video_thumb', () => {
      mockImg.src = 'https://pbs.twimg.com/ext_tw_video_thumb/123456/pu/img/test.jpg';
      expect(isVideoThumbnail(mockImg)).toBe(true);
    });

    it('should return true for amplify_video_thumb', () => {
      mockImg.src = 'https://pbs.twimg.com/amplify_video_thumb/123456/img/test.jpg';
      expect(isVideoThumbnail(mockImg)).toBe(true);
    });

    it('should return true for tweet_video_thumb', () => {
      mockImg.src = 'https://pbs.twimg.com/tweet_video_thumb/123456.jpg';
      expect(isVideoThumbnail(mockImg)).toBe(true);
    });

    it('should return true for Animated Text GIF alt', () => {
      mockImg.src = 'https://example.com/image.jpg';
      mockImg.alt = 'Animated Text GIF';
      expect(isVideoThumbnail(mockImg)).toBe(true);
    });

    it('should return true for Embedded video alt', () => {
      mockImg.src = 'https://example.com/image.jpg';
      mockImg.alt = 'Embedded video';
      expect(isVideoThumbnail(mockImg)).toBe(true);
    });

    it('should return false for regular image', () => {
      mockImg.src = 'https://pbs.twimg.com/media/123456.jpg';
      mockImg.alt = 'Photo';
      expect(isVideoThumbnail(mockImg)).toBe(false);
    });

    it('should return true if image is inside video player container', () => {
      const container = document.createElement('div');
      container.setAttribute('data-testid', 'videoPlayer');
      container.appendChild(mockImg);
      document.body.appendChild(container);

      mockImg.src = 'https://example.com/image.jpg';
      expect(isVideoThumbnail(mockImg)).toBe(true);

      document.body.removeChild(container);
    });
  });

  describe('isVideoPlayer', () => {
    it('should return true for VIDEO element', () => {
      const video = document.createElement('video');
      expect(isVideoPlayer(video)).toBe(true);
    });

    it('should return true for element inside video player container', () => {
      const container = document.createElement('div');
      container.setAttribute('data-testid', 'videoPlayer');
      const div = document.createElement('div');
      container.appendChild(div);
      document.body.appendChild(container);

      expect(isVideoPlayer(div)).toBe(true);

      document.body.removeChild(container);
    });

    it('should return false for regular div', () => {
      const div = document.createElement('div');
      expect(isVideoPlayer(div)).toBe(false);
    });
  });

  describe('isVideoElement', () => {
    it('should return true for IMG with video thumbnail', () => {
      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/ext_tw_video_thumb/123456/pu/img/test.jpg';
      expect(isVideoElement(img)).toBe(true);
    });

    it('should return true for VIDEO element', () => {
      const video = document.createElement('video');
      expect(isVideoElement(video)).toBe(true);
    });

    it('should return false for regular image', () => {
      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/media/123456.jpg';
      expect(isVideoElement(img)).toBe(false);
    });

    it('should return false for regular div', () => {
      const div = document.createElement('div');
      expect(isVideoElement(div)).toBe(false);
    });
  });

  describe('extractTweetId', () => {
    it('should extract tweet ID from x.com status URL', () => {
      const url = 'https://x.com/user/status/1234567890123456789';
      expect(extractTweetId(url)).toBe('1234567890123456789');
    });

    it('should extract tweet ID from twitter.com status URL', () => {
      const url = 'https://twitter.com/user/status/9876543210987654321';
      expect(extractTweetId(url)).toBe('9876543210987654321');
    });

    it('should extract tweet ID from URL with query parameters', () => {
      const url = 'https://x.com/user/status/1111111111111111111?s=20';
      expect(extractTweetId(url)).toBe('1111111111111111111');
    });

    it('should return null for URL without status', () => {
      const url = 'https://x.com/user';
      expect(extractTweetId(url)).toBeNull();
    });

    it('should return null for invalid URL', () => {
      const url = 'https://example.com/page';
      expect(extractTweetId(url)).toBeNull();
    });
  });

  describe('getTweetIdFromContainer', () => {
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement('article');
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('should extract tweet ID from status link', () => {
      const link = document.createElement('a');
      link.href = 'https://x.com/user/status/1234567890123456789';
      container.appendChild(link);

      expect(getTweetIdFromContainer(container)).toBe('1234567890123456789');
    });

    it('should extract tweet ID from time element with parent link', () => {
      const link = document.createElement('a');
      link.href = 'https://x.com/user/status/9876543210987654321';
      const time = document.createElement('time');
      link.appendChild(time);
      container.appendChild(link);

      expect(getTweetIdFromContainer(container)).toBe('9876543210987654321');
    });

    it('should extract tweet ID from data-tweet-id attribute', () => {
      const div = document.createElement('div');
      div.setAttribute('data-tweet-id', '1111111111111111111');
      container.appendChild(div);

      expect(getTweetIdFromContainer(container)).toBe('1111111111111111111');
    });

    it('should return null if no tweet ID found', () => {
      const div = document.createElement('div');
      div.textContent = 'No tweet ID here';
      container.appendChild(div);

      expect(getTweetIdFromContainer(container)).toBeNull();
    });

    it('should handle relative URLs', () => {
      const link = document.createElement('a');
      link.href = '/user/status/1234567890123456789';
      container.appendChild(link);

      expect(getTweetIdFromContainer(container)).toBe('1234567890123456789');
    });
  });

  describe('getVideoMediaEntry', () => {
    beforeEach(() => {
      // Mock TwitterAPI.getTweetMedias
      vi.spyOn(TwitterAPI, 'getTweetMedias').mockResolvedValue([]);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return null when no video medias found', async () => {
      const result = await getVideoMediaEntry('1234567890123456789');
      expect(result).toBeNull();
    });

    it('should return first video when no thumbnail URL provided', async () => {
      const mockMedias: TweetMediaEntry[] = [
        {
          screen_name: 'testuser',
          tweet_id: '1234567890123456789',
          download_url: 'https://video.twimg.com/ext_tw_video/123/pu/vid/720x1280/test.mp4',
          type: 'video',
          typeOriginal: 'video',
          index: 0,
          typeIndex: 0,
          typeIndexOriginal: 0,
          preview_url: 'https://pbs.twimg.com/ext_tw_video_thumb/123/pu/img/test.jpg',
          media_id: '123',
          media_key: 'key123',
          expanded_url: 'https://x.com/user/status/1234567890123456789/video/1',
          short_expanded_url: 'x.com/user/status/1234567890123456789/video/1',
          short_tweet_url: 'https://t.co/abc123',
          tweet_text: 'Test video tweet',
        },
      ];

      vi.spyOn(TwitterAPI, 'getTweetMedias').mockResolvedValue(mockMedias);

      const result = await getVideoMediaEntry('1234567890123456789');
      expect(result).toEqual(mockMedias[0]);
    });

    it('should match video by thumbnail URL', async () => {
      const mockMedias: TweetMediaEntry[] = [
        {
          screen_name: 'testuser',
          tweet_id: '1234567890123456789',
          download_url: 'https://video.twimg.com/ext_tw_video/123/pu/vid/720x1280/test1.mp4',
          type: 'video',
          typeOriginal: 'video',
          index: 0,
          typeIndex: 0,
          typeIndexOriginal: 0,
          preview_url: 'https://pbs.twimg.com/ext_tw_video_thumb/123/pu/img/test1.jpg',
          media_id: '123',
          media_key: 'key123',
          expanded_url: 'https://x.com/user/status/1234567890123456789/video/1',
          short_expanded_url: 'x.com/user/status/1234567890123456789/video/1',
          short_tweet_url: 'https://t.co/abc123',
          tweet_text: 'Test video 1',
        },
        {
          screen_name: 'testuser',
          tweet_id: '1234567890123456789',
          download_url: 'https://video.twimg.com/ext_tw_video/456/pu/vid/720x1280/test2.mp4',
          type: 'video',
          typeOriginal: 'video',
          index: 1,
          typeIndex: 1,
          typeIndexOriginal: 1,
          preview_url: 'https://pbs.twimg.com/ext_tw_video_thumb/456/pu/img/test2.jpg',
          media_id: '456',
          media_key: 'key456',
          expanded_url: 'https://x.com/user/status/1234567890123456789/video/2',
          short_expanded_url: 'x.com/user/status/1234567890123456789/video/2',
          short_tweet_url: 'https://t.co/def456',
          tweet_text: 'Test video 2',
        },
      ];

      vi.spyOn(TwitterAPI, 'getTweetMedias').mockResolvedValue(mockMedias);

      const thumbnailUrl =
        'https://pbs.twimg.com/ext_tw_video_thumb/456/pu/img/test2.jpg?format=jpg';
      const result = await getVideoMediaEntry('1234567890123456789', thumbnailUrl);

      expect(result).toEqual(mockMedias[1]);
    });

    it('should return null on error', async () => {
      vi.spyOn(TwitterAPI, 'getTweetMedias').mockRejectedValue(new Error('API Error'));

      const result = await getVideoMediaEntry('1234567890123456789');
      expect(result).toBeNull();
    });
  });

  describe('getVideoUrlFromThumbnail', () => {
    let mockImg: HTMLImageElement;
    let mockContainer: HTMLElement;

    beforeEach(() => {
      mockImg = document.createElement('img');
      mockContainer = document.createElement('article');
      document.body.appendChild(mockContainer);
    });

    afterEach(() => {
      document.body.removeChild(mockContainer);
      vi.restoreAllMocks();
    });

    it('should return null for non-video thumbnail', async () => {
      mockImg.src = 'https://pbs.twimg.com/media/123456.jpg';
      mockImg.alt = 'Photo';

      const result = await getVideoUrlFromThumbnail(mockImg, mockContainer);
      expect(result).toBeNull();
    });

    it('should return null when tweet ID cannot be extracted', async () => {
      mockImg.src = 'https://pbs.twimg.com/ext_tw_video_thumb/123456/pu/img/test.jpg';
      mockContainer.textContent = 'No tweet ID';

      const result = await getVideoUrlFromThumbnail(mockImg, mockContainer);
      expect(result).toBeNull();
    });

    it('should return video URL when valid thumbnail and tweet ID', async () => {
      mockImg.src = 'https://pbs.twimg.com/ext_tw_video_thumb/123456/pu/img/test.jpg';

      const link = document.createElement('a');
      link.href = 'https://x.com/user/status/1234567890123456789';
      mockContainer.appendChild(link);

      const mockVideoEntry: TweetMediaEntry = {
        screen_name: 'testuser',
        tweet_id: '1234567890123456789',
        download_url: 'https://video.twimg.com/ext_tw_video/123456/pu/vid/720x1280/test.mp4',
        type: 'video',
        typeOriginal: 'video',
        index: 0,
        typeIndex: 0,
        typeIndexOriginal: 0,
        preview_url: 'https://pbs.twimg.com/ext_tw_video_thumb/123456/pu/img/test.jpg',
        media_id: '123456',
        media_key: 'key123456',
        expanded_url: 'https://x.com/user/status/1234567890123456789/video/1',
        short_expanded_url: 'x.com/user/status/1234567890123456789/video/1',
        short_tweet_url: 'https://t.co/abc123',
        tweet_text: 'Test video tweet',
      };

      vi.spyOn(TwitterAPI, 'getTweetMedias').mockResolvedValue([mockVideoEntry]);

      const result = await getVideoUrlFromThumbnail(mockImg, mockContainer);
      expect(result).toBe('https://video.twimg.com/ext_tw_video/123456/pu/vid/720x1280/test.mp4');
    });

    it('should return null when getVideoMediaEntry fails', async () => {
      mockImg.src = 'https://pbs.twimg.com/ext_tw_video_thumb/123456/pu/img/test.jpg';

      const link = document.createElement('a');
      link.href = 'https://x.com/user/status/1234567890123456789';
      mockContainer.appendChild(link);

      vi.spyOn(TwitterAPI, 'getTweetMedias').mockResolvedValue([]);

      const result = await getVideoUrlFromThumbnail(mockImg, mockContainer);
      expect(result).toBeNull();
    });
  });
});
