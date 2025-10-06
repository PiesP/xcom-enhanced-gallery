/**
 * @fileoverview Sub-Epic 1: 미디어 타입 추출 강화 테스트
 * @description Production 이슈 해결 - 비디오/GIF 추출 실패 재현 및 수정
 * @phase Phase 1-1 (RED) - 실패 케이스 재현
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MediaExtractionService } from '@shared/services/media-extraction/MediaExtractionService';
import type { MediaExtractionResult } from '@shared/types/media.types';

describe('[Phase 1-1 RED] Sub-Epic 1: Media Type Extraction Enhancement', () => {
  let mediaExtractionService: MediaExtractionService;

  beforeEach(() => {
    mediaExtractionService = new MediaExtractionService();
    // DOM 초기화
    document.body.innerHTML = '';
  });

  describe('비디오 추출 실패 재현', () => {
    it('[RED] should extract video from Twitter video player with role="button"', async () => {
      // Given: Twitter 비디오 플레이어 구조
      const videoPlayer = document.createElement('div');
      videoPlayer.setAttribute('role', 'button');
      videoPlayer.setAttribute('aria-label', '재생');

      const video = document.createElement('video');
      video.src = 'https://video.twimg.com/ext_tw_video/test.mp4';
      video.setAttribute('poster', 'https://pbs.twimg.com/ext_tw_video_thumb/test.jpg');
      videoPlayer.appendChild(video);

      document.body.appendChild(videoPlayer);

      // When: 비디오 플레이어에서 추출 시도
      const result: MediaExtractionResult =
        await mediaExtractionService.extractFromClickedElement(videoPlayer);

      // Then: 비디오 추출 성공
      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(1);
      expect(result.mediaItems[0].type).toBe('video');
      expect(result.mediaItems[0].url).toContain('video.twimg.com');
    });

    it('[RED] should extract video from nested tweet structure', async () => {
      // Given: Twitter 트윗 중첩 구조
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');

      const mediaDiv = document.createElement('div');
      mediaDiv.setAttribute('data-testid', 'videoComponent');

      const video = document.createElement('video');
      video.src = 'https://video.twimg.com/ext_tw_video/nested_test.mp4';
      mediaDiv.appendChild(video);
      article.appendChild(mediaDiv);

      document.body.appendChild(article);

      // When: mediaDiv 클릭 시 추출
      const result: MediaExtractionResult =
        await mediaExtractionService.extractFromClickedElement(mediaDiv);

      // Then: 중첩 구조에서도 비디오 추출 성공
      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(1);
      expect(result.mediaItems[0].type).toBe('video');
    });

    it('[RED] should extract video when clicked on parent container', async () => {
      // Given: 상위 컨테이너 클릭 시나리오
      const container = document.createElement('div');
      container.className = 'tweet-media-container';

      const videoWrapper = document.createElement('div');
      videoWrapper.setAttribute('role', 'button');

      const video = document.createElement('video');
      video.src = 'https://video.twimg.com/amplify_video/test.mp4';
      videoWrapper.appendChild(video);
      container.appendChild(videoWrapper);

      document.body.appendChild(container);

      // When: 상위 컨테이너 클릭
      const result: MediaExtractionResult =
        await mediaExtractionService.extractFromClickedElement(container);

      // Then: 하위 비디오 탐색 성공
      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(1);
      expect(result.mediaItems[0].type).toBe('video');
    });
  });

  describe('GIF 추출 실패 재현', () => {
    it('[RED] should detect GIF from URL pattern (tweet_video_thumb)', async () => {
      // Given: Twitter GIF URL 패턴 (tweet_video_thumb)
      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/tweet_video_thumb/xyz123.jpg';
      img.alt = 'Animated GIF';

      document.body.appendChild(img);

      // When: 이미지에서 추출 시도
      const result: MediaExtractionResult =
        await mediaExtractionService.extractFromClickedElement(img);

      // Then: GIF로 타입 추론 성공
      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(1);
      expect(result.mediaItems[0].type).toBe('gif');
      expect(result.mediaItems[0].url).toContain('tweet_video');
    });

    it('[RED] should detect GIF from .mp4 extension with small size', async () => {
      // Given: .mp4 확장자 GIF (Twitter는 GIF를 mp4로 변환)
      const video = document.createElement('video');
      video.src = 'https://video.twimg.com/tweet_video/abc.mp4';
      video.setAttribute('loop', 'true');
      video.setAttribute('muted', 'true');
      video.setAttribute('autoplay', 'true');

      document.body.appendChild(video);

      // When: video 요소에서 추출
      const result: MediaExtractionResult =
        await mediaExtractionService.extractFromClickedElement(video);

      // Then: GIF로 추론 (loop + muted + autoplay = GIF 특성)
      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(1);
      expect(result.mediaItems[0].type).toBe('gif');
    });

    it('[RED] should handle mixed media (images + GIF)', async () => {
      // Given: 이미지와 GIF가 섞인 트윗
      const container = document.createElement('div');
      container.setAttribute('data-testid', 'tweetPhoto');

      const img1 = document.createElement('img');
      img1.src = 'https://pbs.twimg.com/media/image1.jpg';

      const gif = document.createElement('img');
      gif.src = 'https://pbs.twimg.com/tweet_video_thumb/gif1.jpg';

      const img2 = document.createElement('img');
      img2.src = 'https://pbs.twimg.com/media/image2.png';

      container.appendChild(img1);
      container.appendChild(gif);
      container.appendChild(img2);

      document.body.appendChild(container);

      // When: 컨테이너에서 추출
      const result: MediaExtractionResult =
        await mediaExtractionService.extractFromClickedElement(container);

      // Then: 모든 미디어 추출 (image 2개, gif 1개)
      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(3);

      const gifItems = result.mediaItems.filter(item => item.type === 'gif');
      const imageItems = result.mediaItems.filter(item => item.type === 'image');

      expect(gifItems).toHaveLength(1);
      expect(imageItems).toHaveLength(2);
    });
  });

  describe('URL 패턴 기반 타입 추론', () => {
    it('[RED] should infer type from URL extension (.mp4)', async () => {
      // Given: .mp4 확장자 URL
      const video = document.createElement('video');
      video.src = 'https://video.twimg.com/ext_tw_video/12345.mp4';

      document.body.appendChild(video);

      // When: 추출 시도
      const result: MediaExtractionResult =
        await mediaExtractionService.extractFromClickedElement(video);

      // Then: video 타입 추론
      expect(result.success).toBe(true);
      expect(result.mediaItems[0].type).toBe('video');
    });

    it('[RED] should infer type from URL path pattern (tweet_video)', async () => {
      // Given: tweet_video 경로 패턴
      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/tweet_video/abc.jpg';

      document.body.appendChild(img);

      // When: 추출 시도
      const result: MediaExtractionResult =
        await mediaExtractionService.extractFromClickedElement(img);

      // Then: gif 타입 추론
      expect(result.success).toBe(true);
      expect(result.mediaItems[0].type).toBe('gif');
    });

    it('[RED] should infer type from URL domain (video.twimg.com)', async () => {
      // Given: video.twimg.com 도메인
      const video = document.createElement('video');
      video.src = 'https://video.twimg.com/amplify_video/test.m3u8';

      document.body.appendChild(video);

      // When: 추출 시도
      const result: MediaExtractionResult =
        await mediaExtractionService.extractFromClickedElement(video);

      // Then: video 타입 추론
      expect(result.success).toBe(true);
      expect(result.mediaItems[0].type).toBe('video');
    });
  });

  describe('Production 로그 재현 시나리오', () => {
    it('[RED] should handle case from production log (DOM 직접 추출 실패)', async () => {
      // Given: Production 로그와 유사한 구조 재현
      // [WARN] [MediaExtractor] simp_ba460f35-...: DOM 직접 추출 실패
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');
      article.setAttribute('role', 'article');

      const videoComponent = document.createElement('div');
      videoComponent.setAttribute('data-testid', 'videoComponent');
      videoComponent.setAttribute('role', 'button');
      videoComponent.setAttribute('aria-label', '동영상 재생');

      const video = document.createElement('video');
      video.src = 'https://video.twimg.com/ext_tw_video/production_test.mp4';
      video.poster = 'https://pbs.twimg.com/ext_tw_video_thumb/production.jpg';

      videoComponent.appendChild(video);
      article.appendChild(videoComponent);
      document.body.appendChild(article);

      // When: videoComponent 클릭 (실제 사용자 시나리오)
      const result: MediaExtractionResult =
        await mediaExtractionService.extractFromClickedElement(videoComponent);

      // Then: 추출 성공
      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(1);
      expect(result.mediaItems[0].type).toBe('video');
      expect(result.metadata?.sourceType).toMatch(/dom/i);
    });

    it('[RED] should provide detailed error info when extraction fails', async () => {
      // Given: 미디어 없는 빈 요소
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'no-media-container';
      document.body.appendChild(emptyDiv);

      // When: 빈 요소에서 추출 시도
      const result: MediaExtractionResult =
        await mediaExtractionService.extractFromClickedElement(emptyDiv);

      // Then: 실패하지만 디버그 정보 포함
      expect(result.success).toBe(false);
      expect(result.metadata?.error).toBeDefined();
      expect(result.metadata?.debug).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('[RED] should handle video without src attribute', async () => {
      // Given: src 없는 video 요소
      const video = document.createElement('video');
      video.setAttribute('poster', 'https://pbs.twimg.com/poster.jpg');

      document.body.appendChild(video);

      // When: 추출 시도
      const result: MediaExtractionResult =
        await mediaExtractionService.extractFromClickedElement(video);

      // Then: 실패하지만 graceful하게 처리
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('[RED] should handle invalid Twitter media URLs', async () => {
      // Given: 잘못된 URL
      const img = document.createElement('img');
      img.src = 'https://evil.com/fake_twimg.jpg';

      document.body.appendChild(img);

      // When: 추출 시도
      const result: MediaExtractionResult =
        await mediaExtractionService.extractFromClickedElement(img);

      // Then: 보안상 거부
      expect(result.success).toBe(false);
    });

    it('[RED] should handle multiple videos in container', async () => {
      // Given: 여러 비디오 (드물지만 가능)
      const container = document.createElement('div');

      const video1 = document.createElement('video');
      video1.src = 'https://video.twimg.com/video1.mp4';

      const video2 = document.createElement('video');
      video2.src = 'https://video.twimg.com/video2.mp4';

      container.appendChild(video1);
      container.appendChild(video2);
      document.body.appendChild(container);

      // When: 컨테이너에서 추출
      const result: MediaExtractionResult =
        await mediaExtractionService.extractFromClickedElement(container);

      // Then: 모든 비디오 추출
      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(2);
      expect(result.mediaItems.every(item => item.type === 'video')).toBe(true);
    });
  });
});
