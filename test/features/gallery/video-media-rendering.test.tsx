/**
 * @fileoverview Video Media Rendering 통합 테스트
 * Epic: GALLERY-ENHANCEMENT-001 Sub-Epic 2
 * TDD Phase: RED (테스트 작성)
 *
 * 목표:
 * - MediaExtractionService가 video type을 정확히 추출하는지 검증
 * - VerticalImageItem이 video type을 <video> 태그로 렌더링하는지 검증
 * - 비디오 controls, preload, error handling 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getSolidCore, getSolidWeb } from '@shared/external/vendors';
import type { MediaInfo } from '@shared/types';

describe('Video Media Rendering (Sub-Epic 2)', () => {
  let cleanup: (() => void) | null = null;

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('Phase 2-1: 비디오 type 감지 및 렌더링 (RED)', () => {
    it('[RED] should render <video> element for video type media', async () => {
      const solid = getSolidCore();
      const { render } = getSolidWeb();

      // Mock 비디오 미디어
      const videoMedia: MediaInfo = {
        id: 'vid_1',
        url: 'https://video.twimg.com/ext_tw_video/test.mp4',
        type: 'video',
        filename: 'test.mp4',
        originalUrl: 'https://video.twimg.com/ext_tw_video/test.mp4',
      };

      // VerticalImageItem import
      const { VerticalImageItem } = await import(
        '@features/gallery/components/vertical-gallery-view/VerticalImageItem'
      );

      // 렌더링
      const container = document.createElement('div');
      document.body.appendChild(container);

      cleanup = render(
        () =>
          solid.createComponent(VerticalImageItem, {
            media: videoMedia,
            index: 0,
            fitMode: 'fitContainer',
            isActive: true,
            isFocused: false,
            isVisible: true,
          }),
        container
      );

      // 약간의 시간 대기 (비동기 렌더링)
      await new Promise(resolve => setTimeout(resolve, 50));

      // 검증: <video> 태그가 렌더링되었는가?
      const videoElement = container.querySelector('video');
      expect(videoElement).not.toBeNull();
      expect(videoElement?.tagName).toBe('VIDEO');

      // 검증: video src가 올바른가?
      expect(videoElement?.src).toContain('video.twimg.com');
      expect(videoElement?.src).toContain('test.mp4');
    });

    it('[RED] should render <img> element for image type media', async () => {
      const solid = getSolidCore();
      const { render } = getSolidWeb();

      // Mock 이미지 미디어
      const imageMedia: MediaInfo = {
        id: 'img_1',
        url: 'https://pbs.twimg.com/media/test.jpg',
        type: 'image',
        filename: 'test.jpg',
        originalUrl: 'https://pbs.twimg.com/media/test.jpg',
      };

      // VerticalImageItem import
      const { VerticalImageItem } = await import(
        '@features/gallery/components/vertical-gallery-view/VerticalImageItem'
      );

      // 렌더링
      const container = document.createElement('div');
      document.body.appendChild(container);

      cleanup = render(
        () =>
          solid.createComponent(VerticalImageItem, {
            media: imageMedia,
            index: 0,
            fitMode: 'fitContainer',
            isActive: true,
            isFocused: false,
            isVisible: true,
          }),
        container
      );

      // 약간의 시간 대기 (비동기 렌더링)
      await new Promise(resolve => setTimeout(resolve, 50));

      // 검증: <img> 태그가 렌더링되었는가?
      const imgElement = container.querySelector('img');
      expect(imgElement).not.toBeNull();
      expect(imgElement?.tagName).toBe('IMG');

      // 검증: img src가 올바른가?
      expect(imgElement?.src).toContain('pbs.twimg.com');
      expect(imgElement?.src).toContain('test.jpg');

      // 검증: <video> 태그가 없는가?
      const videoElement = container.querySelector('video');
      expect(videoElement).toBeNull();
    });

    it('[RED] should include controls attribute on video element', async () => {
      const solid = getSolidCore();
      const { render } = getSolidWeb();

      const videoMedia: MediaInfo = {
        id: 'vid_2',
        url: 'https://video.twimg.com/ext_tw_video/controls_test.mp4',
        type: 'video',
        filename: 'controls_test.mp4',
      };

      const { VerticalImageItem } = await import(
        '@features/gallery/components/vertical-gallery-view/VerticalImageItem'
      );

      const container = document.createElement('div');
      document.body.appendChild(container);

      cleanup = render(
        () =>
          solid.createComponent(VerticalImageItem, {
            media: videoMedia,
            index: 0,
            fitMode: 'fitContainer',
            isActive: true,
            isFocused: false,
            isVisible: true,
          }),
        container
      );

      await new Promise(resolve => setTimeout(resolve, 50));

      const videoElement = container.querySelector('video');
      expect(videoElement).not.toBeNull();

      // 검증: controls 속성이 있는가?
      expect(videoElement?.hasAttribute('controls')).toBe(true);
    });

    it('[RED] should detect video type from URL extension', async () => {
      const solid = getSolidCore();
      const { render } = getSolidWeb();

      // type이 명시되지 않았지만 URL에서 .mp4 확장자로 감지
      const videoMedia: MediaInfo = {
        id: 'vid_3',
        url: 'https://video.twimg.com/ext_tw_video/test.mp4',
        type: 'image', // 잘못된 type
        filename: 'test.mp4',
      };

      const { VerticalImageItem } = await import(
        '@features/gallery/components/vertical-gallery-view/VerticalImageItem'
      );

      const container = document.createElement('div');
      document.body.appendChild(container);

      cleanup = render(
        () =>
          solid.createComponent(VerticalImageItem, {
            media: videoMedia,
            index: 0,
            fitMode: 'fitContainer',
            isActive: true,
            isFocused: false,
            isVisible: true,
          }),
        container
      );

      await new Promise(resolve => setTimeout(resolve, 50));

      // 검증: URL 확장자 기반으로 <video> 렌더링되는가?
      const videoElement = container.querySelector('video');
      expect(videoElement).not.toBeNull();
      expect(videoElement?.tagName).toBe('VIDEO');
    });
  });

  describe('Phase 2-2: 비디오 에러 처리 (GREEN)', () => {
    it('[GREEN] should show error message when video fails to load', async () => {
      const solid = getSolidCore();
      const { render } = getSolidWeb();

      const invalidVideoMedia: MediaInfo = {
        id: 'vid_error',
        url: 'https://video.twimg.com/invalid.mp4',
        type: 'video',
        filename: 'invalid.mp4',
      };

      const { VerticalImageItem } = await import(
        '@features/gallery/components/vertical-gallery-view/VerticalImageItem'
      );

      const container = document.createElement('div');
      document.body.appendChild(container);

      cleanup = render(
        () =>
          solid.createComponent(VerticalImageItem, {
            media: invalidVideoMedia,
            index: 0,
            fitMode: 'fitContainer',
            isActive: true,
            isFocused: false,
            isVisible: true,
          }),
        container
      );

      await new Promise(resolve => setTimeout(resolve, 50));

      const videoElement = container.querySelector('video');
      expect(videoElement).not.toBeNull();

      // 비디오 로드 에러 시뮬레이션
      if (videoElement) {
        videoElement.dispatchEvent(new Event('error'));
      }

      await new Promise(resolve => setTimeout(resolve, 50));

      // 검증: 에러 메시지가 표시되는가?
      const errorElement = container.querySelector('[class*="error"]');
      expect(errorElement).not.toBeNull();
    });
  });

  describe('Phase 2-3: 비디오/이미지 혼합 렌더링 (REFACTOR)', () => {
    it('[REFACTOR] should correctly render mixed media types', async () => {
      const solid = getSolidCore();
      const { render } = getSolidWeb();

      const mixedMedia: MediaInfo[] = [
        {
          id: 'img_1',
          url: 'https://pbs.twimg.com/media/image1.jpg',
          type: 'image',
          filename: 'image1.jpg',
        },
        {
          id: 'vid_1',
          url: 'https://video.twimg.com/ext_tw_video/video1.mp4',
          type: 'video',
          filename: 'video1.mp4',
        },
        {
          id: 'img_2',
          url: 'https://pbs.twimg.com/media/image2.jpg',
          type: 'image',
          filename: 'image2.jpg',
        },
      ];

      const { VerticalImageItem } = await import(
        '@features/gallery/components/vertical-gallery-view/VerticalImageItem'
      );

      const container = document.createElement('div');
      document.body.appendChild(container);

      // 모든 미디어 렌더링
      cleanup = render(
        () =>
          solid.createComponent(solid.For, {
            each: mixedMedia,
            children: (media: MediaInfo, index: () => number) =>
              solid.createComponent(VerticalImageItem, {
                media,
                index: index(),
                fitMode: 'fitContainer',
                isActive: false,
                isFocused: false,
                isVisible: true,
              }),
          }),
        container
      );

      await new Promise(resolve => setTimeout(resolve, 50));

      // 검증: 이미지 2개, 비디오 1개가 렌더링되었는가?
      const images = container.querySelectorAll('img');
      const videos = container.querySelectorAll('video');

      expect(images.length).toBe(2);
      expect(videos.length).toBe(1);

      // 검증: 순서가 올바른가?
      const allMedia = container.querySelectorAll('[data-xeg-gallery-type="item"]');
      expect(allMedia.length).toBe(3);
    });
  });
});
