/**
 * @fileoverview Gallery Core Interfaces
 * @version 1.0.0
 *
 * Features 간 의존성을 제거하기 위한 공통 인터페이스 정의
 * 의존성 규칙: features → shared → core → infrastructure
 */

import type { MediaInfo } from '@shared/types/media.types';
import type { ViewMode } from '@shared/types/app.types';
import type { MediaExtractionOptions, MediaExtractor, TweetInfo } from '@shared/types/media.types';
import type { MediaExtractionResult } from '@shared/types/media.types';

// Re-export extraction types for backward compatibility
export type { MediaExtractionOptions, MediaExtractionResult, MediaExtractor, TweetInfo };

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

  /**
   * 갤러리 닫기 콜백을 설정합니다
   * @param onClose - 갤러리 닫기 시 호출될 콜백 함수
   */
  setOnCloseCallback(onClose: () => void): void;
}

/**
 * 갤러리 렌더링 옵션
 */
export interface GalleryRenderOptions {
  /** 시작 인덱스 */
  startIndex?: number | undefined;
  /** 뷰 모드 */
  viewMode?: ViewMode | undefined;
  /** 클래스명 */
  className?: string | undefined;
  /** 트윗 ID */
  tweetId?: string | undefined;
}
