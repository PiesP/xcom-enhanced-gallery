/**
 * 갤러리 열림 시 세로 스크롤 키 허용 테스트 (RED → GREEN)
 *
 * 목표: 갤러리가 열려있을 때 페이지 세로 스크롤 키들은 기본 동작을 허용해야 함
 * - ArrowUp/ArrowDown: 비디오 볼륨이 아닌 경우 스크롤 허용
 * - PageUp/PageDown: 스크롤 허용
 * - Home/End: 스크롤 허용
 * - ArrowLeft/ArrowRight: 갤러리 네비게이션이므로 차단
 * - Space: 비디오 재생 제어이므로 차단
 */

import * as solid from 'solid-js';
import * as solidStore from 'solid-js/store';
import * as solidWeb from 'solid-js/web';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

async function setup() {
  // 벤더 초기화
  (globalThis as any).__SOLID_JS = solid;
  (globalThis as any).__SOLID_JS_STORE = solidStore;
  (globalThis as any).__SOLID_JS_WEB = solidWeb;

  const vendors = await import('@shared/external/vendors');
  await vendors.initializeVendors();

  const events = await import('@shared/utils/events');
  const { openGallery, closeGallery } = await import('@shared/state/signals/gallery.signals');

  return {
    initializeGalleryEvents: events.initializeGalleryEvents,
    cleanupGalleryEvents: events.cleanupGalleryEvents,
    openGallery,
    closeGallery,
  };
}

describe('Gallery scroll keys behavior (RED → GREEN)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).document.body.innerHTML = '';
  });

  afterEach(() => {
    (globalThis as any).document.body.innerHTML = '';
  });

  it('갤러리 열림 시 세로 스크롤 키(ArrowUp/Down/PageUp/PageDown/Home/End)는 preventDefault를 호출하지 않아야 함', async () => {
    const { initializeGalleryEvents, openGallery, closeGallery, cleanupGalleryEvents } =
      await setup();

    const handlers = {
      onMediaClick: vi.fn(async () => {}),
      onGalleryClose: vi.fn(() => {}),
      onKeyboardEvent: vi.fn(() => {}),
    };

    await initializeGalleryEvents(handlers, { enableKeyboard: true, enableMediaDetection: false });

    // 갤러리 열기
    openGallery([]);

    const scrollKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'];

    for (const key of scrollKeys) {
      const event = new globalThis.KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
      });

      globalThis.document.dispatchEvent(event);

      // 세로 스크롤 키는 preventDefault가 호출되지 않아야 함
      expect(event.defaultPrevented).toBe(false);
    }

    // 정리
    closeGallery();
    cleanupGalleryEvents();
  });

  it('갤러리 열림 시 가로 네비게이션 키(ArrowLeft/Right)와 Space는 preventDefault를 호출해야 함', async () => {
    const { initializeGalleryEvents, openGallery, closeGallery, cleanupGalleryEvents } =
      await setup();

    const handlers = {
      onMediaClick: vi.fn(async () => {}),
      onGalleryClose: vi.fn(() => {}),
      onKeyboardEvent: vi.fn(() => {}),
    };

    await initializeGalleryEvents(handlers, { enableKeyboard: true, enableMediaDetection: false });

    // 갤러리 열기
    openGallery([]);

    const navKeys = ['ArrowLeft', 'ArrowRight', ' ', 'Space'];

    for (const key of navKeys) {
      const event = new globalThis.KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
      });

      globalThis.document.dispatchEvent(event);

      // 갤러리 네비게이션 키는 preventDefault가 호출되어야 함
      expect(event.defaultPrevented).toBe(true);
    }

    // 정리
    closeGallery();
    cleanupGalleryEvents();
  });

  it('갤러리 닫힘 시 모든 키는 기본 동작을 허용해야 함', async () => {
    const { initializeGalleryEvents, cleanupGalleryEvents } = await setup();

    const handlers = {
      onMediaClick: vi.fn(async () => {}),
      onGalleryClose: vi.fn(() => {}),
      onKeyboardEvent: vi.fn(() => {}),
    };

    await initializeGalleryEvents(handlers, { enableKeyboard: true, enableMediaDetection: false });

    // 갤러리 닫힌 상태
    const allKeys = [
      'ArrowUp',
      'ArrowDown',
      'PageUp',
      'PageDown',
      'Home',
      'End',
      'ArrowLeft',
      'ArrowRight',
      ' ',
    ];

    for (const key of allKeys) {
      const event = new globalThis.KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
      });

      globalThis.document.dispatchEvent(event);

      // 갤러리 닫힘 상태에서는 preventDefault가 호출되지 않아야 함
      expect(event.defaultPrevented).toBe(false);
    }

    // 정리
    cleanupGalleryEvents();
  });
});
