/**
 * @fileoverview 통합 타입 정의
 * @description 모든 타입을 하나로 통합한 정의
 * @version 2.0.0 - 구조 개선
 */

// ===== 브랜드 타입 =====
export type Brand<T, B> = T & { __brand: B };

// ===== ID 타입들 =====
export type UserId = Brand<string, 'UserId'>;
export type TweetId = Brand<string, 'TweetId'>;
export type ServiceKey = Brand<string, 'ServiceKey'>;
export type ElementId = Brand<string, 'ElementId'>;
export type MediaUrl = Brand<string, 'MediaUrl'>;
export type MediaId = Brand<string, 'MediaId'>;

// ===== 미디어 타입들 =====
export type MediaType = 'image' | 'video' | 'gif';
export type MediaQuality = 'small' | 'medium' | 'large' | 'orig';

// ===== 리소스 타입들 =====
export type ResourceType =
  | 'image'
  | 'video'
  | 'element'
  | 'observer'
  | 'listener'
  | 'component'
  | 'dom'
  | 'worker'
  | 'event'
  | 'style'
  | 'media'
  | 'network'
  | 'cache';

export interface MediaInfo {
  url: string;
  type: MediaType;
  quality: MediaQuality;
  filename?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface MediaEntity extends MediaInfo {
  id: MediaId;
  tweetId?: TweetId;
  username?: string;
  createdAt?: Date;
}

export interface MediaExtractionResult {
  media: MediaInfo[];
  success: boolean;
  error?: string;
  source: 'api' | 'dom' | 'fallback';
}

export interface MediaExtractionOptions {
  includeVideos?: boolean;
  includeImages?: boolean;
  minWidth?: number;
  minHeight?: number;
  quality?: MediaQuality;
}

// ===== 갤러리 타입들 =====
export interface GalleryState {
  isVisible: boolean;
  currentIndex: number;
  media: MediaInfo[];
  loading: boolean;
  error?: string;
}

export interface GalleryConfig {
  autoPlay?: boolean;
  showThumbnails?: boolean;
  enableKeyboard?: boolean;
  enableTouch?: boolean;
  loop?: boolean;
}

// ===== 서비스 타입들 =====
export type ServiceLifecycle = 'uninitialized' | 'initializing' | 'initialized' | 'destroyed';

export interface ServiceConfig<T = unknown> {
  name: string;
  dependencies?: string[];
  config?: T;
  lazy?: boolean;
}

export type ServiceDependency = string;
export type ServiceFactory<T> = () => T | Promise<T>;

// ===== 트윗 정보 타입들 =====
export interface TweetInfo {
  id: TweetId;
  username: string;
  content: string;
  media: MediaInfo[];
  createdAt?: Date;
  element?: HTMLElement;
}

export interface MediaExtractor {
  extractMedia(element: HTMLElement): Promise<MediaExtractionResult>;
  canExtract(element: HTMLElement): boolean;
}

export interface TweetInfoExtractionStrategy {
  extractTweetInfo(element: HTMLElement): Promise<TweetInfo | null>;
  canHandle(element: HTMLElement): boolean;
}

// ===== 유틸리티 타입들 =====
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

export type Option<T> = T | null;

// ===== 스타일 타입들 =====
export type Theme = 'light' | 'dark' | 'auto';
export type GlassmorphismIntensity = 'light' | 'medium' | 'strong' | 'ultra';

export interface GlassmorphismConfig {
  intensity: GlassmorphismIntensity;
  background?: string;
  blur?: string;
  border?: string;
  shadow?: string;
}

export interface ComponentState {
  [key: string]: boolean;
}

// ===== DOM 타입들 =====
export interface DOMUpdate {
  element: HTMLElement;
  styles?: Partial<CSSStyleDeclaration>;
  classes?: { add?: string[]; remove?: string[] };
  attributes?: Record<string, string>;
}

// ===== 이벤트 타입들 =====
export interface EventHandler<T = Event> {
  (event: T): void;
}

export interface CustomEventMap {
  'gallery:open': CustomEvent<{ media: MediaInfo[]; index: number }>;
  'gallery:close': CustomEvent<void>;
  'gallery:change': CustomEvent<{ index: number; media: MediaInfo }>;
  'media:load': CustomEvent<{ url: string; success: boolean }>;
  'toast:show': CustomEvent<{ message: string; type: 'info' | 'success' | 'warning' | 'error' }>;
}

// ===== UserScript API 타입들 =====
export interface UserScriptInfo {
  name: string;
  version: string;
  description: string;
  author: string;
  match: string[];
  grant: string[];
}

export interface BrowserEnvironment {
  userscriptManager: 'tampermonkey' | 'greasemonkey' | 'violentmonkey' | 'unknown';
  browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'unknown';
  isDevelopment: boolean;
}

// ===== 설정 타입들 =====
export interface AppSettings {
  theme: Theme;
  gallery: GalleryConfig;
  media: {
    autoDownload: boolean;
    quality: MediaQuality;
    format: 'original' | 'jpg' | 'png';
  };
  ui: {
    showToolbar: boolean;
    enableAnimations: boolean;
    glassmorphism: GlassmorphismIntensity;
  };
}

// ===== 에러 타입들 =====
export interface AppError extends Error {
  code: string;
  context?: Record<string, unknown>;
  timestamp: Date;
}

export type ErrorLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  level: ErrorLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}

// ===== 성능 타입들 =====
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  mediaCount: number;
}

export interface MemoryInfo {
  used: number;
  total: number;
  limit: number;
}

// ===== 확장성을 위한 타입들 =====
export interface Plugin {
  name: string;
  version: string;
  init(): Promise<void>;
  destroy(): Promise<void>;
}

export interface Extension<T = unknown> {
  id: string;
  config?: T;
  enable(): void;
  disable(): void;
}

export interface Hook<T = unknown> {
  name: string;
  handler: (data: T) => T | Promise<T>;
  priority?: number;
}
