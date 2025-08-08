/**
 * @fileoverview 비디오 컨트롤 및 갤러리 트리거 관련 유틸 커버리지 향상 테스트
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  isVideoControlElement,
  canTriggerGallery,
  shouldBlockGalleryTrigger,
  isGalleryInternalEvent,
} from '@shared/utils/utils';
import { openGallery, closeGallery } from '@shared/state/signals/gallery.signals';
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

describe('video control & gallery trigger utils', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    closeGallery();
  });

  it('isVideoControlElement: null 은 false', () => {
    expect(isVideoControlElement(null)).toBe(false);
  });

  it('isVideoControlElement: 일반 div는 false', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    expect(isVideoControlElement(div)).toBe(false);
  });

  it('canTriggerGallery: 기본 요소는 (갤러리 닫힘) true', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    expect(canTriggerGallery(el)).toBe(true);
  });

  it('canTriggerGallery: null 대상은 false', () => {
    expect(canTriggerGallery(null as unknown as HTMLElement)).toBe(false);
    expect(shouldBlockGalleryTrigger(null as unknown as HTMLElement)).toBe(true);
  });

  it('canTriggerGallery: 갤러리 오픈 상태면 어떤 요소도 false', () => {
    openGallery([createMedia('m1')], 0);
    const el = document.createElement('div');
    document.body.appendChild(el);
    expect(canTriggerGallery(el)).toBe(false);
  });

  it('isGalleryInternalEvent: target null 이면 false', () => {
    const mockEvent = { target: null } as unknown as Event;
    expect(isGalleryInternalEvent(mockEvent)).toBe(false);
  });

  it('isVideoControlElement: 일반 div 는 false', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    expect(isVideoControlElement(div)).toBe(false);
  });
});
