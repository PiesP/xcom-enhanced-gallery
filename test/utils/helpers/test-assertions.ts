/**
 * 테스트 어설션 헬퍼 함수
 * 프로젝트별 도메인 로직에 특화된 어설션 함수들
 */

import { expect } from 'vitest';
import type { MediaItem, ImageInfo, VideoInfo, GalleryState } from './test-factories';

// ================================
// DOM Assertion Helpers
// ================================

/**
 * 요소가 visible한지 확인
 */
export function expectElementToBeVisible(element: HTMLElement): void {
  expect(element).toBeInTheDocument();
  expect(element).toBeVisible();
  expect(window.getComputedStyle(element).display).not.toBe('none');
  expect(window.getComputedStyle(element).visibility).not.toBe('hidden');
}

/**
 * 요소가 hidden인지 확인
 */
export function expectElementToBeHidden(element: HTMLElement): void {
  const computedStyle = window.getComputedStyle(element);
  const isHidden =
    computedStyle.display === 'none' ||
    computedStyle.visibility === 'hidden' ||
    computedStyle.opacity === '0';

  expect(isHidden).toBe(true);
}

/**
 * 요소가 특정 클래스를 가지는지 확인
 */
export function expectElementToHaveClasses(element: HTMLElement, classes: string[]): void {
  classes.forEach(className => {
    expect(element).toHaveClass(className);
  });
}

/**
 * 요소의 스타일 속성 확인
 */
export function expectElementToHaveStyles(
  element: HTMLElement,
  styles: Record<string, string>
): void {
  Object.entries(styles).forEach(([property, value]) => {
    expect(element).toHaveStyle({ [property]: value });
  });
}

/**
 * 이미지 로딩 상태 확인
 */
export function expectImageToBeLoaded(img: HTMLImageElement): void {
  expect(img.complete).toBe(true);
  expect(img.naturalWidth).toBeGreaterThan(0);
  expect(img.naturalHeight).toBeGreaterThan(0);
}

/**
 * 비디오 로딩 상태 확인
 */
export function expectVideoToBeLoaded(video: HTMLVideoElement): void {
  expect(video.readyState).toBeGreaterThanOrEqual(2); // HAVE_CURRENT_DATA
  expect(video.videoWidth).toBeGreaterThan(0);
  expect(video.videoHeight).toBeGreaterThan(0);
}

// ================================
// URL Assertion Helpers
// ================================

/**
 * URL이 X.com/Twitter URL인지 확인
 */
export function expectUrlToBeTwitterUrl(url: string): void {
  const twitterDomains = ['x.com', 'twitter.com', 'mobile.x.com', 'mobile.twitter.com'];
  const urlObj = new URL(url);

  expect(twitterDomains).toContain(urlObj.hostname);
  expect(urlObj.protocol).toBe('https:');
}

/**
 * URL이 트윗 URL인지 확인
 */
export function expectUrlToBeValidTweetUrl(url: string): void {
  expectUrlToBeTwitterUrl(url);

  const tweetUrlPattern = /\/([\w]+)\/status\/(\d+)/;
  const urlObj = new URL(url);

  expect(urlObj.pathname).toMatch(tweetUrlPattern);
}

/**
 * URL이 미디어 URL인지 확인
 */
export function expectUrlToBeMediaUrl(url: string, type: 'image' | 'video'): void {
  const urlObj = new URL(url);

  if (type === 'image') {
    expect(urlObj.hostname).toBe('pbs.twimg.com');
    expect(urlObj.pathname).toMatch(/\/media\/[\w-]+\.(jpg|jpeg|png|webp)$/);
  } else {
    expect(urlObj.hostname).toBe('video.twimg.com');
    expect(urlObj.pathname).toMatch(/\/ext_tw_video\/.*\.(mp4|mov)$/);
  }
}

/**
 * URL 파라미터 확인
 */
export function expectUrlToHaveParams(url: string, params: Record<string, string>): void {
  const urlObj = new URL(url);

  Object.entries(params).forEach(([key, value]) => {
    expect(urlObj.searchParams.get(key)).toBe(value);
  });
}

// ================================
// Media Item Assertion Helpers
// ================================

/**
 * 미디어 아이템 구조 확인
 */
export function expectValidMediaItem(item: MediaItem): void {
  expect(item).toHaveProperty('id');
  expect(item).toHaveProperty('type');
  expect(item).toHaveProperty('info');
  expect(item).toHaveProperty('downloadStatus');

  expect(typeof item.id).toBe('string');
  expect(item.id).not.toBe('');
  expect(['image', 'video']).toContain(item.type);
  expect(['idle', 'downloading', 'completed', 'failed']).toContain(item.downloadStatus);
}

