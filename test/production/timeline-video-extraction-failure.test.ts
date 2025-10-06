/**
 * @fileoverview Production Issue Test: Timeline Video Extraction Failure
 * @description Epic: PRODUCTION-ISSUES-OCT-2025
 *
 * **Issue**: 타임라인에서 동영상/GIF 썸네일 클릭 시 비디오 정보를 추출하지 못함
 *
 * **로그 증거**:
 * ```
 * [DOMDirectExtractor] 비디오 요소 0개 발견
 * [MediaExtractor] simp_7cee6ed7-1663-4609-bf33-6d72edc06e70: DOM 직접 추출 실패
 * [미디어 추출 실패]: 이미지나 비디오를 찾을 수 없습니다
 * ```
 *
 * **근본 원인**:
 * 1. 타임라인 동영상은 썸네일 이미지만 있고 실제 <video> 태그는 클릭 후 로드됨
 * 2. DOMDirectExtractor가 video 태그가 없으면 즉시 실패
 * 3. MediaClickDetector가 썸네일 이미지에서 비디오 정보를 추출하지 못함
 *
 * **해결 목표**:
 * 1. 썸네일 이미지에서 비디오 URL 추론 로직 추가
 * 2. Twitter API 데이터에서 비디오 정보 추출
 * 3. data-* 속성 및 poster 속성에서 fallback 추출
 *
 * **Acceptance Criteria**:
 * - 타임라인 동영상 썸네일 클릭 시 비디오 URL 추출 성공률 > 95%
 * - GIF와 일반 동영상 정확히 구분
 * - 기존 동작 회귀 없음 (기존 테스트 모두 GREEN)
 * - 번들 크기 증가 < 2KB
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MediaClickDetector } from '@shared/utils/media/MediaClickDetector';

describe('[PRODUCTION-GREEN] Timeline Video Extraction Success', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('Issue Resolved: 비디오 요소 추출 성공', () => {
    it('should successfully extract video from thumbnail-only container', () => {
      // Given: 타임라인 동영상 구조 (썸네일만 있고 video 태그 없음)
      // 실제 X.com 타임라인 DOM 구조 재현
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');
      article.setAttribute('role', 'article');

      const videoContainer = document.createElement('div');
      videoContainer.setAttribute('data-testid', 'videoComponent');
      videoContainer.setAttribute('role', 'button');
      videoContainer.setAttribute('aria-label', '동영상 재생');

      // 썸네일 이미지만 존재 (video 태그 없음)
      const thumbnail = document.createElement('img');
      thumbnail.src = 'https://pbs.twimg.com/ext_tw_video_thumb/1234567890/pu/img/abc123.jpg';
      thumbnail.alt = '동영상 썸네일';

      videoContainer.appendChild(thumbnail);
      article.appendChild(videoContainer);
      document.body.appendChild(article);

      // When: MediaClickDetector로 감지 시도
      const detector = MediaClickDetector.getInstance();
      const result = detector.detectMediaFromClick(thumbnail);

      // Then: Issue #1 수정으로 이제 비디오를 정상적으로 감지
      expect(result.type).toBe('video');
      expect(result.mediaUrl).toContain('ext_tw_video');
    });

    it('should successfully extract video URL from poster attribute', () => {
      // Given: video 요소는 있지만 src 없이 poster만 있는 경우
      const videoContainer = document.createElement('div');
      videoContainer.setAttribute('data-testid', 'videoPlayer');

      const video = document.createElement('video');
      video.poster = 'https://pbs.twimg.com/ext_tw_video_thumb/9876543210/pu/img/xyz789.jpg';
      // src 속성 없음 (아직 로드 안됨)

      videoContainer.appendChild(video);
      document.body.appendChild(videoContainer);

      // When: 비디오 감지 시도
      const detector = MediaClickDetector.getInstance();
      const result = detector.detectMediaFromClick(video);

      // Then: Issue #1 수정으로 poster에서 video URL 추출 성공
      expect(result.type).toBe('video'); // 비디오로 감지
      expect(result.mediaUrl).not.toBe(''); // URL도 추출됨
      expect(result.mediaUrl).toContain('ext_tw_video');
    });

    it('should successfully extract video URL from data attributes', () => {
      // Given: Twitter가 data-* 속성으로 비디오 정보를 제공하는 경우
      const videoContainer = document.createElement('div');
      videoContainer.setAttribute('data-testid', 'videoComponent');
      videoContainer.setAttribute(
        'data-video-url',
        'https://video.twimg.com/ext_tw_video/1234567890/pu/vid/1280x720/video.mp4'
      );

      const thumbnail = document.createElement('img');
      thumbnail.src = 'https://pbs.twimg.com/ext_tw_video_thumb/1234567890/pu/img/thumb.jpg';

      videoContainer.appendChild(thumbnail);
      document.body.appendChild(videoContainer);

      // When: data 속성에서 비디오 URL 추출 시도
      const detector = MediaClickDetector.getInstance();
      const result = detector.detectMediaFromClick(thumbnail);

      // Then: Issue #1 수정으로 data 속성에서 비디오 URL 추출 성공
      expect(result.type).toBe('video');
      expect(result.mediaUrl).toContain('ext_tw_video/');
      expect(result.mediaUrl).toContain('/vid/');
    });
  });

  describe('[GREEN] Expected Behavior: 썸네일 → 비디오 URL 변환', () => {
    it('should extract video URL from thumbnail pattern', () => {
      // Given: 썸네일 URL 패턴에서 비디오 URL 유추 가능
      const thumbnailUrl = 'https://pbs.twimg.com/ext_tw_video_thumb/1234567890/pu/img/abc123.jpg';
      // Expected video URL: https://video.twimg.com/ext_tw_video/1234567890/pu/vid/1280x720/video.mp4

      const videoContainer = document.createElement('div');
      videoContainer.setAttribute('data-testid', 'videoComponent');

      const thumbnail = document.createElement('img');
      thumbnail.src = thumbnailUrl;
      videoContainer.appendChild(thumbnail);
      document.body.appendChild(videoContainer);

      // When: 썸네일 클릭 시 비디오 URL 추출
      const detector = MediaClickDetector.getInstance();
      const result = detector.detectMediaFromClick(thumbnail);

      // Then: 썸네일 URL 패턴에서 비디오 URL 추출 성공
      expect(result.type).toBe('video');
      expect(result.mediaUrl).toContain('ext_tw_video/');
      expect(result.mediaUrl).toContain('/pu/vid/');
    });

    it('should distinguish GIF from regular video', () => {
      // Given: GIF는 tweet_video_thumb 패턴 사용
      const gifThumbnailUrl = 'https://pbs.twimg.com/tweet_video_thumb/AbC123.jpg';
      // Expected: https://video.twimg.com/tweet_video/AbC123.mp4

      const regularThumbnailUrl =
        'https://pbs.twimg.com/ext_tw_video_thumb/9876543210/pu/img/xyz.jpg';
      // Expected: https://video.twimg.com/ext_tw_video/9876543210/pu/vid/1280x720/video.mp4

      // GIF 컨테이너
      const gifContainer = document.createElement('div');
      gifContainer.setAttribute('data-testid', 'videoComponent');
      const gifThumb = document.createElement('img');
      gifThumb.src = gifThumbnailUrl;
      gifContainer.appendChild(gifThumb);

      // 일반 동영상 컨테이너
      const videoContainer = document.createElement('div');
      videoContainer.setAttribute('data-testid', 'videoComponent');
      const videoThumb = document.createElement('img');
      videoThumb.src = regularThumbnailUrl;
      videoContainer.appendChild(videoThumb);

      document.body.appendChild(gifContainer);
      document.body.appendChild(videoContainer);

      const detector = MediaClickDetector.getInstance();

      // When: GIF 썸네일 감지
      const gifResult = detector.detectMediaFromClick(gifThumb);

      // When: 일반 동영상 썸네일 감지
      const videoResult = detector.detectMediaFromClick(videoThumb);

      // Then: GIF와 일반 동영상 구분 성공
      expect(gifResult.mediaUrl).toContain('tweet_video/');
      expect(gifResult.mediaUrl).toMatch(/\.mp4$/);

      expect(videoResult.mediaUrl).toContain('ext_tw_video/');
      expect(videoResult.mediaUrl).toContain('/vid/');
    });

    it('should extract video info from Twitter API data', () => {
      // Given: Twitter가 __NEXT_DATA__ 등에 비디오 정보를 포함하는 경우
      // 실제로는 React Props나 API 응답에서 추출해야 함
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');

      // Twitter 내부 데이터 시뮬레이션 (data attribute로 간소화)
      article.setAttribute('data-tweet-id', '1234567890');

      const videoContainer = document.createElement('div');
      videoContainer.setAttribute('data-testid', 'videoComponent');
      videoContainer.setAttribute('data-video-id', 'ext_tw_video/1234567890');

      const thumbnail = document.createElement('img');
      thumbnail.src = 'https://pbs.twimg.com/ext_tw_video_thumb/1234567890/pu/img/thumb.jpg';

      videoContainer.appendChild(thumbnail);
      article.appendChild(videoContainer);
      document.body.appendChild(article);

      // When: Twitter 내부 데이터에서 비디오 정보 추출
      const detector = MediaClickDetector.getInstance();
      const result = detector.detectMediaFromClick(thumbnail);

      // Then: data 속성 또는 React Props에서 비디오 URL 추출 성공
      expect(result.type).toBe('video');
      expect(result.mediaUrl).toContain('ext_tw_video/1234567890');
    });
  });

  describe('[GREEN] Edge Cases: Production 시나리오', () => {
    it('should handle lazy-loaded video elements', () => {
      // Given: 초기에는 썸네일만 있다가 나중에 video 요소가 추가되는 경우
      const videoContainer = document.createElement('div');
      videoContainer.setAttribute('data-testid', 'videoComponent');

      const thumbnail = document.createElement('img');
      thumbnail.src = 'https://pbs.twimg.com/ext_tw_video_thumb/1234567890/pu/img/thumb.jpg';
      videoContainer.appendChild(thumbnail);
      document.body.appendChild(videoContainer);

      const detector = MediaClickDetector.getInstance();

      // When: 초기 클릭 (video 요소 없음)
      const initialResult = detector.detectMediaFromClick(thumbnail);

      // Then: 썸네일에서 비디오 URL 추론 성공
      expect(initialResult.type).toBe('video');
      expect(initialResult.mediaUrl).toContain('ext_tw_video/');

      // When: video 요소가 나중에 추가됨 (lazy load)
      const video = document.createElement('video');
      video.src = 'https://video.twimg.com/ext_tw_video/1234567890/pu/vid/1280x720/video.mp4';
      videoContainer.appendChild(video);

      // When: 재감지 (video 요소 존재)
      const updatedResult = detector.detectMediaFromClick(video);

      // Then: 실제 video 요소에서 정확한 URL 추출
      expect(updatedResult.type).toBe('video');
      expect(updatedResult.mediaUrl).toBe(video.src);
    });

    it('should fallback to multiple extraction strategies', () => {
      // Given: 다양한 추출 전략이 필요한 복잡한 케이스
      const videoContainer = document.createElement('div');
      videoContainer.setAttribute('data-testid', 'videoComponent');

      // Strategy 1: poster 속성
      const video = document.createElement('video');
      video.poster = 'https://pbs.twimg.com/ext_tw_video_thumb/1234567890/pu/img/thumb.jpg';

      // Strategy 2: data 속성
      videoContainer.setAttribute(
        'data-video-url',
        'https://video.twimg.com/ext_tw_video/1234567890/pu/vid/video.mp4'
      );

      // Strategy 3: source 태그
      const source = document.createElement('source');
      source.src = 'https://video.twimg.com/ext_tw_video/1234567890/pu/vid/avc1/video.mp4';
      source.type = 'video/mp4';
      video.appendChild(source);

      videoContainer.appendChild(video);
      document.body.appendChild(videoContainer);

      // When: 비디오 감지 (모든 전략 시도)
      const detector = MediaClickDetector.getInstance();
      const result = detector.detectMediaFromClick(video);

      // Then: 최소 하나의 전략에서 비디오 URL 추출 성공
      expect(result.type).toBe('video');
      expect(result.mediaUrl).toContain('ext_tw_video/1234567890');
      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });
});
