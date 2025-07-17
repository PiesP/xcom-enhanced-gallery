/**
 * X.com Enhanced Gallery - Test Types
 * 테스트 파일에서 사용되는 타입 정의
 */

// Browser Extension API 타입 확장
export interface ChromeRuntime {
  id?: string;
}

export interface BrowserRuntime {
  id?: string;
}

export interface ChromeAPI {
  runtime?: ChromeRuntime;
}

export interface BrowserAPI {
  runtime?: BrowserRuntime;
}

declare global {
  interface Window {
    chrome?: ChromeAPI;
    browser?: BrowserAPI;
  }

  interface Global {
    mockServerEnvironment: () => void;
    mockBrowserEnvironment: () => void;
  }

  namespace globalThis {
    var mockServerEnvironment: () => void;
    var mockBrowserEnvironment: () => void;
  }
}

// Gallery 관련 타입
export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url?: string;
  thumbnailUrl?: string;
  originalUrl?: string;
  size?: number;
  width?: number;
  height?: number;
  duration?: number;
}

export interface GallerySettings {
  autoPlay: boolean;
  showThumbnails: boolean;
  downloadQuality: 'original' | 'large' | 'medium';
}

export type ViewMode = 'grid' | 'list' | 'fullscreen';

// Mock 서비스 인터페이스
export interface MockGalleryStateInterface {
  currentIndex: number;
  mediaItems: MediaItem[];
  isVisible: boolean;
  isLoading: boolean;
  viewMode: ViewMode;
  settings: GallerySettings;

  setMediaItems(items: MediaItem[]): void;
  setCurrentIndex(index: number): boolean;
  nextMedia(): boolean;
  previousMedia(): boolean;
  getCurrentMedia(): MediaItem | null;
  getMediaCount(): number;
  setVisible(visible: boolean): void;
  setLoading(loading: boolean): void;
  setViewMode(mode: ViewMode): boolean;
  updateSettings(newSettings: Partial<GallerySettings>): void;
  reset(): void;
}

export interface MockVideoServiceInterface {
  initialized: boolean;
  dependencies: string[];

  initialize(): Promise<void>;
  destroy(): void;
  getDependencies(): string[];
}

export interface MockDependentServiceInterface {
  initialized: boolean;
  videoService: MockVideoServiceInterface;

  initialize(): Promise<void>;
  destroy(): void;
}

export interface EventListener<T = any> {
  (data: T): void;
}

export interface MockGalleryServiceInterface {
  state: MockGalleryStateInterface;
  eventListeners: Map<string, EventListener[]>;

  loadMediaFromTweet(tweetId: string): Promise<MediaItem[]>;
  openGallery(initialIndex?: number): void;
  closeGallery(): void;
  navigateToNext(): boolean;
  navigateToPrevious(): boolean;
  downloadCurrentMedia(): { success: boolean; media: MediaItem | null };
  downloadAllMedia(): Array<{ success: boolean; media: MediaItem }>;

  on(event: string, callback: EventListener): void;
  off(event: string, callback: EventListener): void;
  emit(event: string, data: any): void;
}

export interface TestServiceManagerInterface {
  services: Map<string, any>;
  initOrder: string[];

  register(name: string, service: any): void;
  get(name: string): any;
  initializeAll(): Promise<void>;
  destroyAll(): void;
  getInitializationOrder(): string[];
  isInitialized(serviceName: string): boolean;
}

// DOM Mock 타입
export interface MockElement {
  tagName: string;
  className: string;
  id: string;
  children: MockElement[];
  childNodes: MockElement[];
  parentNode: MockElement | null;
  dataset: Record<string, string>;

  setAttribute(name: string, value: string): void;
  getAttribute(name: string): string | null;
  appendChild(child: MockElement): void;
  removeChild(child: MockElement): void;
  querySelector(selector: string): MockElement | null;
  addEventListener(event: string, handler: Function): void;
  removeEventListener(event: string, handler: Function): void;
}

export interface MockDocument extends MockElement {
  body: MockElement;
  head: MockElement;
  documentElement: MockElement;

  createElement(tagName: string): MockElement;
  getElementById(id: string): MockElement | null;
  querySelector(selector: string): MockElement | null;
  querySelectorAll(selector: string): MockElement[];
}

export {};
