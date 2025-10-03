/**
 * @fileoverview 컨텍스트 메뉴 UX 테스트 (Phase 3-1: RED)
 *
 * Epic UX-GALLERY-FEEDBACK-001 Phase 3
 * 아이템 우클릭 시 다운로드/정보 보기 액션을 제공하는 컨텍스트 메뉴 검증
 *
 * PC 전용 인터랙션 정책 준수:
 * - contextmenu 이벤트만 사용 (TouchEvent/PointerEvent 금지)
 */

import type { Component } from 'solid-js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@solidjs/testing-library';
import { initializeVendors, getSolidCore } from '@shared/external/vendors';
import { SolidVerticalImageItem } from '@features/gallery/components/vertical-gallery-view/VerticalImageItem.solid';
import type { MediaInfo } from '@shared/types/media.types';

describe('VerticalImageItem - Context Menu (Phase 3-1)', () => {
  beforeEach(async () => {
    await initializeVendors();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const createMockMedia = (overrides?: Partial<MediaInfo>): MediaInfo => ({
    url: 'https://example.com/image.jpg',
    filename: 'test-image.jpg',
    type: 'image',
    ...overrides,
  });

  describe('컨텍스트 메뉴 표시', () => {
    it('이미지 우클릭 시 컨텍스트 메뉴가 표시되어야 함', async () => {
      const media = createMockMedia();
      const onImageContextMenu = vi.fn();

      render(() => (
        <SolidVerticalImageItem media={media} index={0} onImageContextMenu={onImageContextMenu} />
      ));

      const imageElement = screen.getByAltText('test-image.jpg');
      fireEvent.contextMenu(imageElement);

      expect(onImageContextMenu).toHaveBeenCalledTimes(1);
      expect(onImageContextMenu).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'contextmenu' }),
        media
      );
    });

    it('비디오 우클릭 시 컨텍스트 메뉴가 표시되어야 함', async () => {
      const media = createMockMedia({
        url: 'https://example.com/video.mp4',
        filename: 'test-video.mp4',
        type: 'video',
      });
      const onImageContextMenu = vi.fn();

      render(() => (
        <SolidVerticalImageItem media={media} index={0} onImageContextMenu={onImageContextMenu} />
      ));

      const videoElement = screen.getByRole('button', { name: /Media 1: test-video.mp4/i });
      fireEvent.contextMenu(videoElement);

      expect(onImageContextMenu).toHaveBeenCalledTimes(1);
    });

    it('컨테이너 우클릭 시 컨텍스트 메뉴가 표시되어야 함', async () => {
      const media = createMockMedia();
      const onImageContextMenu = vi.fn();

      render(() => (
        <SolidVerticalImageItem media={media} index={0} onImageContextMenu={onImageContextMenu} />
      ));

      const container = screen.getByRole('button', { name: /Media 1: test-image.jpg/i });
      fireEvent.contextMenu(container);

      expect(onImageContextMenu).toHaveBeenCalledTimes(1);
    });
  });

  describe('다운로드 액션 트리거', () => {
    it('컨텍스트 메뉴에서 다운로드 액션을 트리거할 수 있어야 함', async () => {
      const media = createMockMedia();
      const onDownload = vi.fn();
      const onImageContextMenu = vi.fn((event: MouseEvent) => {
        // 컨텍스트 메뉴 시뮬레이션: 사용자가 "다운로드" 옵션 선택
        event.preventDefault();
        onDownload();
      });

      render(() => (
        <SolidVerticalImageItem
          media={media}
          index={0}
          onDownload={onDownload}
          onImageContextMenu={onImageContextMenu}
        />
      ));

      const imageElement = screen.getByAltText('test-image.jpg');
      fireEvent.contextMenu(imageElement);

      expect(onImageContextMenu).toHaveBeenCalledTimes(1);
      expect(onDownload).toHaveBeenCalledTimes(1);
    });

    it('컨텍스트 메뉴가 미디어 정보를 포함해야 함', async () => {
      const media = createMockMedia({
        url: 'https://example.com/photo.jpg',
        filename: 'vacation-photo.jpg',
      });
      const onImageContextMenu = vi.fn();

      render(() => (
        <SolidVerticalImageItem media={media} index={5} onImageContextMenu={onImageContextMenu} />
      ));

      const imageElement = screen.getByAltText('vacation-photo.jpg');
      fireEvent.contextMenu(imageElement);

      expect(onImageContextMenu).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'contextmenu' }),
        expect.objectContaining({
          url: 'https://example.com/photo.jpg',
          filename: 'vacation-photo.jpg',
        })
      );
    });
  });

  describe('PC 전용 인터랙션 정책', () => {
    it('TouchEvent를 사용하지 않아야 함', () => {
      const media = createMockMedia();
      const { container } = render(() => <SolidVerticalImageItem media={media} index={0} />);

      // TouchEvent 핸들러가 없어야 함
      const element = container.querySelector('[data-xeg-component="vertical-image-item"]');
      expect(element).toBeDefined();
      expect(element?.getAttribute('ontouchstart')).toBeNull();
      expect(element?.getAttribute('ontouchmove')).toBeNull();
      expect(element?.getAttribute('ontouchend')).toBeNull();
    });

    it('PointerEvent를 사용하지 않아야 함', () => {
      const media = createMockMedia();
      const { container } = render(() => <SolidVerticalImageItem media={media} index={0} />);

      // PointerEvent 핸들러가 없어야 함
      const element = container.querySelector('[data-xeg-component="vertical-image-item"]');
      expect(element).toBeDefined();
      expect(element?.getAttribute('onpointerdown')).toBeNull();
      expect(element?.getAttribute('onpointerup')).toBeNull();
      expect(element?.getAttribute('onpointermove')).toBeNull();
    });

    it('contextmenu 이벤트만 사용해야 함', async () => {
      const media = createMockMedia();
      const onImageContextMenu = vi.fn();

      render(() => (
        <SolidVerticalImageItem media={media} index={0} onImageContextMenu={onImageContextMenu} />
      ));

      const imageElement = screen.getByAltText('test-image.jpg');

      // contextmenu 이벤트는 작동해야 함
      fireEvent.contextMenu(imageElement);
      expect(onImageContextMenu).toHaveBeenCalledTimes(1);
    });
  });

  describe('아이템 선택 동작 분리', () => {
    it('컨텍스트 메뉴는 아이템 선택을 트리거하지 않아야 함', async () => {
      const media = createMockMedia();
      const onClick = vi.fn();
      const onImageContextMenu = vi.fn((event: MouseEvent) => {
        event.preventDefault();
      });

      render(() => (
        <SolidVerticalImageItem
          media={media}
          index={0}
          onClick={onClick}
          onImageContextMenu={onImageContextMenu}
        />
      ));

      const imageElement = screen.getByAltText('test-image.jpg');
      fireEvent.contextMenu(imageElement);

      expect(onImageContextMenu).toHaveBeenCalledTimes(1);
      expect(onClick).not.toHaveBeenCalled();
    });

    it('일반 클릭은 여전히 아이템 선택을 트리거해야 함', async () => {
      const media = createMockMedia();
      const onClick = vi.fn();
      const onImageContextMenu = vi.fn();

      render(() => (
        <SolidVerticalImageItem
          media={media}
          index={0}
          onClick={onClick}
          onImageContextMenu={onImageContextMenu}
        />
      ));

      const container = screen.getByRole('button', { name: /Media 1: test-image.jpg/i });
      fireEvent.click(container);

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onImageContextMenu).not.toHaveBeenCalled();
    });
  });

  describe('회귀 방지: 기존 컨텍스트 메뉴 동작', () => {
    it('기존 onImageContextMenu 핸들러가 여전히 작동해야 함', async () => {
      const media = createMockMedia();
      const onImageContextMenu = vi.fn();

      render(() => (
        <SolidVerticalImageItem media={media} index={0} onImageContextMenu={onImageContextMenu} />
      ));

      const imageElement = screen.getByAltText('test-image.jpg');
      fireEvent.contextMenu(imageElement);

      expect(onImageContextMenu).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ url: media.url })
      );
    });
  });
});
