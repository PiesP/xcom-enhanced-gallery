/**
 * @fileoverview Production 환경 DOM 추출 테스트
 * @description 실제 X.com DOM 구조를 재현하여 미디어 추출 로직 검증
 * Epic: PRODUCTION-ENVIRONMENT-VALIDATION
 * Sub-Epic 1: Phase 1-1 (RED)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DOMDirectExtractor } from '@shared/services/media-extraction/extractors/DOMDirectExtractor';
import type { TweetInfo } from '@shared/types/media.types';

describe('Production DOM Extraction (Sub-Epic 1 Phase 1-1)', () => {
  let extractor: DOMDirectExtractor;

  beforeEach(() => {
    extractor = new DOMDirectExtractor();
  });

  describe('[GREEN] X.com 실제 비디오 구조', () => {
    it('should extract video from current X.com video player structure', async () => {
      // 실제 X.com 비디오 트윗 DOM 구조 재현
      // 2025-10-06 기준 X.com 비디오 플레이어 구조
      const container = document.createElement('article');
      container.setAttribute('data-testid', 'tweet');
      container.setAttribute('role', 'article');

      // 비디오 플레이어 컨테이너
      const videoPlayerDiv = document.createElement('div');
      videoPlayerDiv.setAttribute('data-testid', 'videoPlayer');

      // 비디오 요소
      const video = document.createElement('video');
      video.src = 'https://video.twimg.com/ext_tw_video/1234567890/pu/vid/720x1280/test.mp4';
      video.setAttribute('playsinline', '');
      video.controls = true;

      videoPlayerDiv.appendChild(video);
      container.appendChild(videoPlayerDiv);

      const result = await extractor.extract(container, {}, 'test-id');

      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(1);
      expect(result.mediaItems[0].type).toBe('video');
      expect(result.mediaItems[0].url).toContain('video.twimg.com');
    });

    it('should extract video from videoComponent structure', async () => {
      // 또 다른 X.com 비디오 구조 패턴
      const container = document.createElement('article');
      container.setAttribute('data-testid', 'tweet');

      const videoComponent = document.createElement('div');
      videoComponent.setAttribute('data-testid', 'videoComponent');

      const video = document.createElement('video');
      video.src = 'https://video.twimg.com/amplify_video/1234567890/vid/avc1/720x1280/test.mp4';
      video.setAttribute('playsinline', '');

      videoComponent.appendChild(video);
      container.appendChild(videoComponent);

      const result = await extractor.extract(container, {}, 'test-id');

      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(1);
      expect(result.mediaItems[0].type).toBe('video');
    });

    it('should extract animated GIF from video element', async () => {
      // X.com GIF 구조 (video 태그로 렌더링됨)
      const container = document.createElement('article');
      container.setAttribute('data-testid', 'tweet');

      const videoComponent = document.createElement('div');
      videoComponent.setAttribute('data-testid', 'videoComponent');

      // GIF는 loop와 autoplay 속성을 가진 video 태그
      const video = document.createElement('video');
      video.src = 'https://video.twimg.com/tweet_video/test.mp4';
      video.setAttribute('playsinline', '');
      video.setAttribute('loop', '');
      video.setAttribute('autoplay', '');
      video.muted = true;

      videoComponent.appendChild(video);
      container.appendChild(videoComponent);

      const result = await extractor.extract(container, {}, 'test-id');

      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(1);
      // GIF 감지는 URL 패턴 또는 비디오 속성 기반
      expect(['video', 'gif']).toContain(result.mediaItems[0].type);
    });

    it('should extract video from role="button" player container', async () => {
      // X.com 인라인 비디오 플레이어 (role="button" 내부)
      const container = document.createElement('article');
      container.setAttribute('data-testid', 'tweet');

      const playerButton = document.createElement('div');
      playerButton.setAttribute('role', 'button');
      playerButton.setAttribute('aria-label', 'Play video');

      const progressBar = document.createElement('div');
      progressBar.setAttribute('role', 'progressbar');

      const video = document.createElement('video');
      video.src = 'https://video.twimg.com/ext_tw_video/1234567890/pu/vid/1280x720/test.mp4';
      video.poster = 'https://pbs.twimg.com/ext_tw_video_thumb/1234567890/pu/img/thumb.jpg';

      playerButton.appendChild(progressBar);
      playerButton.appendChild(video);
      container.appendChild(playerButton);

      const result = await extractor.extract(container, {}, 'test-id');

      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(1);
      expect(result.mediaItems[0].type).toBe('video');
    });
  });

  describe('[GREEN] 셀렉터 폴백 전략', () => {
    it('should try multiple selectors for video elements', async () => {
      // 다양한 X.com 레이아웃 패턴 테스트
      const patterns = [
        createCurrentVideoStructure(),
        createLegacyVideoStructure(),
        createQuoteTweetVideoStructure(),
      ];

      for (const container of patterns) {
        const result = await extractor.extract(container, {}, 'test-id');
        expect(result.success).toBe(true);
        expect(result.mediaItems.length).toBeGreaterThan(0);
      }
    });

    it('should extract videos from quoted tweet', async () => {
      // 인용 트윗 내 비디오
      const container = document.createElement('article');
      container.setAttribute('data-testid', 'tweet');

      // 메인 트윗 (텍스트만)
      const mainContent = document.createElement('div');
      mainContent.textContent = 'Check out this video!';
      container.appendChild(mainContent);

      // 인용된 트윗 (비디오 포함)
      const quotedTweet = document.createElement('div');
      quotedTweet.setAttribute('role', 'link');
      quotedTweet.setAttribute('data-testid', 'quoteTweet');

      const videoPlayer = document.createElement('div');
      videoPlayer.setAttribute('data-testid', 'videoPlayer');

      const video = document.createElement('video');
      video.src = 'https://video.twimg.com/ext_tw_video/9876543210/pu/vid/720x1280/quoted.mp4';

      videoPlayer.appendChild(video);
      quotedTweet.appendChild(videoPlayer);
      container.appendChild(quotedTweet);

      const result = await extractor.extract(container, {}, 'test-id');

      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(1);
      expect(result.mediaItems[0].url).toContain('quoted.mp4');
    });
  });

  describe('[GREEN] 복합 미디어 추출', () => {
    it('should extract both images and videos from same tweet', async () => {
      const container = document.createElement('article');
      container.setAttribute('data-testid', 'tweet');

      // 이미지
      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/media/test.jpg:large';
      img.alt = 'Image 1';
      container.appendChild(img);

      // 비디오
      const videoPlayer = document.createElement('div');
      videoPlayer.setAttribute('data-testid', 'videoPlayer');

      const video = document.createElement('video');
      video.src = 'https://video.twimg.com/ext_tw_video/1234567890/pu/vid/720x1280/test.mp4';

      videoPlayer.appendChild(video);
      container.appendChild(videoPlayer);

      const result = await extractor.extract(container, {}, 'test-id');

      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(2);

      const types = result.mediaItems.map(item => item.type);
      expect(types).toContain('image');
      expect(types).toContain('video');
    });

    it('should handle multiple videos in thread', async () => {
      const container = document.createElement('article');
      container.setAttribute('data-testid', 'tweet');

      // 첫 번째 비디오
      const video1Player = document.createElement('div');
      video1Player.setAttribute('data-testid', 'videoPlayer');

      const video1 = document.createElement('video');
      video1.src = 'https://video.twimg.com/ext_tw_video/1111111111/pu/vid/720x1280/video1.mp4';
      video1Player.appendChild(video1);
      container.appendChild(video1Player);

      // 두 번째 비디오 (다른 구조)
      const video2Component = document.createElement('div');
      video2Component.setAttribute('data-testid', 'videoComponent');

      const video2 = document.createElement('video');
      video2.src = 'https://video.twimg.com/ext_tw_video/2222222222/pu/vid/1280x720/video2.mp4';
      video2Component.appendChild(video2);
      container.appendChild(video2Component);

      const result = await extractor.extract(container, {}, 'test-id');

      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(2);
      expect(result.mediaItems.every(item => item.type === 'video')).toBe(true);
    });
  });

  describe('[GREEN] 엣지 케이스', () => {
    it('should handle video without src attribute', async () => {
      const container = document.createElement('article');
      container.setAttribute('data-testid', 'tweet');

      const videoPlayer = document.createElement('div');
      videoPlayer.setAttribute('data-testid', 'videoPlayer');

      const video = document.createElement('video');
      // src 없음
      video.poster = 'https://pbs.twimg.com/ext_tw_video_thumb/1234567890/pu/img/thumb.jpg';

      videoPlayer.appendChild(video);
      container.appendChild(videoPlayer);

      const result = await extractor.extract(container, {}, 'test-id');

      // src 없는 비디오는 추출하지 않지만, 추출 자체는 실패가 아님
      // (미디어가 0개일 뿐 추출 프로세스는 정상 완료)
      expect(result.mediaItems).toHaveLength(0);
      // 추출 실패 케이스는 컨테이너를 찾을 수 없을 때만 발생
    });

    it('should deduplicate same video element found multiple times', async () => {
      const container = document.createElement('article');
      container.setAttribute('data-testid', 'tweet');

      const video = document.createElement('video');
      video.src = 'https://video.twimg.com/ext_tw_video/1234567890/pu/vid/720x1280/test.mp4';
      video.setAttribute('playsinline', '');

      // 동일한 비디오 요소를 여러 셀렉터로 찾을 수 있는 구조
      const wrapper1 = document.createElement('div');
      wrapper1.setAttribute('data-testid', 'videoPlayer');
      wrapper1.appendChild(video);

      const wrapper2 = document.createElement('div');
      wrapper2.setAttribute('role', 'button');
      wrapper2.appendChild(wrapper1);

      container.appendChild(wrapper2);

      const result = await extractor.extract(container, {}, 'test-id');

      expect(result.success).toBe(true);
      // 중복 제거되어 1개만 추출되어야 함
      expect(result.mediaItems).toHaveLength(1);
    });
  });
});

// Helper functions for test cases

function createCurrentVideoStructure(): HTMLElement {
  const container = document.createElement('article');
  container.setAttribute('data-testid', 'tweet');

  const videoPlayer = document.createElement('div');
  videoPlayer.setAttribute('data-testid', 'videoPlayer');

  const video = document.createElement('video');
  video.src = 'https://video.twimg.com/ext_tw_video/1234567890/pu/vid/720x1280/current.mp4';

  videoPlayer.appendChild(video);
  container.appendChild(videoPlayer);

  return container;
}

function createLegacyVideoStructure(): HTMLElement {
  const container = document.createElement('article');
  container.setAttribute('data-testid', 'tweet');

  const videoComponent = document.createElement('div');
  videoComponent.setAttribute('data-testid', 'videoComponent');

  const video = document.createElement('video');
  video.src = 'https://video.twimg.com/amplify_video/1234567890/vid/avc1/720x1280/legacy.mp4';

  videoComponent.appendChild(video);
  container.appendChild(videoComponent);

  return container;
}

function createQuoteTweetVideoStructure(): HTMLElement {
  const container = document.createElement('article');
  container.setAttribute('data-testid', 'tweet');

  const quotedTweet = document.createElement('div');
  quotedTweet.setAttribute('role', 'link');
  quotedTweet.setAttribute('data-testid', 'quoteTweet');

  const videoPlayer = document.createElement('div');
  videoPlayer.setAttribute('data-testid', 'videoPlayer');

  const video = document.createElement('video');
  video.src = 'https://video.twimg.com/ext_tw_video/9876543210/pu/vid/1280x720/quoted.mp4';

  videoPlayer.appendChild(video);
  quotedTweet.appendChild(videoPlayer);
  container.appendChild(quotedTweet);

  return container;
}
