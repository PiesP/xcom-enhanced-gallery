/**
 * 테스트 객체 팩토리 함수
 * 동적으로 테스트 데이터를 생성하는 팩토리 패턴
 */

import { mockImageInfo, mockVideoInfo, mockBrowserEnvironment } from '../fixtures/test-data';

// ================================
// Type Definitions
// ================================

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  info: ImageInfo | VideoInfo;
  downloadStatus: 'idle' | 'downloading' | 'completed' | 'failed';
  clickedIndex?: number;
}

export interface ImageInfo {
  url: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface VideoInfo {
  url: string;
  thumbnailUrl: string;
  duration: number;
  width: number;
  height: number;
  format: string;
  size: number;
  bitrate: number;
}

export interface GalleryState {
  currentIndex: number;
  mediaItems: MediaItem[];
  isVisible: boolean;
  isLoading: boolean;
  viewMode: 'grid' | 'list' | 'fullscreen';
  error: Error | null;
}

// ================================
// Media Item Factories
// ================================

/**
 * 이미지 정보 팩토리
 */
export function createMockImageInfo(overrides: Partial<ImageInfo> = {}): ImageInfo {
  return {
    ...mockImageInfo.basic,
    ...overrides,
  };
}

/**
 * 비디오 정보 팩토리
 */
export function createMockVideoInfo(overrides: Partial<VideoInfo> = {}): VideoInfo {
  return {
    ...mockVideoInfo.basic,
    ...overrides,
  };
}

/**
 * 미디어 아이템 팩토리
 */
export function createMockMediaItem(overrides: Partial<MediaItem> = {}): MediaItem {
  const defaultItem: MediaItem = {
    id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'image',
    info: createMockImageInfo(),
    downloadStatus: 'idle',
  };

  const item = { ...defaultItem, ...overrides };

  // type에 따라 적절한 info 설정
  if (item.type === 'video' && !overrides.info) {
    item.info = createMockVideoInfo();
  }

  return item;
}

/**
 * 여러 미디어 아이템 배열 생성
 */
export function createMockMediaItems(
  count: number,
  overrides: Partial<MediaItem> = {}
): MediaItem[] {
  return Array.from({ length: count }, (_, index) =>
    createMockMediaItem({
      id: `media-${index}`,
      ...overrides,
    })
  );
}

/**
 * 이미지와 비디오가 혼합된 미디어 아이템 배열 생성
 */
export function createMockMixedMediaItems(imageCount: number, videoCount: number): MediaItem[] {
  const imageItems = Array.from({ length: imageCount }, (_, index) =>
    createMockMediaItem({
      id: `image-${index}`,
      type: 'image',
      info: createMockImageInfo(),
    })
  );

  const videoItems = Array.from({ length: videoCount }, (_, index) =>
    createMockMediaItem({
      id: `video-${index}`,
      type: 'video',
      info: createMockVideoInfo(),
    })
  );

  // 랜덤하게 섞어서 반환
  return [...imageItems, ...videoItems].sort(() => Math.random() - 0.5);
}

// ================================
// Gallery State Factories
// ================================

/**
 * 갤러리 상태 팩토리
 */
export function createMockGalleryState(overrides: Partial<GalleryState> = {}): GalleryState {
  const defaultState: GalleryState = {
    currentIndex: 0,
    mediaItems: [],
    isVisible: false,
    isLoading: false,
    viewMode: 'grid',
    error: null,
  };

  return { ...defaultState, ...overrides };
}

/**
 * 미디어가 있는 갤러리 상태 생성
 */
export function createMockGalleryStateWithMedia(
  mediaCount: number = 3,
  overrides: Partial<GalleryState> = {}
): GalleryState {
  const mediaItems = createMockMediaItems(mediaCount);

  return createMockGalleryState({
    mediaItems,
    currentIndex: Math.min(overrides.currentIndex ?? 0, mediaItems.length - 1),
    ...overrides,
  });
}

/**
 * 로딩 상태의 갤러리 상태 생성
 */
export function createMockLoadingGalleryState(overrides: Partial<GalleryState> = {}): GalleryState {
  return createMockGalleryState({
    isLoading: true,
    isVisible: false,
    ...overrides,
  });
}

/**
 * 에러 상태의 갤러리 상태 생성
 */
export function createMockErrorGalleryState(
  error: Error = new Error('Test error'),
  overrides: Partial<GalleryState> = {}
): GalleryState {
  return createMockGalleryState({
    error,
    isLoading: false,
    ...overrides,
  });
}

// ================================
// URL Factories
// ================================

/**
 * Twitter URL 팩토리
 */
export function createMockTwitterUrl(
  tweetId: string = '1234567890123456789',
  options: {
    domain?: 'x.com' | 'twitter.com' | 'mobile.x.com';
    params?: Record<string, string>;
  } = {}
): string {
  const domain = options.domain ?? 'x.com';
  const baseUrl = `https://${domain}/user/status/${tweetId}`;

  if (options.params && Object.keys(options.params).length > 0) {
    const searchParams = new URLSearchParams(options.params);
    return `${baseUrl}?${searchParams.toString()}`;
  }

  return baseUrl;
}

/**
 * 미디어 URL 팩토리
 */
export function createMockMediaUrl(
  type: 'image' | 'video',
  options: {
    quality?: 'small' | 'medium' | 'large' | 'orig';
    format?: string;
    id?: string;
  } = {}
): string {
  const id = options.id ?? 'test';
  const quality = options.quality ?? 'large';

  if (type === 'image') {
    const format = options.format ?? 'jpg';
    return `https://pbs.twimg.com/media/${id}.${format}?format=${format}&name=${quality}`;
  } else {
    const format = options.format ?? 'mp4';
    const resolution =
      quality === 'small' ? '480x270' : quality === 'medium' ? '1280x720' : '1920x1080';
    return `https://video.twimg.com/ext_tw_video/${id}/pu/vid/${resolution}/video.${format}`;
  }
}

// ================================
// Browser Environment Factories
// ================================

/**
 * 브라우저 환경 팩토리
 */
export function createMockBrowserInfo(
  browser: 'chrome' | 'firefox' | 'safari' = 'chrome',
  overrides: Partial<Navigator> = {}
): Partial<Navigator> {
  const baseInfo = mockBrowserEnvironment[browser];

  return {
    userAgent: baseInfo.userAgent,
    vendor: baseInfo.vendor,
    language: baseInfo.language,
    languages: [baseInfo.language, 'en'],
    platform: 'Win32',
    cookieEnabled: true,
    onLine: true,
    ...overrides,
  };
}

/**
 * Window 객체 팩토리 (테스트용)
 */
export function createMockWindow(overrides: Partial<Window> = {}): Partial<Window> {
  return {
    location: {
      hostname: 'x.com',
      href: createMockTwitterUrl(),
      pathname: '/user/status/1234567890123456789',
      search: '',
      hash: '',
      protocol: 'https:',
      port: '',
      host: 'x.com',
    } as Location,

    navigator: createMockBrowserInfo() as Navigator,

    innerWidth: 1920,
    innerHeight: 1080,
    outerWidth: 1920,
    outerHeight: 1080,
    devicePixelRatio: 1,

    document: {} as Document,

    ...overrides,
  };
}

// ================================
// Event Factories
// ================================

/**
 * 키보드 이벤트 팩토리
 */
export function createMockKeyboardEvent(
  key: string,
  options: {
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
  } = {}
): KeyboardEvent {
  return {
    key,
    code: `Key${key.toUpperCase()}`,
    ctrlKey: options.ctrlKey ?? false,
    shiftKey: options.shiftKey ?? false,
    altKey: options.altKey ?? false,
    metaKey: options.metaKey ?? false,
    preventDefault: () => {},
    stopPropagation: () => {},
  } as KeyboardEvent;
}

/**
 * 마우스 이벤트 팩토리
 */
export function createMockMouseEvent(
  type: 'click' | 'mousedown' | 'mouseup' | 'mousemove',
  options: {
    clientX?: number;
    clientY?: number;
    button?: number;
    ctrlKey?: boolean;
    shiftKey?: boolean;
  } = {}
): MouseEvent {
  return {
    type,
    clientX: options.clientX ?? 0,
    clientY: options.clientY ?? 0,
    button: options.button ?? 0,
    ctrlKey: options.ctrlKey ?? false,
    shiftKey: options.shiftKey ?? false,
    preventDefault: () => {},
    stopPropagation: () => {},
  } as MouseEvent;
}

// ================================
// Utility Functions
// ================================

/**
 * 랜덤 ID 생성
 */
export function generateRandomId(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 지연 시간 생성 (테스트용)
 */
export function createMockDelay(ms: number = 100): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 파일 크기를 바이트로 변환
 */
export function parseFileSize(size: string): number {
  const units = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
  const match = size.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);

  if (!match) return 0;

  const [, num, unit] = match;
  if (!num || !unit) return 0;

  return parseFloat(num) * (units[unit.toUpperCase() as keyof typeof units] || 1);
}
