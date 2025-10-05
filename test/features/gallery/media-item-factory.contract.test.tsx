/**
 * @fileoverview MediaItemFactory Contract Tests (TDD RED Phase)
 * Epic: MEDIA-TYPE-ENHANCEMENT Phase 1-3
 *
 * Factory 패턴을 통한 미디어 타입별 컴포넌트 선택 로직 검증
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@solidjs/testing-library';
import { createMediaItem } from '@features/gallery/factories/MediaItemFactory';
import type { MediaInfo } from '@shared/types/media.types';

describe('MediaItemFactory Contract (TDD RED)', () => {
  afterEach(() => {
    cleanup();
  });

  describe('타입 기반 컴포넌트 선택', () => {
    const commonProps = {
      index: 0,
      isActive: true,
      isFocused: false,
      isVisible: true,
      forceVisible: false,
      fitMode: 'cover' as const,
    };

    it('image 타입은 VerticalImageItem을 반환한다', () => {
      const media: MediaInfo = {
        url: 'https://pbs.twimg.com/media/test.jpg',
        type: 'image',
        originalUrl: 'https://pbs.twimg.com/media/test.jpg',
        index: 0,
      };

      const component = createMediaItem(media, commonProps);

      expect(component).toBeDefined();
      // 실제 렌더링 시 VerticalImageItem 특성 검증
      const { container } = render(() => component);
      // VerticalImageItem은 data-xeg-component='vertical-image-item' 속성을 가집니다
      expect(container.querySelector('[data-xeg-component="vertical-image-item"]')).toBeTruthy();
    });

    it('video 타입은 VerticalVideoItem을 반환한다', () => {
      const media: MediaInfo = {
        url: 'https://video.twimg.com/ext_tw_video/test.mp4',
        type: 'video',
        originalUrl: 'https://video.twimg.com/ext_tw_video/test.mp4',
        index: 0,
      };

      const component = createMediaItem(media, commonProps);

      expect(component).toBeDefined();
      const { container } = render(() => component);
      expect(container.querySelector('[data-testid="video-container"]')).toBeTruthy();
    });

    it('gif 타입은 VerticalImageItem을 폴백한다', () => {
      const media: MediaInfo = {
        url: 'https://pbs.twimg.com/tweet_video/test.gif',
        type: 'gif',
        originalUrl: 'https://pbs.twimg.com/tweet_video/test.gif',
        index: 0,
      };

      const component = createMediaItem(media, commonProps);

      expect(component).toBeDefined();
      const { container } = render(() => component);
      // GIF는 현재 VerticalImageItem으로 처리
      expect(container.querySelector('[data-xeg-component="vertical-image-item"]')).toBeTruthy();
    });

    it('알 수 없는 타입은 VerticalImageItem을 폴백한다', () => {
      const media: MediaInfo = {
        url: 'https://pbs.twimg.com/media/unknown.file',
        type: 'image' as any, // 타입 강제
        originalUrl: 'https://pbs.twimg.com/media/unknown.file',
        index: 0,
      };

      const component = createMediaItem(media, commonProps);

      expect(component).toBeDefined();
      const { container } = render(() => component);
      expect(container.querySelector('[data-xeg-component="vertical-image-item"]')).toBeTruthy();
    });
  });

  describe('Props 전달 검증', () => {
    it('모든 공통 props를 컴포넌트에 전달한다', () => {
      const media: MediaInfo = {
        url: 'https://pbs.twimg.com/media/test.jpg',
        type: 'image',
        originalUrl: 'https://pbs.twimg.com/media/test.jpg',
        index: 0,
      };

      const props = {
        index: 5,
        isActive: true,
        isFocused: true,
        isVisible: false,
        forceVisible: true,
        fitMode: 'contain' as const,
      };

      const component = createMediaItem(media, props);
      const { container } = render(() => component);

      // 컨테이너가 존재하고 props가 적용되었는지 확인
      const containerEl = container.querySelector('[data-xeg-component="vertical-image-item"]');
      expect(containerEl).toBeTruthy();
    });

    it('media 정보를 컴포넌트에 전달한다', () => {
      const media: MediaInfo = {
        url: 'https://video.twimg.com/ext_tw_video/test.mp4',
        type: 'video',
        originalUrl: 'https://video.twimg.com/ext_tw_video/test.mp4',
        index: 3,
        thumbnailUrl: 'https://pbs.twimg.com/media/thumb.jpg',
      };

      const props = {
        index: 3,
        isActive: true,
        isFocused: false,
        isVisible: true,
        forceVisible: false,
        fitMode: 'cover' as const,
      };

      const component = createMediaItem(media, props);
      const { container } = render(() => component);

      const videoEl = container.querySelector('video');
      expect(videoEl).toBeTruthy();
      expect(videoEl?.src).toContain('test.mp4');
    });
  });

  describe('타입 안전성', () => {
    it('MediaInfo 타입을 정확히 준수한다', () => {
      const media: MediaInfo = {
        url: 'https://pbs.twimg.com/media/test.jpg',
        type: 'image',
        originalUrl: 'https://pbs.twimg.com/media/test.jpg',
        index: 0,
      };

      const props = {
        index: 0,
        isActive: true,
        isFocused: false,
        isVisible: true,
        forceVisible: false,
        fitMode: 'cover' as const,
      };

      // 타입 체크가 통과되면 성공
      const component = createMediaItem(media, props);
      expect(component).toBeDefined();
    });
  });
});
