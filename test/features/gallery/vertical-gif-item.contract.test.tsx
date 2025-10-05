/**
 * VerticalGifItem Contract Tests (Phase 1-2: RED)
 * Epic: MEDIA-TYPE-ENHANCEMENT
 *
 * 목표: GIF 전용 컴포넌트 개발 (재생/일시정지, 반복 제어, 접근성, PC 전용 입력)
 */

/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, cleanup, waitFor } from '@solidjs/testing-library';
import { VerticalGifItem } from '@features/gallery/components/vertical-gallery-view/VerticalGifItem.solid';
import type { MediaInfo } from '@shared/types/media.types';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

describe('VerticalGifItem Contract (TDD RED)', () => {
  const mockGifMedia: MediaInfo = {
    type: 'gif' as const,
    url: 'https://pbs.twimg.com/tweet_video/abc123.gif',
    originalUrl: 'https://pbs.twimg.com/tweet_video/abc123.gif',
    width: 400,
    height: 300,
    aspectRatio: 4 / 3,
    alt: 'GIF 애니메이션 설명',
  };

  beforeEach(() => {
    // Mock canvas getContext for JSDOM
    (window as any).HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      drawImage: vi.fn(),
      clearRect: vi.fn(),
      canvas: {} as any,
    })) as any;

    // Mock Image for GIF loading
    (window as any).Image = class MockImage {
      onload: (() => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      src = '';
      width = 400;
      height = 300;

      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }
    } as any;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('렌더링 계약', () => {
    it('GIF URL이 주어지면 canvas 요소를 렌더링한다', () => {
      const { container } = render(() => (
        <VerticalGifItem
          media={mockGifMedia}
          index={0}
          isActive={false}
          isFocused={false}
          isVisible={false}
          forceVisible={false}
          fitMode='contain'
          onClick={() => {}}
        />
      ));

      const canvasElement = container.querySelector('canvas');
      expect(canvasElement).toBeTruthy();

      // data-xeg-component는 컨테이너에 있음
      const containerElement = container.querySelector('[data-xeg-component="vertical-gif-item"]');
      expect(containerElement).toBeTruthy();
    });

    it('GIF 요소에 적절한 ARIA 속성이 설정된다', () => {
      const { container } = render(() => (
        <VerticalGifItem
          media={mockGifMedia}
          index={0}
          isActive={false}
          isFocused={false}
          isVisible={false}
          forceVisible={false}
          fitMode='contain'
          onClick={() => {}}
        />
      ));

      const canvasElement = container.querySelector('canvas');
      expect(canvasElement).toHaveAttribute('role', 'img');
      expect(canvasElement).toHaveAttribute('aria-label');
      expect(canvasElement?.getAttribute('aria-label')).toContain('GIF');
    });

    it('GIF alt 텍스트가 aria-label에 반영된다', () => {
      const { container } = render(() => (
        <VerticalGifItem
          media={mockGifMedia}
          index={0}
          isActive={false}
          isFocused={false}
          isVisible={false}
          forceVisible={false}
          fitMode='contain'
          onClick={() => {}}
        />
      ));

      const canvasElement = container.querySelector('canvas');
      expect(canvasElement?.getAttribute('aria-label')).toContain('GIF 애니메이션 설명');
    });
  });

  describe('재생 컨트롤 계약', () => {
    it('기본적으로 GIF가 자동 재생된다', async () => {
      const { container } = render(() => (
        <VerticalGifItem
          media={mockGifMedia}
          index={0}
          isActive={true}
          isFocused={true}
          isVisible={true}
          forceVisible={true}
          fitMode='contain'
          onClick={() => {}}
        />
      ));

      // GIF는 자동 재생되므로 일시정지 버튼이 표시되어야 함
      await waitFor(() => {
        const pauseButton = container.querySelector('[data-testid="pause-button"]');
        expect(pauseButton).toBeTruthy();
      });
    });

    it('일시정지 버튼 클릭 시 GIF 애니메이션을 정지한다', async () => {
      const { container } = render(() => (
        <VerticalGifItem
          media={mockGifMedia}
          index={0}
          isActive={true}
          isFocused={true}
          isVisible={true}
          forceVisible={true}
          fitMode='contain'
          onClick={() => {}}
        />
      ));

      await waitFor(() => {
        const pauseButton = container.querySelector('[data-testid="pause-button"]');
        expect(pauseButton).toBeTruthy();
      });

      const pauseButton = container.querySelector('[data-testid="pause-button"]');
      await fireEvent.click(pauseButton!);

      // 일시정지 후 재생 버튼이 표시되어야 함
      await waitFor(() => {
        const playButton = container.querySelector('[data-testid="play-button"]');
        expect(playButton).toBeTruthy();
      });
    });

    it('재생 버튼 클릭 시 GIF 애니메이션을 재개한다', async () => {
      const { container } = render(() => (
        <VerticalGifItem
          media={mockGifMedia}
          index={0}
          isActive={true}
          isFocused={true}
          isVisible={true}
          forceVisible={true}
          fitMode='contain'
          onClick={() => {}}
        />
      ));

      // 먼저 일시정지
      await waitFor(() => {
        const pauseButton = container.querySelector('[data-testid="pause-button"]');
        expect(pauseButton).toBeTruthy();
      });

      const pauseButton = container.querySelector('[data-testid="pause-button"]');
      await fireEvent.click(pauseButton!);

      // 재생 버튼 클릭
      await waitFor(() => {
        const playButton = container.querySelector('[data-testid="play-button"]');
        expect(playButton).toBeTruthy();
      });

      const playButton = container.querySelector('[data-testid="play-button"]');
      await fireEvent.click(playButton!);

      // 다시 일시정지 버튼이 표시되어야 함
      await waitFor(() => {
        const pauseButton = container.querySelector('[data-testid="pause-button"]');
        expect(pauseButton).toBeTruthy();
      });
    });

    it('Space 키를 누르면 재생/일시정지를 토글한다', async () => {
      const { container } = render(() => (
        <VerticalGifItem
          media={mockGifMedia}
          index={0}
          isActive={true}
          isFocused={true}
          isVisible={true}
          forceVisible={true}
          fitMode='contain'
          onClick={() => {}}
        />
      ));

      const containerElement = container.querySelector('[data-xeg-component="vertical-gif-item"]');

      // 초기 상태는 재생 중 (일시정지 버튼 표시)
      await waitFor(() => {
        const pauseButton = container.querySelector('[data-testid="pause-button"]');
        expect(pauseButton).toBeTruthy();
      });

      // Space 키로 일시정지
      await fireEvent.keyDown(containerElement!, { key: ' ', code: 'Space' });

      await waitFor(() => {
        const playButton = container.querySelector('[data-testid="play-button"]');
        expect(playButton).toBeTruthy();
      });

      // Space 키로 재생
      await fireEvent.keyDown(containerElement!, { key: ' ', code: 'Space' });

      await waitFor(() => {
        const pauseButton = container.querySelector('[data-testid="pause-button"]');
        expect(pauseButton).toBeTruthy();
      });
    });
  });

  describe('반복 제어 계약', () => {
    it('기본적으로 무한 반복 모드로 동작한다', async () => {
      const { container } = render(() => (
        <VerticalGifItem
          media={mockGifMedia}
          index={0}
          isActive={true}
          isFocused={true}
          isVisible={true}
          forceVisible={true}
          fitMode='contain'
          onClick={() => {}}
        />
      ));

      // 무한 반복 아이콘이 표시되어야 함
      await waitFor(() => {
        const loopButton = container.querySelector('[data-testid="loop-infinite"]');
        expect(loopButton).toBeTruthy();
      });
    });

    it('반복 버튼 클릭 시 1회 재생 모드로 전환한다', async () => {
      const { container } = render(() => (
        <VerticalGifItem
          media={mockGifMedia}
          index={0}
          isActive={true}
          isFocused={true}
          isVisible={true}
          forceVisible={true}
          fitMode='contain'
          onClick={() => {}}
        />
      ));

      await waitFor(() => {
        const loopButton = container.querySelector('[data-testid="loop-infinite"]');
        expect(loopButton).toBeTruthy();
      });

      const loopButton = container.querySelector('[data-testid="loop-infinite"]');
      await fireEvent.click(loopButton!);

      // 1회 재생 아이콘으로 변경되어야 함
      await waitFor(() => {
        const loopOnce = container.querySelector('[data-testid="loop-once"]');
        expect(loopOnce).toBeTruthy();
      });
    });

    it('1회 재생 모드에서 버튼 클릭 시 무한 반복으로 전환한다', async () => {
      const { container } = render(() => (
        <VerticalGifItem
          media={mockGifMedia}
          index={0}
          isActive={true}
          isFocused={true}
          isVisible={true}
          forceVisible={true}
          fitMode='contain'
          onClick={() => {}}
        />
      ));

      // 무한 → 1회
      await waitFor(() => {
        const loopButton = container.querySelector('[data-testid="loop-infinite"]');
        expect(loopButton).toBeTruthy();
      });

      const loopInfiniteButton = container.querySelector('[data-testid="loop-infinite"]');
      await fireEvent.click(loopInfiniteButton!);

      // 1회 → 무한
      await waitFor(() => {
        const loopOnce = container.querySelector('[data-testid="loop-once"]');
        expect(loopOnce).toBeTruthy();
      });

      const loopOnceButton = container.querySelector('[data-testid="loop-once"]');
      await fireEvent.click(loopOnceButton!);

      // 다시 무한 반복으로
      await waitFor(() => {
        const loopButton = container.querySelector('[data-testid="loop-infinite"]');
        expect(loopButton).toBeTruthy();
      });
    });
  });

  describe('로딩/에러 상태 계약', () => {
    it('GIF 로딩 중에는 로딩 인디케이터를 표시한다', async () => {
      // Mock slow loading
      (window as any).Image = class MockSlowImage {
        onload: (() => void) | null = null;
        onerror: ((event: Event) => void) | null = null;
        src = '';
        width = 400;
        height = 300;

        constructor() {
          // 로딩 지연 시뮬레이션
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 100);
        }
      } as any;

      const { container } = render(() => (
        <VerticalGifItem
          media={mockGifMedia}
          index={0}
          isActive={true}
          isFocused={true}
          isVisible={true}
          forceVisible={true}
          fitMode='contain'
          onClick={() => {}}
        />
      ));

      // 로딩 중 오버레이 확인
      const loadingOverlay = container.querySelector('[data-testid="loading-overlay"]');
      expect(loadingOverlay).toBeTruthy();
    });

    it('GIF 로딩 실패 시 에러 메시지를 표시한다', async () => {
      // Mock failed loading
      (window as any).Image = class MockFailedImage {
        onload: (() => void) | null = null;
        onerror: ((event: Event) => void) | null = null;
        src = '';
        width = 400;
        height = 300;

        constructor() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Event('error'));
            }
          }, 0);
        }
      } as any;

      const { container } = render(() => (
        <VerticalGifItem
          media={mockGifMedia}
          index={0}
          isActive={true}
          isFocused={true}
          isVisible={true}
          forceVisible={true}
          fitMode='contain'
          onClick={() => {}}
        />
      ));

      // 에러 오버레이 확인
      await waitFor(() => {
        const errorOverlay = container.querySelector('[data-testid="error-overlay"]');
        expect(errorOverlay).toBeTruthy();
      });
    });
  });

  describe('디자인 토큰 계약', () => {
    it('하드코딩된 색상/시간/이징을 사용하지 않는다', () => {
      // Use import.meta.url to get current directory
      const currentDir = path.dirname(fileURLToPath(import.meta.url));
      const cssPath = path.resolve(
        currentDir,
        '../../../src/features/gallery/components/vertical-gallery-view/VerticalGifItem.module.css'
      );

      if (!fs.existsSync(cssPath)) {
        // CSS 파일이 아직 없으면 테스트를 건너뜀 (RED 단계)
        return;
      }

      const cssContent = fs.readFileSync(cssPath, 'utf-8');

      // 하드코딩된 색상 패턴 검증
      const hardcodedColorPatterns = [
        /#[0-9a-fA-F]{3,8}(?!\s*;?\s*\/\*\s*fallback)/gi, // Hex 색상 (fallback 주석 제외)
        /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/gi, // RGB/RGBA
        /hsla?\(/gi, // HSL/HSLA
      ];

      hardcodedColorPatterns.forEach(pattern => {
        const matches = cssContent.match(pattern);
        if (matches) {
          expect(
            matches,
            `하드코딩된 색상을 발견했습니다. 디자인 토큰(var(--xeg-*) 또는 var(--color-*))을 사용하세요: ${matches.join(', ')}`
          ).toHaveLength(0);
        }
      });

      // 하드코딩된 시간 패턴 검증 (transition, animation)
      const hardcodedTimePatterns = [
        /transition:\s*[^;]*?\d+\.?\d*(s|ms)(?!\s*var\()/gi,
        /animation:\s*[^;]*?\d+\.?\d*(s|ms)(?!\s*var\()/gi,
      ];

      hardcodedTimePatterns.forEach(pattern => {
        const matches = cssContent.match(pattern);
        if (matches) {
          expect(
            matches,
            `하드코딩된 시간을 발견했습니다. 디자인 토큰(var(--xeg-duration-*))을 사용하세요: ${matches.join(', ')}`
          ).toHaveLength(0);
        }
      });

      // 하드코딩된 easing 패턴 검증
      const hardcodedEasingPatterns = [
        /cubic-bezier\(/gi,
        /ease-in-out(?!\s*var\()/gi,
        /ease-in(?!\s*var\()/gi,
      ];

      hardcodedEasingPatterns.forEach(pattern => {
        const matches = cssContent.match(pattern);
        if (matches) {
          expect(
            matches,
            `하드코딩된 이징을 발견했습니다. 디자인 토큰(var(--xeg-easing-*))을 사용하세요: ${matches.join(', ')}`
          ).toHaveLength(0);
        }
      });
    });
  });

  describe('접근성 계약', () => {
    it('재생/일시정지 버튼에 적절한 aria-label이 설정된다', async () => {
      const { container } = render(() => (
        <VerticalGifItem
          media={mockGifMedia}
          index={0}
          isActive={true}
          isFocused={true}
          isVisible={true}
          forceVisible={true}
          fitMode='contain'
          onClick={() => {}}
        />
      ));

      // 초기 일시정지 버튼 확인
      await waitFor(() => {
        const pauseButton = container.querySelector('[data-testid="pause-button"]');
        expect(pauseButton).toHaveAttribute('aria-label');
        expect(pauseButton?.getAttribute('aria-label')).toContain('일시정지');
      });

      // 일시정지 후 재생 버튼 확인
      const pauseButton = container.querySelector('[data-testid="pause-button"]');
      await fireEvent.click(pauseButton!);

      await waitFor(() => {
        const playButton = container.querySelector('[data-testid="play-button"]');
        expect(playButton).toHaveAttribute('aria-label');
        expect(playButton?.getAttribute('aria-label')).toContain('재생');
      });
    });

    it('반복 제어 버튼에 적절한 aria-label이 설정된다', async () => {
      const { container } = render(() => (
        <VerticalGifItem
          media={mockGifMedia}
          index={0}
          isActive={true}
          isFocused={true}
          isVisible={true}
          forceVisible={true}
          fitMode='contain'
          onClick={() => {}}
        />
      ));

      await waitFor(() => {
        const loopButton = container.querySelector('[data-testid="loop-infinite"]');
        expect(loopButton).toHaveAttribute('aria-label');
        expect(loopButton?.getAttribute('aria-label')).toContain('무한 반복');
      });
    });
  });

  describe('PC 전용 입력 계약', () => {
    it('Touch 이벤트를 사용하지 않는다', () => {
      const { container } = render(() => (
        <VerticalGifItem
          media={mockGifMedia}
          index={0}
          isActive={true}
          isFocused={true}
          isVisible={true}
          forceVisible={true}
          fitMode='contain'
          onClick={() => {}}
        />
      ));

      const element = container.querySelector('[data-xeg-component="vertical-gif-item"]');

      // Touch 이벤트 리스너가 없어야 함
      expect(element).not.toHaveAttribute('ontouchstart');
      expect(element).not.toHaveAttribute('ontouchmove');
      expect(element).not.toHaveAttribute('ontouchend');
    });

    it('Pointer 이벤트를 사용하지 않는다', () => {
      const { container } = render(() => (
        <VerticalGifItem
          media={mockGifMedia}
          index={0}
          isActive={true}
          isFocused={true}
          isVisible={true}
          forceVisible={true}
          fitMode='contain'
          onClick={() => {}}
        />
      ));

      const element = container.querySelector('[data-xeg-component="vertical-gif-item"]');

      // Pointer 이벤트 리스너가 없어야 함
      expect(element).not.toHaveAttribute('onpointerdown');
      expect(element).not.toHaveAttribute('onpointermove');
      expect(element).not.toHaveAttribute('onpointerup');
    });
  });
});
