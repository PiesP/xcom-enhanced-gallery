/**
 * Contract Test: Timeline Video Click Detection (Epic TIMELINE-VIDEO-CLICK-FIX)
 *
 * **Purpose**: 타임라인 상에서 동영상 요소 클릭 시 갤러리 기동 검증
 *
 * **Scope**:
 * - Timeline video click detection (타임라인 구조)
 * - Tweet detail page compatibility (기존 동작 유지)
 * - Control blocking precision (재생/음소거 버튼 차단)
 * - Selector specificity (video 태그, role, aria-label 감지)
 * - Gallery trigger validation (processable media 판정)
 *
 * **References**:
 * - Epic: TIMELINE-VIDEO-CLICK-FIX (TDD_REFACTORING_PLAN.md)
 * - Implementation: src/shared/utils/media/MediaClickDetector.ts
 * - Architecture: docs/ARCHITECTURE.md
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MediaClickDetector } from '@shared/utils/media/MediaClickDetector';

describe('Timeline Video Click Detection (Contract)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('[AC-1] Timeline Video Detection', () => {
    it('should detect video element click in timeline structure', () => {
      // Timeline 구조 모킹 (X.com timeline DOM)
      const timelineArticle = document.createElement('div');
      timelineArticle.setAttribute('data-testid', 'cellInnerDiv');

      const videoContainer = document.createElement('div');
      videoContainer.setAttribute('data-testid', 'videoComponent');

      const videoElement = document.createElement('video');
      videoElement.src = 'https://video.twimg.com/ext_tw_video/12345/pu/vid/video.mp4';
      videoElement.setAttribute('aria-label', '동영상');

      videoContainer.appendChild(videoElement);
      timelineArticle.appendChild(videoContainer);
      document.body.appendChild(timelineArticle);

      // Act: video 태그 직접 클릭
      const result = MediaClickDetector.isProcessableMedia(videoElement);

      // Assert: processable로 인식되어야 함
      expect(result).toBe(true);
    });

    it('should detect video role button click in timeline', () => {
      // Timeline 구조: div[role="button"] + aria-label
      const timelineArticle = document.createElement('div');
      timelineArticle.setAttribute('data-testid', 'cellInnerDiv');

      const videoButton = document.createElement('div');
      videoButton.setAttribute('role', 'button');
      videoButton.setAttribute('aria-label', '동영상 재생');
      videoButton.setAttribute('data-testid', 'videoComponent');

      timelineArticle.appendChild(videoButton);
      document.body.appendChild(timelineArticle);

      // Act: role="button" 클릭
      const result = MediaClickDetector.isProcessableMedia(videoButton);

      // Assert: processable로 인식되어야 함
      expect(result).toBe(true);
    });
  });

  describe('[AC-2] Tweet Detail Page Compatibility', () => {
    it('should maintain existing tweet detail video click behavior', () => {
      // Tweet detail 구조 모킹 (article 태그 존재)
      const tweetArticle = document.createElement('article');
      tweetArticle.setAttribute('data-testid', 'tweet');
      tweetArticle.setAttribute('tabindex', '-1');

      const videoContainer = document.createElement('div');
      videoContainer.setAttribute('data-testid', 'videoPlayer');

      const videoElement = document.createElement('video');
      videoElement.src = 'https://video.twimg.com/ext_tw_video/67890/pu/vid/video.mp4';

      videoContainer.appendChild(videoElement);
      tweetArticle.appendChild(videoContainer);
      document.body.appendChild(tweetArticle);

      // Act: tweet detail video 클릭
      const result = MediaClickDetector.isProcessableMedia(videoElement);

      // Assert: 기존처럼 processable 유지
      expect(result).toBe(true);
    });
  });

  describe('[AC-3] Control Blocking Precision', () => {
    it('should block gallery trigger on video play button click', () => {
      // Video controls: play button with aria-label
      const videoContainer = document.createElement('div');
      videoContainer.setAttribute('data-testid', 'videoComponent');

      const playButton = document.createElement('button');
      playButton.setAttribute('aria-label', '재생');
      playButton.setAttribute('data-testid', 'playButton');

      videoContainer.appendChild(playButton);
      document.body.appendChild(videoContainer);

      // Act: play button 클릭
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: playButton, enumerable: true });

      const result = MediaClickDetector.shouldBlockGalleryTrigger(playButton);

      // Assert: 갤러리 트리거 차단되어야 함
      expect(result).toBe(true);
    });

    it('should block gallery trigger on video progress slider interaction', () => {
      // Video controls: progress slider with role="slider"
      const videoContainer = document.createElement('div');
      videoContainer.setAttribute('data-testid', 'videoComponent');

      const progressSlider = document.createElement('div');
      progressSlider.setAttribute('role', 'slider');
      progressSlider.setAttribute('aria-label', '진행 상태');
      progressSlider.setAttribute('data-testid', 'videoProgress');

      videoContainer.appendChild(progressSlider);
      document.body.appendChild(videoContainer);

      // Act: slider 클릭
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: progressSlider, enumerable: true });

      const result = MediaClickDetector.shouldBlockGalleryTrigger(progressSlider);

      // Assert: 갤러리 트리거 차단되어야 함
      expect(result).toBe(true);
    });

    it('should NOT block gallery trigger on video container click (outside controls)', () => {
      // Video container 클릭 (컨트롤 외부)
      const videoContainer = document.createElement('div');
      videoContainer.setAttribute('data-testid', 'videoComponent');

      const videoElement = document.createElement('video');
      videoElement.src = 'https://video.twimg.com/ext_tw_video/12345/pu/vid/video.mp4';

      videoContainer.appendChild(videoElement);
      document.body.appendChild(videoContainer);

      // Act: video container 클릭 (컨트롤 아님)
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: videoContainer, enumerable: true });

      const result = MediaClickDetector.shouldBlockGalleryTrigger(videoContainer);

      // Assert: 갤러리 트리거 허용되어야 함
      expect(result).toBe(false);
    });
  });

  describe('[AC-4] Selector Specificity', () => {
    it('should use precise aria-label patterns instead of broad selectors', () => {
      // 광범위한 selector로 인한 false positive 방지
      const videoContainer = document.createElement('div');
      videoContainer.setAttribute('data-testid', 'videoComponent');

      // 일반 버튼 (aria-label이 비디오 컨트롤과 무관)
      const genericButton = document.createElement('button');
      genericButton.setAttribute('aria-label', '설정 열기');
      genericButton.textContent = 'Settings';

      videoContainer.appendChild(genericButton);
      document.body.appendChild(videoContainer);

      // Act: 일반 버튼 클릭 (비디오 컨트롤 아님)
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: genericButton, enumerable: true });

      const result = MediaClickDetector.shouldBlockGalleryTrigger(genericButton);

      // Assert: 갤러리 트리거 허용되어야 함 (false positive 방지)
      expect(result).toBe(false);
    });
  });

  describe('[Edge Cases] Timeline Video Click', () => {
    it('should handle nested video structure in timeline', () => {
      // 중첩된 timeline 구조
      const outerDiv = document.createElement('div');
      outerDiv.setAttribute('data-testid', 'cellInnerDiv');

      const innerDiv = document.createElement('div');
      innerDiv.setAttribute('data-testid', 'videoComponent');

      const videoWrapper = document.createElement('div');
      videoWrapper.className = 'video-wrapper';

      const videoElement = document.createElement('video');
      videoElement.src = 'https://video.twimg.com/ext_tw_video/99999/pu/vid/video.mp4';

      videoWrapper.appendChild(videoElement);
      innerDiv.appendChild(videoWrapper);
      outerDiv.appendChild(innerDiv);
      document.body.appendChild(outerDiv);

      // Act: 중첩 구조 내 video 클릭
      const result = MediaClickDetector.isProcessableMedia(videoElement);

      // Assert: processable로 인식되어야 함
      expect(result).toBe(true);
    });

    it('should ignore non-Twitter video URLs', () => {
      // 외부 동영상 URL (Twitter 외부)
      const videoElement = document.createElement('video');
      videoElement.src = 'https://example.com/malicious-video.mp4';

      document.body.appendChild(videoElement);

      // Act: 외부 URL video 클릭
      const result = MediaClickDetector.isProcessableMedia(videoElement);

      // Assert: processable로 인식되지 않아야 함 (보안)
      expect(result).toBe(false);
    });
  });
});
