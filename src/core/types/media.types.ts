/**
 * Core Media Types for X.com Enhanced Gallery
 *
 * This module contains the fundamental media type definitions that are used
 * across all layers of the application. These types should remain stable
 * and serve as the single source of truth for media-related interfaces.
 */

/**
 * 미디어 타입
 */
export type MediaType = 'image' | 'video' | 'gif';

/**
 * 미디어 품질
 */
export type MediaQuality = 'thumbnail' | 'small' | 'medium' | 'large' | 'original';

/**
 * 기본 미디어 정보 인터페이스
 */
export interface MediaInfo {
  /** 미디어의 고유 식별자 */
  id?: string;
  /** 미디어의 기본 URL */
  url: string;
  /** 원본 해상도 미디어 URL */
  originalUrl?: string;
  /** 미디어 타입 (이미지, 비디오, GIF) */
  type: MediaType;
  /** 다운로드용 파일명 */
  filename?: string;
  /** 파일 크기 (바이트) */
  fileSize?: number;
  /** 미디어 너비 (픽셀) */
  width?: number;
  /** 미디어 높이 (픽셀) */
  height?: number;
  /** 썸네일 URL (비디오의 경우) */
  thumbnailUrl?: string;
  /** 대체 텍스트 (접근성) */
  alt?: string;
  // Tweet-specific properties
  /** 트윗 작성자 사용자명 */
  tweetUsername?: string;
  /** 트윗 ID */
  tweetId?: string;
  /** 트윗 URL */
  tweetUrl?: string;
  // Metadata
  /** 추가 메타데이터 */
  metadata?: Record<string, unknown>;
  /** 대체 URL 목록 */
  urlAlternatives?: string[];
}

/**
 * 미디어 아이템 타입 (MediaInfo와 동일한 구조)
 * 애플리케이션 전반에서 일관된 미디어 데이터 구조를 위해 사용
 */
export type MediaItem = MediaInfo;

/**
 * 다운로드 미디어 아이템
 */
export interface DownloadMediaItem extends MediaInfo {
  downloadProgress?: number;
  downloadStatus?: 'pending' | 'downloading' | 'completed' | 'failed';
}

/**
 * URL과 파일명 쌍을 나타내는 인터페이스
 */
export interface UrlWithFilename {
  /** 다운로드할 파일의 URL */
  url: string;
  /** 저장할 파일명 */
  filename: string;
}

/**
 * 파일명이 포함된 미디어 정보 (다운로드용)
 * MediaInfo에서 필수 필드들을 required로 만든 버전
 */
export interface MediaInfoWithFilename extends MediaInfo {
  /** 미디어 고유 식별자 (필수) */
  id: string;
  /** 원본 페이지 URL (필수) */
  originalUrl: string;
  /** 저장할 파일명 (필수) */
  filename: string;
}

/**
 * 갤러리 열기 이벤트 세부 정보
 */
export interface GalleryOpenEventDetail {
  /** 미디어 아이템 목록 */
  media: MediaItem[];
  /** 시작 인덱스 */
  startIndex: number;
}

/**
 * 갤러리 열기 커스텀 이벤트
 */
export interface GalleryOpenEvent extends CustomEvent<GalleryOpenEventDetail> {
  type: 'xeg:gallery:open' | 'xeg:openGallery';
}

/**
 * 갤러리 닫기 커스텀 이벤트
 */
export interface GalleryCloseEvent extends CustomEvent<void> {
  type: 'xeg:gallery:close';
}

/**
 * 미디어 컬렉션 인터페이스
 */
export interface MediaCollection {
  items: MediaItem[];
  totalCount: number;
  currentIndex: number;
}

// MediaExtractionResult는 @core/interfaces/gallery.interfaces.ts에서 정의됨
// 중복 제거: 해당 인터페이스는 core/interfaces/gallery.interfaces.ts에서 정의된 것을 사용