/**
 * 이미지 정보 구조 확인
 */
export function expectValidImageInfo(info: ImageInfo): void {
  expect(info).toHaveProperty('url');
  expect(info).toHaveProperty('width');
  expect(info).toHaveProperty('height');
  expect(info).toHaveProperty('format');
  expect(info).toHaveProperty('size');

  expect(typeof info.url).toBe('string');
  expect(info.url).not.toBe('');
  expect(info.width).toBeGreaterThan(0);
  expect(info.height).toBeGreaterThan(0);
  expect(typeof info.format).toBe('string');
  expect(info.size).toBeGreaterThan(0);

  expectUrlToBeMediaUrl(info.url, 'image');
}

/**
 * 비디오 정보 구조 확인
 */
export function expectValidVideoInfo(info: VideoInfo): void {
  expect(info).toHaveProperty('url');
  expect(info).toHaveProperty('thumbnailUrl');
  expect(info).toHaveProperty('duration');
  expect(info).toHaveProperty('width');
  expect(info).toHaveProperty('height');
  expect(info).toHaveProperty('format');
  expect(info).toHaveProperty('size');
  expect(info).toHaveProperty('bitrate');

  expect(typeof info.url).toBe('string');
  expect(info.url).not.toBe('');
  expect(typeof info.thumbnailUrl).toBe('string');
  expect(info.duration).toBeGreaterThan(0);
  expect(info.width).toBeGreaterThan(0);
  expect(info.height).toBeGreaterThan(0);
  expect(typeof info.format).toBe('string');
  expect(info.size).toBeGreaterThan(0);
  expect(info.bitrate).toBeGreaterThan(0);

  expectUrlToBeMediaUrl(info.url, 'video');
  expectUrlToBeMediaUrl(info.thumbnailUrl, 'image');
}

/**
 * 이미지 미디어 아이템 확인
 */
export function expectValidImageMediaItem(item: MediaItem): void {
  expectValidMediaItem(item);
  expect(item.type).toBe('image');
  expectValidImageInfo(item.info as ImageInfo);
}

/**
 * 비디오 미디어 아이템 확인
 */
export function expectValidVideoMediaItem(item: MediaItem): void {
  expectValidMediaItem(item);
  expect(item.type).toBe('video');
  expectValidVideoInfo(item.info as VideoInfo);
}

// ================================
// Gallery State Assertion Helpers
// ================================

/**
 * 갤러리 상태 구조 확인
 */
export function expectValidGalleryState(state: GalleryState): void {
  expect(state).toHaveProperty('currentIndex');
  expect(state).toHaveProperty('mediaItems');
  expect(state).toHaveProperty('isVisible');
  expect(state).toHaveProperty('isLoading');
  expect(state).toHaveProperty('viewMode');
  expect(state).toHaveProperty('error');

  expect(typeof state.currentIndex).toBe('number');
  expect(state.currentIndex).toBeGreaterThanOrEqual(0);
  expect(Array.isArray(state.mediaItems)).toBe(true);
  expect(typeof state.isVisible).toBe('boolean');
  expect(typeof state.isLoading).toBe('boolean');
  expect(['grid', 'list', 'fullscreen']).toContain(state.viewMode);

  if (state.mediaItems.length > 0) {
    expect(state.currentIndex).toBeLessThan(state.mediaItems.length);
    state.mediaItems.forEach(item => expectValidMediaItem(item));
  }
}

/**
 * 갤러리가 비어있는지 확인
 */
export function expectGalleryToBeEmpty(state: GalleryState): void {
  expect(state.mediaItems).toHaveLength(0);
  expect(state.currentIndex).toBe(0);
  expect(state.isVisible).toBe(false);
}

/**
 * 갤러리가 로딩 중인지 확인
 */
export function expectGalleryToBeLoading(state: GalleryState): void {
  expect(state.isLoading).toBe(true);
  expect(state.error).toBeNull();
}

/**
 * 갤러리에 에러가 있는지 확인
 */
export function expectGalleryToHaveError(state: GalleryState, errorMessage?: string): void {
  expect(state.isLoading).toBe(false);
  expect(state.error).not.toBeNull();

  if (errorMessage) {
    expect(state.error?.message).toContain(errorMessage);
  }
}

/**
 * 갤러리가 특정 인덱스를 가리키는지 확인
 */
