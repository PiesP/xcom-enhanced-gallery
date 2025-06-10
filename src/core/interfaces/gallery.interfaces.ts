/**
 * @fileoverview Gallery Core Interfaces
 * @version 1.0.0
 *
 * Features 간 의존성을 제거하기 위한 공통 인터페이스 정의
 * 의존성 규칙: features → shared → core → infrastructure
 */

import type { MediaInfo } from '@core/types/media.types';
import type { ViewMode } from '@core/types/view-mode.types';

/**
 * 갤러리 렌더러 인터페이스
 * Features 계층의 GalleryRenderer를 추상화
 */
export interface GalleryRenderer {
  /**
   * 갤러리를 렌더링합니다
   * @param mediaItems - 미디어 아이템 목록
   * @param options - 렌더링 옵션
   */
  render(mediaItems: readonly MediaInfo[], options?: GalleryRenderOptions): Promise<void>;

  /**
   * 갤러리를 닫습니다
   */
  close(): void;

  /**
   * 갤러리를 완전히 제거합니다
   */
  destroy(): void;

  /**
   * 갤러리가 현재 렌더링 중인지 확인합니다
   */
  isRendering(): boolean;
}

/**
 * 미디어 추출기 인터페이스
 * Features 계층의 MediaExtractor를 추상화
 */
export interface MediaExtractor {
  /**
   * 클릭된 요소에서 미디어를 추출합니다
   * @param element - 클릭된 DOM 요소
   * @returns 추출된 미디어 정보
   */
  extractFromClickedElement(element: HTMLElement): Promise<MediaExtractionResult>;

  /**
   * 컨테이너에서 모든 미디어를 추출합니다
   * @param container - 미디어를 검색할 컨테이너
   * @returns 추출된 미디어 목록
   */
  extractAllFromContainer(container: HTMLElement): Promise<MediaExtractionResult>;
}

/**
 * 갤러리 렌더링 옵션
 */
export interface GalleryRenderOptions {
  /** 시작 인덱스 */
  startIndex?: number;
  /** 뷰 모드 */
  viewMode?: ViewMode;
  /** 클래스명 */
  className?: string;
}

/**
 * 미디어 추출 결과
 */
export interface MediaExtractionResult {
  /** 추출 성공 여부 */
  success: boolean;
  /** 추출된 미디어 목록 */
  mediaItems: readonly MediaInfo[];
  /** 클릭된 미디어의 인덱스 (0부터 시작) */
  clickedIndex?: number;
  /** 에러 메시지 (실패시) */
  error?: string;
  /** 추출 메타데이터 */
  metadata?: MediaExtractionMetadata;
}

/**
 * 미디어 추출 메타데이터
 */
export interface MediaExtractionMetadata {
  /** 트윗 ID */
  tweetId?: string;
  /** 사용자 ID */
  userId?: string;
  /** 추출 시간 */
  extractedAt: number;
  /** 소스 타입 */
  sourceType:
    | 'tweet'
    | 'profile'
    | 'media'
    | 'unknown'
    | 'cached'
    | 'image-elements'
    | 'video-elements'
    | 'data-attributes'
    | 'background-images'
    | 'twitter-api';
  /** 추출 전략 */
  strategy?: string;
}
