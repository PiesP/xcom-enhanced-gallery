/**
 * @fileoverview 갤러리 비디오 트리거 & 오픈시 비디오 정지 TDD (RED 단계)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MediaClickDetector } from '@shared/utils/media/media-click-detector';
import { openGallery, closeGallery, galleryState } from '@shared/state/signals/gallery.signals';
import type { MediaInfo } from '@shared/types/media.types';

// 최소 MediaInfo 팩토리 (인터페이스 필수 필드 충족 - 필요 필드만 작성)
function createMediaInfo(id: string, type: 'image' | 'video'): MediaInfo {
  return {
    id,
    type,
    url: `https://example.com/${id}`,
    originalUrl: `https://example.com/${id}`,
    thumbnailUrl: `https://example.com/${id}.jpg`,
    filename: `${id}.jpg`,
    extension: 'jpg',
    size: 0,
    quality: 'orig',
    width: 0,
    height: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    source: 'test',
    extractionId: 'test',
    metadata: {},
  } as MediaInfo; // 테스트 단축을 위한 단순 캐스팅
}

describe('🎥 비디오 클릭 → 갤러리 트리거 및 비디오 정지 (RED)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    closeGallery();
  });

  function setupVideoDom(): {
    wrapper: HTMLDivElement;
    video: HTMLVideoElement;
    playButton: HTMLButtonElement;
  } {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-testid', 'videoPlayer');
    wrapper.className = 'video-container';

    const video = document.createElement('video');
    // 재생/정지 상태를 제어하기 위한 mock 구현
    let pausedState = false;
    video.play = vi.fn(() => {
      pausedState = false;
      return Promise.resolve();
    });
    video.pause = vi.fn(() => {
      pausedState = true;
    });
    Object.defineProperty(video, 'paused', { get: () => pausedState });

    const playButton = document.createElement('button');
    playButton.setAttribute('data-testid', 'playButton');
    playButton.textContent = 'Play';

    wrapper.appendChild(playButton);
    wrapper.appendChild(video);
    document.body.appendChild(wrapper);

    return { wrapper, video, playButton };
  }

  it('VIDEO 요소 직접 클릭은 MediaClickDetector.isProcessableMedia 에서 true 여야 한다', () => {
    const { video } = setupVideoDom();
    const result = MediaClickDetector.isProcessableMedia(video);
    expect(result).toBe(true);
  });

  it('플레이 버튼 클릭은 MediaClickDetector.isProcessableMedia 에서 false 여야 한다 (갤러리 기동 금지)', () => {
    const { playButton } = setupVideoDom();
    const result = MediaClickDetector.isProcessableMedia(playButton as unknown as HTMLElement);
    expect(result).toBe(false);
  });

  it('openGallery 실행 시 재생 중이던 모든 비디오가 pause 되어야 한다', async () => {
    const { video } = setupVideoDom();
    // 재생 상태로 전환 (mock)
    await video.play();
    expect((video as any).paused).toBe(false);

    // 갤러리 오픈 (현재 구현에는 비디오 정지 로직이 아직 없음 → RED)
    const items: MediaInfo[] = [createMediaInfo('vid1', 'video')];
    openGallery(items, 0);

    // 기대: pause 메서드가 호출되어야 함
    expect(video.pause).toHaveBeenCalled(); // ✅ GREEN 단계에서 통과하도록 구현 예정
    expect((video as any).paused).toBe(true);
    expect(galleryState.value.isOpen).toBe(true);
  });
});
