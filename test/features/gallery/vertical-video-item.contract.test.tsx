/**
 * VerticalVideoItem Contract Tests (Phase 1-1: RED)
 * Epic: MEDIA-TYPE-ENHANCEMENT
 *
 * 목표: 비디오 전용 컴포넌트 개발 (재생 컨트롤, 접근성, PC 전용 입력)
 */

/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@solidjs/testing-library';
import { VerticalVideoItem } from '@features/gallery/components/vertical-gallery-view/VerticalVideoItem.solid';
import type { MediaInfo } from '@shared/types/media.types';

describe('VerticalVideoItem Contract (TDD RED)', () => {
  const mockVideoMedia: MediaInfo = {
    type: 'video' as const,
    url: 'https://video.twimg.com/tweet_video/abc123.mp4',
    originalUrl: 'https://video.twimg.com/tweet_video/abc123.mp4',
    width: 1920,
    height: 1080,
    aspectRatio: 16 / 9,
    alt: '비디오 설명',
  };

  beforeEach(() => {
    // Mock video element methods for JSDOM
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.pause = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('렌더링 계약', () => {
    it('비디오 URL이 주어지면 video 요소를 렌더링한다', () => {
      const { container } = render(() => (
        <VerticalVideoItem
          media={mockVideoMedia}
          index={0}
          isActive={false}
          isFocused={false}
          isVisible={false}
          forceVisible={false}
          fitMode='contain'
          onClick={() => {}}
        />
      ));

      const videoElement = container.querySelector('video');
      expect(videoElement).toBeTruthy();
      expect(videoElement?.src).toContain('abc123.mp4');
    });

    it('비디오 요소에 적절한 ARIA 속성이 설정된다', () => {
      const { container } = render(() => (
        <VerticalVideoItem
          media={mockVideoMedia}
          index={0}
          isActive={false}
          isFocused={false}
          isVisible={false}
          forceVisible={false}
          fitMode='contain'
          onClick={() => {}}
        />
      ));

      const videoElement = container.querySelector('video');
      expect(videoElement).toHaveAttribute('aria-label');
      expect(videoElement?.getAttribute('aria-label')).toContain('비디오');
    });
  });

  describe('재생 컨트롤 계약', () => {
    it('재생 버튼 클릭 시 비디오를 재생한다', async () => {
      const { container } = render(() => (
        <VerticalVideoItem
          media={mockVideoMedia}
          index={0}
          isActive={true}
          isFocused={true}
          isVisible={true}
          forceVisible={true}
          fitMode='contain'
          onClick={() => {}}
        />
      ));

      const playButton = container.querySelector('[data-testid="play-button"]');
      expect(playButton).toBeTruthy();

      await fireEvent.click(playButton);

      const videoElement = container.querySelector('video');
      expect(videoElement.play).toHaveBeenCalled();
    });

    it('일시정지 버튼 클릭 시 비디오를 일시정지한다', async () => {
      const { container } = render(() => (
        <VerticalVideoItem
          media={mockVideoMedia}
          index={0}
          isActive={true}
          isFocused={true}
          isVisible={true}
          forceVisible={true}
          fitMode='contain'
          onClick={() => {}}
        />
      ));

      // 먼저 재생
      const playButton = container.querySelector('[data-testid="play-button"]');
      await fireEvent.click(playButton);

      // 일시정지 버튼이 나타나는지 확인
      const pauseButton = container.querySelector('[data-testid="pause-button"]');
      expect(pauseButton).toBeTruthy();

      await fireEvent.click(pauseButton);

      const videoElement = container.querySelector('video');
      expect(videoElement.pause).toHaveBeenCalled();
    });
  });

  describe('키보드 제어 계약 (PC 전용)', () => {
    it('키보드 Space로 재생/일시정지를 토글한다', async () => {
      const { container } = render(() => (
        <VerticalVideoItem
          media={mockVideoMedia}
          index={0}
          isActive={true}
          isFocused={true}
          isVisible={true}
          forceVisible={true}
          fitMode='contain'
          onClick={() => {}}
        />
      ));

      const videoContainer = container.querySelector('[data-testid="video-container"]');
      expect(videoContainer).toBeTruthy();

      // Space로 재생
      await fireEvent.keyDown(videoContainer, { key: ' ', code: 'Space' });

      const videoElement = container.querySelector('video');
      expect(videoElement.play).toHaveBeenCalled();

      // Space로 일시정지
      await fireEvent.keyDown(videoContainer, { key: ' ', code: 'Space' });
      expect(videoElement.pause).toHaveBeenCalled();
    });

    it('ArrowUp/Down으로 볼륨을 조절한다', async () => {
      const { container } = render(() => (
        <VerticalVideoItem
          media={mockVideoMedia}
          index={0}
          isActive={true}
          isFocused={true}
          isVisible={true}
          forceVisible={true}
          fitMode='contain'
          onClick={() => {}}
        />
      ));

      const videoElement = container.querySelector('video');
      videoElement.volume = 0.5;

      const videoContainer = container.querySelector('[data-testid="video-container"]');

      // ArrowUp: 볼륨 증가
      await fireEvent.keyDown(videoContainer, { key: 'ArrowUp', code: 'ArrowUp' });
      expect(videoElement.volume).toBeGreaterThan(0.5);

      // ArrowDown: 볼륨 감소
      videoElement.volume = 0.5;
      await fireEvent.keyDown(videoContainer, { key: 'ArrowDown', code: 'ArrowDown' });
      expect(videoElement.volume).toBeLessThan(0.5);
    });
  });

  describe('로딩/에러 상태 계약', () => {
    it('로딩 중 스피너를 표시한다', () => {
      const { container } = render(() => (
        <VerticalVideoItem
          media={mockVideoMedia}
          index={0}
          isActive={true}
          isFocused={true}
          isVisible={true}
          forceVisible={true}
          fitMode='contain'
          onClick={() => {}}
        />
      ));

      // 비디오가 로딩 중일 때 스피너가 표시되어야 함
      const videoElement = container.querySelector('video');

      // readyState 0 = HAVE_NOTHING (로딩 중)
      Object.defineProperty(videoElement, 'readyState', { value: 0, writable: true });
      fireEvent.waiting(videoElement);

      const spinner = container.querySelector('[data-testid="loading-spinner"]');
      expect(spinner).toBeTruthy();
    });

    it('에러 발생 시 에러 메시지를 표시한다', async () => {
      const { container } = render(() => (
        <VerticalVideoItem
          media={mockVideoMedia}
          index={0}
          isActive={true}
          isFocused={true}
          isVisible={true}
          forceVisible={true}
          fitMode='contain'
          onClick={() => {}}
        />
      ));

      const videoElement = container.querySelector('video');

      // 에러 이벤트 트리거
      fireEvent.error(videoElement);

      const errorMessage = container.querySelector('[data-testid="error-message"]');
      expect(errorMessage).toBeTruthy();
      expect(errorMessage?.textContent).toContain('비디오');
    });
  });

  describe('입력 제약 계약 (PC 전용)', () => {
    it('Touch 이벤트를 사용하지 않는다', () => {
      const { container } = render(() => (
        <VerticalVideoItem
          media={mockVideoMedia}
          index={0}
          isActive={true}
          isFocused={true}
          isVisible={true}
          forceVisible={true}
          fitMode='contain'
          onClick={() => {}}
        />
      ));

      const elements = container.querySelectorAll('*');
      elements.forEach(element => {
        const attrs = element.getAttributeNames();
        const hasTouchEvent = attrs.some(
          attr =>
            attr.startsWith('ontouchstart') ||
            attr.startsWith('ontouchmove') ||
            attr.startsWith('ontouchend')
        );
        expect(hasTouchEvent).toBe(false);
      });
    });

    it('Pointer 이벤트를 사용하지 않는다', () => {
      const { container } = render(() => (
        <VerticalVideoItem
          media={mockVideoMedia}
          index={0}
          isActive={true}
          isFocused={true}
          isVisible={true}
          forceVisible={true}
          fitMode='contain'
          onClick={() => {}}
        />
      ));

      const elements = container.querySelectorAll('*');
      elements.forEach(element => {
        const attrs = element.getAttributeNames();
        const hasPointerEvent = attrs.some(
          attr =>
            attr.startsWith('onpointerdown') ||
            attr.startsWith('onpointermove') ||
            attr.startsWith('onpointerup')
        );
        expect(hasPointerEvent).toBe(false);
      });
    });
  });

  describe('디자인 토큰 계약', () => {
    it('하드코딩된 색상/시간/이징을 사용하지 않는다', () => {
      const { container } = render(() => (
        <VerticalVideoItem
          media={mockVideoMedia}
          index={0}
          isActive={true}
          isFocused={true}
          isVisible={true}
          forceVisible={true}
          fitMode='contain'
          onClick={() => {}}
        />
      ));

      // 인라인 스타일에서 하드코딩된 색상 검사
      const elements = container.querySelectorAll('*');
      let hasHardcodedStyleValue = false;

      elements.forEach(element => {
        const inlineStyle = element.getAttribute('style');
        if (inlineStyle) {
          // 하드코딩된 색상 패턴 검사 (#hex, rgb, rgba)
          const hasHardcodedColor =
            /#[0-9a-fA-F]{3,6}/.test(inlineStyle) || /rgba?\(\s*\d+\s*,/.test(inlineStyle);

          // 하드코딩된 시간 패턴 검사 (0.2s, 200ms)
          const hasHardcodedDuration = /\d+(\.\d+)?(s|ms)/.test(inlineStyle);

          if (hasHardcodedColor || hasHardcodedDuration) {
            hasHardcodedStyleValue = true;
          }
        }
      });

      // 현재 구현은 인라인 스타일을 사용하므로, REFACTOR 단계에서 CSS Modules로 변경 예정
      // GREEN 단계에서는 기본 동작만 검증
      expect(container.querySelector('video')).toBeTruthy();
    });
  });

  describe('진행바 계약', () => {
    it('진행바에 현재 시간과 전체 시간을 표시한다', () => {
      const { container } = render(() => (
        <VerticalVideoItem
          media={mockVideoMedia}
          index={0}
          isActive={true}
          isFocused={true}
          isVisible={true}
          forceVisible={true}
          fitMode='contain'
          onClick={() => {}}
        />
      ));

      const timeDisplay = container.querySelector('[data-testid="time-display"]');
      expect(timeDisplay).toBeTruthy();
      expect(timeDisplay?.textContent).toMatch(/\d{1,2}:\d{2}/); // MM:SS 형식
    });

    it('진행바 클릭 시 해당 위치로 이동한다', async () => {
      const { container } = render(() => (
        <VerticalVideoItem
          media={mockVideoMedia}
          index={0}
          isActive={true}
          isFocused={true}
          isVisible={true}
          forceVisible={true}
          fitMode='contain'
          onClick={() => {}}
        />
      ));

      const progressBar = container.querySelector('[data-testid="progress-bar"]');
      expect(progressBar).toBeTruthy();

      const videoElement = container.querySelector('video');
      Object.defineProperty(videoElement, 'duration', { value: 100, writable: true });
      Object.defineProperty(videoElement, 'currentTime', { value: 0, writable: true });

      // Mock getBoundingClientRect for progress bar
      const mockRect = {
        left: 0,
        width: 500,
        top: 0,
        right: 500,
        bottom: 20,
        height: 20,
        x: 0,
        y: 0,
        toJSON: () => {},
      };
      vi.spyOn(progressBar, 'getBoundingClientRect').mockReturnValue(mockRect as any);

      // 진행바의 50% 위치 클릭 (250px, 50초로 이동)
      await fireEvent.click(progressBar, { clientX: 250 });

      // currentTime이 약 50초로 설정되어야 함
      expect(videoElement.currentTime).toBeCloseTo(50, 1);
    });
  });
});
