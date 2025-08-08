/**
 * @fileoverview 추가 커버리지: 갤러리 오픈 시 비디오 pause 로직 및 갤러리 오픈 상태 차단 로직
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { openGallery, closeGallery, galleryState } from '@shared/state/signals/gallery.signals';
import { MediaClickDetector } from '@shared/utils/media/media-click-detector';
import type { MediaInfo } from '@shared/types/media.types';

function createMedia(id: string): MediaInfo {
  return {
    id,
    type: 'image',
    url: '',
    originalUrl: '',
    thumbnailUrl: '',
    filename: id,
    extension: 'jpg',
    size: 0,
    quality: 'orig',
    width: 0,
    height: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    source: 'test',
    extractionId: 't',
    metadata: {},
  } as MediaInfo;
}

describe('Gallery video pause & state gating coverage', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    closeGallery();
  });

  it('재생 중/이미 일시정지된 비디오가 섞여 있어도 openGallery 호출 시 재생 중 것만 pause 호출', async () => {
    const v1 = document.createElement('video');
    const v2 = document.createElement('video');
    // mock play/pause
    let v1Paused = false;
    let v2Paused = true; // 이미 pause 상태
    v1.play = vi.fn(() => {
      v1Paused = false;
      return Promise.resolve();
    });
    v1.pause = vi.fn(() => {
      v1Paused = true;
    });
    Object.defineProperty(v1, 'paused', { get: () => v1Paused });

    v2.play = vi.fn(() => {
      v2Paused = false;
      return Promise.resolve();
    });
    v2.pause = vi.fn(() => {
      v2Paused = true;
    });
    Object.defineProperty(v2, 'paused', { get: () => v2Paused });

    document.body.appendChild(v1);
    document.body.appendChild(v2);

    await v1.play(); // v1 재생 중

    openGallery([createMedia('a')], 0);

    expect(v1.pause).toHaveBeenCalledTimes(1);
    expect(v2.pause).not.toHaveBeenCalled();
    expect(galleryState.value.isOpen).toBe(true);
  });

  it('갤러리 오픈 후 추가 클릭은 MediaClickDetector에 의해 차단', () => {
    openGallery([createMedia('b')], 0);
    const dummy = document.createElement('div');
    const canProcess = MediaClickDetector.isProcessableMedia(dummy as HTMLElement);
    expect(canProcess).toBe(false);
  });
});
