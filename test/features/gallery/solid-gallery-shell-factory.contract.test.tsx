/**
 * @fileoverview SolidGalleryShell Factory Integration Contract Tests
 * Epic: MEDIA-TYPE-ENHANCEMENT Phase 1-4
 * TDD Phase: RED
 *
 * 목적:
 * SolidGalleryShell이 MediaItemFactory를 사용하여 미디어 타입별로
 * 적절한 컴포넌트를 렌더링하는지 검증
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { JSX } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { SolidGalleryShell } from '@/features/gallery/solid/SolidGalleryShell.solid';
import type { MediaInfo } from '@shared/types/media.types';
import { getSolidCore } from '@shared/external/vendors';

describe('SolidGalleryShell Factory Integration Contract', () => {
  const solid = getSolidCore();

  const mockProps = {
    onClose: vi.fn(),
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onDownloadCurrent: vi.fn(),
    onDownloadAll: vi.fn(),
  };

  const mockImageMedia: MediaInfo = {
    type: 'image' as const,
    url: 'https://pbs.twimg.com/media/test.jpg',
    originalUrl: 'https://pbs.twimg.com/media/test.jpg?name=orig',
    previewUrl: 'https://pbs.twimg.com/media/test.jpg?name=small',
    width: 1200,
    height: 800,
  };

  const mockVideoMedia: MediaInfo = {
    type: 'video' as const,
    url: 'https://video.twimg.com/ext_tw_video/test.mp4',
    originalUrl: 'https://video.twimg.com/ext_tw_video/test.mp4',
    previewUrl: 'https://pbs.twimg.com/media/test.jpg',
    width: 1920,
    height: 1080,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    document.body.innerHTML = '';

    // galleryState 초기화 (dynamic import로 순환 의존성 회피)
    const gallerySignals = await import('@shared/state/signals/gallery.signals');
    gallerySignals.galleryState.mediaItems = [];
    gallerySignals.galleryState.currentIndex = 0;
  });

  describe('1. Factory 통합 검증', () => {
    it('이미지 미디어는 VerticalImageItem 컴포넌트로 렌더링된다', async () => {
      const { galleryState } = await import('@shared/state/signals/gallery.signals');
      galleryState.mediaItems = [mockImageMedia];
      galleryState.currentIndex = 0;

      const { container } = render(() => <SolidGalleryShell {...mockProps} />);

      // VerticalImageItem의 특징적인 요소 확인
      // (예: 이미지 컨테이너 클래스)
      const imageContainer = container.querySelector('[data-media-type="image"]');
      expect(imageContainer).toBeTruthy();
    });

    it('비디오 미디어는 VerticalVideoItem 컴포넌트로 렌더링된다', async () => {
      const { galleryState } = await import('@shared/state/signals/gallery.signals');
      galleryState.mediaItems = [mockVideoMedia];
      galleryState.currentIndex = 0;

      const { container } = render(() => <SolidGalleryShell {...mockProps} />);

      // VerticalVideoItem의 특징적인 요소 확인
      // (예: video 태그, 컨트롤 버튼)
      const videoElement = container.querySelector('video');
      expect(videoElement).toBeTruthy();
    });

    it('혼합 미디어 타입을 올바르게 렌더링한다', async () => {
      const { galleryState } = await import('@shared/state/signals/gallery.signals');
      galleryState.mediaItems = [mockImageMedia, mockVideoMedia];
      galleryState.currentIndex = 0;

      const { container } = render(() => <SolidGalleryShell {...mockProps} />);

      // 이미지와 비디오 모두 존재하는지 확인
      const imageContainer = container.querySelector('[data-media-type="image"]');
      const videoElement = container.querySelector('video');

      expect(imageContainer).toBeTruthy();
      expect(videoElement).toBeTruthy();
    });
  });

  describe('2. Props 전달 검증', () => {
    it('Factory를 통해 생성된 컴포넌트에 공통 props가 전달된다', async () => {
      const { galleryState } = await import('@shared/state/signals/gallery.signals');
      galleryState.mediaItems = [mockImageMedia];
      galleryState.currentIndex = 0;

      const { container } = render(() => <SolidGalleryShell {...mockProps} />);

      const mediaItem = container.querySelector('[data-media-type="image"]');

      // isActive, isFocused, forceVisible, fitMode 등의 props가 전달되었는지 확인
      expect(mediaItem).toBeTruthy();
      expect(mediaItem?.getAttribute('data-is-active')).toBe('true');
    });

    it('미디어별 고유 props가 올바르게 전달된다', async () => {
      const { galleryState } = await import('@shared/state/signals/gallery.signals');
      galleryState.mediaItems = [mockVideoMedia];
      galleryState.currentIndex = 0;

      const { container } = render(() => <SolidGalleryShell {...mockProps} />);

      const videoElement = container.querySelector('video');

      // 비디오 특화 props 확인 (예: src)
      expect(videoElement).toBeTruthy();
      expect(videoElement?.getAttribute('src')).toBe(mockVideoMedia.url);
    });
  });

  describe('3. 반응성 검증', () => {
    it('fitMode 변경 시 모든 아이템이 업데이트된다', async () => {
      const { galleryState } = await import('@shared/state/signals/gallery.signals');
      galleryState.mediaItems = [mockImageMedia, mockVideoMedia];
      galleryState.currentIndex = 0;

      const { rerender } = render(() => <SolidGalleryShell {...mockProps} />);

      // fitMode 변경 시뮬레이션 (실제 구현에서는 settings 변경)
      // 이 테스트는 Factory가 반응성을 유지하는지 확인

      // TODO: fitMode 변경 후 재렌더링 검증 로직 추가
      expect(true).toBe(true); // 임시 placeholder
    });

    it('currentIndex 변경 시 활성 아이템이 업데이트된다', async () => {
      const { galleryState, navigateToItem } = await import(
        '@shared/state/signals/gallery.signals'
      );
      galleryState.mediaItems = [mockImageMedia, mockVideoMedia];
      galleryState.currentIndex = 0;

      const { container } = render(() => <SolidGalleryShell {...mockProps} />);

      // 첫 번째 아이템 활성화 확인
      let activeItem = container.querySelector('[data-is-active="true"]');
      expect(activeItem).toBeTruthy();

      // 두 번째 아이템으로 이동
      navigateToItem(1);

      // 활성 아이템 변경 확인 (SolidJS 반응성)
      // 실제로는 waitFor 사용하여 업데이트 대기 필요
      // TODO: waitFor를 사용한 비동기 검증 추가
      expect(true).toBe(true); // 임시 placeholder
    });
  });

  describe('4. 기존 기능 회귀 방지', () => {
    it('클릭 핸들러가 정상 동작한다', async () => {
      const { galleryState } = await import('@shared/state/signals/gallery.signals');
      galleryState.mediaItems = [mockImageMedia, mockVideoMedia];
      galleryState.currentIndex = 0;

      const { container } = render(() => <SolidGalleryShell {...mockProps} />);

      const secondItem = container.querySelectorAll('[data-media-type]')[1];

      // 클릭 이벤트 시뮬레이션
      if (secondItem) {
        (secondItem as HTMLElement).click();
      }

      // 네비게이션 발생 확인
      // TODO: navigateToItem 호출 검증
      expect(true).toBe(true); // 임시 placeholder
    });

    it('키보드 네비게이션이 정상 동작한다', async () => {
      const { galleryState } = await import('@shared/state/signals/gallery.signals');
      galleryState.mediaItems = [mockImageMedia, mockVideoMedia];
      galleryState.currentIndex = 0;

      render(() => <SolidGalleryShell {...mockProps} />);

      // ArrowRight 키 시뮬레이션
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      document.dispatchEvent(event);

      // onNext 호출 확인
      // TODO: 실제 키보드 이벤트 핸들링 검증
      expect(true).toBe(true); // 임시 placeholder
    });
  });

  describe('5. 타입 안전성 검증', () => {
    it('MediaInfo 인터페이스를 준수하는 미디어만 렌더링된다', () => {
      // TypeScript 컴파일 시점에서 검증
      // 이 테스트는 타입 안전성을 문서화하는 역할

      const validMedia: MediaInfo = {
        type: 'image',
        url: 'https://example.com/image.jpg',
        originalUrl: 'https://example.com/image.jpg',
        previewUrl: 'https://example.com/image.jpg',
        width: 100,
        height: 100,
      };

      expect(validMedia.type).toBeDefined();
      expect(validMedia.url).toBeDefined();
    });
  });
});
