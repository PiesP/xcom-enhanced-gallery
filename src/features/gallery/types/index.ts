/**
 * @fileoverview Gallery 타입 정의
 * @description 갤러리 기능 관련 타입들
 * @version 1.0.0
 */

// 갤러리 상태 관련 타입들
export type GalleryMode = 'grid' | 'list' | 'slideshow';
export type GalleryTheme = 'dark' | 'light' | 'auto';

export interface GalleryState {
  readonly isOpen: boolean;
  readonly currentIndex: number;
  readonly mode: GalleryMode;
  readonly theme: GalleryTheme;
}

export interface GalleryConfig {
  readonly autoPlay: boolean;
  readonly showThumbnails: boolean;
  readonly enableKeyboard: boolean;
  readonly theme: GalleryTheme;
}

// 미디어 추출 결과 기본 타입 (순환 의존성 방지)
export interface MediaExtractionResult {
  success: boolean;
  medias: Array<{
    url: string;
    type: 'image' | 'video' | 'gif';
    filename?: string;
  }>;
  error?: string;
}

// 트윗 정보 기본 타입
export interface TweetInfo {
  tweetId: string;
  username: string;
  tweetUrl: string;
  extractionMethod: string;
  confidence: number;
}

// 미디어 추출기 기본 인터페이스
export interface MediaExtractor {
  extractFromClickedElement(element: HTMLElement): Promise<MediaExtractionResult>;
  extractAllFromContainer(container: HTMLElement): Promise<MediaExtractionResult>;
}
