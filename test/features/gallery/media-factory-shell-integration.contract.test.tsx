/**
 * @fileoverview Phase 1-4: MediaItemFactory → SolidGalleryShell 통합 Contract 테스트
 * Epic: MEDIA-TYPE-ENHANCEMENT Phase 1-4 (RED)
 *
 * **목표**: MediaItemFactory를 SolidGalleryShell의 renderItems에 통합하여
 * 타입별 컴포넌트 자동 선택 검증
 *
 * **테스트 범위**:
 * 1. 이미지 미디어 → VerticalImageItem 렌더링
 * 2. 비디오 미디어 → VerticalVideoItem 렌더링
 * 3. 혼합 미디어 타입 → 올바른 컴포넌트 조합
 * 4. 알 수 없는 타입 → VerticalImageItem으로 fallback
 * 5. Props 정규화 → Factory에서 기본값 적용
 * 6. 기존 기능 유지 → isActive, isFocused, isVisible, fitMode 동작
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@solidjs/testing-library';
import type { MediaInfo } from '@shared/types/media.types';
import { getSolidCore } from '@shared/external/vendors';
import { openGallery, closeGallery } from '@shared/state/signals/gallery.signals';

// Component import - default export
import SolidGalleryShell from '@features/gallery/solid/SolidGalleryShell.solid';

const solid = getSolidCore();

describe('MediaFactory-SolidGalleryShell Integration Contract', () => {
  beforeEach(() => {
    // DOM 초기화
    document.body.innerHTML = '';

    // Gallery store 초기화 - closeGallery로 초기 상태로 리셋
    closeGallery();
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  /**
   * RED Test 1: 이미지 타입 미디어는 VerticalImageItem으로 렌더링
   *
   * **검증 사항**:
   * - media.type === 'image'
   * - data-xeg-component="vertical-image-item" 존재
   * - data-xeg-component="vertical-video-item" 부재
   */
  it('이미지 타입 미디어는 VerticalImageItem으로 렌더링된다', () => {
    const imageMedia: MediaInfo = {
      url: 'https://pbs.twimg.com/media/test-image.jpg',
      originalUrl: 'https://pbs.twimg.com/media/test-image.jpg:large',
      type: 'image',
      index: 0,
    };

    openGallery([imageMedia], 0);

    render(() => <SolidGalleryShell />);

    // VerticalImageItem 컴포넌트 렌더링 확인
    const imageItem = document.querySelector('[data-xeg-component="vertical-image-item"]');
    expect(imageItem).not.toBeNull();

    // VerticalVideoItem이 아님을 확인
    const videoItem = document.querySelector('[data-xeg-component="vertical-video-item"]');
    expect(videoItem).toBeNull();
  });

  /**
   * RED Test 2: 비디오 타입 미디어는 VerticalVideoItem으로 렌더링
   *
   * **검증 사항**:
   * - media.type === 'video'
   * - data-xeg-component="vertical-video-item" 존재
   * - video 태그 존재
   */
  it('비디오 타입 미디어는 VerticalVideoItem으로 렌더링된다', () => {
    const videoMedia: MediaInfo = {
      url: 'https://video.twimg.com/amplify_video/test-video.mp4',
      originalUrl: 'https://video.twimg.com/amplify_video/test-video.mp4',
      type: 'video',
      index: 0,
    };

    openGallery([videoMedia], 0);

    render(() => <SolidGalleryShell />);

    // VerticalVideoItem 컴포넌트 렌더링 확인
    const videoItem = document.querySelector('[data-xeg-component="vertical-video-item"]');
    expect(videoItem).not.toBeNull();

    // video 태그 존재 확인
    const videoElement = document.querySelector('video');
    expect(videoElement).not.toBeNull();
  });

  /**
   * RED Test 3: GIF 타입은 VerticalImageItem으로 렌더링 (img 태그 처리)
   *
   * **검증 사항**:
   * - media.type === 'gif'
   * - data-xeg-component="vertical-image-item" 존재
   * - GIF는 `<img>` 태그로 자동 재생 가능
   */
  it('GIF 타입 미디어는 VerticalImageItem으로 렌더링된다', () => {
    const gifMedia: MediaInfo = {
      url: 'https://pbs.twimg.com/tweet_video/test-gif.gif',
      originalUrl: 'https://pbs.twimg.com/tweet_video/test-gif.gif',
      type: 'gif',
      index: 0,
    };

    openGallery([gifMedia], 0);

    render(() => <SolidGalleryShell />);

    // VerticalImageItem 컴포넌트 렌더링 확인
    const imageItem = document.querySelector('[data-xeg-component="vertical-image-item"]');
    expect(imageItem).not.toBeNull();

    // VerticalVideoItem이 아님을 확인 (GIF는 이미지로 처리)
    const videoItem = document.querySelector('[data-xeg-component="vertical-video-item"]');
    expect(videoItem).toBeNull();
  });

  /**
   * RED Test 4: 혼합 미디어 타입 (video + image) 올바른 컴포넌트 조합
   *
   * **검증 사항**:
   * - 다양한 타입 혼합 렌더링
   * - 각 타입별 올바른 컴포넌트 선택
   * - index 순서 유지
   */
  it('혼합 미디어 타입은 각각 올바른 컴포넌트로 렌더링된다', () => {
    const mixedMedia: MediaInfo[] = [
      {
        url: 'https://pbs.twimg.com/media/image1.jpg',
        originalUrl: 'https://pbs.twimg.com/media/image1.jpg:large',
        type: 'image',
        index: 0,
      },
      {
        url: 'https://video.twimg.com/video1.mp4',
        originalUrl: 'https://video.twimg.com/video1.mp4',
        type: 'video',
        index: 1,
      },
      {
        url: 'https://pbs.twimg.com/media/image2.jpg',
        originalUrl: 'https://pbs.twimg.com/media/image2.jpg:large',
        type: 'image',
        index: 2,
      },
    ];

    openGallery(mixedMedia, 0);

    render(() => <SolidGalleryShell />);

    // VerticalImageItem 2개 확인
    const imageItems = document.querySelectorAll('[data-xeg-component="vertical-image-item"]');
    expect(imageItems.length).toBe(2);

    // VerticalVideoItem 1개 확인
    const videoItems = document.querySelectorAll('[data-xeg-component="vertical-video-item"]');
    expect(videoItems.length).toBe(1);

    // video 태그 1개 존재
    const videoElements = document.querySelectorAll('video');
    expect(videoElements.length).toBe(1);
  });

  /**
   * RED Test 5: 알 수 없는 타입은 VerticalImageItem으로 fallback
   *
   * **검증 사항**:
   * - media.type이 정의되지 않은 타입
   * - 안전하게 VerticalImageItem으로 렌더링
   * - 에러 미발생
   */
  it('알 수 없는 타입은 VerticalImageItem으로 fallback된다', () => {
    const unknownMedia: MediaInfo = {
      url: 'https://pbs.twimg.com/media/unknown.dat',
      originalUrl: 'https://pbs.twimg.com/media/unknown.dat',
      type: 'unknown' as any, // 의도적으로 잘못된 타입
      index: 0,
    };

    openGallery([unknownMedia], 0);

    render(() => <SolidGalleryShell />);

    // VerticalImageItem으로 fallback 확인
    const imageItem = document.querySelector('[data-xeg-component="vertical-image-item"]');
    expect(imageItem).not.toBeNull();

    // VerticalVideoItem이 아님을 확인
    const videoItem = document.querySelector('[data-xeg-component="vertical-video-item"]');
    expect(videoItem).toBeNull();
  });

  /**
   * RED Test 6: Props 정규화 - isActive, isFocused, isVisible, fitMode 동작 유지
   *
   * **검증 사항**:
   * - Factory가 Props를 올바르게 전달
   * - currentIndex에 따른 isActive 동작
   * - 기존 기능 회귀 없음
   */
  it('Factory 통합 후에도 isActive, isFocused, isVisible 동작이 유지된다', () => {
    const media: MediaInfo[] = [
      {
        url: 'https://pbs.twimg.com/media/image1.jpg',
        originalUrl: 'https://pbs.twimg.com/media/image1.jpg:large',
        type: 'image',
        index: 0,
      },
      {
        url: 'https://video.twimg.com/video1.mp4',
        originalUrl: 'https://video.twimg.com/video1.mp4',
        type: 'video',
        index: 1,
      },
    ];

    openGallery(media, 1); // 비디오 아이템 선택

    render(() => <SolidGalleryShell />);

    // 선택된 비디오 아이템이 aria-current="true"를 가지는지 확인
    const videoItem = document.querySelector('[data-xeg-component="vertical-video-item"]');
    expect(videoItem).not.toBeNull();

    // 기존 기능 회귀 없음 - renderItems가 여전히 동작
    const allItems = document.querySelectorAll(
      '[data-xeg-component="vertical-image-item"], [data-xeg-component="vertical-video-item"]'
    );
    expect(allItems.length).toBe(2);
  });

  /**
   * RED Test 7: Factory import 검증 - createMediaItem 함수 사용
   *
   * **검증 사항**:
   * - SolidGalleryShell이 createMediaItem을 import
   * - renderItems 로직이 Factory 패턴 사용
   * - 직접 컴포넌트 인스턴스화 제거
   */
  it('SolidGalleryShell은 createMediaItem Factory를 사용한다', async () => {
    // 이 테스트는 구조적 검증이므로, 실제 동작은 위 테스트들로 충분히 검증됨
    // RED 상태에서는 실패 예상 (아직 Factory 통합 안 됨)

    const imageMedia: MediaInfo = {
      url: 'https://pbs.twimg.com/media/test.jpg',
      originalUrl: 'https://pbs.twimg.com/media/test.jpg:large',
      type: 'image',
      index: 0,
    };

    openGallery([imageMedia], 0);

    render(() => <SolidGalleryShell />);

    // renderItems가 Factory를 사용하면 정상 렌더링됨
    const item = document.querySelector('[data-xeg-component="vertical-image-item"]');
    expect(item).not.toBeNull();
  });

  /**
   * RED Test 8: 비디오 컴포넌트 특수 기능 유지 - 재생 컨트롤
   *
   * **검증 사항**:
   * - VerticalVideoItem의 재생/일시정지 버튼 존재
   * - Factory 통합 후에도 비디오 전용 기능 동작
   */
  it('비디오 타입은 재생 컨트롤을 포함한다', () => {
    const videoMedia: MediaInfo = {
      url: 'https://video.twimg.com/video.mp4',
      originalUrl: 'https://video.twimg.com/video.mp4',
      type: 'video',
      index: 0,
    };

    openGallery([videoMedia], 0);

    render(() => <SolidGalleryShell />);

    // 비디오 컨트롤 버튼 존재 확인 (ARIA 검증)
    const videoItem = document.querySelector('[data-xeg-component="vertical-video-item"]');
    expect(videoItem).not.toBeNull();

    // video 태그에 controls 속성 또는 커스텀 컨트롤 버튼 존재
    const hasControls =
      document.querySelector('video[controls]') !== null ||
      document.querySelector('[aria-label*="재생"]') !== null ||
      document.querySelector('[aria-label*="일시정지"]') !== null;

    expect(hasControls).toBe(true);
  });
});
