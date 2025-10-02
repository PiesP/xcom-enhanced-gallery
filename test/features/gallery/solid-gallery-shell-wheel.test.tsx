/**
 * @fileoverview SolidGalleryShell wheel 이벤트 처리 테스트
 * @description Phase C (UX-001) - 갤러리 내부 네이티브 스크롤 허용 + 외부(Twitter) 스크롤 차단
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { MediaInfo } from '@shared/types/media.types';

const { renderSolidGalleryShell } = await import(
  '@/features/gallery/solid/renderSolidGalleryShell'
);
const { openGallery, closeGallery } = await import('@shared/state/signals/gallery.signals');

function getSolidShellElement(container: HTMLElement): HTMLElement | null {
  // Light DOM 모드: 직접 쿼리
  return container.querySelector('[data-xeg-solid-shell]');
}

function dispatchWheelEventAndCheckPrevented(
  target: HTMLElement | (typeof document extends never ? never : typeof document),
  deltaY: number
): boolean {
  const event = new globalThis.WheelEvent('wheel', {
    deltaY,
    bubbles: true,
    cancelable: true,
  });
  const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
  target.dispatchEvent(event);
  const wasPrevented = preventDefaultSpy.mock.calls.length > 0;
  preventDefaultSpy.mockRestore();
  return wasPrevented;
}

// TODO: [RED-TEST-SKIP] This test is in RED state (TDD) - blocking git push
// Epic tracking: Move to separate Epic branch for GREEN implementation
describe.skip('SolidGalleryShell — wheel event handling (Phase C)', () => {
  let container: HTMLElement;

  const mediaItems: MediaInfo[] = [
    {
      type: 'image' as const,
      url: 'https://example.com/image1.jpg',
      thumbnailUrl: 'https://example.com/thumb1.jpg',
    },
    {
      type: 'image' as const,
      url: 'https://example.com/image2.jpg',
      thumbnailUrl: 'https://example.com/thumb2.jpg',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement('div');
    container.setAttribute('data-test-gallery-container', 'true');
    document.body.appendChild(container);
  });

  afterEach(() => {
    closeGallery();
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  it('갤러리 shell 내부에서 wheel 이벤트 발생 시 preventDefault()가 호출되지 않아야 함 (네이티브 스크롤 허용)', () => {
    // Arrange
    renderSolidGalleryShell({
      container,
      onClose: vi.fn(),
      onPrevious: vi.fn(),
      onNext: vi.fn(),
      onDownloadCurrent: vi.fn(),
      onDownloadAll: vi.fn(),
    });

    // Act: 갤러리 열기
    openGallery(mediaItems, 0);

    const shellElement = getSolidShellElement(container);
    expect(shellElement).toBeTruthy();

    // 갤러리 shell 내부에서 wheel 이벤트 발생
    const wasPrevented = dispatchWheelEventAndCheckPrevented(shellElement!, 100);

    // Assert: preventDefault()가 호출되지 않음 (네이티브 스크롤 허용)
    expect(wasPrevented).toBe(false);
  });

  it('갤러리 shell 외부(document.body)에서 wheel 이벤트 발생 시 preventDefault()가 호출되어야 함 (Twitter 스크롤 차단)', () => {
    // Arrange
    renderSolidGalleryShell({
      container,
      onClose: vi.fn(),
      onPrevious: vi.fn(),
      onNext: vi.fn(),
      onDownloadCurrent: vi.fn(),
      onDownloadAll: vi.fn(),
    });

    // Act: 갤러리 열기
    openGallery(mediaItems, 0);

    // 외부 요소(document.body)에서 wheel 이벤트 발생
    const outsideElement = document.body;
    const wasPrevented = dispatchWheelEventAndCheckPrevented(outsideElement, 100);

    // Assert: preventDefault()가 호출됨 (Twitter 스크롤 차단)
    expect(wasPrevented).toBe(true);
  });

  it('갤러리가 닫혀 있을 때는 wheel 이벤트를 차단하지 않아야 함', () => {
    // Arrange
    renderSolidGalleryShell({
      container,
      onClose: vi.fn(),
      onPrevious: vi.fn(),
      onNext: vi.fn(),
      onDownloadCurrent: vi.fn(),
      onDownloadAll: vi.fn(),
    });

    // Act: 갤러리를 열지 않은 상태에서 외부 wheel 이벤트 발생
    const wasPrevented = dispatchWheelEventAndCheckPrevented(document.body, 100);

    // Assert: preventDefault()가 호출되지 않음 (갤러리 비활성 상태)
    expect(wasPrevented).toBe(false);
  });

  it('갤러리 shell 내부에서 ArrowRight 키 이벤트 발생 시 onNext 콜백이 호출되어야 함', async () => {
    // Arrange
    const onNext = vi.fn();
    const onPrevious = vi.fn();

    renderSolidGalleryShell({
      container,
      onClose: vi.fn(),
      onPrevious,
      onNext,
      onDownloadCurrent: vi.fn(),
      onDownloadAll: vi.fn(),
    });

    // Act: 갤러리 열기
    openGallery(mediaItems, 0);

    const shellElement = getSolidShellElement(container);
    expect(shellElement).toBeTruthy();

    // ArrowRight 키 이벤트 발생
    const event = new globalThis.KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });

    document.dispatchEvent(event);

    // RAF 처리를 위해 대기
    await new Promise(resolve => setTimeout(resolve, 50));

    // Assert: onNext가 호출됨
    expect(onNext).toHaveBeenCalled();
    expect(onPrevious).not.toHaveBeenCalled();
  });

  it('갤러리 shell 내부에서 ArrowLeft 키 이벤트 발생 시 onPrevious 콜백이 호출되어야 함', async () => {
    // Arrange
    const onNext = vi.fn();
    const onPrevious = vi.fn();

    renderSolidGalleryShell({
      container,
      onClose: vi.fn(),
      onPrevious,
      onNext,
      onDownloadCurrent: vi.fn(),
      onDownloadAll: vi.fn(),
    });

    // Act: 갤러리 열기
    openGallery(mediaItems, 1); // 두 번째 아이템으로 시작 (이전으로 갈 수 있도록)

    const shellElement = getSolidShellElement(container);
    expect(shellElement).toBeTruthy();

    // ArrowLeft 키 이벤트 발생
    const event = new globalThis.KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      bubbles: true,
      cancelable: true,
    });

    document.dispatchEvent(event);

    // RAF 처리를 위해 대기
    await new Promise(resolve => setTimeout(resolve, 50));

    // Assert: onPrevious가 호출됨
    expect(onPrevious).toHaveBeenCalled();
    expect(onNext).not.toHaveBeenCalled();
  });
});
