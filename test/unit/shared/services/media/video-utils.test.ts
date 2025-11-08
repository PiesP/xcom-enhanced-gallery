/**
 * @fileoverview Video Utilities Unit Tests
 * @description Phase 291 분리된 모듈에 대한 단위 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../../shared/global-cleanup-hooks';
import {
  isVideoThumbnail,
  isVideoPlayer,
  isVideoElement,
  extractTweetId,
  getTweetIdFromContainer,
} from '../../../../../src/shared/services/media/video-utils';

describe('video-utils', () => {
  setupGlobalTestIsolation();

  describe('isVideoThumbnail', () => {
    let imgElement: HTMLImageElement;

    beforeEach(() => {
      imgElement = document.createElement('img');
    });

    it('썸네일 URL 패턴으로 비디오 썸네일 감지', () => {
      imgElement.src = 'https://pbs.twimg.com/ext_tw_video_thumb/123/pu/img/abc.jpg';
      expect(isVideoThumbnail(imgElement)).toBe(true);
    });

    it('amplify_video_thumb 패턴 감지', () => {
      imgElement.src = 'https://pbs.twimg.com/amplify_video_thumb/456/img/xyz.jpg';
      expect(isVideoThumbnail(imgElement)).toBe(true);
    });

    it('tweet_video_thumb 패턴 감지', () => {
      imgElement.src = 'https://pbs.twimg.com/tweet_video_thumb/789.jpg';
      expect(isVideoThumbnail(imgElement)).toBe(true);
    });

    it('alt 텍스트로 Animated GIF 감지', () => {
      imgElement.alt = 'Animated Text GIF';
      expect(isVideoThumbnail(imgElement)).toBe(true);
    });

    it('alt 텍스트로 Embedded video 감지', () => {
      imgElement.alt = 'Embedded video';
      expect(isVideoThumbnail(imgElement)).toBe(true);
    });

    it('일반 이미지는 false 반환', () => {
      imgElement.src = 'https://pbs.twimg.com/media/abc123.jpg';
      imgElement.alt = 'Photo';
      expect(isVideoThumbnail(imgElement)).toBe(false);
    });
  });

  describe('isVideoPlayer', () => {
    it('VIDEO 요소는 true 반환', () => {
      const videoElement = document.createElement('video');
      expect(isVideoPlayer(videoElement)).toBe(true);
    });

    it('일반 DIV 요소는 false 반환', () => {
      const divElement = document.createElement('div');
      expect(isVideoPlayer(divElement)).toBe(false);
    });
  });

  describe('isVideoElement', () => {
    it('IMG 요소는 isVideoThumbnail 결과 반환', () => {
      const imgElement = document.createElement('img');
      imgElement.src = 'https://pbs.twimg.com/ext_tw_video_thumb/123/pu/img/abc.jpg';
      expect(isVideoElement(imgElement)).toBe(true);
    });

    it('VIDEO 요소는 true 반환', () => {
      const videoElement = document.createElement('video');
      expect(isVideoElement(videoElement)).toBe(true);
    });

    it('일반 요소는 false 반환', () => {
      const divElement = document.createElement('div');
      expect(isVideoElement(divElement)).toBe(false);
    });
  });

  describe('extractTweetId', () => {
    it('표준 트윗 URL에서 ID 추출', () => {
      const url = 'https://x.com/user/status/1234567890123456789';
      expect(extractTweetId(url)).toBe('1234567890123456789');
    });

    it('twitter.com URL에서도 ID 추출', () => {
      const url = 'https://twitter.com/user/status/9876543210987654321';
      expect(extractTweetId(url)).toBe('9876543210987654321');
    });

    it('쿼리 파라미터가 있어도 ID 추출', () => {
      const url = 'https://x.com/user/status/1111111111111111111?s=20';
      expect(extractTweetId(url)).toBe('1111111111111111111');
    });

    it('status가 없으면 null 반환', () => {
      const url = 'https://x.com/user';
      expect(extractTweetId(url)).toBe(null);
    });

    it('빈 문자열은 null 반환', () => {
      expect(extractTweetId('')).toBe(null);
    });
  });

  describe('getTweetIdFromContainer', () => {
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement('div');
    });

    it('링크 href에서 트윗 ID 추출', () => {
      const link = document.createElement('a');
      link.href = 'https://x.com/user/status/1234567890123456789';
      container.appendChild(link);

      expect(getTweetIdFromContainer(container)).toBe('1234567890123456789');
    });

    it('time 요소의 부모 링크에서 ID 추출', () => {
      const link = document.createElement('a');
      link.href = 'https://x.com/user/status/9876543210987654321';
      const time = document.createElement('time');
      link.appendChild(time);
      container.appendChild(link);

      expect(getTweetIdFromContainer(container)).toBe('9876543210987654321');
    });

    it('data-tweet-id 속성에서 ID 추출', () => {
      const div = document.createElement('div');
      div.setAttribute('data-tweet-id', '1111111111111111111');
      container.appendChild(div);

      expect(getTweetIdFromContainer(container)).toBe('1111111111111111111');
    });

    it('aria-label에서 ID 추출', () => {
      const div = document.createElement('div');
      div.setAttribute('aria-label', 'Tweet 1234567890123456789');
      container.appendChild(div);

      expect(getTweetIdFromContainer(container)).toBe('1234567890123456789');
    });

    it('상대 경로 URL도 처리', () => {
      const link = document.createElement('a');
      link.href = '/user/status/5555555555555555555';
      container.appendChild(link);

      expect(getTweetIdFromContainer(container)).toBe('5555555555555555555');
    });

    it('ID를 찾을 수 없으면 null 반환', () => {
      expect(getTweetIdFromContainer(container)).toBe(null);
    });
  });
});
