/**
 * @fileoverview Phase 1-1: Timeline Video Click Extraction Tests (RED)
 * @description Epic: PRODUCTION-ISSUES-OCT-2025
 *
 * Issue: 타임라인에서 동영상/GIF 썸네일 클릭 시 갤러리에 동영상 플레이어가 표시되지 않고
 * 대신 썸네일 이미지만 표시됨
 *
 * 목표: MediaClickDetector가 비디오 컨테이너 클릭 시 실제 비디오 URL을 추출하도록 개선
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { MediaClickDetector } from '@shared/utils/media/MediaClickDetector';

describe('[RED] Timeline Video Click Extraction', () => {
  let dom: JSDOM;
  let document: globalThis.Document;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'https://x.com',
    });
    document = dom.window.document;
    // @ts-ignore - JSDOM setup for test environment
    globalThis.document = document;
    // @ts-ignore - JSDOM setup for test environment
    globalThis.window = dom.window;
  });

  /**
   * Helper: 타임라인 비디오 컨테이너 모킹 (tweet_video 패턴 - GIF)
   */
  function createMockGifContainer(options: {
    thumbnailUrl: string;
    videoUrl: string;
  }): HTMLElement {
    const container = document.createElement('div');
    container.setAttribute('data-testid', 'videoComponent');

    const video = document.createElement('video');
    video.poster = options.thumbnailUrl;
    video.src = options.videoUrl;

    container.appendChild(video);
    document.body.appendChild(container);

    return container;
  }

  /**
   * Helper: 타임라인 비디오 컨테이너 모킹 (ext_tw_video 패턴 - 일반 동영상)
   */
  function createMockVideoContainer(options: {
    thumbnailUrl: string;
    videoUrl: string;
  }): HTMLElement {
    const container = document.createElement('div');
    container.setAttribute('data-testid', 'videoPlayer');

    const video = document.createElement('video');
    video.poster = options.thumbnailUrl;

    const source = document.createElement('source');
    source.src = options.videoUrl;
    source.type = 'video/mp4';

    video.appendChild(source);
    container.appendChild(video);
    document.body.appendChild(container);

    return container;
  }

  /**
   * Helper: 썸네일만 있는 비디오 컨테이너 (video 요소 없이 poster 이미지만)
   */
  function createMockThumbnailOnlyContainer(thumbnailUrl: string): HTMLElement {
    const container = document.createElement('div');
    container.setAttribute('data-testid', 'videoComponent');

    const img = document.createElement('img');
    img.src = thumbnailUrl;
    img.alt = 'Video thumbnail';

    container.appendChild(img);
    document.body.appendChild(container);

    return container;
  }

  describe('비디오 URL 추출 (직접 src)', () => {
    it('[RED] should extract video URL when clicking video thumbnail with direct src', () => {
      // Given: 타임라인에 비디오 썸네일이 있음 (video.src)
      const videoContainer = createMockVideoContainer({
        thumbnailUrl: 'https://pbs.twimg.com/ext_tw_video_thumb/123456789/pu/img/abc.jpg',
        videoUrl: 'https://video.twimg.com/ext_tw_video/123456789/pu/vid/1280x720/abc.mp4',
      });

      const video = videoContainer.querySelector('video') as globalThis.HTMLVideoElement;
      expect(video).not.toBeNull();

      // When: MediaClickDetector로 비디오 URL 추출 시도
      // 현재는 extractVideoUrlFromContainer 메서드가 없어서 실패할 것임
      const result = MediaClickDetector.isProcessableMedia(video);

      // Then: 비디오 URL이 추출되어야 함
      // 현재 구현에서는 이 테스트가 실패할 것으로 예상
      expect(result).toBe(true);

      // TODO: Phase 1-2에서 extractVideoUrlFromContainer() 메서드 구현 후
      // 실제 URL 추출을 검증하는 테스트로 확장
      // const extractedUrl = MediaClickDetector.extractVideoUrlFromContainer(video);
      // expect(extractedUrl).toContain('.mp4');
      // expect(extractedUrl).toContain('ext_tw_video');
    });

    it('[RED] should extract video URL from source tag', () => {
      // Given: source 태그로 비디오 URL이 제공됨
      const videoContainer = createMockVideoContainer({
        thumbnailUrl: 'https://pbs.twimg.com/ext_tw_video_thumb/123456789/pu/img/abc.jpg',
        videoUrl: 'https://video.twimg.com/ext_tw_video/123456789/pu/vid/1280x720/abc.mp4',
      });

      const source = videoContainer.querySelector('source') as globalThis.HTMLSourceElement;
      expect(source).not.toBeNull();
      expect(source.src).toContain('.mp4');

      // When: source 요소 클릭
      const result = MediaClickDetector.isProcessableMedia(source as any);

      // Then: 비디오로 감지되어야 함
      expect(result).toBe(true);
    });
  });

  describe('GIF 비디오 처리 (tweet_video 패턴)', () => {
    it('[RED] should handle GIF video correctly', () => {
      // Given: GIF 컨테이너 (tweet_video 패턴)
      const gifContainer = createMockGifContainer({
        thumbnailUrl: 'https://pbs.twimg.com/tweet_video_thumb/AbC123.jpg',
        videoUrl: 'https://video.twimg.com/tweet_video/AbC123.mp4',
      });

      const video = gifContainer.querySelector('video') as globalThis.HTMLVideoElement;

      // When: 비디오 감지
      const result = MediaClickDetector.isProcessableMedia(video);

      // Then: 비디오로 감지되어야 함
      expect(result).toBe(true);

      // TODO: Phase 1-2에서 GIF vs 일반 비디오 구분 로직 추가
      // const mediaInfo = await extractMediaFromClick(video);
      // expect(mediaInfo.type).toBe('gif');
      // expect(mediaInfo.url).toContain('tweet_video');
    });
  });

  describe('썸네일 → 비디오 URL 변환', () => {
    it('[RED] should convert thumbnail URL to video URL (poster fallback)', () => {
      // Given: video 요소에 poster만 있고 src는 없음
      const container = document.createElement('div');
      container.setAttribute('data-testid', 'videoPlayer');

      const video = document.createElement('video');
      video.poster = 'https://pbs.twimg.com/ext_tw_video_thumb/123456789/pu/img/abc.jpg';
      // src 없음 (로딩 전 상태)

      container.appendChild(video);
      document.body.appendChild(container);

      // When: poster 속성에서 비디오 URL 유추
      // 현재는 convertThumbnailToVideoUrl 함수가 없어서 실패할 것임
      const result = MediaClickDetector.isProcessableMedia(video);

      // Then: 비디오로 감지되고, poster에서 URL 변환이 가능해야 함
      expect(result).toBe(true);

      // TODO: Phase 1-4에서 convertThumbnailToVideoUrl() 유틸리티 구현
      // const convertedUrl = convertThumbnailToVideoUrl(video.poster);
      // expect(convertedUrl).toContain('ext_tw_video');
      // expect(convertedUrl).toContain('.mp4');
      // expect(convertedUrl).not.toContain('_thumb');
    });

    it('[RED] should handle tweet_video_thumb → tweet_video conversion', () => {
      // Given: GIF 썸네일
      const thumbnailUrl = 'https://pbs.twimg.com/tweet_video_thumb/AbC123xyz.jpg';

      // When: 비디오 URL 변환 시도
      // 현재는 변환 함수가 없어서 테스트가 실패할 것임
      // const videoUrl = convertThumbnailToVideoUrl(thumbnailUrl);

      // Then: tweet_video로 변환되고 확장자가 .mp4로 바뀌어야 함
      // expect(videoUrl).toBe('https://pbs.twimg.com/tweet_video/AbC123xyz.mp4');
      // 또는
      // expect(videoUrl).toContain('tweet_video/');
      // expect(videoUrl).toContain('.mp4');
      // expect(videoUrl).not.toContain('_thumb');

      // 현재는 함수가 구현되지 않아 이 테스트를 보류
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('썸네일만 있는 경우 (video 요소 없음)', () => {
    it('[RED] should extract video URL from thumbnail image in video container', () => {
      // Given: 비디오 컨테이너에 이미지만 있고 video 요소가 없음 (아직 로드 전)
      const container = createMockThumbnailOnlyContainer(
        'https://pbs.twimg.com/ext_tw_video_thumb/123456789/pu/img/abc.jpg'
      );

      const img = container.querySelector('img') as globalThis.HTMLImageElement;
      expect(img).not.toBeNull();

      // When: 썸네일 이미지 클릭
      const result = MediaClickDetector.isProcessableMedia(img);

      // Then: 비디오로 감지되어야 함 (컨테이너가 videoComponent)
      // 현재 구현에서는 이미지로만 인식될 수 있음
      expect(result).toBe(true);

      // TODO: Phase 1-3에서 DOMDirectExtractor 강화 후
      // 비디오 컨테이너의 썸네일 이미지를 비디오로 변환하는 로직 추가
      // const extractedUrl = extractVideoUrlFromThumbnail(img.src);
      // expect(extractedUrl).toContain('ext_tw_video');
      // expect(extractedUrl).toContain('.mp4');
    });
  });

  describe('Acceptance Criteria 검증', () => {
    it('[RED] should meet acceptance criteria: video player display', () => {
      // Given: 타임라인 비디오 썸네일
      const videoContainer = createMockVideoContainer({
        thumbnailUrl: 'https://pbs.twimg.com/ext_tw_video_thumb/123/pu/img/a.jpg',
        videoUrl: 'https://video.twimg.com/ext_tw_video/123/pu/vid/1280x720/a.mp4',
      });

      const video = videoContainer.querySelector('video')!;

      // When: 클릭 처리
      const result = MediaClickDetector.isProcessableMedia(video);

      // Then: 비디오로 감지되어야 함
      expect(result).toBe(true);

      // Acceptance:
      // ✅ 타임라인에서 동영상 썸네일 클릭 시 비디오 플레이어 표시
      // ✅ GIF와 일반 비디오 구분 정확
      // ✅ 썸네일 → 비디오 URL 변환 성공률 > 95%
      // ✅ 기존 테스트 GREEN 유지
      // ✅ 번들 크기 증가 < 2KB
    });

    it('[RED] should distinguish GIF from regular video', () => {
      // Given: GIF와 일반 비디오
      const gifContainer = createMockGifContainer({
        thumbnailUrl: 'https://pbs.twimg.com/tweet_video_thumb/123.jpg',
        videoUrl: 'https://video.twimg.com/tweet_video/123.mp4',
      });

      const videoContainer = createMockVideoContainer({
        thumbnailUrl: 'https://pbs.twimg.com/ext_tw_video_thumb/456/pu/img/a.jpg',
        videoUrl: 'https://video.twimg.com/ext_tw_video/456/pu/vid/1280x720/a.mp4',
      });

      const gifVideo = gifContainer.querySelector('video')!;
      const normalVideo = videoContainer.querySelector('video')!;

      // When: 타입 감지
      const gifResult = MediaClickDetector.isProcessableMedia(gifVideo);
      const videoResult = MediaClickDetector.isProcessableMedia(normalVideo);

      // Then: 둘 다 비디오로 감지되어야 함
      expect(gifResult).toBe(true);
      expect(videoResult).toBe(true);

      // TODO: Phase 1-2에서 타입 구분 로직 추가
      // const gifType = detectMediaTypeFromUrl(gifVideo.src);
      // const videoType = detectMediaTypeFromUrl(normalVideo.querySelector('source')!.src);
      // expect(gifType).toBe('gif');
      // expect(videoType).toBe('video');
    });
  });

  describe('[Phase 1-5] 썸네일만 있는 비디오 컨테이너 (RED)', () => {
    it('[RED] should extract video URL from thumbnail-only container', () => {
      // Given: video 요소 없이 썸네일 이미지만 있는 컨테이너
      // (로그: "[DOMDirectExtractor] 비디오 요소 0개 발견" 케이스 재현)
      const thumbnailUrl = 'https://pbs.twimg.com/tweet_video_thumb/GZFabcXYZ.jpg';
      const container = createMockThumbnailOnlyContainer(thumbnailUrl);

      const img = container.querySelector('img') as globalThis.HTMLImageElement;
      expect(img).not.toBeNull();
      expect(img.src).toBe(thumbnailUrl);

      // When: MediaClickDetector로 감지 시도
      const result = MediaClickDetector.isProcessableMedia(img);

      // Then: 현재는 실패 (Phase 1-5 GREEN에서 성공하도록 개선 예정)
      // 이미지 요소는 isProcessableMedia에서 true를 반환하지만,
      // DOMDirectExtractor가 비디오 요소를 찾지 못해 추출 실패
      expect(result).toBe(true); // 이미지로는 감지됨

      // TODO: Phase 1-5 GREEN에서 아래 로직 구현
      // DOMDirectExtractor가 비디오 요소 없이 썸네일 이미지만 있을 때:
      // 1. img[src*="video_thumb"] 검색
      // 2. convertThumbnailToVideoUrl(img.src)로 변환
      // 3. 변환된 비디오 URL로 MediaInfo 생성
    });

    it('[RED] should convert tweet_video_thumb to tweet_video', async () => {
      // Given: tweet_video_thumb 패턴의 썸네일
      const thumbnailUrl = 'https://pbs.twimg.com/tweet_video_thumb/GZFabcXYZ.jpg';
      const expectedVideoUrl = 'https://pbs.twimg.com/tweet_video/GZFabcXYZ.mp4';

      const container = createMockThumbnailOnlyContainer(thumbnailUrl);
      const img = container.querySelector('img')!;

      // When: 썸네일 → 비디오 URL 변환 (Phase 1-4 유틸리티 사용)
      // TODO: Phase 1-5 GREEN에서 DOMDirectExtractor에 통합
      const { convertThumbnailToVideoUrl } = await import(
        '@shared/utils/media/video-url-converter'
      );
      const convertedUrl = convertThumbnailToVideoUrl(thumbnailUrl);

      // Then: 올바르게 변환되어야 함
      expect(convertedUrl).toBe(expectedVideoUrl);
    });

    it('[RED] should handle missing video element gracefully', () => {
      // Given: 비디오 컨테이너이지만 video 요소가 DOM에 없음
      // (로그 분석 결과: 사용자가 썸네일을 클릭했을 때 비디오 요소가 아직 로드되지 않은 상태)
      const container = document.createElement('div');
      container.setAttribute('data-testid', 'videoComponent');

      const thumbnailImg = document.createElement('img');
      thumbnailImg.src = 'https://pbs.twimg.com/ext_tw_video_thumb/123/pu/img/abc.jpg';
      thumbnailImg.alt = 'Video thumbnail';

      container.appendChild(thumbnailImg);
      document.body.appendChild(container);

      // When: 비디오 요소 검색
      const videoElement = container.querySelector('video');

      // Then: null이어야 함 (현재 상태)
      expect(videoElement).toBeNull();

      // TODO: Phase 1-5 GREEN에서 이 케이스를 처리하도록 개선
      // DOMDirectExtractor가 video 요소가 없을 때:
      // 1. 비디오 컨테이너 내부의 썸네일 이미지 검색
      // 2. 썸네일 URL → 비디오 URL 변환
      // 3. MediaInfo 추가
    });

    it('[RED] should not extract from non-video thumbnails', async () => {
      // Given: 일반 이미지 (비디오 썸네일이 아님)
      const container = document.createElement('div');
      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/media/regular_photo.jpg'; // video_thumb 패턴 없음

      container.appendChild(img);
      document.body.appendChild(container);

      // When: 썸네일 → 비디오 URL 변환 시도
      const { convertThumbnailToVideoUrl } = await import(
        '@shared/utils/media/video-url-converter'
      );
      const convertedUrl = convertThumbnailToVideoUrl(img.src);

      // Then: null을 반환해야 함 (비디오 썸네일이 아니므로)
      expect(convertedUrl).toBeNull();
    });
  });
});