export function expectGalleryCurrentIndex(state: GalleryState, expectedIndex: number): void {
  expect(state.currentIndex).toBe(expectedIndex);
  expect(expectedIndex).toBeGreaterThanOrEqual(0);
  expect(expectedIndex).toBeLessThan(state.mediaItems.length);
}

// ================================
// Download Status Assertion Helpers
// ================================

/**
 * 다운로드 상태 확인
 */
export function expectDownloadStatus(
  item: MediaItem,
  status: 'idle' | 'downloading' | 'completed' | 'failed'
): void {
  expect(item.downloadStatus).toBe(status);
}

/**
 * 다운로드가 진행 중인지 확인
 */
export function expectDownloadInProgress(item: MediaItem): void {
  expectDownloadStatus(item, 'downloading');
}

/**
 * 다운로드가 완료되었는지 확인
 */
export function expectDownloadCompleted(item: MediaItem): void {
  expectDownloadStatus(item, 'completed');
}

/**
 * 다운로드가 실패했는지 확인
 */
export function expectDownloadFailed(item: MediaItem): void {
  expectDownloadStatus(item, 'failed');
}

// ================================
// Animation Assertion Helpers
// ================================

/**
 * CSS 애니메이션이 실행 중인지 확인
 */
export function expectElementToBeAnimating(element: HTMLElement): void {
  const computedStyle = window.getComputedStyle(element);
  const animationName = computedStyle.animationName;
  const animationDuration = computedStyle.animationDuration;

  expect(animationName).not.toBe('none');
  expect(animationDuration).not.toBe('0s');
}

/**
 * CSS 트랜지션이 적용되었는지 확인
 */
export function expectElementToHaveTransition(element: HTMLElement, property?: string): void {
  const computedStyle = window.getComputedStyle(element);
  const transitionProperty = computedStyle.transitionProperty;
  const transitionDuration = computedStyle.transitionDuration;

  expect(transitionProperty).not.toBe('none');
  expect(transitionDuration).not.toBe('0s');

  if (property) {
    expect(transitionProperty).toContain(property);
  }
}

// ================================
// Performance Assertion Helpers
// ================================

/**
 * 함수 실행 시간 측정 및 확인
 */
export async function expectFunctionToExecuteWithin(
  fn: () => Promise<void> | void,
  maxTimeMs: number
): Promise<void> {
  const startTime = performance.now();
  await fn();
  const endTime = performance.now();
  const executionTime = endTime - startTime;

  expect(executionTime).toBeLessThanOrEqual(maxTimeMs);
}

/**
 * 메모리 사용량 확인 (브라우저 환경에서만 동작)
 */
export function expectMemoryUsageToBeReasonable(): void {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    const usedJSHeapSize = memory.usedJSHeapSize;
    const totalJSHeapSize = memory.totalJSHeapSize;

    // 사용된 힙이 전체 힙의 80%를 넘지 않는지 확인
    expect(usedJSHeapSize / totalJSHeapSize).toBeLessThanOrEqual(0.8);
  }
}

// ================================
// Browser Extension Assertion Helpers
// ================================

/**
 * 브라우저 확장 API 호출 확인
 */
export function expectBrowserApiToBeCalled(
  mockApi: any,
  method: string,
  callCount: number = 1
): void {
  expect(mockApi[method]).toHaveBeenCalledTimes(callCount);
}

/**
 * 스토리지 API 호출 확인
 */
export function expectStorageApiToBeCalledWith(
  mockStorage: any,
  method: 'get' | 'set' | 'remove',
  expectedArgs: any[]
): void {
  expect(mockStorage[method]).toHaveBeenCalledWith(...expectedArgs);
}

// ================================
// Vendor Library Assertion Helpers
// ================================

/**
 * Preact 컴포넌트 렌더링 확인
 */
export function expectPreactComponentToRender(container: HTMLElement): void {
  expect(container).not.toBeEmptyDOMElement();
  expect(container.children.length).toBeGreaterThan(0);
}

/**
 * Preact Signal 값 확인
 */
export function expectSignalValue<T>(signal: { value: T }, expectedValue: T): void {
  expect(signal.value).toEqual(expectedValue);
}

/**
 * 압축 라이브러리 동작 확인
 */
export function expectCompressionToWork(compressedData: Uint8Array, originalSize: number): void {
  expect(compressedData).toBeInstanceOf(Uint8Array);
  expect(compressedData.length).toBeGreaterThan(0);
  expect(compressedData.length).toBeLessThan(originalSize);
}
